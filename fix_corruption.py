import os
import re

def fix_corruption(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix ge'Window' -> get('window')
    content = content.replace("ge'Window'", "get('window')")
    content = content.replace("ge'window'", "get('window')")
    
    # Fix any other t replacements that were joined
    # Example: shadowOffse'...'
    # Wait, shadowOffset doesn't end with t.
    # What about 'chat'? router.push('/chat') -> router.push('/'Chat'')? 
    # No, '/chat' doesn't match t('...').
    
    # But Dimensions.get('window') was definitely hit.
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                fix_corruption(os.path.join(root, file))

if __name__ == "__main__":
    process_directory('mobile/app')
    process_directory('mobile/components')
    print("Corruption fix complete.")
