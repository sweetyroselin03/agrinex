"""
AgriNex Disease ML - Update Final Class Decisions & Generate Final Dataset Plan

Performs manual review decision updates and generates:
1. data/processed/final_class_decisions.csv
2. results/small_class_review.txt
3. results/final_dataset_plan.txt
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# The 7 Review Class decisions specified by User:
# KEEP:
#   1. Orange___Haunglongbing_(Citrus_greening)
#   2. crape_jasmine - yld
# EXCLUDE:
#   3. Fruit - buck
#   4. banana_bush - yld
#   5. dwarf_white_bauhinia - death_leaf
#   6. dwarf_white_bauhinia - yld
#   7. hibiscus - death_leaf

EXCLUDE_REVIEW_CLASSES = {
    ("archive (4)", "Fruit - buck"),
    ("flower_data", "banana_bush - yld"),
    ("flower_data", "dwarf_white_bauhinia - death_leaf"),
    ("flower_data", "dwarf_white_bauhinia - yld"),
    ("flower_data", "hibiscus - death_leaf")
}

KEEP_REVIEW_CLASSES = {
    ("PlantVillage", "Orange___Haunglongbing_(Citrus_greening)"),
    ("flower_data", "crape_jasmine - yld")
}


def update_decisions_and_plan():
    BASE_DIR = Path(__file__).resolve().parent.parent
    PROCESSED_DIR = BASE_DIR / "data" / "processed"
    RESULTS_DIR = BASE_DIR / "results"

    csv_mapping_path = PROCESSED_DIR / "class_mapping_review.csv"
    csv_metadata_path = PROCESSED_DIR / "curated_metadata.csv"

    if not csv_mapping_path.exists() or not csv_metadata_path.exists():
        print("❌ Error: Processed metadata CSV files not found. Run src/curate_dataset.py first.")
        sys.exit(1)

    df_mapping = pd.read_csv(csv_mapping_path)
    df_curated = pd.read_csv(csv_metadata_path)

    # 1. Calculate unique image count per class from df_curated
    counts = df_curated.groupby(["source_dataset", "original_class"]).size().reset_index(name="unique_image_count")
    
    df_full = pd.merge(df_mapping, counts, on=["source_dataset", "original_class"], how="left")
    df_full["unique_image_count"] = df_full["unique_image_count"].fillna(0).astype(int)

    # 2. Update Decisions & Plant Part Metadata
    decisions_rows = []

    for _, row in df_full.iterrows():
        ds = row["source_dataset"]
        orig_cls = row["original_class"]
        pair = (ds, orig_cls)
        img_cnt = row["unique_image_count"]
        plant = row["plant"]
        disease = row["disease_name"]
        cond_type = row["condition_type"]

        # Default plant part logic with user's metadata rule:
        # flower_data YLD describes foliage -> LEAF.
        # Other flower_data classes without explicit leaf/fruit evidence -> UNKNOWN
        if ds == "flower_data":
            if "yld" in orig_cls.lower() or "scorch" in orig_cls.lower() or "blight" in orig_cls.lower() or "spot" in orig_cls.lower() or "death_leaf" in orig_cls.lower():
                plant_part = "LEAF"
            else:
                plant_part = "UNKNOWN"  # Do not guess FLOWER without explicit metadata
        elif ds == "archive (4)":
            if orig_cls.startswith("Fruit"):
                plant_part = "FRUIT"
            elif orig_cls.startswith("Leaf"):
                plant_part = "LEAF"
            else:
                plant_part = "UNKNOWN"
        else:
            plant_part = "LEAF"  # PlantVillage and Original Dataset are leaf datasets

        canonical_cls = f"{plant}__{disease}__{plant_part}"

        # Decision & Reason
        if pair in EXCLUDE_REVIEW_CLASSES:
            decision = "EXCLUDE"
            reason = "Explicitly excluded during manual review preparation (ambiguous/abbreviated/low count)"
        elif pair in KEEP_REVIEW_CLASSES:
            decision = "KEEP"
            reason = "Explicitly approved KEEP during manual review preparation"
        else:
            # Default mapping from curation
            if row["status"] == "KEEP":
                decision = "KEEP"
                reason = "Valid clear crop condition class"
            else:
                decision = "REVIEW"
                reason = "Pending review"

        decisions_rows.append({
            "source_dataset": ds,
            "original_class": orig_cls,
            "canonical_class": canonical_cls,
            "plant": plant,
            "plant_part": plant_part,
            "disease": disease,
            "health_status": cond_type,
            "image_count": img_cnt,
            "decision": decision,
            "reason": reason
        })

    df_decisions = pd.DataFrame(decisions_rows)

    # Save data/processed/final_class_decisions.csv
    csv_decisions_path = PROCESSED_DIR / "final_class_decisions.csv"
    df_decisions.to_csv(csv_decisions_path, index=False)
    print(f"✅ Saved Final Class Decisions: {csv_decisions_path}")

    # Update metadata file with canonical classes & decisions
    # Filter curated metadata for kept classes
    kept_pairs = set(df_decisions[df_decisions["decision"] == "KEEP"][["source_dataset", "original_class"]].itertuples(index=False, name=None))
    df_curated_kept = df_curated[df_curated.apply(lambda r: (r["source_dataset"], r["original_class"]) in kept_pairs, axis=1)]

    # -------------------------------------------------------------------------
    # PART 2: CREATE results/small_class_review.txt
    # -------------------------------------------------------------------------
    small_classes = df_decisions[df_decisions["image_count"] < 250].sort_values(by="image_count", ascending=True)

    small_lines = []
    small_lines.append("=" * 95)
    small_lines.append("AGRINEX DISEASE ML - SMALL CLASS REVIEW REPORT (< 250 IMAGES)")
    small_lines.append("=" * 95)
    small_lines.append(f"Total Classes with < 250 Images: {len(small_classes)}")
    small_lines.append("Note: Small classes are NOT automatically excluded. Evaluation is based on disease validity.\n")

    small_lines.append(f"{'Source Dataset':<16} | {'Original Class Name':<42} | {'Count':<5} | {'Decision':<8} | {'Recommendation & Analysis'}")
    small_lines.append("-" * 105)

    for _, r in small_classes.iterrows():
        cnt = r["image_count"]
        dec = r["decision"]
        if dec == "EXCLUDE":
            rec = "EXCLUDED (Ambiguous label or negligible count)"
        elif cnt < 50:
            rec = "REVIEW (Extremely small sample count <50, consider data augmentation)"
        else:
            rec = "KEEP (Valid crop disease/healthy condition, small sample size)"

        small_lines.append(f"{r['source_dataset']:<16} | {r['original_class']:<42} | {cnt:<5} | {dec:<8} | {rec}")

    small_report_path = RESULTS_DIR / "small_class_review.txt"
    small_report_path.write_text("\n".join(small_lines), encoding='utf-8')
    print(f"✅ Saved Small Class Review: {small_report_path}")

    # -------------------------------------------------------------------------
    # PART 3: CREATE results/final_dataset_plan.txt
    # -------------------------------------------------------------------------
    keep_df = df_decisions[df_decisions["decision"] == "KEEP"]
    exclude_df = df_decisions[df_decisions["decision"] == "EXCLUDE"]
    review_df = df_decisions[df_decisions["decision"] == "REVIEW"]

    total_keep_images = keep_df["image_count"].sum()

    healthy_keep = keep_df[keep_df["health_status"] == "Healthy"]
    disease_keep = keep_df[keep_df["health_status"] == "Disease"]

    total_healthy_imgs = healthy_keep["image_count"].sum()
    total_disease_imgs = disease_keep["image_count"].sum()

    num_crops = keep_df["plant"].nunique()
    num_plant_parts = keep_df["plant_part"].nunique()

    smallest_keep = keep_df.sort_values(by="image_count", ascending=True).iloc[0]
    largest_keep = keep_df.sort_values(by="image_count", ascending=False).iloc[0]

    # Imbalance stats
    mean_imgs = keep_df["image_count"].mean()
    median_imgs = keep_df["image_count"].median()
    std_imgs = keep_df["image_count"].std()
    min_imgs = keep_df["image_count"].min()
    max_imgs = keep_df["image_count"].max()
    imbalance_ratio = max_imgs / max(1, min_imgs)

    plan_lines = []
    plan_lines.append("=" * 85)
    plan_lines.append("AGRINEX DISEASE ML - FINAL DATASET PLAN REPORT")
    plan_lines.append("=" * 85)
    plan_lines.append(f"1. Final KEEP Class Count           : {len(keep_df)}")
    plan_lines.append(f"2. Final EXCLUDE Class Count        : {len(exclude_df)}")
    plan_lines.append(f"3. Final REVIEW Class Count         : {len(review_df)}")
    plan_lines.append(f"4. Total Images in KEEP Classes     : {total_keep_images} unique images")
    plan_lines.append(f"   - Healthy Images                 : {total_healthy_imgs} ({(total_healthy_imgs/total_keep_images)*100:.2f}%) across {len(healthy_keep)} classes")
    plan_lines.append(f"   - Disease Images                 : {total_disease_imgs} ({(total_disease_imgs/total_keep_images)*100:.2f}%) across {len(disease_keep)} classes")
    plan_lines.append(f"5. Number of Crop Species           : {num_crops}")
    plan_lines.append(f"6. Number of Plant-Part Categories   : {num_plant_parts} ({', '.join(sorted(keep_df['plant_part'].unique()))})")
    plan_lines.append(f"7. Smallest KEEP Class              : '{smallest_keep['original_class']}' [{smallest_keep['source_dataset']}] with {smallest_keep['image_count']} images")
    plan_lines.append(f"8. Largest KEEP Class               : '{largest_keep['original_class']}' [{largest_keep['source_dataset']}] with {largest_keep['image_count']} images")
    plan_lines.append("-" * 85)
    plan_lines.append("📊 CLASS IMBALANCE STATISTICS (KEEP CLASSES):")
    plan_lines.append(f"   - Minimum Image Count            : {min_imgs}")
    plan_lines.append(f"   - Maximum Image Count            : {max_imgs}")
    plan_lines.append(f"   - Mean Images Per Class          : {mean_imgs:.2f}")
    plan_lines.append(f"   - Median Images Per Class        : {median_imgs:.2f}")
    plan_lines.append(f"   - Standard Deviation             : {std_imgs:.2f}")
    plan_lines.append(f"   - Imbalance Ratio (Max/Min)      : {imbalance_ratio:.2f}:1")
    plan_lines.append("=" * 85)

    plan_report_path = RESULTS_DIR / "final_dataset_plan.txt"
    plan_report_path.write_text("\n".join(plan_lines), encoding='utf-8')
    print(f"✅ Saved Final Dataset Plan: {plan_report_path}")

    # Print summary to console
    print("\n" + "=" * 80)
    print("FINAL DATASET PLAN SUMMARY")
    print("=" * 80)
    print(f"FINAL KEEP CLASS COUNT    : {len(keep_df)}")
    print(f"FINAL EXCLUDE CLASS COUNT : {len(exclude_df)}")
    print(f"FINAL REVIEW CLASS COUNT  : {len(review_df)}")
    print(f"TOTAL IMAGES (KEEP)       : {total_keep_images}")
    print(f"  - HEALTHY IMAGES        : {total_healthy_imgs} ({(total_healthy_imgs/total_keep_images)*100:.2f}%)")
    print(f"  - DISEASE IMAGES        : {total_disease_imgs} ({(total_disease_imgs/total_keep_images)*100:.2f}%)")
    print(f"NUMBER OF CROPS           : {num_crops}")
    print(f"PLANT PARTS CATEGORIES    : {num_plant_parts} ({', '.join(sorted(keep_df['plant_part'].unique()))})")
    print(f"SMALLEST KEEP CLASS       : '{smallest_keep['original_class']}' ({smallest_keep['image_count']} imgs)")
    print(f"LARGEST KEEP CLASS        : '{largest_keep['original_class']}' ({largest_keep['image_count']} imgs)")
    print(f"IMBALANCE RATIO (MAX/MIN) : {imbalance_ratio:.2f}:1")
    print("=" * 80)


if __name__ == "__main__":
    update_decisions_and_plan()
