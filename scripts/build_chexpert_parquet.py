import argparse
from pathlib import Path
import re
import yaml
import numpy as np
import pandas as pd
from typing import List, Dict, Optional

# Load config file
def load_config_file(PATH: str= "./configs/label_policy.yaml"):
    with open(PATH, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)
    return config

config = load_config_file()

# Get labels from config file
CHEXPERT_LABELS = config.get("label_cols", {})

def parse_ids_from_path(p: str):
    # Example: CheXpert-v1.0-small/train/patient00001/study1/view1_frontal.jpg
    parts = str(p).split('/')
    patient_id = parts[2] if len(parts) > 2 else None
    study_id = parts[3] if len(parts) > 3 else None
    rel_path = '/'.join(parts)
    return patient_id, study_id, rel_path

def apply_policy(df_raw: pd.DataFrame, policy: Dict, label_cols: List[str]) -> pd.DataFrame:
    """
    Returns a dataframe with y_{label}, m_{label} columns.
    y is float in {0,1} or NaN (or 0.5 if soft policy).
    m is 1 if y should contribute to loss else 0
    """
    null_handling = policy["null_handling"] # missing | negative
    unc_handling = policy["uncertain_handling"] # ignore | zero | one | soft
    soft_val = float(policy.get("uncertain_soft_value", 0.5))

    out = df_raw.copy()

    for l in label_cols:
        s = out[l].astype('float32') # will convert blanks to NaN already if read correctly
        y = s.copy()

        # handle null (NaN)
        if null_handling == 'negative':
            y = y.fillna(0.0)
            m = np.ones(len(y), dtype=np.int8)
        elif null_handling == 'missing':
            m = (~y.isna()).astype(np.int8).to_numpy()
        else:
            raise ValueError("Unknown null handling: {}".format(null_handling))

        # handle uncertain (-1)
        is_unc = (y == -1.0)
        if unc_handling == "ignore":
            # mask out uncertain from loss, keep y as NaN so it won't be computed
            y = y.mask(is_unc, np.nan)
            m = np.where(is_unc.to_numpy(), 0, m).astype(np.int8)
        elif unc_handling == "zero":
            y = y.mask(is_unc, 0.0)
        elif unc_handling == "one":
            y = y.mask(is_unc, 1.0)
        elif unc_handling == "soft":
            y = y.mask(is_unc, soft_val)
        else:
            raise ValueError(f"Unknown uncertain_handling: {unc_handling}")

        # map positives/negatives
        y = y.replace({1.0: 1.0, 0.0: 0.0})

        out[f"y_{l}"] = y.astype("float32")
        out[f"m_{l}"] = m.astype("int8")

    # No Finding special handling
    nf_cfg = policy.get("no_finding", {"mode": "keep_original"})
    mode = nf_cfg.get("mode", "keep_original")

    if mode == "drop":
        out.drop(columns=["y_No Finding", "m_No Finding"], inplace=True, errors="ignore")

    elif mode == "keep_original":
        pass

    elif mode == "derive":
        req_obs = int(nf_cfg.get("require_observed_other_labels", 1))
        other = [l for l in label_cols if l != "No Finding"]

        y_other = np.stack([out[f"y_{l}"].to_numpy() for l in other], axis=1)
        m_other = np.stack([out[f"m_{l}"].to_numpy() for l in other], axis=1)

        any_pos = np.nanmax(np.where(np.isnan(y_other), -np.inf, y_other), axis=1) == 1.0
        observed_count = m_other.sum(axis=1)

        # “all observed are 0 and none positive”
        all_observed_zero = np.all((np.isnan(y_other)) | (y_other == 0.0) | (m_other == 0), axis=1) & (~any_pos)

        y_nf = np.full(len(out), np.nan, dtype=np.float32)
        m_nf = np.zeros(len(out), dtype=np.int8)

        # if any other positive => NF = 0 (observed)
        y_nf[any_pos] = 0.0
        m_nf[any_pos] = 1

        # if enough observed info and no positives => NF = 1
        ok = (observed_count >= req_obs) & all_observed_zero
        y_nf[ok] = 1.0
        m_nf[ok] = 1

        out["y_No Finding"] = y_nf
        out["m_No Finding"] = m_nf

    else:
        raise ValueError(f"Unknown no_finding.mode: {mode}")

    return out

def semantic_checks(df_policy: pd.DataFrame, label_cols: list[str]):
    # Basic rates
    y_cols = [c for c in df_policy.columns if c.startswith("y_")]
    m_cols = [c for c in df_policy.columns if c.startswith("m_")]

    # Contradiction: No Finding == 1 while any other label == 1
    if "y_No Finding" in df_policy.columns:
        other_y = [f"y_{l}" for l in label_cols if l != "No Finding" and f"y_{l}" in df_policy.columns]
        any_other_pos = (df_policy[other_y] == 1.0).any(axis=1)
        nf_pos = (df_policy["y_No Finding"] == 1.0)
        contradictions = int((nf_pos & any_other_pos).sum())
        print("No Finding contradictions (policy-derived):", contradictions)

    # Mean positives per image (excluding missing)
    pos_counts = []
    for l in label_cols:
        yc = f"y_{l}"
        if yc in df_policy.columns:
            pos_counts.append((df_policy[yc] == 1.0).astype("int32"))
    if pos_counts:
        mean_pos = pd.concat(pos_counts, axis=1).sum(axis=1).mean()
        print("Mean #positive labels/image (policy targets):", float(mean_pos))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train_csv", required=True)
    ap.add_argument("--policy_yaml", required=True)
    ap.add_argument("--variant", required=False, default=None)
    ap.add_argument("--out_base_parquet", required=True)
    ap.add_argument("--out_policy_parquet", required=False, default=None)
    args = ap.parse_args()

    # Load CSV
    df = pd.read_csv(args.train_csv)

    # Ensure label cols are floats with NaNs
    for c in CHEXPERT_LABELS:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    # Parse IDs
    ids = df["Path"].apply(parse_ids_from_path)
    df["patient_id"] = ids.apply(lambda x: x[0])
    df["study_id"] = ids.apply(lambda x: x[1])
    df["rel_path"] = ids.apply(lambda x: x[2])

    # Save base parquet (raw semantics)
    out_base = Path(args.out_base_parquet)
    out_base.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_base, index=False)

    # Optionally apply a policy variant and save
    if args.out_policy_parquet and args.variant:
        pol = yaml.safe_load(Path(args.policy_yaml).read_text())
        variant = pol["variants"][args.variant]
        df_pol = apply_policy(df, variant, pol["label_cols"])
        out_pol = Path(args.out_policy_parquet)
        out_pol.parent.mkdir(parents=True, exist_ok=True)
        df_pol.to_parquet(out_pol, index=False)
        semantic_checks(df_pol, pol["label_cols"])

if __name__ == "__main__":
    main()