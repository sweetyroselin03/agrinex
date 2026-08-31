import re
import unicodedata
import logging
from typing import Dict, Any

logger = logging.getLogger("uvicorn.error")

# Leetspeak / obfuscation decoding map
LEET_MAP = {
    '@': 'a', '4': 'a', '^': 'a',
    '8': 'b',
    '(': 'c', '<': 'c', '[': 'c',
    '3': 'e',
    '1': 'i', '!': 'i', '|': 'i',
    '0': 'o',
    '$': 's', '5': 's',
    '7': 't', '+': 't',
    'v': 'u',
}

# Explicit unsafe keyword & regex patterns categorized
PATTERNS = {
    "hate_speech": [
        r"\b(nigger|nigga|faggot|fag|kike|chink|spic|retard|cunt|slut|bitch|whore)\b",
        r"\b(hate|kill|die|destroy)\s+(all|those|these|them)?\s*(people|person|group|black|white|jew|muslim|hindu|christian|caste|dalit|gay|queer|immigrant)s?\b",
        r"\b(hate|despise)\s+(those|them|you|all)\b",
        r"\b(racial|caste|religious)\s+(slur|hate|violence)\b",
    ],
    "threats_violence": [
        r"\b(i will|im gonna|going to|gonna)\s+(kill|murder|stab|shoot|behead|hang|attack|harm|execute)\s+(you|him|her|them|everyone)\b",
        r"\b(death to|die you|burn in hell|kill yourself|kys)\b",
        r"\b(bomb|terrorist|terrorism|shootup|massacre)\b",
    ],
    "abuse_insult": [
        r"\b(fuck|fucker|fucking|motherfucker|asshole|bastard|dickhead|dipshit|shithead|cock|pussy|wanker)\b",
        r"\b(you are|ur)\s+(an?|a)?\s*(idiot|moron|stupid|loser|scum|trash|piece of shit)\b",
    ],
    "harassment": [
        r"\b(stalking|doxx|doxxing|leak your address|find where you live)\b",
        r"\b(go kill yourself|nobody likes you|user is a fraud|report this user)\b",
    ],
    "sexual_content": [
        r"\b(porn|porno|pornography|hentai|xxx|naked|nude|nudes|sex tape|explicit sex)\b",
        r"\b(blowjob|handjob|cunt|penis|vagina|dildo|orgasm|erotic)\b",
    ],
    "spam_scam": [
        r"\b(free money|click here to win|whatsapp me for loan|crypto double|telegram admin)\b",
        r"\b(get rich quick|guaranteed return|wire transfer money|send btc)\b",
    ]
}


class ModerationService:
    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold

    def normalize_text(self, text: str) -> str:
        """
        Normalizes text to defeat obfuscation tricks:
        1. Unicode NFKD normalization
        2. Lowercase
        3. Leetspeak substitution (@ -> a, 1 -> i, 0 -> o, $ -> s, etc.)
        4. Normalize repeated characters (e.g. 'fauuuuck' -> 'fuck')
        """
        if not text:
            return ""

        # Unicode normalization
        normalized = unicodedata.normalize('NFKD', text)
        normalized = normalized.encode('ASCII', 'ignore').decode('utf-8').lower()

        # Replace leetspeak characters
        char_list = []
        for char in normalized:
            char_list.append(LEET_MAP.get(char, char))
        text_leet = "".join(char_list)

        # Deduplicate repeated consecutive characters (e.g. "b1111tch" -> "bitch", "fauuuuck" -> "fauk")
        text_dedup = re.sub(r'(.)\1+', r'\1', text_leet)

        return text_dedup

    def moderate_text(self, text: str) -> Dict[str, Any]:
        """
        Evaluates text for offensive or inappropriate content.
        Checks raw normalized text, leetspeak deduplicated text, and symbol-stripped text.
        """
        if not text or not text.strip():
            return {
                "allowed": True,
                "category": "safe",
                "score": 0.0,
                "reason": "Text is empty"
            }

        norm_text = self.normalize_text(text)
        raw_norm = text.lower()
        
        # Strip internal separators like f.u.c.k -> fuck, b-i-t-c-h -> bitch
        clean_sep = re.sub(r'[\.\-\_\*]', '', norm_text)

        texts_to_check = [norm_text, raw_norm, clean_sep]

        # Check against offensive category patterns
        for category, regex_list in PATTERNS.items():
            for pattern in regex_list:
                for check_str in texts_to_check:
                    match = re.search(pattern, check_str, re.IGNORECASE)
                    if match:
                        matched_word = match.group(0).lower()

                        logger.warning(
                            f"[Moderation] Flagged offensive content under '{category}': "
                            f"matched pattern '{pattern}' on text snippet '{matched_word}'"
                        )

                        return {
                            "allowed": False,
                            "category": category,
                            "score": 0.95,
                            "reason": "This post contains offensive or inappropriate content and cannot be published."
                        }

        return {
            "allowed": True,
            "category": "safe",
            "score": 0.0,
            "reason": "Content is appropriate"
        }


moderation_service = ModerationService()
