import os
import json

paths = [
    r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend\tsconfig.json",
    r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend\tsconfig.app.json"
]

for path in paths:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'compilerOptions' not in data:
            data['compilerOptions'] = {}
        
        data['compilerOptions']['noUnusedLocals'] = False
        data['compilerOptions']['noUnusedParameters'] = False
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

print("Fixed tsconfig.")
