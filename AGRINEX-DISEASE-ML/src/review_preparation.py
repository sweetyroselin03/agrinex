"""
AgriNex Disease ML - Manual Review Preparation Pipeline

Analyzes the 7 REVIEW classes, computes class balance across all 97 original classes,
and generates key analytical artifacts:
1. results/review_classes_report.txt
2. results/class_balance_report.txt
3. results/final_class_candidates.csv
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


def run_review_preparation():
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

    total_unique_images = len(df_curated)

    print("========================================================================")
    print("AGRINEX DISEASE ML - MANUAL REVIEW PREPARATION STAGE")
    print("========================================================================")
    print(f"Total Unique Images Analyzed: {total_unique_images}")
    print(f"Total Mapped Classes        : {len(df_mapping)}")

    # Calculate post-deduplication image counts for each (source_dataset, original_class)
    class_counts = df_curated.groupby(["source_dataset", "original_class"]).size().reset_index(name="unique_image_count")
    
    # Merge unique image counts into mapping dataframe
    df_analysis = pd.merge(df_mapping, class_counts, on=["source_dataset", "original_class"], how="left")
    df_analysis["unique_image_count"] = df_analysis["unique_image_count"].fillna(0).astype(int)
    df_analysis["pct_of_dataset"] = (df_analysis["unique_image_count"] / total_unique_images) * 100

    # Sort classes by unique_image_count descending
    df_analysis = df_analysis.sort_values(by="unique_image_count", ascending=False).reset_index(drop=True)
    df_analysis["rank"] = df_analysis.index + 1

    # -------------------------------------------------------------------------
    # PART 1: ANALYZE 7 REVIEW CLASSES
    # -------------------------------------------------------------------------
    review_class_details = [
        {
            "source_dataset": "PlantVillage",
            "original_class": "Orange___Haunglongbing_(Citrus_greening)",
            "proposed_canonical": "Orange__Huanglongbing_Citrus_Greening__LEAF",
            "plant": "Orange",
            "plant_part": "LEAF",
            "interpretation": "Huanglongbing (HLB) / Citrus Greening caused by Candidatus Liberibacter bacteria.",
            "why_review": "Dominant single class (5,507 unique images, 7.57% of dataset). Bacterial disease of citrus trees.",
            "suitable_for_ml": "YES - Highly relevant agricultural disease, though sample size balancing may be considered.",
            "recommendation": "KEEP (or Cap sample size for class balancing)"
        },
        {
            "source_dataset": "archive (4)",
            "original_class": "Fruit - buck",
            "proposed_canonical": "Generic_Fruit__Buckeye_Rot__FRUIT",
            "plant": "Generic_Fruit",
            "plant_part": "FRUIT",
            "interpretation": "Buckeye rot (Phytophthora parasitica) on fruit.",
            "why_review": "Abbreviated label 'buck' and very low sample count (27 unique images).",
            "suitable_for_ml": "YES for fruit disease, but requires augmentation or human verification due to low count.",
            "recommendation": "NEEDS HUMAN REVIEW"
        },
        {
            "source_dataset": "flower_data",
            "original_class": "banana_bush - yld",
            "proposed_canonical": "Banana_Bush__Yellow_Leaf_Disease_YLD__FLOWER",
            "plant": "Banana_Bush",
            "plant_part": "FLOWER",
            "interpretation": "Yellow Leaf Disease (YLD) causing foliage yellowing.",
            "why_review": "Abbreviated label 'yld' (Yellow Leaf Disease). Post-deduplication count is 63 images.",
            "suitable_for_ml": "YES - Valid plant disease condition, though sample size is small (63 images).",
            "recommendation": "NEEDS HUMAN REVIEW"
        },
        {
            "source_dataset": "flower_data",
            "original_class": "crape_jasmine - yld",
            "proposed_canonical": "Crape_Jasmine__Yellow_Leaf_Disease_YLD__FLOWER",
            "plant": "Crape_Jasmine",
            "plant_part": "FLOWER",
            "interpretation": "Yellow Leaf Disease (YLD) causing foliage yellowing.",
            "why_review": "Abbreviated label 'yld'. Post-deduplication count is 100 images.",
            "suitable_for_ml": "YES - Valid plant disease condition.",
            "recommendation": "KEEP"
        },
        {
            "source_dataset": "flower_data",
            "original_class": "dwarf_white_bauhinia - death_leaf",
            "proposed_canonical": "Dwarf_White_Bauhinia__Death_Leaf__FLOWER",
            "plant": "Dwarf_White_Bauhinia",
            "plant_part": "FLOWER",
            "interpretation": "Dead/necrotic foliage or natural leaf senescence ('death_leaf').",
            "why_review": "Ambiguous non-standard condition term 'death_leaf' (may be natural leaf drop rather than specific pathogen). Low count (31 images).",
            "suitable_for_ml": "QUESTIONABLE - May represent natural senescence rather than a target pathogen.",
            "recommendation": "NEEDS HUMAN REVIEW"
        },
        {
            "source_dataset": "flower_data",
            "original_class": "dwarf_white_bauhinia - yld",
            "proposed_canonical": "Dwarf_White_Bauhinia__Yellow_Leaf_Disease_YLD__FLOWER",
            "plant": "Dwarf_White_Bauhinia",
            "plant_part": "FLOWER",
            "interpretation": "Yellow Leaf Disease (YLD) causing foliage yellowing.",
            "why_review": "Abbreviated label 'yld'. Post-deduplication count is 67 images.",
            "suitable_for_ml": "YES - Valid plant disease condition.",
            "recommendation": "NEEDS HUMAN REVIEW"
        },
        {
            "source_dataset": "flower_data",
            "original_class": "hibiscus - death_leaf",
            "proposed_canonical": "Hibiscus__Death_Leaf__FLOWER",
            "plant": "Hibiscus",
            "plant_part": "FLOWER",
            "interpretation": "Dead/necrotic foliage or leaf senescence ('death_leaf').",
            "why_review": "Ambiguous condition term 'death_leaf'. Post-deduplication count is 92 images.",
            "suitable_for_ml": "QUESTIONABLE - May represent natural leaf drop.",
            "recommendation": "NEEDS HUMAN REVIEW"
        }
    ]

    # Write results/review_classes_report.txt
    review_lines = []
    review_lines.append("=" * 85)
    review_lines.append("AGRINEX DISEASE ML - 7 REVIEW CLASSES ANALYSIS REPORT")
    review_lines.append("=" * 85)
    review_lines.append(f"Total Review Classes Analyzed: {len(review_class_details)}\n")

    for idx, item in enumerate(review_class_details, 1):
        # Match actual image count
        match_row = df_analysis[(df_analysis["source_dataset"] == item["source_dataset"]) & 
                                (df_analysis["original_class"] == item["original_class"])]
        img_cnt = match_row["unique_image_count"].values[0] if len(match_row) > 0 else 0
        pct = match_row["pct_of_dataset"].values[0] if len(match_row) > 0 else 0.0

        review_lines.append(f"CLASS #{idx}: {item['original_class']}")
        review_lines.append("-" * 75)
        review_lines.append(f"  1. Source Dataset       : {item['source_dataset']}")
        review_lines.append(f"  2. Original Class Name  : {item['original_class']}")
        review_lines.append(f"  3. Proposed Canonical   : {item['proposed_canonical']}")
        review_lines.append(f"  4. Plant & Part         : Plant={item['plant']}, Part={item['plant_part']}")
        review_lines.append(f"  5. Unique Image Count   : {img_cnt} images ({pct:.2f}% of total dataset)")
        review_lines.append(f"  6. Disease Interpretation: {item['interpretation']}")
        review_lines.append(f"  7. Reason for REVIEW    : {item['why_review']}")
        review_lines.append(f"  8. Suitable for ML?     : {item['suitable_for_ml']}")
        review_lines.append(f"  9. Recommendation       : {item['recommendation']}")
        review_lines.append("")

    review_report_path = RESULTS_DIR / "review_classes_report.txt"
    review_report_path.write_text("\n".join(review_lines), encoding='utf-8')
    print(f"✅ Saved Review Classes Report: {review_report_path}")

    # -------------------------------------------------------------------------
    # PART 2: CLASS BALANCE ANALYSIS FOR ALL 97 CLASSES
    # -------------------------------------------------------------------------
    less_than_100 = df_analysis[df_analysis["unique_image_count"] < 100]
    less_than_250 = df_analysis[df_analysis["unique_image_count"] < 250]
    more_than_2000 = df_analysis[df_analysis["unique_image_count"] > 2000]

    healthy_df = df_analysis[df_analysis["condition_type"] == "Healthy"]
    disease_df = df_analysis[df_analysis["condition_type"] == "Disease"]
    ambiguous_df = df_analysis[df_analysis["condition_type"] == "Ambiguous"]

    total_healthy_imgs = healthy_df["unique_image_count"].sum()
    total_disease_imgs = disease_df["unique_image_count"].sum()
    total_ambiguous_imgs = ambiguous_df["unique_image_count"].sum()

    balance_lines = []
    balance_lines.append("=" * 95)
    balance_lines.append("AGRINEX DISEASE ML - COMPLETE CLASS BALANCE REPORT (ALL 97 CLASSES)")
    balance_lines.append("=" * 95)
    balance_lines.append(f"Total Scanned Classes     : 97")
    balance_lines.append(f"Total Unique Images       : {total_unique_images}")
    balance_lines.append(f"Healthy Image Total       : {total_healthy_imgs} ({(total_healthy_imgs/total_unique_images)*100:.2f}%) across {len(healthy_df)} classes")
    balance_lines.append(f"Disease Image Total       : {total_disease_imgs} ({(total_disease_imgs/total_unique_images)*100:.2f}%) across {len(disease_df)} classes")
    balance_lines.append(f"Ambiguous Image Total     : {total_ambiguous_imgs} ({(total_ambiguous_imgs/total_unique_images)*100:.2f}%) across {len(ambiguous_df)} classes")
    balance_lines.append("=" * 95)
    balance_lines.append("")

    balance_lines.append(f"📊 SUMMARY THRESHOLDS:")
    balance_lines.append(f"  - Classes with > 2,000 images : {len(more_than_2000)} classes")
    balance_lines.append(f"  - Classes with < 250 images   : {len(less_than_250)} classes")
    balance_lines.append(f"  - Classes with < 100 images   : {len(less_than_100)} classes")
    balance_lines.append("")

    balance_lines.append("🚨 CLASSES WITH < 100 IMAGES (Extremely Small Classes):")
    balance_lines.append("-" * 80)
    for _, r in less_than_100.iterrows():
        balance_lines.append(f"  Rank #{r['rank']:<2} | [{r['source_dataset']:<15}] {r['original_class']:<42} | Count: {r['unique_image_count']:<4} ({r['pct_of_dataset']:.2f}%)")

    balance_lines.append("\n⚠️ CLASSES WITH < 250 IMAGES (Small Classes):")
    balance_lines.append("-" * 80)
    for _, r in less_than_250.iterrows():
        balance_lines.append(f"  Rank #{r['rank']:<2} | [{r['source_dataset']:<15}] {r['original_class']:<42} | Count: {r['unique_image_count']:<4} ({r['pct_of_dataset']:.2f}%)")

    balance_lines.append("\n🔥 CLASSES WITH > 2,000 IMAGES (Large Dominant Classes):")
    balance_lines.append("-" * 80)
    for _, r in more_than_2000.iterrows():
        balance_lines.append(f"  Rank #{r['rank']:<2} | [{r['source_dataset']:<15}] {r['original_class']:<42} | Count: {r['unique_image_count']:<4} ({r['pct_of_dataset']:.2f}%)")

    balance_lines.append("\n" + "=" * 95)
    balance_lines.append(f"{'Rank':<5} | {'Source Dataset':<16} | {'Original Class Name':<42} | {'Category':<10} | {'Count':<6} | {'Pct %':<6}")
    balance_lines.append("=" * 95)

    for _, r in df_analysis.iterrows():
        balance_lines.append(f"{r['rank']:<5} | {r['source_dataset']:<16} | {r['original_class']:<42} | {r['condition_type']:<10} | {r['unique_image_count']:<6} | {r['pct_of_dataset']:>5.2f}%")

    balance_report_path = RESULTS_DIR / "class_balance_report.txt"
    balance_report_path.write_text("\n".join(balance_lines), encoding='utf-8')
    print(f"✅ Saved Class Balance Report: {balance_report_path}")

    # -------------------------------------------------------------------------
    # PART 3: CREATE final_class_candidates.csv
    # -------------------------------------------------------------------------
    df_candidates = pd.DataFrame({
        "class": df_analysis["proposed_standard_class"],
        "original_class": df_analysis["original_class"],
        "source_dataset": df_analysis["source_dataset"],
        "image_count": df_analysis["unique_image_count"],
        "healthy_or_disease": df_analysis["condition_type"],
        "plant": df_analysis["plant"],
        "plant_part": df_analysis["plant_part"],
        "status": df_analysis["status"],
        "reason": df_analysis["reason"]
    })

    candidates_path = RESULTS_DIR / "final_class_candidates.csv"
    df_candidates.to_csv(candidates_path, index=False)
    print(f"✅ Saved Final Class Candidates CSV: {candidates_path}")

    # -------------------------------------------------------------------------
    # PART 4: CONSOLE OUTPUT AT THE END
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("SUMMARY OF THE 7 REVIEW CLASSES")
    print("=" * 80)
    for idx, item in enumerate(review_class_details, 1):
        match_row = df_analysis[(df_analysis["source_dataset"] == item["source_dataset"]) & 
                                (df_analysis["original_class"] == item["original_class"])]
        img_cnt = match_row["unique_image_count"].values[0] if len(match_row) > 0 else 0
        print(f"  {idx}. [{item['source_dataset']}] '{item['original_class']}' ({img_cnt} imgs)")
        print(f"     Canonical: {item['proposed_canonical']}")
        print(f"     Reason   : {item['why_review']}")
        print(f"     Rec      : {item['recommendation']}\n")

    print("=" * 80)
    print("COMPLETE CLASS-BALANCE SUMMARY")
    print("=" * 80)
    print(f"Total Raw Classes Mapped : 97")
    print(f"Total Unique Images      : {total_unique_images}")
    print(f"Healthy Condition Images : {total_healthy_imgs} ({(total_healthy_imgs/total_unique_images)*100:.2f}%)")
    print(f"Disease Condition Images : {total_disease_imgs} ({(total_disease_imgs/total_unique_images)*100:.2f}%)")
    print(f"Ambiguous Images         : {total_ambiguous_imgs} ({(total_ambiguous_imgs/total_unique_images)*100:.2f}%)")
    print("-" * 80)
    print(f"Large Classes (>2,000 imgs) : {len(more_than_2000)} classes")
    print(f"Small Classes (<250 imgs)   : {len(less_than_250)} classes")
    print(f"Tiny Classes  (<100 imgs)   : {len(less_than_100)} classes")
    print("=" * 80)


if __name__ == "__main__":
    run_review_preparation()
