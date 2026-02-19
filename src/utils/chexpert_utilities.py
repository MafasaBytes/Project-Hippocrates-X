import torch
import torchvision.transforms as T
import torch.nn.functional as F

def chexpert_collate_fn(batch):
    xs, ys, ms, metas = zip(*batch)
    x = torch.stack(xs, dim=0)
    y = torch.stack(ys, dim=0)
    m = torch.stack(ms, dim=0)
    return x, y, m, metas

def chexpert_transforms():
    train_tf = T.Compose([
    T.Resize((224, 224)),
    T.RandomHorizontalFlip(p=0.5),
    # optional: mild augmentation
    # T.RandomRotation(degrees=5),
    T.ToTensor(),                 # [1,H,W] in [0,1] for grayscale PIL
    T.Normalize(mean=[0.5], std=[0.25]),  # replace with your chosen stats
    ])

    val_tf = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.5], std=[0.25]),
    ])

    return train_tf, val_tf

def biomedclip_transforms():
    """Transforms compatible with BiomedCLIP's ViT-B/16.

    Converts grayscale PIL → RGB, resizes to 224x224 (no crop to preserve
    full lung fields), and normalizes with OpenAI CLIP stats.
    """
    CLIP_MEAN = (0.48145466, 0.4578275, 0.40821073)
    CLIP_STD = (0.26862954, 0.26130258, 0.27577711)

    to_rgb = T.Lambda(lambda img: img.convert("RGB"))

    train_tf = T.Compose([
        to_rgb,
        T.Resize((224, 224)),
        T.RandomHorizontalFlip(p=0.5),
        T.ToTensor(),
        T.Normalize(mean=CLIP_MEAN, std=CLIP_STD),
    ])

    val_tf = T.Compose([
        to_rgb,
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=CLIP_MEAN, std=CLIP_STD),
    ])

    return train_tf, val_tf


def compute_masked_auroc(logits, y, m, label_names):
    """Per-label AUROC using only supervised entries (mask==1).

    Returns (per_label_dict, macro_mean).  Labels with <2 classes get NaN.
    """
    from sklearn.metrics import roc_auc_score
    import numpy as np

    probs = torch.sigmoid(logits).numpy()
    y_np = torch.nan_to_num(y, nan=0.0).numpy()
    m_np = m.numpy()

    results = {}
    for i, name in enumerate(label_names):
        mask = m_np[:, i] == 1
        if mask.sum() < 2:
            results[name] = float("nan")
            continue
        y_l = y_np[mask, i]
        p_l = probs[mask, i]
        if len(np.unique(y_l)) < 2:
            results[name] = float("nan")
            continue
        results[name] = roc_auc_score(y_l, p_l)

    valid = [v for v in results.values() if not np.isnan(v)]
    macro = float(np.mean(valid)) if valid else float("nan")
    return results, macro


def masked_bce_with_logits(logits, y, m, eps=1e-6):
    """
    logits: [B,L]
    y:      [B,L] float (0/1 or NaN)
    m:      [B,L] 0/1 mask
    """
    # replace NaN targets with 0 (they will be masked out anyway)
    y_clean = torch.nan_to_num(y, nan=0.0)

    per_entry = F.binary_cross_entropy_with_logits(logits, y_clean, reduction="none")  # [B,L]
    per_entry = per_entry * m

    denom = m.sum().clamp_min(eps)
    return per_entry.sum() / denom
        