"""
AgriNex Disease ML - Automated Dataset Curation Pipeline

Performs dataset curation ONLY:
1. Recursively discovers all raw images in data/raw/
2. Computes global MD5 hashes and deduplicates globally across all 4 datasets
3. Handles flower_data train/val/test duplication by treating images as one pool
4. Generates class mapping review CSV (data/processed/class_mapping_review.csv)
5. Flag specified ambiguous classes as REVIEW (Citrus greening, buck, yld, death_leaf)
6. Preserves crop, plant part, and disease distinction using canonical label format:
   {Plant}__{Disease}__{PlantPart}
7. Generates data/processed/curated_metadata.csv
8. Generates results/curation_report.txt
9. Generates results/curated_class_distribution.png
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

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ImageFile.LOAD_TRUNCATED_IMAGES = True

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff'}

# Master Class Mapping Rules for all 97 classes across 4 raw datasets
CLASS_MAPPING_RULES: Dict[Tuple[str, str], Dict[str, str]] = {
    # -------------------------------------------------------------------------
    # DATASET 1: Original Dataset (22 classes)
    # -------------------------------------------------------------------------
    ("Original Dataset", "Eggplant - Eggplant fresh leaf"): {
        "plant": "Eggplant", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("Original Dataset", "Tomato - Tomato leaf curl virus"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Yellow_Leaf_Curl_Virus", "status": "KEEP", "reason": "Standard viral disease class"
    },
    ("Original Dataset", "Eggplant - Eggplant verticillium wilt"): {
        "plant": "Eggplant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Verticillium_Wilt", "status": "KEEP", "reason": "Standard fungal wilt disease class"
    },
    ("Original Dataset", "Eggplant - Eggplant Cercopora leaf spot"): {
        "plant": "Eggplant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Cercospora_Leaf_Spot", "status": "KEEP", "reason": "Standard fungal spot disease class"
    },
    ("Original Dataset", "Eggplant - Eggplant begomovirus"): {
        "plant": "Eggplant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Begomovirus", "status": "KEEP", "reason": "Standard viral disease class"
    },
    ("Original Dataset", "Bottle gourd - Downey mildew"): {
        "plant": "Bottle_Gourd", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Downy_Mildew", "status": "KEEP", "reason": "Standard oomycete mildew disease class"
    },
    ("Original Dataset", "Tomato - Tomato spotted wilt"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Spotted_Wilt", "status": "KEEP", "reason": "Standard viral wilt disease class"
    },
    ("Original Dataset", "Bottle gourd - Anthracnose"): {
        "plant": "Bottle_Gourd", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Anthracnose", "status": "KEEP", "reason": "Standard fungal anthracnose class"
    },
    ("Original Dataset", "Bitter Gourd - Mosaic virus"): {
        "plant": "Bitter_Gourd", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Mosaic_Virus", "status": "KEEP", "reason": "Standard viral mosaic class"
    },
    ("Original Dataset", "Tomato - Tomato Fresh leaf"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("Original Dataset", "Tomato - Tomato Bacterial spot"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Bacterial_Spot", "status": "KEEP", "reason": "Standard bacterial spot disease class"
    },
    ("Original Dataset", "Bitter Gourd - Downey mildew"): {
        "plant": "Bitter_Gourd", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Downy_Mildew", "status": "KEEP", "reason": "Standard mildew disease class"
    },
    ("Original Dataset", "Cucumber - Downy mildew"): {
        "plant": "Cucumber", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Downy_Mildew", "status": "KEEP", "reason": "Standard mildew disease class"
    },
    ("Original Dataset", "Cauliflower - Black Rot"): {
        "plant": "Cauliflower", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Black_Rot", "status": "KEEP", "reason": "Standard bacterial rot disease class"
    },
    ("Original Dataset", "Bitter Gourd - Fresh leaf"): {
        "plant": "Bitter_Gourd", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("Original Dataset", "Cucumber - Anthracnose lesions"): {
        "plant": "Cucumber", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Anthracnose", "status": "KEEP", "reason": "Standard anthracnose disease class"
    },
    ("Original Dataset", "Cucumber - Belly rot"): {
        "plant": "Cucumber", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Belly_Rot", "status": "KEEP", "reason": "Standard rot disease class"
    },
    ("Original Dataset", "Cucumber - Fresh leaf"): {
        "plant": "Cucumber", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("Original Dataset", "Cauliflower - Fresh leaf"): {
        "plant": "Cauliflower", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("Original Dataset", "Bottle gourd - Fresh leaf"): {
        "plant": "Bottle_Gourd", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("Original Dataset", "Cauliflower - Downy mildew"): {
        "plant": "Cauliflower", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Downy_Mildew", "status": "KEEP", "reason": "Standard mildew disease class"
    },
    ("Original Dataset", "Bitter Gourd - Fusarium wilt"): {
        "plant": "Bitter_Gourd", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Fusarium_Wilt", "status": "KEEP", "reason": "Standard fungal wilt disease class"
    },

    # -------------------------------------------------------------------------
    # DATASET 2: PlantVillage (38 classes)
    # -------------------------------------------------------------------------
    ("PlantVillage", "Orange___Haunglongbing_(Citrus_greening)"): {
        "plant": "Orange", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Huanglongbing_Citrus_Greening", "status": "REVIEW",
        "reason": "Citrus Greening bacterial disease - flagged for domain review"
    },
    ("PlantVillage", "Tomato___Tomato_Yellow_Leaf_Curl_Virus"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Yellow_Leaf_Curl_Virus", "status": "KEEP", "reason": "Standard viral disease class"
    },
    ("PlantVillage", "Soybean___healthy"): {
        "plant": "Soybean", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Peach___Bacterial_spot"): {
        "plant": "Peach", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Bacterial_Spot", "status": "KEEP", "reason": "Standard bacterial spot disease class"
    },
    ("PlantVillage", "Tomato___Bacterial_spot"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Bacterial_Spot", "status": "KEEP", "reason": "Standard bacterial spot disease class"
    },
    ("PlantVillage", "Tomato___Late_blight"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Late_Blight", "status": "KEEP", "reason": "Standard late blight class"
    },
    ("PlantVillage", "Squash___Powdery_mildew"): {
        "plant": "Squash", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Powdery_Mildew", "status": "KEEP", "reason": "Standard powdery mildew class"
    },
    ("PlantVillage", "Tomato___Septoria_leaf_spot"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Septoria_Leaf_Spot", "status": "KEEP", "reason": "Standard fungal spot class"
    },
    ("PlantVillage", "Tomato___Spider_mites Two-spotted_spider_mite"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Spider_Mites", "status": "KEEP", "reason": "Standard mite damage class"
    },
    ("PlantVillage", "Apple___healthy"): {
        "plant": "Apple", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Tomato___healthy"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Blueberry___healthy"): {
        "plant": "Blueberry", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Pepper,_bell___healthy"): {
        "plant": "Pepper_Bell", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Tomato___Target_Spot"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Target_Spot", "status": "KEEP", "reason": "Standard target spot disease class"
    },
    ("PlantVillage", "Grape___Esca_(Black_Measles)"): {
        "plant": "Grape", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Esca_Black_Measles", "status": "KEEP", "reason": "Standard fungal disease class"
    },
    ("PlantVillage", "Corn_(maize)___Common_rust_"): {
        "plant": "Corn", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Common_Rust", "status": "KEEP", "reason": "Standard rust disease class"
    },
    ("PlantVillage", "Grape___Black_rot"): {
        "plant": "Grape", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Black_Rot", "status": "KEEP", "reason": "Standard black rot class"
    },
    ("PlantVillage", "Corn_(maize)___healthy"): {
        "plant": "Corn", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Strawberry___Leaf_scorch"): {
        "plant": "Strawberry", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Leaf_Scorch", "status": "KEEP", "reason": "Standard leaf scorch class"
    },
    ("PlantVillage", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)"): {
        "plant": "Grape", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Isariopsis_Leaf_Spot", "status": "KEEP", "reason": "Standard leaf spot disease class"
    },
    ("PlantVillage", "Cherry_(including_sour)___Powdery_mildew"): {
        "plant": "Cherry", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Powdery_Mildew", "status": "KEEP", "reason": "Standard powdery mildew class"
    },
    ("PlantVillage", "Potato___Early_blight"): {
        "plant": "Potato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Early_Blight", "status": "KEEP", "reason": "Standard early blight class"
    },
    ("PlantVillage", "Potato___Late_blight"): {
        "plant": "Potato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Late_Blight", "status": "KEEP", "reason": "Standard late blight class"
    },
    ("PlantVillage", "Tomato___Early_blight"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Early_Blight", "status": "KEEP", "reason": "Standard early blight class"
    },
    ("PlantVillage", "Pepper,_bell___Bacterial_spot"): {
        "plant": "Pepper_Bell", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Bacterial_Spot", "status": "KEEP", "reason": "Standard bacterial spot class"
    },
    ("PlantVillage", "Corn_(maize)___Northern_Leaf_Blight"): {
        "plant": "Corn", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Northern_Leaf_Blight", "status": "KEEP", "reason": "Standard leaf blight class"
    },
    ("PlantVillage", "Tomato___Leaf_Mold"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Leaf_Mold", "status": "KEEP", "reason": "Standard leaf mold class"
    },
    ("PlantVillage", "Cherry_(including_sour)___healthy"): {
        "plant": "Cherry", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Apple___Apple_scab"): {
        "plant": "Apple", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Apple_Scab", "status": "KEEP", "reason": "Standard fungal scab class"
    },
    ("PlantVillage", "Apple___Black_rot"): {
        "plant": "Apple", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Black_Rot", "status": "KEEP", "reason": "Standard black rot class"
    },
    ("PlantVillage", "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot"): {
        "plant": "Corn", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Cercospora_Gray_Leaf_Spot", "status": "KEEP", "reason": "Standard spot disease class"
    },
    ("PlantVillage", "Strawberry___healthy"): {
        "plant": "Strawberry", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Grape___healthy"): {
        "plant": "Grape", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Tomato___Tomato_mosaic_virus"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Mosaic_Virus", "status": "KEEP", "reason": "Standard mosaic virus class"
    },
    ("PlantVillage", "Raspberry___healthy"): {
        "plant": "Raspberry", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Peach___healthy"): {
        "plant": "Peach", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("PlantVillage", "Apple___Cedar_apple_rust"): {
        "plant": "Apple", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Cedar_Apple_Rust", "status": "KEEP", "reason": "Standard rust disease class"
    },
    ("PlantVillage", "Potato___healthy"): {
        "plant": "Potato", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },

    # -------------------------------------------------------------------------
    # DATASET 3: archive (4) (19 classes)
    # -------------------------------------------------------------------------
    ("archive (4)", "Leaf - Leaf Miner"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Leaf_Miner", "status": "KEEP", "reason": "Standard pest leaf miner class"
    },
    ("archive (4)", "Leaf - Tomato Leaf Curl Virus"): {
        "plant": "Tomato", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Yellow_Leaf_Curl_Virus", "status": "KEEP", "reason": "Standard viral disease class"
    },
    ("archive (4)", "Leaf - Bacterial Spot"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Bacterial_Spot", "status": "KEEP", "reason": "Standard bacterial spot class"
    },
    ("archive (4)", "Leaf - Insect Damage"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Insect_Damage", "status": "KEEP", "reason": "Standard pest damage class"
    },
    ("archive (4)", "Leaf - Spider Mites"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Spider_Mites", "status": "KEEP", "reason": "Standard mite damage class"
    },
    ("archive (4)", "Fruit - healthy"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy fruit class"
    },
    ("archive (4)", "Fruit - mold"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Mold", "status": "KEEP", "reason": "Standard fruit mold class"
    },
    ("archive (4)", "Fruit - crack"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Fruit_Crack", "status": "KEEP", "reason": "Standard fruit crack damage class"
    },
    ("archive (4)", "Leaf - Early Blight"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Early_Blight", "status": "KEEP", "reason": "Standard early blight class"
    },
    ("archive (4)", "Fruit - anthracnose"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Anthracnose", "status": "KEEP", "reason": "Standard fruit anthracnose class"
    },
    ("archive (4)", "Leaf - Late Blight"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Late_Blight", "status": "KEEP", "reason": "Standard late blight class"
    },
    ("archive (4)", "Leaf - Cercospora leaf mold"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Cercospora_Leaf_Mold", "status": "KEEP", "reason": "Standard fungal spot class"
    },
    ("archive (4)", "Fruit - blossom"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Blossom_End_Rot", "status": "KEEP", "reason": "Standard blossom rot class"
    },
    ("archive (4)", "Fruit - blight"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Fruit_Blight", "status": "KEEP", "reason": "Standard fruit blight class"
    },
    ("archive (4)", "Leaf - Healthy"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy leaf class"
    },
    ("archive (4)", "Leaf - Leaf Mold"): {
        "plant": "Generic_Plant", "plant_part": "LEAF", "condition_type": "Disease",
        "disease_name": "Leaf_Mold", "status": "KEEP", "reason": "Standard leaf mold class"
    },
    ("archive (4)", "Fruit - catfaced"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Catfacing", "status": "KEEP", "reason": "Standard catfacing damage class"
    },
    ("archive (4)", "Fruit - spot"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Disease",
        "disease_name": "Fruit_Spot", "status": "KEEP", "reason": "Standard fruit spot class"
    },
    ("archive (4)", "Fruit - buck"): {
        "plant": "Generic_Fruit", "plant_part": "FRUIT", "condition_type": "Ambiguous",
        "disease_name": "Buckeye_Rot", "status": "REVIEW",
        "reason": "Ambiguous short label 'buck' - flagged for domain review"
    },

    # -------------------------------------------------------------------------
    # DATASET 4: flower_data (18 classes)
    # -------------------------------------------------------------------------
    ("flower_data", "banana_bush - healthy"): {
        "plant": "Banana_Bush", "plant_part": "FLOWER", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy flower class"
    },
    ("flower_data", "banana_bush - scorch"): {
        "plant": "Banana_Bush", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Scorch", "status": "KEEP", "reason": "Standard scorch disease class"
    },
    ("flower_data", "banana_bush - yld"): {
        "plant": "Banana_Bush", "plant_part": "FLOWER", "condition_type": "Ambiguous",
        "disease_name": "Yellow_Leaf_Disease_YLD", "status": "REVIEW",
        "reason": "Abbreviated label 'yld' (Yellow Leaf Disease) - flagged for review"
    },
    ("flower_data", "crape_jasmine - healthy"): {
        "plant": "Crape_Jasmine", "plant_part": "FLOWER", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy flower class"
    },
    ("flower_data", "crape_jasmine - insect_bite"): {
        "plant": "Crape_Jasmine", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Insect_Bite", "status": "KEEP", "reason": "Standard insect damage class"
    },
    ("flower_data", "crape_jasmine - yld"): {
        "plant": "Crape_Jasmine", "plant_part": "FLOWER", "condition_type": "Ambiguous",
        "disease_name": "Yellow_Leaf_Disease_YLD", "status": "REVIEW",
        "reason": "Abbreviated label 'yld' (Yellow Leaf Disease) - flagged for review"
    },
    ("flower_data", "dwarf_white_bauhinia - death_leaf"): {
        "plant": "Dwarf_White_Bauhinia", "plant_part": "FLOWER", "condition_type": "Ambiguous",
        "disease_name": "Death_Leaf", "status": "REVIEW",
        "reason": "Non-standard condition 'death_leaf' - flagged for review"
    },
    ("flower_data", "dwarf_white_bauhinia - healthy"): {
        "plant": "Dwarf_White_Bauhinia", "plant_part": "FLOWER", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy flower class"
    },
    ("flower_data", "dwarf_white_bauhinia - yld"): {
        "plant": "Dwarf_White_Bauhinia", "plant_part": "FLOWER", "condition_type": "Ambiguous",
        "disease_name": "Yellow_Leaf_Disease_YLD", "status": "REVIEW",
        "reason": "Abbreviated label 'yld' (Yellow Leaf Disease) - flagged for review"
    },
    ("flower_data", "hibiscus - blight"): {
        "plant": "Hibiscus", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Blight", "status": "KEEP", "reason": "Standard blight disease class"
    },
    ("flower_data", "hibiscus - death_leaf"): {
        "plant": "Hibiscus", "plant_part": "FLOWER", "condition_type": "Ambiguous",
        "disease_name": "Death_Leaf", "status": "REVIEW",
        "reason": "Non-standard condition 'death_leaf' - flagged for review"
    },
    ("flower_data", "hibiscus - healthy"): {
        "plant": "Hibiscus", "plant_part": "FLOWER", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy flower class"
    },
    ("flower_data", "hibiscus - scorch"): {
        "plant": "Hibiscus", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Scorch", "status": "KEEP", "reason": "Standard scorch disease class"
    },
    ("flower_data", "night_flowering_jasmine - early_blight"): {
        "plant": "Night_Flowering_Jasmine", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Early_Blight", "status": "KEEP", "reason": "Standard early blight class"
    },
    ("flower_data", "night_flowering_jasmine - healthy"): {
        "plant": "Night_Flowering_Jasmine", "plant_part": "FLOWER", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy flower class"
    },
    ("flower_data", "night_flowering_jasmine - red_spot"): {
        "plant": "Night_Flowering_Jasmine", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Red_Spot", "status": "KEEP", "reason": "Standard red spot disease class"
    },
    ("flower_data", "rose - blight"): {
        "plant": "Rose", "plant_part": "FLOWER", "condition_type": "Disease",
        "disease_name": "Blight", "status": "KEEP", "reason": "Standard blight disease class"
    },
    ("flower_data", "rose - healthy"): {
        "plant": "Rose", "plant_part": "FLOWER", "condition_type": "Healthy",
        "disease_name": "Healthy", "status": "KEEP", "reason": "Standard healthy flower class"
    }
}


def compute_file_hash(file_path: Path) -> str:
    """Computes MD5 hash of image file for global deduplication."""
    md5 = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(65536):
                md5.update(chunk)
        return md5.hexdigest()
    except Exception:
        return ""


def extract_class_name(img_path: Path, ds_root: Path) -> str:
    """Extracts logical class folder name from image path relative to dataset root."""
    rel_path = img_path.relative_to(ds_root)
    parts = list(rel_path.parts[:-1])
    ignore_splits = {'train', 'val', 'validation', 'test', 'images', 'raw', 'data'}
    filtered_parts = [p for p in parts if p.lower() not in ignore_splits]
    
    if not filtered_parts:
        return "Unclassified_Root"
    elif len(filtered_parts) == 1:
        return filtered_parts[0]
    else:
        return " - ".join(filtered_parts)


def run_curation_pipeline():
    """Executes the dataset curation pipeline."""
    BASE_DIR = Path(__file__).resolve().parent.parent
    RAW_DATA_DIR = BASE_DIR / "data" / "raw"
    PROCESSED_DIR = BASE_DIR / "data" / "processed"
    RESULTS_DIR = BASE_DIR / "results"

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    print("========================================================================")
    print("AGRINEX DISEASE ML - AUTOMATED DATASET CURATION PIPELINE")
    print("========================================================================")
    print(f"Raw Data Path: {RAW_DATA_DIR}")

    # 1. Discover all raw images
    dataset_dirs = [d for d in RAW_DATA_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]
    all_image_records = []
    
    for ds_dir in sorted(dataset_dirs):
        ds_name = ds_dir.name
        print(f"\n[DISCOVER] Scanning Dataset: [{ds_name}] ...")
        
        all_files = [f for f in ds_dir.rglob('*') if f.is_file() and not f.name.startswith('.')]
        img_files = [f for f in all_files if f.suffix.lower() in IMAGE_EXTENSIONS]
        
        print(f"   Found {len(img_files)} total images in {ds_name}.")
        
        for img_p in tqdm(img_files, desc=f"Hashing {ds_name[:15]}"):
            original_class = extract_class_name(img_p, ds_dir)
            md5_hash = compute_file_hash(img_p)
            
            all_image_records.append({
                "source_dataset": ds_name,
                "original_class": original_class,
                "file_path": str(img_p.relative_to(RAW_DATA_DIR)),
                "md5_hash": md5_hash
            })

    df_raw = pd.DataFrame(all_image_records)
    total_raw_images = len(df_raw)
    print(f"\n[SUMMARY] Total Raw Images Discovered: {total_raw_images}")

    # 2. Global Deduplication
    print("\n[DEDUPLICATE] Performing Global MD5 Deduplication across all 4 datasets...")
    seen_hashes: Set[str] = set()
    unique_records = []
    duplicate_records = []

    for _, row in df_raw.iterrows():
        h = row["md5_hash"]
        if h and h in seen_hashes:
            duplicate_records.append(row)
        else:
            if h:
                seen_hashes.add(h)
            unique_records.append(row)

    df_unique = pd.DataFrame(unique_records)
    total_unique_images = len(df_unique)
    total_duplicates_removed = len(duplicate_records)

    print(f"   - Unique Images Retained : {total_unique_images}")
    print(f"   - Duplicate Copies Filtered: {total_duplicates_removed}")

    # 3. Create Class Mapping Review CSV
    print("\n[MAPPING] Generating Class Mapping Review (data/processed/class_mapping_review.csv)...")
    mapping_rows = []
    
    unique_pairs = df_raw[["source_dataset", "original_class"]].drop_duplicates().sort_values(by=["source_dataset", "original_class"])
    
    for _, pair in unique_pairs.iterrows():
        ds = pair["source_dataset"]
        orig_cls = pair["original_class"]
        
        rule = CLASS_MAPPING_RULES.get((ds, orig_cls), {
            "plant": "Unknown", "plant_part": "UNKNOWN", "condition_type": "Ambiguous",
            "disease_name": "Unknown", "status": "REVIEW", "reason": "Unmapped class folder - flagged for review"
        })
        
        plant = rule["plant"]
        disease = rule["disease_name"]
        part = rule["plant_part"]
        canonical_class = f"{plant}__{disease}__{part}"
        
        mapping_rows.append({
            "source_dataset": ds,
            "original_class": orig_cls,
            "proposed_standard_class": canonical_class,
            "plant": plant,
            "plant_part": part,
            "condition_type": rule["condition_type"],
            "disease_name": disease,
            "status": rule["status"],
            "reason": rule["reason"]
        })

    df_mapping = pd.DataFrame(mapping_rows)
    csv_mapping_path = PROCESSED_DIR / "class_mapping_review.csv"
    df_mapping.to_csv(csv_mapping_path, index=False)
    print(f"✅ Saved Class Mapping Review: {csv_mapping_path}")

    # 4. Map Unique Images to Curated Metadata
    print("\n[METADATA] Building Curated Metadata (data/processed/curated_metadata.csv)...")
    curated_records = []
    
    mapping_dict = {(r["source_dataset"], r["original_class"]): r for _, r in df_mapping.iterrows()}

    for _, row in df_unique.iterrows():
        ds = row["source_dataset"]
        orig_cls = row["original_class"]
        
        map_info = mapping_dict.get((ds, orig_cls), {
            "proposed_standard_class": "Unknown__Unknown__UNKNOWN",
            "plant": "Unknown", "plant_part": "UNKNOWN", "disease_name": "Unknown",
            "condition_type": "Ambiguous", "status": "REVIEW"
        })
        
        curated_records.append({
            "image_path": row["file_path"],
            "source_dataset": ds,
            "original_class": orig_cls,
            "canonical_class": map_info["proposed_standard_class"],
            "crop": map_info["plant"],
            "plant_part": map_info["plant_part"],
            "disease": map_info["disease_name"],
            "health_status": map_info["condition_type"],
            "image_hash": row["md5_hash"],
            "curation_status": map_info["status"]
        })

    df_curated = pd.DataFrame(curated_records)
    csv_metadata_path = PROCESSED_DIR / "curated_metadata.csv"
    df_curated.to_csv(csv_metadata_path, index=False)
    print(f"✅ Saved Curated Metadata: {csv_metadata_path}")

    # Counts by status
    keep_classes_cnt = len(df_mapping[df_mapping["status"] == "KEEP"])
    review_classes_cnt = len(df_mapping[df_mapping["status"] == "REVIEW"])
    exclude_classes_cnt = len(df_mapping[df_mapping["status"] == "EXCLUDE"])

    # 5. Generate Curation Report Text File
    print("\n[REPORT] Writing Curation Report (results/curation_report.txt)...")
    report_lines = []
    report_lines.append("=" * 85)
    report_lines.append("AGRINEX DISEASE ML - DATASET CURATION REPORT")
    report_lines.append("=" * 85)
    report_lines.append(f"Raw Image Count Discovered         : {total_raw_images}")
    report_lines.append(f"Unique Images (Post-Deduplication) : {total_unique_images}")
    report_lines.append(f"Duplicate Images Removed           : {total_duplicates_removed}")
    report_lines.append(f"Total Source Classes Mapped        : {len(df_mapping)}")
    report_lines.append(f"Classes Marked [KEEP]              : {keep_classes_cnt}")
    report_lines.append(f"Classes Marked [REVIEW]            : {review_classes_cnt}")
    report_lines.append(f"Classes Marked [EXCLUDE]           : {exclude_classes_cnt}")
    report_lines.append("=" * 85)
    report_lines.append("")

    report_lines.append("📊 1. IMAGES PER SOURCE DATASET (Post-Deduplication):")
    report_lines.append("-" * 65)
    for ds, count in df_curated["source_dataset"].value_counts().items():
        raw_count = len(df_raw[df_raw["source_dataset"] == ds])
        report_lines.append(f"  - {ds:<25}: {count:<6} unique images (raw: {raw_count})")

    report_lines.append("\n🌱 2. CROP DISTRIBUTION (Post-Deduplication):")
    report_lines.append("-" * 65)
    for crop, count in df_curated["crop"].value_counts().items():
        pct = (count / total_unique_images) * 100
        report_lines.append(f"  - {crop:<25}: {count:<6} images ({pct:.2f}%)")

    report_lines.append("\n🌿 3. PLANT-PART DISTRIBUTION:")
    report_lines.append("-" * 65)
    for part, count in df_curated["plant_part"].value_counts().items():
        pct = (count / total_unique_images) * 100
        report_lines.append(f"  - {part:<15}: {count:<6} images ({pct:.2f}%)")

    report_lines.append("\n🔬 4. HEALTH & CONDITION STATUS DISTRIBUTION:")
    report_lines.append("-" * 65)
    for status_name, count in df_curated["health_status"].value_counts().items():
        pct = (count / total_unique_images) * 100
        report_lines.append(f"  - {status_name:<15}: {count:<6} images ({pct:.2f}%)")

    report_lines.append("\n⚠️ 5. AMBIGUOUS CLASSES MARKED FOR MANUAL REVIEW:")
    report_lines.append("-" * 85)
    report_lines.append(f"  {'Source Dataset':<20} | {'Original Class Name':<42} | {'Reason'}")
    report_lines.append("  " + "-" * 83)
    review_rows = df_mapping[df_mapping["status"] == "REVIEW"]
    for _, r in review_rows.iterrows():
        report_lines.append(f"  {r['source_dataset']:<20} | {r['original_class']:<42} | {r['reason']}")

    report_lines.append("\n📌 6. CANONICAL CLASS DISTRIBUTION (TOP 30):")
    report_lines.append("-" * 75)
    for c_cls, count in df_curated["canonical_class"].value_counts().head(30).items():
        pct = (count / total_unique_images) * 100
        report_lines.append(f"  - {c_cls:<45}: {count:<5} ({pct:.2f}%)")

    txt_report_content = "\n".join(report_lines)
    txt_report_path = RESULTS_DIR / "curation_report.txt"
    txt_report_path.write_text(txt_report_content, encoding='utf-8')
    print(f"✅ Saved Curation Report Text File: {txt_report_path}")

    # 6. Generate Curated Class Distribution Plot
    print("\n[PLOT] Generating Curated Class Distribution Chart (results/curated_class_distribution.png)...")
    plot_curated_distribution(df_curated, RESULTS_DIR / "curated_class_distribution.png")

    # 7. Print Final Console Summary
    print("\n" + "=" * 70)
    print("AGRINEX DISEASE ML - CURATION COMPLETED SUMMARY")
    print("=" * 70)
    print(f"RAW IMAGES        : {total_raw_images}")
    print(f"UNIQUE IMAGES     : {total_unique_images}")
    print(f"DUPLICATES REMOVED: {total_duplicates_removed}")
    print(f"KEEP CLASSES      : {keep_classes_cnt}")
    print(f"REVIEW CLASSES    : {review_classes_cnt}")
    print(f"EXCLUDE CLASSES   : {exclude_classes_cnt}")
    print("=" * 70)


def plot_curated_distribution(df_curated: pd.DataFrame, png_path: Path):
    """Generates clean visualization plot of top canonical classes in curated dataset."""
    counts = df_curated["canonical_class"].value_counts()
    top_counts = counts.head(30).sort_values(ascending=True)
    
    plt.figure(figsize=(14, max(8, len(top_counts) * 0.35)))
    bars = plt.barh(top_counts.index, top_counts.values, color='#2980b9')
    plt.title('Top 30 Canonical Classes in Curated Dataset (Post-Deduplication)', fontsize=14, fontweight='bold')
    plt.xlabel('Number of Unique Images')
    plt.ylabel('Canonical Label ({Plant}__{Disease}__{PlantPart})')
    
    for bar in bars:
        w = bar.get_width()
        plt.annotate(f'{int(w)}',
                     xy=(w, bar.get_y() + bar.get_height() / 2),
                     xytext=(5, 0),
                     textcoords="offset points",
                     ha='left', va='center', fontsize=8)

    plt.tight_layout()
    plt.savefig(png_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"✅ Saved Curated Distribution Chart: {png_path}")


if __name__ == "__main__":
    run_curation_pipeline()
