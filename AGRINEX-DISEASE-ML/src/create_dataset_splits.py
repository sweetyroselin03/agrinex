"""
AgriNex Disease ML - Dataset Splitting & Leakage Verification Pipeline

1. Filters curated metadata for KEEP classes only (92 classes, 72,507 unique images)
2. Performs 70% Train / 15% Validation / 15% Test stratified splitting per canonical class
3. Ensures strict zero-leakage hash isolation across splits
4. Generates data/processed/agrinex_dataset/{train.csv, val.csv, test.csv}
5. Generates results/final_split_report.txt
6. Generates results/data_leakage_check.txt
7. Generates results/final_split_distribution.csv
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SEED = 42


def create_splits():
    BASE_DIR = Path(__file__).resolve().parent.parent
    PROCESSED_DIR = BASE_DIR / "data" / "processed"
    RESULTS_DIR = BASE_DIR / "results"
    DATASET_DIR = PROCESSED_DIR / "agrinex_dataset"

    # Create directories
    (DATASET_DIR / "train").mkdir(parents=True, exist_ok=True)
    (DATASET_DIR / "val").mkdir(parents=True, exist_ok=True)
    (DATASET_DIR / "test").mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    csv_decisions_path = PROCESSED_DIR / "final_class_decisions.csv"
    csv_metadata_path = PROCESSED_DIR / "curated_metadata.csv"

    if not csv_decisions_path.exists() or not csv_metadata_path.exists():
        print("❌ Error: Processed metadata CSV files not found. Run prior pipeline stages first.")
        sys.exit(1)

    df_decisions = pd.read_csv(csv_decisions_path)
    df_curated = pd.read_csv(csv_metadata_path)

    # 1. Filter KEEP classes only
    keep_rows = df_decisions[df_decisions["decision"] == "KEEP"]
    keep_pairs = set(zip(keep_rows["source_dataset"], keep_rows["original_class"]))
    
    # Map decision metadata back to curated images
    mapping_dict = {(r["source_dataset"], r["original_class"]): r for _, r in keep_rows.iterrows()}

    df_filtered = df_curated[df_curated.apply(lambda r: (r["source_dataset"], r["original_class"]) in keep_pairs, axis=1)].copy()

    # Update canonical_class and plant_part from final decisions
    df_filtered["canonical_class"] = df_filtered.apply(
        lambda r: mapping_dict[(r["source_dataset"], r["original_class"])]["canonical_class"], axis=1
    )
    df_filtered["plant_part"] = df_filtered.apply(
        lambda r: mapping_dict[(r["source_dataset"], r["original_class"])]["plant_part"], axis=1
    )
    df_filtered["crop"] = df_filtered.apply(
        lambda r: mapping_dict[(r["source_dataset"], r["original_class"])]["plant"], axis=1
    )

    total_images = len(df_filtered)
    unique_classes = df_filtered["canonical_class"].nunique()

    print("========================================================================")
    print("AGRINEX DISEASE ML - DATASET STRATIFIED SPLITTING PIPELINE")
    print("========================================================================")
    print(f"Total Unique Images in KEEP Classes: {total_images}")
    print(f"Total Candidate Classes            : {unique_classes}")

    # 2. Per-Class Stratified Splitting (70% Train, 15% Val, 15% Test)
    np.random.seed(SEED)
    
    split_records = []
    distribution_rows = []

    for canonical_cls, group in df_filtered.groupby("canonical_class"):
        group_shuffled = group.sample(frac=1.0, random_state=SEED).reset_index(drop=True)
        n = len(group_shuffled)
        
        if n >= 3:
            n_val = max(1, int(np.round(n * 0.15)))
            n_test = max(1, int(np.round(n * 0.15)))
            n_train = n - n_val - n_test
            if n_train < 1:
                n_train = 1
                n_val = (n - 1) // 2
                n_test = n - 1 - n_val
        elif n == 2:
            n_train, n_val, n_test = 1, 0, 1
        else:
            n_train, n_val, n_test = 1, 0, 0

        train_part = group_shuffled.iloc[:n_train].copy()
        val_part = group_shuffled.iloc[n_train:n_train + n_val].copy()
        test_part = group_shuffled.iloc[n_train + n_val:].copy()

        train_part["split"] = "train"
        val_part["split"] = "val"
        test_part["split"] = "test"

        split_records.extend([train_part, val_part, test_part])

        distribution_rows.append({
            "canonical_class": canonical_cls,
            "total_images": n,
            "train_count": len(train_part),
            "val_count": len(val_part),
            "test_count": len(test_part),
            "train_pct": (len(train_part) / n) * 100,
            "val_pct": (len(val_part) / n) * 100,
            "test_pct": (len(test_part) / n) * 100
        })

    df_split_all = pd.concat(split_records, ignore_index=True)

    # 3. Create Split CSVs
    # Reorder/rename columns as requested:
    # image_path, image_hash, source_dataset, original_class, canonical_class, plant, plant_part, disease, health_status, split
    df_split_all["plant"] = df_split_all["crop"]
    cols_order = [
        "image_path", "image_hash", "source_dataset", "original_class",
        "canonical_class", "plant", "plant_part", "disease", "health_status", "split"
    ]

    df_train = df_split_all[df_split_all["split"] == "train"][cols_order]
    df_val = df_split_all[df_split_all["split"] == "val"][cols_order]
    df_test = df_split_all[df_split_all["split"] == "test"][cols_order]

    train_csv_path = DATASET_DIR / "train.csv"
    val_csv_path = DATASET_DIR / "val.csv"
    test_csv_path = DATASET_DIR / "test.csv"

    df_train.to_csv(train_csv_path, index=False)
    df_val.to_csv(val_csv_path, index=False)
    df_test.to_csv(test_csv_path, index=False)

    print(f"\n✅ Saved Train CSV       : {train_csv_path} ({len(df_train)} rows)")
    print(f"✅ Saved Validation CSV  : {val_csv_path} ({len(df_val)} rows)")
    print(f"✅ Saved Test CSV        : {test_csv_path} ({len(df_test)} rows)")

    # Save distribution summary CSV
    df_distrib = pd.DataFrame(distribution_rows).sort_values(by="total_images", ascending=False)
    distrib_csv_path = RESULTS_DIR / "final_split_distribution.csv"
    df_distrib.to_csv(distrib_csv_path, index=False)
    print(f"✅ Saved Split Distribution CSV: {distrib_csv_path}")

    # 4. Perform Data Leakage Check
    train_hashes = set(df_train["image_hash"])
    val_hashes = set(df_val["image_hash"])
    test_hashes = set(df_test["image_hash"])

    train_val_overlap = train_hashes.intersection(val_hashes)
    train_test_overlap = train_hashes.intersection(test_hashes)
    val_test_overlap = val_hashes.intersection(test_hashes)

    leakage_lines = []
    leakage_lines.append("=" * 80)
    leakage_lines.append("AGRINEX DISEASE ML - DATA LEAKAGE VERIFICATION REPORT")
    leakage_lines.append("=" * 80)
    leakage_lines.append(f"Train Set Unique Hashes      : {len(train_hashes)}")
    leakage_lines.append(f"Validation Set Unique Hashes : {len(val_hashes)}")
    leakage_lines.append(f"Test Set Unique Hashes       : {len(test_hashes)}")
    leakage_lines.append("-" * 80)
    leakage_lines.append(f"train ↔ val duplicate hashes  : {len(train_val_overlap)}")
    leakage_lines.append(f"train ↔ test duplicate hashes : {len(train_test_overlap)}")
    leakage_lines.append(f"val ↔ test duplicate hashes   : {len(val_test_overlap)}")
    leakage_lines.append("-" * 80)

    if len(train_val_overlap) == 0 and len(train_test_overlap) == 0 and len(val_test_overlap) == 0:
        leakage_lines.append("✅ RESULT: PASSED - ZERO DATA LEAKAGE DETECTED ACROSS ALL SPLITS!")
        leakage_passed = True
    else:
        leakage_lines.append("❌ RESULT: FAILED - DUPLICATE HASHES DETECTED!")
        leakage_passed = False

    leakage_lines.append("=" * 80)
    leakage_report_path = RESULTS_DIR / "data_leakage_check.txt"
    leakage_report_path.write_text("\n".join(leakage_lines), encoding='utf-8')
    print(f"✅ Saved Data Leakage Report: {leakage_report_path}")

    # 5. Generate Final Split Report
    healthy_cnt = len(df_split_all[df_split_all["health_status"] == "Healthy"])
    disease_cnt = len(df_split_all[df_split_all["health_status"] == "Disease"])
    ambiguous_cnt = len(df_split_all[df_split_all["health_status"] == "Ambiguous"])

    smallest_row = df_distrib.iloc[-1]
    largest_row = df_distrib.iloc[0]

    report_lines = []
    report_lines.append("=" * 85)
    report_lines.append("AGRINEX DISEASE ML - FINAL SPLIT REPORT")
    report_lines.append("=" * 85)
    report_lines.append(f"Total Unique Images            : {total_images}")
    report_lines.append(f"Train Split Count (70%)        : {len(df_train)} images ({(len(df_train)/total_images)*100:.2f}%)")
    report_lines.append(f"Validation Split Count (15%)   : {len(df_val)} images ({(len(df_val)/total_images)*100:.2f}%)")
    report_lines.append(f"Test Split Count (15%)         : {len(df_test)} images ({(len(df_test)/total_images)*100:.2f}%)")
    report_lines.append(f"Total Candidate Classes        : {unique_classes}")
    report_lines.append(f"Healthy Images                 : {healthy_cnt} ({(healthy_cnt/total_images)*100:.2f}%)")
    report_lines.append(f"Disease Images                 : {disease_cnt} ({(disease_cnt/total_images)*100:.2f}%)")
    report_lines.append(f"Ambiguous Images               : {ambiguous_cnt} ({(ambiguous_cnt/total_images)*100:.2f}%)")
    report_lines.append(f"Smallest Class                 : '{smallest_row['canonical_class']}' ({smallest_row['total_images']} imgs)")
    report_lines.append(f"Largest Class                  : '{largest_row['canonical_class']}' ({largest_row['total_images']} imgs)")
    report_lines.append("-" * 85)

    report_lines.append("\n📋 PER-CLASS TRAIN / VAL / TEST SPLIT BREAKDOWN:")
    report_lines.append("-" * 95)
    report_lines.append(f"{'Canonical Class Name':<45} | {'Total':<6} | {'Train':<6} | {'Val':<6} | {'Test':<6}")
    report_lines.append("-" * 95)

    for _, r in df_distrib.iterrows():
        report_lines.append(f"{r['canonical_class']:<45} | {r['total_images']:<6} | {r['train_count']:<6} | {r['val_count']:<6} | {r['test_count']:<6}")

    report_lines.append("=" * 85)

    split_report_path = RESULTS_DIR / "final_split_report.txt"
    split_report_path.write_text("\n".join(report_lines), encoding='utf-8')
    print(f"✅ Saved Final Split Report: {split_report_path}")

    # 6. Final Console Summary
    print("\n" + "=" * 80)
    print("COMPLETE SPLIT SUMMARY & LEAKAGE CHECK RESULT")
    print("=" * 80)
    print(f"TOTAL IMAGES IN SPLIT      : {total_images}")
    print(f"  - TRAIN COUNT (70%)      : {len(df_train)} ({(len(df_train)/total_images)*100:.2f}%)")
    print(f"  - VALIDATION COUNT (15%) : {len(df_val)} ({(len(df_val)/total_images)*100:.2f}%)")
    print(f"  - TEST COUNT (15%)       : {len(df_test)} ({(len(df_test)/total_images)*100:.2f}%)")
    print(f"TOTAL KEEP CLASSES         : {unique_classes}")
    print(f"HEALTHY IMAGES             : {healthy_cnt} ({(healthy_cnt/total_images)*100:.2f}%)")
    print(f"DISEASE IMAGES             : {disease_cnt} ({(disease_cnt/total_images)*100:.2f}%)")
    print("-" * 80)
    print("DATA LEAKAGE VERIFICATION  :")
    print(f"  - train ↔ val duplicate hashes  : {len(train_val_overlap)}")
    print(f"  - train ↔ test duplicate hashes : {len(train_test_overlap)}")
    print(f"  - val ↔ test duplicate hashes   : {len(val_test_overlap)}")
    print(f"OVERALL LEAKAGE STATUS     : {'PASSED (ZERO LEAKAGE)' if leakage_passed else 'FAILED'}")
    print("=" * 80)


if __name__ == "__main__":
    create_splits()
