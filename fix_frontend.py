import os
import glob

frontend_src = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend\src"

for filepath in glob.glob(f"{frontend_src}/**/*.tsx", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix React unused
    content = content.replace("import React, {", "import {")
    content = content.replace("import React from 'react';\n", "")
    content = content.replace("import React from 'react'", "")

    # Fix CloudRainIcon
    content = content.replace("CloudRainIcon", "CloudIcon")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed TS errors.")
