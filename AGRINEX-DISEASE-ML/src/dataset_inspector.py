"""
AgriNex Disease ML - Dataset Inspector Pipeline

Recursively scans all 4 extracted raw datasets in data/raw/:
1. PlantVillage
2. Original Dataset
3. archive (4)
4. flower_data

Safety Rules strictly enforced:
- NO model training
- NO dataset merging
- NO dataset file deleting/renaming
- NO modification of AgriNex application files
- Only inspect and report

Generates:
- data/processed/dataset_inspection_report.csv
- results/dataset_inspection_report.txt
- results/class_distribution.png
"""

import sys
import os
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Any, Set
from PIL import Image, ImageFile
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm

# Configure UTF-8 encoding for Windows console output compatibility
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ImageFile.LOAD_TRUNCATED_IMAGES = True

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff'}
HEALTHY_KEYWORDS = {'healthy', 'fresh', 'normal', 'good'}
SUSPICIOUS_KEYWORDS = {'background', 'bg', 'test', 'train', 'val', 'validation', 'unknown', 'bad', 'other', 'unlabeled', 'noise'}
DISEASE_KEYWORDS = {
    'blight', 'spot', 'mildew', 'virus', 'rot', 'mold', 'canker', 'wilt',
    'rust', 'scab', 'damage', 'miner', 'mite', 'curl', 'anthracnose', 'blossom',
    'crack', 'catfaced', 'insect', 'gall', 'black', 'yellow', 'burn', 'streak',
    'mosaic', 'smut', 'scorch', 'decay', 'lesion', 'fungus', 'bacterial', 'pest'
}


def compute_file_hash(file_path: Path) -> str:
    """Computes MD5 hash of image file for duplicate detection."""
    md5 = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(65536):
                md5.update(chunk)
        return md5.hexdigest()
    except Exception:
        return ""


def categorize_class_name(class_name: str) -> str:
    """
    Categorizes class into:
    - Healthy (contains healthy, fresh, normal, good)
    - Suspicious/Ambiguous (backgrounds, test/val splits, species-only names)
    - Disease (contains specific disease indicators)
    """
    name_lower = class_name.lower().replace('_', ' ').replace('-', ' ')
    words = set(name_lower.split())
    
    # 1. Healthy check
    if any(k in name_lower for k in HEALTHY_KEYWORDS):
        return "Healthy"
    
    # 2. Suspicious keywords check
    if any(k in words for k in SUSPICIOUS_KEYWORDS):
        return "Ambiguous/Suspicious"
    
    # 3. Check for disease indicator keywords
    if any(k in name_lower for k in DISEASE_KEYWORDS):
        return "Disease"
        
    # 4. If neither healthy nor disease indicator, flag as ambiguous (e.g. species-only labels)
    return "Ambiguous/Suspicious"


def extract_class_name(img_path: Path, ds_root: Path) -> str:
    """
    Recursively extracts meaningful class name from relative directory structure,
    filtering out split folder names like train, val, validation, test.
    """
    rel_path = img_path.relative_to(ds_root)
    parts = list(rel_path.parts[:-1])  # Exclude filename
    
    ignore_splits = {'train', 'val', 'validation', 'test', 'images', 'raw', 'data'}
    filtered_parts = [p for p in parts if p.lower() not in ignore_splits]
    
    if not filtered_parts:
        return "Unclassified_Root"
    elif len(filtered_parts) == 1:
        return filtered_parts[0]
    else:
        return " - ".join(filtered_parts)


def scan_raw_datasets(raw_dir: Path) -> pd.DataFrame:
    """Recursively scans all subdirectories in data/raw/ and returns detailed image DataFrame."""
    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw data directory '{raw_dir}' does not exist.")

    dataset_dirs = [d for d in raw_dir.iterdir() if d.is_dir() and not d.name.startswith('.')]
    
    if not dataset_dirs:
        print("[WARNING] No top-level dataset directories found in data/raw/")
        return pd.DataFrame()

    records = []
    
    for ds_dir in sorted(dataset_dirs):
        ds_name = ds_dir.name
        print(f"\n[DATASET] Scanning: [{ds_name}] ...")
        
        all_files = [f for f in ds_dir.rglob('*') if f.is_file() and not f.name.startswith('.')]
        img_files = [f for f in all_files if f.suffix.lower() in IMAGE_EXTENSIONS]
        
        print(f"   Found {len(img_files)} total image files.")
        
        for img_p in tqdm(img_files, desc=f"Inspecting {ds_name[:20]}"):
            class_name = extract_class_name(img_p, ds_dir)
            category_type = categorize_class_name(class_name)
            file_size = img_p.stat().st_size
            ext = img_p.suffix.lower()
            
            is_corrupt = False
            width, height, channels, mode, aspect_ratio = 0, 0, 0, "Unknown", 0.0
            
            if file_size == 0:
                is_corrupt = True
            else:
                try:
                    with Image.open(img_p) as img:
                        img.verify()
                    with Image.open(img_p) as img:
                        width, height = img.size
                        mode = img.mode
                        channels = len(img.getbands())
                        aspect_ratio = round(width / height, 2) if height > 0 else 0.0
                except Exception:
                    is_corrupt = True

            md5_hash = compute_file_hash(img_p) if not is_corrupt else ""
            
            records.append({
                "dataset_name": ds_name,
                "file_path": str(img_p.relative_to(raw_dir)),
                "filename": img_p.name,
                "class_name": class_name,
                "category_type": category_type,
                "format": ext,
                "file_size_kb": round(file_size / 1024, 2),
                "is_corrupt": is_corrupt,
                "md5_hash": md5_hash,
                "width": width,
                "height": height,
                "channels": channels,
                "mode": mode,
                "aspect_ratio": aspect_ratio
            })

    df_images = pd.DataFrame(records)
    return df_images


def generate_inspection_reports(df_images: pd.DataFrame, processed_dir: Path, results_dir: Path) -> Tuple[pd.DataFrame, str]:
    """Generates dataset_inspection_report.csv, dataset_inspection_report.txt, and class_distribution.png."""
    processed_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)
    
    csv_path = processed_dir / "dataset_inspection_report.csv"
    txt_path = results_dir / "dataset_inspection_report.txt"
    png_path = results_dir / "class_distribution.png"

    if df_images.empty:
        print("[WARNING] No images found to report.")
        return pd.DataFrame(), "No image files found in data/raw/"

    # Class-level summary DataFrame
    class_rows = []
    
    for (ds_name, cls_name), group in df_images.groupby(["dataset_name", "class_name"]):
        total_ds_images = len(df_images[df_images["dataset_name"] == ds_name])
        cls_images = len(group)
        pct = round((cls_images / total_ds_images) * 100, 2)
        
        valid_group = group[~group["is_corrupt"]]
        corrupt_cnt = group["is_corrupt"].sum()
        
        # Duplicate detection within class
        hashes = group[group["md5_hash"] != ""]["md5_hash"]
        dup_cnt = len(hashes) - hashes.nunique()
        unique_cnt = hashes.nunique()
        
        category_type = group["category_type"].iloc[0]
        formats_str = ", ".join(sorted(group["format"].unique()))
        
        min_w = int(valid_group["width"].min()) if not valid_group.empty else 0
        max_w = int(valid_group["width"].max()) if not valid_group.empty else 0
        mean_w = round(valid_group["width"].mean(), 1) if not valid_group.empty else 0.0
        
        min_h = int(valid_group["height"].min()) if not valid_group.empty else 0
        max_h = int(valid_group["height"].max()) if not valid_group.empty else 0
        mean_h = round(valid_group["height"].mean(), 1) if not valid_group.empty else 0.0
        
        class_rows.append({
            "dataset_name": ds_name,
            "class_name": cls_name,
            "category_type": category_type,
            "image_count": cls_images,
            "percentage": pct,
            "formats": formats_str,
            "corrupted_count": corrupt_cnt,
            "duplicate_count": dup_cnt,
            "unique_images": unique_cnt,
            "min_width": min_w,
            "max_width": max_w,
            "mean_width": mean_w,
            "min_height": min_h,
            "max_height": max_h,
            "mean_height": mean_h
        })

    df_class_report = pd.DataFrame(class_rows).sort_values(by=["dataset_name", "image_count"], ascending=[True, False])
    df_class_report.to_csv(csv_path, index=False)
    print(f"\n[OK] Saved CSV Report: {csv_path}")

    # Build Text Summary Report
    lines = []
    lines.append("=" * 85)
    lines.append("AGRINEX DISEASE ML - AUTOMATED DATASET INSPECTION REPORT")
    lines.append("=" * 85)
    lines.append(f"Total Datasets Inspected     : {df_images['dataset_name'].nunique()}")
    lines.append(f"Total Image Files Scanned   : {len(df_images)}")
    lines.append(f"Total Unique Class Folders   : {df_images['class_name'].nunique()}")
    lines.append(f"Total Corrupted Images       : {df_images['is_corrupt'].sum()}")
    
    valid_hashes = df_images[df_images["md5_hash"] != ""]["md5_hash"]
    total_duplicates = len(valid_hashes) - valid_hashes.nunique()
    lines.append(f"Total Exact Duplicate Images: {total_duplicates} (via MD5 hashing)")
    lines.append("=" * 85)
    lines.append("")

    for ds_name, ds_group in df_images.groupby("dataset_name"):
        ds_class_rep = df_class_report[df_class_report["dataset_name"] == ds_name]
        valid_ds = ds_group[~ds_group["is_corrupt"]]
        
        lines.append(f"DATASET: [{ds_name}]")
        lines.append("-" * 75)
        lines.append(f"  1. Dataset Name            : {ds_name}")
        lines.append(f"  2. Total Image Count       : {len(ds_group)}")
        lines.append(f"  3. Supported Image Formats : {', '.join(sorted(ds_group['format'].unique()))}")
        lines.append(f"  4. Number of Classes       : {len(ds_class_rep)}")
        
        counts = ds_class_rep["image_count"]
        lines.append(f"  5. Images Per Class Stats  : Min={counts.min()}, Max={counts.max()}, Avg={counts.mean():.1f}")
        
        healthy_classes = ds_class_rep[ds_class_rep["category_type"] == "Healthy"]["class_name"].tolist()
        disease_classes = ds_class_rep[ds_class_rep["category_type"] == "Disease"]["class_name"].tolist()
        ambiguous_classes = ds_class_rep[ds_class_rep["category_type"] == "Ambiguous/Suspicious"]["class_name"].tolist()
        
        lines.append(f"  6. Healthy Classes ({len(healthy_classes)}):")
        for hc in healthy_classes[:10]:
            lines.append(f"     - {hc}")
        if len(healthy_classes) > 10:
            lines.append(f"     ... and {len(healthy_classes) - 10} more")

        lines.append(f"  7. Disease Classes ({len(disease_classes)}):")
        for dc in disease_classes[:10]:
            lines.append(f"     - {dc}")
        if len(disease_classes) > 10:
            lines.append(f"     ... and {len(disease_classes) - 10} more")

        lines.append(f"  8. Ambiguous/Suspicious Classes ({len(ambiguous_classes)}):")
        for ac in ambiguous_classes[:10]:
            lines.append(f"     - {ac}")
        if len(ambiguous_classes) > 10:
            lines.append(f"     ... and {len(ambiguous_classes) - 10} more")

        corrupt_in_ds = ds_group["is_corrupt"].sum()
        lines.append(f"  9. Corrupted/Unreadable    : {corrupt_in_ds} files")
        
        ds_hashes = ds_group[ds_group["md5_hash"] != ""]["md5_hash"]
        ds_dups = len(ds_hashes) - ds_hashes.nunique()
        lines.append(f" 10. Duplicate Images (MD5)  : {ds_dups} duplicate files")
        
        if not valid_ds.empty:
            lines.append(f" 11. Image Dimensions Stats :")
            lines.append(f"      - Width : Min={valid_ds['width'].min()}, Max={valid_ds['width'].max()}, Avg={valid_ds['width'].mean():.1f} px")
            lines.append(f"      - Height: Min={valid_ds['height'].min()}, Max={valid_ds['height'].max()}, Avg={valid_ds['height'].mean():.1f} px")
            lines.append(f"      - Aspect Ratio Avg: {valid_ds['aspect_ratio'].mean():.2f}")
            lines.append(f"      - Color Channels  : {sorted(valid_ds['channels'].unique())}")
        
        lines.append("")
        lines.append("  12. Class Imbalance & Percentage Distribution:")
        lines.append("      " + f"{'Class Name':<42} | {'Count':<8} | {'Pct':<7} | {'Category':<20} | {'Dups':<5}")
        lines.append("      " + "-" * 90)
        for _, r in ds_class_rep.iterrows():
            lines.append(f"      {r['class_name']:<42} | {r['image_count']:<8} | {r['percentage']:<6.2f}% | {r['category_type']:<20} | {r['duplicate_count']:<5}")
        
        lines.append("-" * 75)
        lines.append("")

    txt_content = "\n".join(lines)
    txt_path.write_text(txt_content, encoding='utf-8')
    print(f"[OK] Saved Text Summary Report: {txt_path}")

    # Plot Class Distribution
    plot_class_distribution(df_class_report, png_path)

    return df_class_report, txt_content


def plot_class_distribution(df_class_report: pd.DataFrame, png_path: Path):
    """Generates plot visualization of class image counts per dataset."""
    if df_class_report.empty:
        return
    
    datasets = df_class_report["dataset_name"].unique()
    num_datasets = len(datasets)
    
    color_map = {
        "Healthy": "#2ecc71",
        "Disease": "#e74c3c",
        "Ambiguous/Suspicious": "#f39c12"
    }

    fig, axes = plt.subplots(num_datasets, 1, figsize=(14, max(4 * num_datasets, 8)), squeeze=False)
    
    for idx, ds_name in enumerate(datasets):
        ax = axes[idx, 0]
        group = df_class_report[df_class_report["dataset_name"] == ds_name].sort_values(by="image_count", ascending=True)
        
        if len(group) > 25:
            display_group = group.tail(25)
            title_suffix = f" (Top 25 of {len(group)} Classes)"
        else:
            display_group = group
            title_suffix = f" ({len(group)} Classes)"

        palette = [color_map.get(cat, "#3498db") for cat in display_group["category_type"]]
        
        bars = ax.barh(display_group["class_name"], display_group["image_count"], color=palette)
        ax.set_title(f"Dataset: [{ds_name}] - Class Counts{title_suffix}", fontsize=12, fontweight='bold')
        ax.set_xlabel("Number of Images")
        ax.set_ylabel("Class Label")
        
        for bar in bars:
            width = bar.get_width()
            ax.annotate(f'{int(width)}',
                        xy=(width, bar.get_y() + bar.get_height() / 2),
                        xytext=(5, 0),
                        textcoords="offset points",
                        ha='left', va='center', fontsize=8)
            
    from matplotlib.patches import Patch
    legend_elements = [Patch(facecolor=color_map[k], label=k) for k in color_map]
    fig.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(0.99, 0.99), fontsize=10)
    
    plt.tight_layout()
    plt.savefig(png_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"[OK] Saved Class Distribution Visualization: {png_path}")


def main():
    """Main function."""
    BASE_DIR = Path(__file__).resolve().parent.parent
    RAW_DATA_DIR = BASE_DIR / "data" / "raw"
    PROCESSED_DIR = BASE_DIR / "data" / "processed"
    RESULTS_DIR = BASE_DIR / "results"

    print("========================================================================")
    print("AGRINEX DISEASE ML - AUTOMATED DATASET INSPECTOR")
    print("========================================================================")
    print(f"Raw Data Path: {RAW_DATA_DIR}")

    df_images = scan_raw_datasets(RAW_DATA_DIR)
    df_class_report, summary_text = generate_inspection_reports(df_images, PROCESSED_DIR, RESULTS_DIR)

    print("\n" + summary_text)


if __name__ == "__main__":
    main()
