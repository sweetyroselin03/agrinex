import os
import glob
import re

frontend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend"

# 1. Fix Dashboard.tsx imports
dashboard_path = os.path.join(frontend_dir, "src", "pages", "Dashboard.tsx")
if os.path.exists(dashboard_path):
    with open(dashboard_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace("import { BellIcon, ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';", 
                              "import { BellIcon, ChartBarIcon, ArrowTrendingUpIcon, ViewfinderCircleIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';")
    with open(dashboard_path, "w", encoding="utf-8") as f:
        f.write(content)

# 2. Fix 'import React' globally
for filepath in glob.glob(f"{frontend_dir}/src/**/*.tsx", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove `import React from 'react';`
    content = re.sub(r"import React(?:, \{.*?\})? from 'react';\n?", "", content)
    # Re-inject named imports if needed (e.g., import { useState } from 'react')
    # Actually my previous script had `import React, { useState } from 'react';`
    # Let's cleanly replace `import React, {` with `import {`
    content = content.replace("import React, {", "import {")
    content = content.replace("import React from 'react'", "")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fix applied.")
