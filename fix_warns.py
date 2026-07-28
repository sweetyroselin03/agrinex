import os
import glob

frontend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend"

for filepath in glob.glob(f"{frontend_dir}/src/**/*.tsx", recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix catch(e) to catch(_)
    content = content.replace("catch(e=>{})", "catch(()=>{})")
    content = content.replace("catch(e=>", "catch(()=>")
    content = content.replace("catch (e)", "catch (_)")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Warnings fixed.")
