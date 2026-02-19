"""
Reusable multi-label classification head.

Designed to sit on top of any encoder that produces a fixed-dim feature vector.
"""

import torch
import torch.nn as nn


class MultiLabelHead(nn.Module):
    def __init__(self, in_dim: int = 768, num_labels: int = 13, dropout: float = 0.1):
        super().__init__()
        self.drop = nn.Dropout(dropout)
        self.fc = nn.Linear(in_dim, num_labels)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        """features: [B, in_dim] → logits: [B, num_labels]"""
        return self.fc(self.drop(features))
