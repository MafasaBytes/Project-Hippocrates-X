import torch
import torchvision.transforms as T

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
        