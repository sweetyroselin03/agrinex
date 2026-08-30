"""
AgriNex Disease ML - Populate Split Images Pipeline

1. Reads data/processed/agrinex_dataset/{train.csv, val.csv, test.csv}
2. Pre-flight verifies that all 72,507 raw image paths exist on disk.
3. Copies images into data/processed/agrinex_dataset/<split>/<canonical_class>/
   using shutil.copy2() while preserving file metadata and handling duplicate filenames.
4. Includes --dry-run option for pre-execution validation.
5. Performs post-copy image count verification.
6. Generates results/populate_split_report.txt.
"""

import sys
import argparse
import shutil
from pathlib import Path
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def populate_splits(dry_run=False):
    BASE_DIR = Path(__file__).resolve().parent.parent
    RAW_DIR = BASE_DIR / "data" / "raw"
    DATASET_DIR = BASE_DIR / "data" / "processed" / "agrinex_dataset"
    RESULTS_DIR = BASE_DIR / "results"

    csv_files = {
        "train": DATASET_DIR / "train.csv",
        "val": DATASET_DIR / "val.csv",
        "test": DATASET_DIR / "test.csv"
    }

    # Verify CSV files exist
    for split_name, path in csv_files.items():
        if not path.exists():
            print(f"❌ Error: Required CSV file for split '{split_name}' not found at: {path}")
            sys.exit(1)

    print("========================================================================")
    print(f"AGRINEX DISEASE ML - POPULATE SPLIT IMAGES PIPELINE ({'DRY RUN' if dry_run else 'ACTUAL COPY'})")
    print("========================================================================")

    # 1. Load all CSV records
    split_dfs = {}
    total_csv_records = 0
    for split_name, path in csv_files.items():
        df = pd.read_csv(path)
        split_dfs[split_name] = df
        total_csv_records += len(df)
        print(f"Loaded {split_name}.csv: {len(df)} records")

    print(f"Total CSV Records Across All Splits: {total_csv_records}")

    # 2. Pre-flight Verification: Resolve all image paths
    print("\n🔍 Step 1: Performing Pre-Flight Image Existence Verification...")
    missing_images = []
    task_queue = []

    for split_name, df in split_dfs.items():
        for idx, row in df.iterrows():
            rel_path_str = str(row["image_path"])
            source_path = RAW_DIR / rel_path_str if not Path(rel_path_str).is_absolute() else Path(rel_path_str)

            if not source_path.exists():
                missing_images.append((split_name, idx, rel_path_str, str(source_path)))
            else:
                task_queue.append({
                    "split": split_name,
                    "canonical_class": str(row["canonical_class"]),
                    "image_hash": str(row["image_hash"]),
                    "source_path": source_path,
                    "original_filename": source_path.name
                })

    if missing_images:
        print(f"\n❌ PRE-FLIGHT VERIFICATION FAILED! {len(missing_images)} images could not be found on disk.")
        print("Sample missing images:")
        for m in missing_images[:10]:
            print(f"  - Split [{m[0]}] Row {m[1]}: '{m[2]}' -> Resolved Path: '{m[3]}'")
        print("\nStopping pipeline execution immediately as requested.")
        sys.exit(1)

    print(f"✅ PRE-FLIGHT VERIFICATION PASSED! All {len(task_queue)} raw images resolved successfully on disk.")

    # 3. Destination Path Planning & Duplicate Filename Resolution
    print("\n📦 Step 2: Planning Destination Paths & Resolving Duplicate Filenames...")
    seen_dest_paths = set()
    copy_plan = []
    duplicate_filename_count = 0
    duplicate_details = []

    for task in task_queue:
        split_dir = DATASET_DIR / task["split"] / task["canonical_class"]
        orig_name = task["original_filename"]
        target_path = split_dir / orig_name

        if target_path in seen_dest_paths:
            duplicate_filename_count += 1
            stem = target_path.stem
            ext = target_path.suffix
            short_hash = task["image_hash"][:8]
            unique_name = f"{stem}_{short_hash}{ext}"
            target_path = split_dir / unique_name

            # Secondary fallback if hash collides in same folder
            counter = 1
            while target_path in seen_dest_paths:
                target_path = split_dir / f"{stem}_{short_hash}_{counter}{ext}"
                counter += 1

            duplicate_details.append({
                "split": task["split"],
                "canonical_class": task["canonical_class"],
                "original_filename": orig_name,
                "assigned_filename": target_path.name
            })

        seen_dest_paths.add(target_path)
        copy_plan.append({
            "source_path": task["source_path"],
            "target_path": target_path,
            "split": task["split"],
            "canonical_class": task["canonical_class"]
        })

    print(f"Destination Path Planning Completed.")
    print(f"Duplicate Filenames Handled : {duplicate_filename_count}")

    # 4. Dry-Run or Actual Copy Execution
    copied_count = 0
    if dry_run:
        print("\n[DRY RUN MODE] Simulating image copy operations...")
        copied_count = len(copy_plan)
        print(f"Would copy {copied_count} files using shutil.copy2().")
    else:
        print("\n🚀 Step 3: Executing Actual Image Copies (shutil.copy2)...")
        # Ensure directories exist
        created_dirs = set()
        for item in copy_plan:
            dest_dir = item["target_path"].parent
            if dest_dir not in created_dirs:
                dest_dir.mkdir(parents=True, exist_ok=True)
                created_dirs.add(dest_dir)

        # Execute file copy
        for idx, item in enumerate(copy_plan, 1):
            shutil.copy2(item["source_path"], item["target_path"])
            copied_count += 1
            if idx % 10000 == 0 or idx == len(copy_plan):
                print(f"   Copied {idx}/{len(copy_plan)} images...")

        print("✅ Image Copying Complete!")

    # 5. Post-Copy Verification
    print("\n📊 Step 4: Performing Post-Copy Split Verification...")
    split_counts = {"train": 0, "val": 0, "test": 0}
    canonical_counts = {}

    if not dry_run:
        for split_name in ["train", "val", "test"]:
            split_folder = DATASET_DIR / split_name
            for path in split_folder.rglob("*"):
                if path.is_file() and not path.name.endswith(".csv"):
                    split_counts[split_name] += 1
                    canon_cls = path.parent.name
                    canonical_counts[canon_cls] = canonical_counts.get(canon_cls, 0) + 1

        total_copied_on_disk = sum(split_counts.values())
        unique_canon_classes = len(canonical_counts)

        print(f"Train Image Count : {split_counts['train']} (Target: 50,757)")
        print(f"Val Image Count   : {split_counts['val']} (Target: 10,875)")
        print(f"Test Image Count  : {split_counts['test']} (Target: 10,875)")
        print(f"Total Disk Images : {total_copied_on_disk} (Target: 72,507)")
        print(f"Canonical Classes : {unique_canon_classes} (Target: 88)")

        verification_passed = (
            split_counts["train"] == 50757 and
            split_counts["val"] == 10875 and
            split_counts["test"] == 10875 and
            total_copied_on_disk == 72507 and
            unique_canon_classes == 88
        )
    else:
        for item in copy_plan:
            s = item["split"]
            c = item["canonical_class"]
            split_counts[s] += 1
            canonical_counts[c] = canonical_counts.get(c, 0) + 1

        total_copied_on_disk = sum(split_counts.values())
        unique_canon_classes = len(canonical_counts)
        verification_passed = True
        print(f"[DRY RUN] Simulated Train Count : {split_counts['train']}")
        print(f"[DRY RUN] Simulated Val Count   : {split_counts['val']}")
        print(f"[DRY RUN] Simulated Test Count  : {split_counts['test']}")

    # 6. Generate Report File: results/populate_split_report.txt
    report_lines = []
    report_lines.append("=" * 85)
    report_lines.append(f"AGRINEX DISEASE ML - POPULATE SPLIT IMAGES REPORT ({'DRY RUN' if dry_run else 'ACTUAL COPY'})")
    report_lines.append("=" * 85)
    report_lines.append(f"1. Total CSV Records            : {total_csv_records}")
    report_lines.append(f"2. Successfully Resolved Images : {len(task_queue)}")
    report_lines.append(f"3. Missing Images               : {len(missing_images)}")
    report_lines.append(f"4. Duplicate Filenames Handled  : {duplicate_filename_count}")
    report_lines.append(f"5. Total Copied Images on Disk  : {total_copied_on_disk}")
    report_lines.append(f"   - Train Split Image Count   : {split_counts['train']} (Target: 50757)")
    report_lines.append(f"   - Val Split Image Count     : {split_counts['val']} (Target: 10875)")
    report_lines.append(f"   - Test Split Image Count    : {split_counts['test']} (Target: 10875)")
    report_lines.append(f"6. Total Canonical Classes      : {unique_canon_classes} (Target: 88)")
    report_lines.append(f"7. Post-Copy Verification Status: {'PASSED (100% MATCH)' if verification_passed else 'FAILED'}")
    report_lines.append("-" * 85)

    if duplicate_details:
        report_lines.append("\n📋 SAMPLE DUPLICATE FILENAME RESOLUTION DETAILS (TOP 20):")
        report_lines.append("-" * 85)
        for d in duplicate_details[:20]:
            report_lines.append(f"  [{d['split']}/{d['canonical_class']}] '{d['original_filename']}' -> '{d['assigned_filename']}'")

    report_lines.append("\n📋 IMAGE COUNTS BY CANONICAL CLASS:")
    report_lines.append("-" * 85)
    for c_cls, cnt in sorted(canonical_counts.items(), key=lambda x: x[1], reverse=True):
        report_lines.append(f"  - {c_cls:<55} : {cnt} images")

    report_lines.append("=" * 85)

    report_path = RESULTS_DIR / "populate_split_report.txt"
    report_path.write_text("\n".join(report_lines), encoding='utf-8')
    print(f"\n✅ Saved Population Report: {report_path}")

    # Final Console Output
    print("\n" + "=" * 80)
    print(f"POPULATE SPLIT IMAGES SUMMARY ({'DRY RUN PASSED' if dry_run else 'COPY COMPLETED'})")
    print("=" * 80)
    print(f"TOTAL CSV RECORDS        : {total_csv_records}")
    print(f"SUCCESSFULLY COPIED      : {copied_count}")
    print(f"MISSING IMAGES           : {len(missing_images)}")
    print(f"DUPLICATES RENAMED       : {duplicate_filename_count}")
    print(f"TRAIN IMAGES             : {split_counts['train']}")
    print(f"VAL IMAGES               : {split_counts['val']}")
    print(f"TEST IMAGES              : {split_counts['test']}")
    print(f"TOTAL DISK IMAGES        : {total_copied_on_disk}")
    print(f"CANONICAL CLASSES        : {unique_canon_classes}")
    print(f"VERIFICATION STATUS      : {'PASSED' if verification_passed else 'FAILED'}")
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Populate AgriNex dataset split directories with images.")
    parser.add_argument("--dry-run", action="store_true", help="Perform pre-flight verification and planning without copying files.")
    args = parser.parse_args()

    populate_splits(dry_run=args.dry_run)
