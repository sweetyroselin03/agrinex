import os
import glob
import re

frontend_src = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend\src"

for filepath in glob.glob(f"{frontend_src}/**/*.tsx", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if not "import React" in content:
        content = "import React from 'react';\n" + content
    
    content = content.replace("import { React, {", "import React, {")
    content = content.replace("import React from 'react';\nimport {", "import React, {")
    content = content.replace("CloudIcon, CloudIcon", "CloudIcon")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Restored React imports and fixed duplicate CloudIcon.")
