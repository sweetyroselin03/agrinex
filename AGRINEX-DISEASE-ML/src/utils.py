"""
AgriNex Disease ML - Dataset Utilities & Helpers
Provides reusable helper functions for inspecting datasets, validating image integrity,
and preparing metadata DataFrames.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple
from PIL import Image, ImageFile
import pandas as pd
from tqdm import tqdm

# Enable loading truncated images safely during inspection
ImageFile.LOAD_TRUNCATED_IMAGES = True

VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}


def scan_dataset_classes(data_dir: str) -> List[str]:
    """Scan directory structure and return list of subdirectories (disease classes)."""
    p = Path(data_dir)
    if not p.exists():
        raise FileNotFoundError(f"Dataset path '{data_dir}' does not exist.")
    
    classes = [d.name for d in p.iterdir() if d.is_dir() and not d.name.startswith('.')]
    return sorted(classes)


def inspect_image_integrity(data_dir: str) -> Tuple[pd.DataFrame, List[str]]:
    """
    Scans dataset path, checks file extensions, file sizes, image resolutions,
    and identifies corrupt or unreadable files.
    """
    records = []
    corrupted_files = []
    
    classes = scan_dataset_classes(data_dir)
    
    for class_name in classes:
        class_path = Path(data_dir) / class_name
        image_files = [f for f in class_path.glob('*') if f.suffix.lower() in VALID_EXTENSIONS]
        
        for img_path in tqdm(image_files, desc=f"Inspecting {class_name}"):
            str_path = str(img_path)
            file_size_bytes = img_path.stat().st_size
            
            if file_size_bytes == 0:
                corrupted_files.append(str_path)
                continue
                
            try:
                with Image.open(img_path) as img:
                    img.verify()  # Verify file structure
                
                # Re-open to get dimensions and mode after verify()
                with Image.open(img_path) as img:
                    width, height = img.size
                    mode = img.mode
                    
                records.append({
                    "file_path": str_path,
                    "filename": img_path.name,
                    "class_name": class_name,
                    "width": width,
                    "height": height,
                    "aspect_ratio": round(width / height, 2) if height > 0 else 0,
                    "channels": len(img.getbands()),
                    "mode": mode,
                    "size_kb": round(file_size_bytes / 1024, 2)
                })
            except Exception as e:
                corrupted_files.append(str_path)
                
    df = pd.DataFrame(records)
    return df, corrupted_files


def summarize_class_distribution(df: pd.DataFrame) -> pd.DataFrame:
    """Summarizes counts and percentages per class from dataset metadata dataframe."""
    if df.empty:
        return pd.DataFrame(columns=["class_name", "count", "percentage"])
    
    counts = df['class_name'].value_counts().reset_index()
    counts.columns = ['class_name', 'count']
    counts['percentage'] = round((counts['count'] / len(df)) * 100, 2)
    return counts
