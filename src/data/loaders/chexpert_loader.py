from torch.utils.data import DataLoader
import sys

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from loaders.chexpert_dataset import CheXpertParquetDataset
from utils.chexpert_utilities import chexpert_transforms

LABELS = [
  "No Finding","Enlarged Cardiomediastinum","Cardiomegaly","Lung Opacity","Lung Lesion",
  "Edema","Consolidation","Pneumonia","Atelectasis","Pneumothorax",
  "Pleural Effusion","Pleural Other","Fracture","Support Devices"
]


train_ds = CheXpertParquetDataset(
    parquet_path="data/processed/chexpert/dataset_u_ignore__null_missing__nf_derive.parquet",
    image_root="data/raw/CheXpert",  # must contain CheXpert-v1.0-small/
    labels=LABELS,
    drop_labels={"No Finding"},
    transform=None,
)

train_loader = DataLoader(
    train_ds, batch_size=32, shuffle=True, num_workers=4,
    pin_memory=True, collate_fn=chexpert_collate
)