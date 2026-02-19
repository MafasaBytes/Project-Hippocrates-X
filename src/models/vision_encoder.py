"""
BiomedCLIP ViT-B/16 vision encoder wrapper.

Loads the vision tower from Microsoft's BiomedCLIP (PMC-15M)
and exposes it as a standalone feature extractor.
The CLIP projection head is replaced with Identity so we get raw ViT features.
embed_dim is auto-detected from the loaded weights.

open_clip wraps this model in a TimmModel, so attribute access goes through
visual.trunk (the timm ViT) and visual.head (the CLIP projection).
"""

import torch
import torch.nn as nn


class BiomedCLIPVisionEncoder(nn.Module):

    CHECKPOINT = "hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"

    def __init__(self, freeze: bool = True):
        super().__init__()
        import open_clip

        clip_model, _, _ = open_clip.create_model_and_transforms(self.CHECKPOINT)

        self.visual = clip_model.visual

        # TimmModel layout: visual.trunk = timm ViT, visual.head = CLIP projection
        trunk = self.visual.trunk
        self.embed_dim = trunk.num_features  # 768 for ViT-B
        self.visual.head = nn.Identity()     # drop CLIP projection

        self._blocks = trunk.blocks          # transformer blocks for selective unfreeze
        self._norm = trunk.norm              # final layer norm

        del clip_model

        if freeze:
            self.freeze()

    def freeze(self):
        for p in self.visual.parameters():
            p.requires_grad = False

    def unfreeze(self, from_block: int = 0):
        """Unfreeze transformer blocks from index `from_block` onward.

        - from_block=0  -> full fine-tune (all blocks + embeddings)
        - from_block=10 -> only last 2 blocks + final norm  (ViT-B has 12 blocks)
        """
        self.freeze()

        if from_block == 0:
            for p in self.visual.parameters():
                p.requires_grad = True
            return

        for i in range(from_block, len(self._blocks)):
            for p in self._blocks[i].parameters():
                p.requires_grad = True
        for p in self._norm.parameters():
            p.requires_grad = True

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: [B, 3, 224, 224] -> features: [B, embed_dim]"""
        return self.visual(x)

    def trainable_params(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def total_params(self) -> int:
        return sum(p.numel() for p in self.parameters())

    def __repr__(self):
        return (
            f"BiomedCLIPVisionEncoder(embed_dim={self.embed_dim}, "
            f"blocks={len(self._blocks)}, "
            f"trainable={self.trainable_params():,}/{self.total_params():,})"
        )


if __name__ == "__main__":
    enc = BiomedCLIPVisionEncoder(freeze=True)
    print(enc)
    dummy = torch.randn(2, 3, 224, 224)
    out = enc(dummy)
    print(f"Input: {tuple(dummy.shape)} -> Output: {tuple(out.shape)}")

    enc.unfreeze(from_block=10)
    print(f"After unfreeze(10): {enc}")
