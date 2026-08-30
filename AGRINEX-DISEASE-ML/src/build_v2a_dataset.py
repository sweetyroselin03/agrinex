"""
AgriNex Disease ML - Build V2-A Dataset (39 Classes)

1. Verifies 38 PlantVillage classes.
2. Copies PlantVillage train/val/test splits to data/raw/v2_augmented/.
3. Maps safe real-world categories from 'Original Dataset':
   - Tomato/Tomato Bacterial spot -> Tomato___Bacterial_spot
   - Tomato/Tomato Fresh leaf -> Tomato___healthy
   - Tomato/Tomato leaf curl virus -> Tomato___Tomato_Yellow_Leaf_Curl_Virus
4. Splits mapped real-world categories into 70% train, 15% val, 15% test with seed 42.
5. Creates 'Background_Or_Non_Crop_Leaf' directory in train/val/test (39th class).
6. Prevents filename collisions using unique prefixes.
7. Outputs full summary reports to console and results/v2a_dataset_summary.txt.
"""

import os
import sys
import random
import shutil
from pathlib import Path
from collections import defaultdict

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

RANDOM_SEED = 42

SAFE_REAL_WORLD_MAPPINGS = {
    ("Tomato", "Tomato Bacterial spot"): "Tomato___Bacterial_spot",
    ("Tomato", "Tomato Fresh leaf"): "Tomato___healthy",
    ("Tomato", "Tomato leaf curl virus"): "Tomato___Tomato_Yellow_Leaf_Curl_Virus"
}

NEGATIVE_CLASS_NAME = "Background_Or_Non_Crop_Leaf"


def build_v2a_dataset():
    BASE_DIR = Path(__file__).resolve().parent.parent
    PLANTVILLAGE_DIR = BASE_DIR / "data" / "raw" / "PlantVillage"
    ORIGINAL_DATASET_DIR = BASE_DIR / "data" / "raw" / "Original Dataset"
    V2A_DIR = BASE_DIR / "data" / "raw" / "v2_augmented"
    RESULTS_DIR = BASE_DIR / "results"
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("AGRINEX V2-A DATASET BUILDER & VERIFICATION")
    print("=" * 80)

    # 1. Verify PlantVillage directory structure
    for split in ["train", "val", "test"]:
        split_path = PLANTVILLAGE_DIR / split
        if not split_path.exists():
            raise FileNotFoundError(f"❌ Error: Required PlantVillage split missing: {split_path}")

    train_classes = sorted([d.name for d in (PLANTVILLAGE_DIR / "train").iterdir() if d.is_dir()])
    val_classes = sorted([d.name for d in (PLANTVILLAGE_DIR / "val").iterdir() if d.is_dir()])
    test_classes = sorted([d.name for d in (PLANTVILLAGE_DIR / "test").iterdir() if d.is_dir()])

    if len(train_classes) != 38 or train_classes != val_classes or train_classes != test_classes:
        raise ValueError(
            f"❌ PlantVillage class inconsistency! Train: {len(train_classes)}, "
            f"Val: {len(val_classes)}, Test: {len(test_classes)}"
        )

    print("✅ Verified PlantVillage: exactly 38 identical classes across train, val, and test splits.")

    # 2. Target 39 classes for V2-A
    v2a_classes = sorted(train_classes + [NEGATIVE_CLASS_NAME])
    print(f"✅ Total V2-A classes planned: {len(v2a_classes)} (38 PlantVillage + 1 Negative Class: '{NEGATIVE_CLASS_NAME}')")

    # Clean / Initialize V2-A target directory
    if V2A_DIR.exists():
        print(f"🧹 Initializing/refreshing target directory: {V2A_DIR}")
        shutil.rmtree(V2A_DIR)
    
    for split in ["train", "val", "test"]:
        for cls_name in v2a_classes:
            (V2A_DIR / split / cls_name).mkdir(parents=True, exist_ok=True)

    # 3. Copy PlantVillage dataset into v2_augmented
    print("\n📦 Copying PlantVillage base splits into v2_augmented...")
    pv_counts = defaultdict(lambda: defaultdict(int))
    
    for split in ["train", "val", "test"]:
        src_split_dir = PLANTVILLAGE_DIR / split
        dst_split_dir = V2A_DIR / split
        for cls_name in train_classes:
            src_cls_dir = src_split_dir / cls_name
            dst_cls_dir = dst_split_dir / cls_name
            
            for img_file in src_cls_dir.glob("*"):
                if img_file.is_file():
                    shutil.copy2(img_file, dst_cls_dir / img_file.name)
                    pv_counts[split][cls_name] += 1

    print("✅ PlantVillage base dataset copied successfully.")

    # 4. Process Mapped Real-World Images from 'Original Dataset'
    print("\n🌿 Processing safe real-world image mappings from 'Original Dataset'...")
    random.seed(RANDOM_SEED)

    rw_added_counts = defaultdict(lambda: defaultdict(int))
    rw_unmapped_counts = defaultdict(int)

    for crop_dir in sorted(ORIGINAL_DATASET_DIR.iterdir()):
        if not crop_dir.is_dir():
            continue
        for cat_dir in sorted(crop_dir.iterdir()):
            if not cat_dir.is_dir():
                continue
            
            category_key = (crop_dir.name, cat_dir.name)
            images = sorted([f for f in cat_dir.glob("*") if f.is_file()])
            
            if category_key in SAFE_REAL_WORLD_MAPPINGS:
                target_cls = SAFE_REAL_WORLD_MAPPINGS[category_key]
                random.shuffle(images)
                
                n_total = len(images)
                n_train = int(n_total * 0.70)
                n_val = int(n_total * 0.15)
                
                train_imgs = images[:n_train]
                val_imgs = images[n_train:n_train + n_val]
                test_imgs = images[n_train + n_val:]
                
                for img_list, split in [(train_imgs, "train"), (val_imgs, "val"), (test_imgs, "test")]:
                    dst_dir = V2A_DIR / split / target_cls
                    for img in img_list:
                        safe_filename = f"rw_{crop_dir.name}_{cat_dir.name}_{img.name}".replace(" ", "_")
                        shutil.copy2(img, dst_dir / safe_filename)
                        rw_added_counts[split][target_cls] += 1
                        
                print(f"  [MAPPED] '{crop_dir.name}/{cat_dir.name}' ({n_total} imgs) -> '{target_cls}' "
                      f"[Train: {len(train_imgs)}, Val: {len(val_imgs)}, Test: {len(test_imgs)}]")
            else:
                rw_unmapped_counts[f"{crop_dir.name}/{cat_dir.name}"] = len(images)
                print(f"  [UNMAPPED / HELD OUT] '{crop_dir.name}/{cat_dir.name}': {len(images)} images (Retained for OOD evaluation)")

    # 5. Final Dataset Audit & Verification
    print("\n" + "=" * 85)
    print("V2-A DATASET SUMMARY & AUDIT REPORT")
    print("=" * 85)

    total_train = 0
    total_val = 0
    total_test = 0

    class_stats = []

    print(f"{'Class Name':<48} | {'Train':<7} | {'Val':<7} | {'Test':<7} | {'Total':<7}")
    print("-" * 85)

    for cls_name in v2a_classes:
        tr_cnt = len(list((V2A_DIR / "train" / cls_name).glob("*")))
        va_cnt = len(list((V2A_DIR / "val" / cls_name).glob("*")))
        te_cnt = len(list((V2A_DIR / "test" / cls_name).glob("*")))
        tot = tr_cnt + va_cnt + te_cnt
        
        total_train += tr_cnt
        total_val += va_cnt
        total_test += te_cnt
        
        class_stats.append((cls_name, tr_cnt, va_cnt, te_cnt, tot))
        print(f"{cls_name:<48} | {tr_cnt:<7} | {va_cnt:<7} | {te_cnt:<7} | {tot:<7}")

    print("-" * 85)
    print(f"{'TOTALS':<48} | {total_train:<7} | {total_val:<7} | {total_test:<7} | {total_train + total_val + total_test:<7}")
    print("=" * 85)

    # Verify split class count consistency
    for split in ["train", "val", "test"]:
        present_classes = [d.name for d in (V2A_DIR / split).iterdir() if d.is_dir()]
        assert len(present_classes) == 39, f"Error: Split {split} contains {len(present_classes)} classes instead of 39."

    total_rw_added = sum(sum(split_dict.values()) for split_dict in rw_added_counts.values())
    total_unmapped = sum(rw_unmapped_counts.values())

    print("\n📊 Key Metrics:")
    print(f"  • Total V2-A Classes        : {len(v2a_classes)} (38 PlantVillage + 1 Negative Class)")
    print(f"  • Total Train Images        : {total_train:,}")
    print(f"  • Total Validation Images   : {total_val:,}")
    print(f"  • Total Test Images         : {total_test:,}")
    print(f"  • Overall Dataset Total     : {total_train + total_val + total_test:,}")
    print(f"  • Real-World Mapped Added   : {total_rw_added:,}")
    print(f"  • Real-World Unmapped (OOD) : {total_unmapped:,}")
    print(f"  • Negative Class Status     : '{NEGATIVE_CLASS_NAME}' directory created across all splits.")
    print("\n✅ V2-A Dataset Creation Completed Successfully!")

    # Save summary report file
    with open(RESULTS_DIR / "v2a_dataset_summary.txt", "w", encoding="utf-8") as f:
        f.write("AGRINEX V2-A DATASET AUDIT REPORT\n")
        f.write("=" * 60 + "\n")
        f.write(f"Total Classes: {len(v2a_classes)}\n")
        f.write(f"Train Images: {total_train}\n")
        f.write(f"Val Images: {total_val}\n")
        f.write(f"Test Images: {total_test}\n")
        f.write(f"Total Dataset Images: {total_train + total_val + total_test}\n")
        f.write(f"Real-World Mapped Added: {total_rw_added}\n")
        f.write(f"Real-World Unmapped Held-Out: {total_unmapped}\n\n")
        f.write("PER CLASS BREAKDOWN:\n")
        for cls_name, tr, va, te, tot in class_stats:
            f.write(f"{cls_name}: Train={tr}, Val={va}, Test={te}, Total={tot}\n")


if __name__ == "__main__":
    build_v2a_dataset()
