"""
CheXpert multi-label training with BiomedCLIP ViT-B/16 encoder.

Phase 1 (FREEZE_ENCODER=True):  Linear probe — only the head trains.
Phase 2 (FREEZE_ENCODER=False): Full fine-tune — encoder + head, lower LR.

Run:  python src/train/train_chexpert.py
"""

import time
import yaml
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader, random_split, Subset
from tqdm import tqdm

import sys
import logging

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.models.vision_encoder import BiomedCLIPVisionEncoder
from src.models.classification_head import MultiLabelHead
from src.utils.chexpert_utilities import (
    masked_bce_with_logits,
    chexpert_collate_fn,
    biomedclip_transforms,
    compute_masked_auroc,
)
from src.data.loaders.chexpert_dataset import CheXpertParquetDataset
from src.utils.training_utils import setup_logging

def setup_logging(log_dir: Path, tag: str):
    log_dir.mkdir(exist_ok=True, parents=True)
    log_file = log_dir / f"train_{tag}_{time.strftime('%Y%m%d_%H%M%S')}.log"
    
    # Configure logging to both console and file
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_file
# Labels
LABELS = [
    "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
    "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
    "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices",
]
DROP_LABELS = {"No Finding"}

# Hyperparameters
FREEZE_ENCODER = True
NUM_EPOCHS = 100
BATCH_SIZE = 64
HEAD_LR = 3e-4
ENCODER_LR = 1e-5
NUM_WORKERS = 0
VAL_FRACTION = 0.10
SEED = 42
MAX_SAMPLES = None      # set to None for full dataset
PATIENCE = 10            


class CheXpertViT(nn.Module):
    """BiomedCLIP encoder + multi-label head."""

    def __init__(self, num_labels: int, freeze_encoder: bool = True):
        super().__init__()
        self.encoder = BiomedCLIPVisionEncoder(freeze=freeze_encoder)
        self.head = MultiLabelHead(
            in_dim=self.encoder.embed_dim,
            num_labels=num_labels,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.encoder(x)
        return self.head(features)


def build_optimizer(model: CheXpertViT, freeze_encoder: bool):
    """Separate param groups: head always trains; encoder only when unfrozen."""
    if freeze_encoder:
        return torch.optim.AdamW(model.head.parameters(), lr=HEAD_LR)

    return torch.optim.AdamW([
        {"params": model.encoder.parameters(), "lr": ENCODER_LR},
        {"params": model.head.parameters(), "lr": HEAD_LR},
    ])


def train_one_epoch(model, loader, optimizer, scheduler, device, freeze_encoder):
    model.train()
    if freeze_encoder:
        model.encoder.eval()
    running_loss = 0.0
    n_batches = 0

    pbar = tqdm(loader, desc="  train", leave=False, disable=False)
    for x, y, m, _metas in pbar:
        x, y, m = x.to(device), y.to(device), m.to(device)

        optimizer.zero_grad(set_to_none=True)
        logits = model(x)
        loss = masked_bce_with_logits(logits, y, m)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        n_batches += 1
        pbar.set_postfix(loss=f"{running_loss / n_batches:.4f}")

    scheduler.step()
    return running_loss / max(n_batches, 1)


@torch.no_grad()
def eval_one_epoch(model, loader, device):
    model.eval()
    running_loss = 0.0
    n_batches = 0
    all_logits, all_y, all_m = [], [], []

    pbar = tqdm(loader, desc="  val  ", leave=False)
    for x, y, m, _metas in pbar:
        x, y, m = x.to(device), y.to(device), m.to(device)

        logits = model(x)
        loss = masked_bce_with_logits(logits, y, m)

        running_loss += loss.item()
        n_batches += 1
        all_logits.append(logits.cpu())
        all_y.append(y.cpu())
        all_m.append(m.cpu())
        pbar.set_postfix(loss=f"{running_loss / n_batches:.4f}")

    avg_loss = running_loss / max(n_batches, 1)
    return avg_loss, (torch.cat(all_logits), torch.cat(all_y), torch.cat(all_m))


def main():
    torch.manual_seed(SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tag = "frozen" if FREEZE_ENCODER else "finetuned"
    log_path = setup_logging(PROJECT_ROOT / "logs", tag)

    logging.info(f"Device: {device}")
    logging.info(f"Log file created at: {log_path}")

    train_tf, val_tf = biomedclip_transforms()

    active_labels = [l for l in LABELS if l not in DROP_LABELS]
    num_labels = len(active_labels)
    logging.info(f"Training on {num_labels} labels (dropped: {DROP_LABELS})")
    logging.info(f"Mode: {'linear probe (encoder frozen)' if FREEZE_ENCODER else 'full fine-tune'}")

    full_ds = CheXpertParquetDataset(
        labels=LABELS,
        drop_labels=DROP_LABELS,
        transform=train_tf,
    )
    logging.info(full_ds)

    if MAX_SAMPLES is not None and MAX_SAMPLES < len(full_ds):
        g = torch.Generator().manual_seed(SEED)
        indices = torch.randperm(len(full_ds), generator=g)[:MAX_SAMPLES].tolist()
        full_ds = Subset(full_ds, indices)
        print(f"Subsampled to {len(full_ds)} images (MAX_SAMPLES={MAX_SAMPLES})")

    n_total = len(full_ds)
    n_val = max(1, int(n_total * VAL_FRACTION))
    n_train = n_total - n_val
    train_ds, val_ds = random_split(
        full_ds, [n_train, n_val],
        generator=torch.Generator().manual_seed(SEED),
    )

    print(f"Split: train={n_train}, val={n_val}")

    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, shuffle=True,
        num_workers=NUM_WORKERS, pin_memory=(device.type == "cuda"),
        collate_fn=chexpert_collate_fn,
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=(device.type == "cuda"),
        collate_fn=chexpert_collate_fn,
    )

    model = CheXpertViT(num_labels=num_labels, freeze_encoder=FREEZE_ENCODER).to(device)
    optimizer = build_optimizer(model, FREEZE_ENCODER)
    scheduler = CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-6)

    ckpt_dir = PROJECT_ROOT / "checkpoints"
    ckpt_dir.mkdir(exist_ok=True)
    tag = "frozen" if FREEZE_ENCODER else "finetuned"
    best_ckpt = ckpt_dir / f"chexpert_biomedclip_{tag}_best.pt"

    logging.info(f"\nEncoder:  {model.encoder}")
    logging.info(f"Head:     {model.head}")
    logging.info(f"LR schedule: CosineAnnealing  head_lr={HEAD_LR}  epochs={NUM_EPOCHS}")
    logging.info(f"Starting training loop. Patience: {PATIENCE}")
    logging.info(f"Starting training...\n")

    active_label_names = [l for l in LABELS if l not in DROP_LABELS]

    best_val = float("inf")
    wait = 0

    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()
        train_loss = train_one_epoch(
            model, train_loader, optimizer, scheduler, device, FREEZE_ENCODER
        )
        val_loss, (val_logits, val_y, val_m) = eval_one_epoch(model, val_loader, device)
        elapsed = time.time() - t0

        per_label, macro_auroc = compute_masked_auroc(
            val_logits, val_y, val_m, active_label_names
        )

        improved = val_loss < best_val
        if improved:
            best_val = val_loss
            wait = 0
            torch.save(model.state_dict(), best_ckpt)
            marker = " *best*"
        else:
            wait += 1
            marker = ""

        lr_now = optimizer.param_groups[0]["lr"]
        logging.info(
            f"Epoch {epoch:03d}/{NUM_EPOCHS} | "
            f"Train: {train_loss:.4f} | Val: {val_loss:.4f} | "
            f"AUROC: {macro_auroc:.4f} | "
            f"LR: {lr_now:.2e} | {elapsed:.1f}s{marker}"
        )

        if epoch % 5 == 1 or improved or epoch == NUM_EPOCHS:
            logging.info("  Per-label AUROC:")
            for name, auc in per_label.items():
                logging.info(f"    {name:<30s} {auc:.4f}" if auc == auc else f"    {name:<30s} N/A")

        if wait >= PATIENCE:
            logging.warning(f"Early stopping triggered at epoch {epoch}")
            break

    logging.info(f"\nTraining Complete. Best Val Loss: {best_val:.4f}")
    logging.info(f"Best checkpoint: {best_ckpt}")

if __name__ == "__main__":
    main()
