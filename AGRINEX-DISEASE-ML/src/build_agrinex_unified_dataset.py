import os
import sys
import shutil
import hashlib
import random
import csv
from pathlib import Path
from collections import defaultdict, Counter

# Fixed random seed for deterministic splitting
SEED = 42
random.seed(SEED)

RAW_DIR = Path("data/raw")
TARGET_DIR = RAW_DIR / "agrinex_unified"
RESULTS_DIR = Path("results")

# Ensure results directory exists
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Define explicit source-to-canonical mappings
LABEL_MAPPINGS = []

# 1. PlantVillage (38 baseline classes)
pv_dir = RAW_DIR / "PlantVillage"
if pv_dir.exists():
    for split in ['train', 'val', 'test']:
        split_p = pv_dir / split
        if split_p.exists():
            for c_name in os.listdir(split_p):
                c_p = split_p / c_name
                if c_p.is_dir():
                    LABEL_MAPPINGS.append(("PlantVillage", f"PlantVillage/{split}/{c_name}", c_name, c_name))

# 2. Original Dataset (22 classes across 6 crops)
orig_dir = RAW_DIR / "Original Dataset"
orig_class_map = {
    "Bitter Gourd/Downey mildew": "Bitter_Gourd___Downey_mildew",
    "Bitter Gourd/Fresh leaf": "Bitter_Gourd___healthy",
    "Bitter Gourd/Fusarium wilt": "Bitter_Gourd___Fusarium_wilt",
    "Bitter Gourd/Mosaic virus": "Bitter_Gourd___Mosaic_virus",
    "Bottle gourd/Anthracnose": "Bottle_Gourd___Anthracnose",
    "Bottle gourd/Downey mildew": "Bottle_Gourd___Downey_mildew",
    "Bottle gourd/Fresh leaf": "Bottle_Gourd___healthy",
    "Cauliflower/Black Rot": "Cauliflower___Black_Rot",
    "Cauliflower/Downy mildew": "Cauliflower___Downy_mildew",
    "Cauliflower/Fresh leaf": "Cauliflower___healthy",
    "Cucumber/Anthracnose lesions": "Cucumber___Anthracnose",
    "Cucumber/Belly rot": "Cucumber___Belly_rot",
    "Cucumber/Downy mildew": "Cucumber___Downy_mildew",
    "Cucumber/Fresh leaf": "Cucumber___healthy",
    "Eggplant/Eggplant begomovirus": "Eggplant___Begomovirus",
    "Eggplant/Eggplant Cercopora leaf spot": "Eggplant___Cercospora_leaf_spot",
    "Eggplant/Eggplant fresh leaf": "Eggplant___healthy",
    "Eggplant/Eggplant verticillium wilt": "Eggplant___Verticillium_wilt",
    "Tomato/Tomato Bacterial spot": "Tomato___Bacterial_spot",
    "Tomato/Tomato Fresh leaf": "Tomato___healthy",
    "Tomato/Tomato leaf curl virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato/Tomato spotted wilt": "Tomato___Tomato_spotted_wilt"
}

if orig_dir.exists():
    for crop in os.listdir(orig_dir):
        crop_p = orig_dir / crop
        if crop_p.is_dir():
            for condition in os.listdir(crop_p):
                cond_p = crop_p / condition
                if cond_p.is_dir():
                    src_key = f"{crop}/{condition}"
                    canon_name = orig_class_map.get(src_key)
                    if canon_name:
                        LABEL_MAPPINGS.append(("Original Dataset", f"Original Dataset/{src_key}", src_key, canon_name))

# 3. archive (4)/Leaf (10 classes)
archive_leaf_dir = RAW_DIR / "archive (4)" / "Leaf"
archive_leaf_map = {
    "Bacterial Spot": "Tomato___Bacterial_spot",
    "Cercospora leaf mold": "Tomato___Cercospora_leaf_spot",
    "Early Blight": "Tomato___Early_blight",
    "Healthy": "Tomato___healthy",
    "Insect Damage": "Tomato___Insect_damage",
    "Late Blight": "Tomato___Late_blight",
    "Leaf Miner": "Tomato___Leaf_miner",
    "Leaf Mold": "Tomato___Leaf_Mold",
    "Spider Mites": "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato Leaf Curl Virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus"
}

if archive_leaf_dir.exists():
    for c_name in os.listdir(archive_leaf_dir):
        c_p = archive_leaf_dir / c_name
        if c_p.is_dir():
            canon_name = archive_leaf_map.get(c_name)
            if canon_name:
                LABEL_MAPPINGS.append(("archive (4)/Leaf", f"archive (4)/Leaf/{c_name}", c_name, canon_name))

# Excluded datasets audit list
EXCLUDED_DATASETS = [
    ("data/raw/archive (4)/Fruit", 1320, "Fruit defect/disease images excluded (leaf-only classifier scope)"),
    ("data/raw/flower_data", 25200, "Ornamental flower/plant dataset excluded (agricultural food crop scope)"),
    ("data/raw/v2_augmented", 56243, "Derived composite folder excluded to prevent duplicate data leakage")
]

def get_sha256(file_path):
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def run_build():
    print("=" * 80)
    print("AGRINEX UNIFIED DATASET BUILDER")
    print("=" * 80)
    
    mapping_rows = []
    unique_mappings = {}
    for src_ds, rel_path, src_cls, canon_cls in LABEL_MAPPINGS:
        key = (src_ds, src_cls)
        if key not in unique_mappings:
            unique_mappings[key] = canon_cls
            mapping_rows.append({"Source_Dataset": src_ds, "Source_Class": src_cls, "Canonical_Class": canon_cls})

    csv_path = RESULTS_DIR / "agrinex_label_mapping.csv"
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["Source_Dataset", "Source_Class", "Canonical_Class"])
        writer.writeheader()
        writer.writerows(mapping_rows)
    print(f"Label mapping CSV saved: {csv_path}")

    # Collect source files
    print("\nScanning source images & calculating SHA-256 hashes...")
    priority = {"PlantVillage": 1, "Original Dataset": 2, "archive (4)/Leaf": 3}
    
    raw_candidates = []
    folder_image_counts = defaultdict(int)
    
    for src_ds, rel_path, src_cls, canon_cls in LABEL_MAPPINGS:
        folder = RAW_DIR / rel_path
        if folder.exists():
            for root, dirs, files in os.walk(folder):
                for f in files:
                    ext = Path(f).suffix.lower()
                    if ext in ['.jpg', '.jpeg', '.png', '.webp']:
                        full_p = Path(root) / f
                        raw_candidates.append((src_ds, canon_cls, full_p, rel_path))
                        folder_image_counts[rel_path] += 1

    raw_candidates.sort(key=lambda x: (priority.get(x[0], 99), str(x[2])))

    seen_hashes = {}
    duplicate_records = []
    unique_images = []

    for src_ds, canon_cls, full_p, rel_path in raw_candidates:
        h = get_sha256(full_p)
        if h in seen_hashes:
            orig_ds, orig_path = seen_hashes[h]
            duplicate_records.append((str(full_p.relative_to(RAW_DIR)), src_ds, orig_ds, str(orig_path.relative_to(RAW_DIR)), h))
        else:
            seen_hashes[h] = (src_ds, full_p)
            unique_images.append((h, src_ds, canon_cls, full_p))

    print(f"Total candidate images scanned: {len(raw_candidates)}")
    print(f"Duplicates removed via SHA-256: {len(duplicate_records)}")
    print(f"Unique source images retained: {len(unique_images)}")

    dup_report_path = RESULTS_DIR / "agrinex_duplicate_report.txt"
    with open(dup_report_path, 'w', encoding='utf-8') as f:
        f.write("================================================================================\n")
        f.write("AGRINEX UNIFIED DATASET - DUPLICATE IMAGE REPORT\n")
        f.write("================================================================================\n\n")
        f.write(f"Total Candidate Images Scanned: {len(raw_candidates)}\n")
        f.write(f"Duplicates Detected & Removed: {len(duplicate_records)}\n")
        f.write(f"Unique Images Retained: {len(unique_images)}\n\n")
        f.write("--- DETAILED DUPLICATE LIST ---\n")
        for dup_rel, dup_ds, orig_ds, orig_rel, h in duplicate_records:
            f.write(f"REMOVED: {dup_rel} [{dup_ds}] (Duplicate of {orig_rel} [{orig_ds}], Hash: {h[:16]}...)\n")

    print(f"Duplicate report saved: {dup_report_path}")

    # Deterministic splitting
    class_to_images = defaultdict(list)
    for entry in unique_images:
        h, src_ds, canon_cls, full_p = entry
        class_to_images[canon_cls].append(entry)

    split_counts = defaultdict(lambda: Counter())
    split_assignments = []

    for canon_cls, img_list in sorted(class_to_images.items()):
        shuffled = list(img_list)
        random.seed(SEED)
        random.shuffle(shuffled)

        n = len(shuffled)
        n_train = max(1, int(n * 0.70))
        n_val = max(1, int(n * 0.15))
        n_test = n - n_train - n_val

        train_imgs = shuffled[:n_train]
        val_imgs = shuffled[n_train:n_train + n_val]
        test_imgs = shuffled[n_train + n_val:]

        for sp_name, sp_list in [('train', train_imgs), ('val', val_imgs), ('test', test_imgs)]:
            for (h, src_ds, _, full_p) in sp_list:
                ext = full_p.suffix.lower()
                new_fn = f"{canon_cls}_{h[:12]}{ext}"
                split_assignments.append((sp_name, canon_cls, full_p, new_fn))
                split_counts[canon_cls][sp_name] += 1
                split_counts[canon_cls]['total'] += 1
                split_counts[canon_cls][f'src_{src_ds}'] += 1

    # Re-create output target directory
    if TARGET_DIR.exists():
        shutil.rmtree(TARGET_DIR)
    
    for sp in ['train', 'val', 'test']:
        for canon_cls in class_to_images.keys():
            (TARGET_DIR / sp / canon_cls).mkdir(parents=True, exist_ok=True)

    print(f"\nCopying {len(split_assignments)} unique images to {TARGET_DIR}...")
    copied_count = 0
    for sp_name, canon_cls, full_p, new_fn in split_assignments:
        dest_p = TARGET_DIR / sp_name / canon_cls / new_fn
        shutil.copy2(full_p, dest_p)
        copied_count += 1

    # Full Audit Summary Report
    summary_path = RESULTS_DIR / "agrinex_unified_dataset_summary.txt"
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("================================================================================\n")
        f.write("AGRINEX UNIFIED DATASET - COMPLETE AUDIT REPORT\n")
        f.write("================================================================================\n\n")
        f.write(f"Target Directory: {TARGET_DIR.resolve()}\n")
        f.write(f"Random Seed: {SEED}\n")
        f.write(f"Split Ratio: 70% Train / 15% Validation / 15% Test\n\n")
        f.write(f"Canonical Classes: {len(class_to_images)}\n")
        f.write(f"Total Candidate Images Scanned: {len(raw_candidates)}\n")
        f.write(f"Duplicates Removed: {len(duplicate_records)}\n")
        f.write(f"Total Retained Unified Images: {len(unique_images)}\n")
        f.write(f"  - Train Images: {sum(s['train'] for s in split_counts.values())}\n")
        f.write(f"  - Validation Images: {sum(s['val'] for s in split_counts.values())}\n")
        f.write(f"  - Test Images: {sum(s['test'] for s in split_counts.values())}\n\n")

        f.write("--- EXCLUDED / UNMAPPED DATASETS AND REASONS ---\n")
        for path_str, count, reason in EXCLUDED_DATASETS:
            f.write(f"  - {path_str} ({count} images): {reason}\n")
        f.write("\n")

        f.write("--- SOURCE FOLDER BREAKDOWN ---\n")
        for rel_p, cnt in sorted(folder_image_counts.items()):
            f.write(f"  - {rel_p}: {cnt} images\n")
        f.write("\n")

        f.write("--- CANONICAL CLASS BREAKDOWN & TRAIN/VAL/TEST COUNTS ---\n")
        f.write(f"{'Canonical Class Name':<50} | {'Train':<7} | {'Val':<7} | {'Test':<7} | {'Total':<7} | Source Datasets\n")
        f.write("-" * 110 + "\n")
        for canon_cls, counts in sorted(split_counts.items()):
            srcs = [k.replace('src_', '') for k in counts.keys() if k.startswith('src_')]
            src_str = ", ".join(srcs)
            f.write(f"{canon_cls:<50} | {counts['train']:<7} | {counts['val']:<7} | {counts['test']:<7} | {counts['total']:<7} | {src_str}\n")

    print(f"Audit summary report saved: {summary_path}")
    print("\n" + "=" * 80)
    print("SUCCESSFULLY CREATED UNIFIED DATASET & AUDIT REPORTS")
    print("=" * 80)

if __name__ == "__main__":
    run_build()
