import os
import re

# Mapping of translation keys to hardcoded strings
TRANSLATION_MAP = {
    'dashboard.greeting': 'Good Morning,',
    'dashboard.farm_insights': 'Farm Insights',
    'dashboard.crop_health': 'Crop Health',
    'dashboard.soil_moisture': 'Soil Moisture',
    'dashboard.market_prices': 'Market Prices',
    'scanner.title': 'AI Crop Scanner',
    'scanner.analyzing': 'Analyzing...',
    'profile.language': 'Language',
    'profile.edit': 'Edit Profile',
    'profile.settings': 'Settings',
    'profile.sign_out': 'Sign Out',
    'common.cancel': 'Cancel',
    'community': 'Community',
    'profile': 'Profile',
    'chat': 'AI Assistant',
    'home': 'Home',
    'settings': 'Settings'
}

def remove_i18n_from_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove imports
    content = re.sub(r'import \{[^}]*useTranslation[^}]*\} from \'react-i18next\';?\n?', '', content)
    content = re.sub(r'import .* from \'\.\/i18n\';?\n?', '', content)

    # 2. Remove hook usage: const { t, i18n } = useTranslation();
    content = re.sub(r'const \{[ \t]*t[ \t]*,?[ \t]*i18n[ \t]*\} = useTranslation\(\);?\n?', '', content)
    content = re.sub(r'const \{[ \t]*t[ \t]*\} = useTranslation\(\);?\n?', '', content)
    content = re.sub(r'const \{[ \t]*i18n[ \t]*\} = useTranslation\(\);?\n?', '', content)

    # 3. Replace t('key') or t('key', 'default') - USE WORD BOUNDARY \b
    def replace_t(match):
        key = match.group(1)
        default_val = match.group(2) if match.group(2) else None
        
        if key in TRANSLATION_MAP:
            return f"'{TRANSLATION_MAP[key]}'"
        elif default_val:
            default_val = default_val.strip("'\" ")
            return f"'{default_val}'"
        else:
            fallback = key.split('.')[-1].replace('_', ' ').capitalize()
            return f"'{fallback}'"

    content = re.sub(r"\bt\('([^']*)'(?:,[ \t]*'([^']*)')?\)", replace_t, content)
    content = re.sub(r"\bt\(\"([^\"]*)\"(?:,[ \t]*\"([^\"]*)\")?\)", replace_t, content)

    # 4. Remove i18n.changeLanguage, i18n.language
    content = re.sub(r'i18n\.changeLanguage\([^)]*\);?', '', content)
    content = re.sub(r'i18n\.language', "'en'", content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx')):
                remove_i18n_from_file(os.path.join(root, file))

if __name__ == "__main__":
    process_directory('mobile/app')
    process_directory('mobile/components')
    process_directory('mobile/api')
    process_directory('mobile/store')
    process_directory('mobile/utils')
    print("i18n removal complete.")
