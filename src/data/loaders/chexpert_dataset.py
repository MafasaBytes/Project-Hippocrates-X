from pathlib import Path
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import List, Optional
from PIL import Image
import yaml
import os

import sys

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from utils.chexpert_abs_path import resolve_chexpert_path, _normalize_path_for_platform

class CheXpertParquetDataset(Dataset):
    def __init__(
        self,
        parquet_path: Optional[str] = None,
        image_root: Optional[str] = None,
        labels: Optional[List[str]] = None,
        config_path: Optional[str] = None,
        drop_labels: Optional[set[str]] = None,
        transform=None,
    ):
        # Resolve paths from config, unless explicitly provided
        self.config_path = config_path or "configs/chexpert.yaml"
        self.config = self.load_config_file()

        self.parquet_path = Path(
            parquet_path
            or _normalize_path_for_platform(self.config["data"]["processed"]["CheXpert"]["parquet"])
        )
        self.image_root = Path(
            image_root
            or _normalize_path_for_platform(self.config["data"]["raw"]["CheXpert"]["img_data"])
        )

        self.df = pd.read_parquet(self.parquet_path)

        # Labels: prefer explicit list; otherwise from config
        base_labels = labels or self.config.get("label_cols", [])
        if drop_labels:
            base_labels = [l for l in base_labels if l not in drop_labels]
        self.labels = list(base_labels)
        self.transform = transform

        # columns required in parquet
        self.y_cols = [f"y_{l}" for l in self.labels]
        self.m_cols = [f"m_{l}" for l in self.labels]

        # Ensure numeric dtypes (avoid numpy.object_ arrays later)
        for c in self.y_cols:
            if c in self.df.columns:
                self.df[c] = pd.to_numeric(self.df[c], errors="coerce").astype("float32")
        for c in self.m_cols:
            if c in self.df.columns:
                self.df[c] = pd.to_numeric(self.df[c], errors="coerce").astype("float32")

    def load_config_file(self):
        with open(self.config_path, "r", encoding="utf-8") as file:
            return yaml.safe_load(file)

    def __len__(self):
        return len(self.df)

    def __repr__(self):
        return (
            f"CheXpertParquetDataset(n={len(self)}, parquet='{self.parquet_path}', "
            f"image_root='{self.image_root}', labels={len(self.labels)})"
        )

    def __getitem__(self, idx: int):
        row = self.df.iloc[idx]

        # Resolve image path from rel_path (supports multiple disk layouts)
        rel = row["rel_path"]  # e.g. CheXpert-v1.0-small/train/...
        img_path = resolve_chexpert_path(
            rel, root_path=self.image_root, img_data=self.image_root
        )

        if not Path(img_path).exists():
            raise FileNotFoundError(
                f"Missing image for rel_path='{rel}' -> '{img_path}' "
                f"(image_root='{self.image_root}')"
            )

        img = Image.open(img_path).convert("L") # grayscale

        if self.transform:
            x = self.transform(img)
        else:
            # convert float tensor [1,H,W]
            x = torch.from_numpy(np.array(img)).float().unsqueeze(0) / 255.0
        
        # y can contain NaNs (float); m is 0/1
        y_np = row[self.y_cols].to_numpy(dtype=np.float32)
        m_np = row[self.m_cols].to_numpy(dtype=np.float32)
        y = torch.from_numpy(y_np)
        m = torch.from_numpy(m_np)

        meta = {
            "image_id": row.get("image_id", row["rel_path"]),
            "patient_id": row.get("patient_id", None),
            "view": row.get("AP/PA", None)
        }

        return x, y, m, meta  

if __name__ == "__main__":
    dataset = CheXpertParquetDataset()
    x, y, m, meta = dataset[0]
    print(dataset)
    print("x", tuple(x.shape), "y", tuple(y.shape), "m", tuple(m.shape))
    print("meta", meta)

