from pathlib import Path

def resolve_chexpert_path(
    rel_path: str,
    root_path: Path,
    img_data: Path,
) -> Path:
    """
    rel_path examples:
      CheXpert-v1.0-small/train/patient00001/study1/view1_frontal.jpg
    disk layouts might be:
      <root>/CheXpert-v1.0-small/train/...
      <root>/train/...
    """

    s0 = str(rel_path).replace("\\", "/").lstrip("/")

    bases = [
        root_path,
        root_path / "CheXpert-v1.0-small",
        root_path.parent,
        img_data,
        img_data.parent,
    ]

    variants = {
        s0,
        s0.replace("CheXpert-v1.0-small/", "", 1),
        s0.replace("CheXpert-v1.0-small/train/", "train/", 1),
        s0.replace("CheXpert-v1.0-small/valid/", "valid/", 1),
    }

    for base in bases:
        for v in variants:
            p = base / v
            if p.exists():
                return p

    # If nothing matches, return the “most likely” default for error reporting
    return root_path / s0

