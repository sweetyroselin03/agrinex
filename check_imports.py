import os
import re

def check_imports(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.expo' in dirs:
            dirs.remove('.expo')
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Match relative imports
                        matches = re.findall(r'import .* from [\'"](\..*)[\'"]', content)
                        # Also match side-effect imports like import './i18n'
                        matches += re.findall(r'import [\'"](\..*)[\'"]', content)
                        
                        for match in matches:
                            import_path = match
                            # Normalize path
                            abs_import_dir = os.path.abspath(os.path.join(root, import_path))
                            
                            found = False
                            # Check as file
                            for ext in ['', '.tsx', '.ts', '.js', '.jsx', '.json']:
                                if os.path.isfile(abs_import_dir + ext):
                                    found = True
                                    break
                            
                            if not found:
                                # Check as directory with index
                                for ext in ['/index.tsx', '/index.ts', '/index.js', '/index.jsx']:
                                    if os.path.isfile(os.path.join(abs_import_dir, ext.lstrip('/'))):
                                        found = True
                                        break
                            
                            if not found:
                                # Special case for .json which might not have extension in import
                                if os.path.isfile(abs_import_dir + '.json'):
                                    found = True
                            
                            if not found:
                                print(f"Broken import in {file_path}: {import_path}")
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    check_imports('mobile')
