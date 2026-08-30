"""
AgriNex AI Agricultural Chatbot Engine (Local Offline Knowledge Base)

Provides conversational agricultural responses for 60 V2-B crops and diseases
WITHOUT requiring external LLM APIs (Gemini/OpenAI).

Features:
- Local knowledge retrieval from data/chatbot_knowledge.json
- Prediction Context Awareness (uses latest /predict result when user asks ambiguous follow-ups)
- Structured keyword and intent matching (causes, symptoms, prevention, treatment, watering, soil, pests)
- Safe fallback responses for unsupported topics
"""

import sys
import re
import json
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

# Windows console encoding fix
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_KNOWLEDGE_PATH = BASE_DIR / "data" / "chatbot_knowledge.json"


class AgriNexChatbot:
    """Local offline conversational chatbot for AgriNex crops & diseases."""

    def __init__(self, knowledge_path: Optional[Path] = None):
        self.knowledge_path = Path(knowledge_path) if knowledge_path else DEFAULT_KNOWLEDGE_PATH
        self.knowledge = self._load_knowledge_base()

        self.diseases = self.knowledge.get("diseases", {})
        self.crops = self.knowledge.get("crops", {})
        self.faqs = self.knowledge.get("faqs", [])

    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Loads local JSON knowledge base."""
        if not self.knowledge_path.exists():
            raise FileNotFoundError(f"❌ Chatbot knowledge base not found at {self.knowledge_path}")

        try:
            with open(self.knowledge_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"❌ Error decoding chatbot knowledge base: {e}")

    def _normalize_text(self, text: str) -> str:
        """Lowercases and cleans input text."""
        if not text:
            return ""
        text = text.lower().strip()
        text = re.sub(r"[^\w\s]", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    def _extract_crop_mentions(self, text_norm: str) -> Optional[str]:
        """Identifies crop names mentioned in text using exact word boundaries."""
        crop_names = sorted(list(self.crops.keys()), key=lambda x: len(x), reverse=True)

        for crop in crop_names:
            c_norm = self._normalize_text(crop)
            # Match whole word pattern
            pattern = r"\b" + re.escape(c_norm) + r"\b"
            if re.search(pattern, text_norm):
                return crop

        # Additional alias mappings
        aliases = {
            "tomatoes": "Tomato",
            "potatoes": "Potato",
            "apples": "Apple",
            "grapes": "Grape",
            "peaches": "Peach",
            "peppers": "Pepper",
            "cherries": "Cherry",
            "cucumbers": "Cucumber",
            "eggplants": "Eggplant",
            "cauliflowers": "Cauliflower",
            "blueberries": "Blueberry",
            "raspberries": "Raspberry",
            "strawberries": "Strawberry",
            "soybeans": "Soybean",
            "oranges": "Orange",
            "maize": "Corn",
            "corns": "Corn",
            "bell pepper": "Pepper",
            "bell peppers": "Pepper"
        }

        for alias, mapped_crop in aliases.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, text_norm):
                return mapped_crop

        return None

    def _extract_disease_mentions(self, text_norm: str, crop_filter: Optional[str] = None) -> Optional[str]:
        """Identifies disease names in text."""
        # Search through disease keys
        candidate_entries = []
        for key, entry in self.diseases.items():
            plant = entry.get("plant", "")
            disease = entry.get("disease", "")

            if crop_filter and plant.lower() != crop_filter.lower():
                continue

            d_norm = self._normalize_text(disease)
            if d_norm and d_norm in text_norm and d_norm not in ["healthy", "none"]:
                candidate_entries.append((key, disease))

        if candidate_entries:
            # Sort by longest disease name match
            candidate_entries.sort(key=lambda x: len(x[1]), reverse=True)
            return candidate_entries[0][0]

        # Generic disease keyword fallbacks
        generic_disease_keywords = {
            "early blight": "Early blight",
            "late blight": "Late blight",
            "black rot": "Black rot",
            "scab": "Apple scab",
            "cedar apple rust": "Cedar apple rust",
            "downy mildew": "Downey mildew",
            "powdery mildew": "Powdery mildew",
            "fusarium wilt": "Fusarium wilt",
            "verticillium wilt": "Verticillium wilt",
            "mosaic virus": "Mosaic virus",
            "anthracnose": "Anthracnose",
            "belly rot": "Belly rot",
            "bacterial spot": "Bacterial spot",
            "cercospora": "Cercospora leaf spot",
            "gray leaf spot": "Gray leaf spot",
            "common rust": "Common rust",
            "citrus greening": "Citrus greening",
            "huanglongbing": "Citrus greening",
            "leaf scorch": "Leaf scorch",
            "leaf mold": "Leaf mold",
            "leaf miner": "Leaf miner",
            "septoria": "Septoria leaf spot",
            "spider mite": "Two-spotted spider mite",
            "target spot": "Target spot",
            "yellow leaf curl": "Tomato Yellow Leaf Curl Virus",
            "spotted wilt": "Tomato spotted wilt",
            "insect damage": "Insect damage"
        }

        for kw, target_d in generic_disease_keywords.items():
            if kw in text_norm:
                # Find matching key in self.diseases
                for key, entry in self.diseases.items():
                    plant = entry.get("plant", "")
                    d_name = entry.get("disease", "")
                    if crop_filter and plant.lower() != crop_filter.lower():
                        continue
                    if self._normalize_text(kw) in self._normalize_text(d_name) or self._normalize_text(target_d) in self._normalize_text(d_name):
                        return key

        return None

    def ask(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Main query processing function."""
        if not message or not message.strip():
            return {
                "response": "Please enter a valid agricultural question or request.",
                "source": "AgriNex Knowledge Base",
                "context_used": False
            }

        text_norm = self._normalize_text(message)

        # Context Resolution
        context_used = False
        context_plant = None
        context_disease = None
        context_status = None

        if context and isinstance(context, dict):
            context_plant = context.get("plant")
            context_disease = context.get("disease")
            context_status = context.get("status")

        # Determine target crop & disease
        extracted_crop = self._extract_crop_mentions(text_norm)
        extracted_disease_key = self._extract_disease_mentions(text_norm, crop_filter=extracted_crop)

        # Check for contextual pronouns / ambiguous follow-ups
        contextual_triggers = [
            "this", "it", "what should i do", "what to do", "how to treat",
            "how can i prevent", "what causes", "symptoms", "cause", "prevention",
            "treatment", "cure", "help", "solution", "about this", "fix this"
        ]

        uses_context_reference = any(trig in text_norm for trig in contextual_triggers)

        # If user did not mention an explicit crop but context is available
        target_crop = extracted_crop
        target_disease_key = extracted_disease_key

        if not target_crop and context_plant and context_plant != "Unknown":
            if uses_context_reference or not target_disease_key:
                target_crop = context_plant
                context_used = True

        if not target_disease_key and context_disease and context_disease not in ["Unknown", "None"]:
            if uses_context_reference or context_used:
                # Match disease key for context_plant + context_disease
                for key, entry in self.diseases.items():
                    if entry.get("plant", "").lower() == str(context_plant).lower():
                        if entry.get("disease", "").lower() == str(context_disease).lower():
                            target_disease_key = key
                            context_used = True
                            break

                if not target_disease_key and target_crop:
                    target_disease_key = self._extract_disease_mentions(self._normalize_text(str(context_disease)), crop_filter=target_crop)
                    if target_disease_key:
                        context_used = True

        # Intent Recognition & Response Formatting

        # 1. Healthy Plant Context / Query
        if "healthy" in text_norm or (context_status == "Healthy" and context_used):
            if target_crop and target_crop in self.crops:
                guide = self.crops[target_crop]
                resp = (
                    f"🌿 **{target_crop} Plant Status: Healthy**\n\n"
                    f"{guide.get('healthy_appearance', 'The plant shows healthy green foliage and normal growth.')}\n\n"
                    f"💡 **Care Guidance for Healthy {target_crop}:**\n"
                    f"• **Watering:** {guide.get('irrigation')}\n"
                    f"• **Soil & Fertilizer:** {guide.get('soil_fertilizer')}\n"
                    f"• **Maintenance:** No disease treatment required. Continue routine monitoring."
                )
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 2. Specific Disease Query (using matched key)
        if target_disease_key and target_disease_key in self.diseases:
            d_entry = self.diseases[target_disease_key]
            plant_name = d_entry.get("plant")
            disease_name = d_entry.get("disease")

            # Check specific sub-intents
            is_cause_q = any(k in text_norm for k in ["cause", "causes", "why", "pathogen", "reason"])
            is_prev_q = any(k in text_norm for k in ["prevent", "prevention", "avoid", "protect", "stop"])
            is_treat_q = any(k in text_norm for k in ["treat", "treatment", "cure", "manage", "control", "spray", "fungicide", "what should i do", "fix"])
            is_symp_q = any(k in text_norm for k in ["symptom", "symptoms", "look like", "sign", "spot", "spots"])

            # Formulate tailored responses
            if is_cause_q and not is_treat_q and not is_prev_q:
                resp = f"🦠 **Cause of {plant_name} {disease_name}:**\n{d_entry.get('cause')}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

            if is_prev_q and not is_treat_q:
                prev_items = d_entry.get("prevention", [])
                if isinstance(prev_items, list):
                    prev_str = "\n".join([f"• {item}" for item in prev_items])
                else:
                    prev_str = f"• {prev_items}"
                resp = f"🛡️ **Prevention for {plant_name} {disease_name}:**\n{prev_str}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

            if is_treat_q:
                mgmt_items = d_entry.get("management", []) or d_entry.get("treatment", [])
                if isinstance(mgmt_items, list):
                    mgmt_str = "\n".join([f"• {item}" for item in mgmt_items])
                else:
                    mgmt_str = f"• {mgmt_items}"

                prev_items = d_entry.get("prevention", [])
                if isinstance(prev_items, list):
                    prev_str = "\n".join([f"• {item}" for item in prev_items])
                else:
                    prev_str = f"• {prev_items}"

                resp = (
                    f"🚨 **Management & Treatment for {plant_name} {disease_name}:**\n\n"
                    f"**Recommended Actions:**\n{mgmt_str}\n\n"
                    f"**Preventive Care:**\n{prev_str}"
                )
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

            if is_symp_q:
                symp_items = d_entry.get("symptoms", [])
                if isinstance(symp_items, list):
                    symp_str = "\n".join([f"• {item}" for item in symp_items])
                else:
                    symp_str = f"• {symp_items}"
                resp = f"🔍 **Symptoms of {plant_name} {disease_name}:**\n{symp_str}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

            # General comprehensive disease summary
            symp_str = "\n".join([f"• {s}" for s in d_entry.get("symptoms", [])]) if isinstance(d_entry.get("symptoms"), list) else f"• {d_entry.get('symptoms')}"
            prev_str = "\n".join([f"• {p}" for p in d_entry.get("prevention", [])]) if isinstance(d_entry.get("prevention"), list) else f"• {d_entry.get('prevention')}"
            mgmt_str = "\n".join([f"• {m}" for m in d_entry.get("management", [])]) if isinstance(d_entry.get("management"), list) else f"• {d_entry.get('management')}"

            resp = (
                f"🌾 **{plant_name} - {disease_name} Guide**\n\n"
                f"**Cause:**\n{d_entry.get('cause')}\n\n"
                f"**Key Symptoms:**\n{symp_str}\n\n"
                f"**Prevention:**\n{prev_str}\n\n"
                f"**Management & Treatment:**\n{mgmt_str}"
            )
            return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 3. Query for Diseases Affecting a Crop (e.g., "What diseases affect bitter gourd?")
        if target_crop and any(k in text_norm for k in ["diseases", "disease", "affect", "affects", "types of disease", "list diseases", "problems"]):
            crop_diseases = []
            for key, entry in self.diseases.items():
                if entry.get("plant", "").lower() == target_crop.lower():
                    d_name = entry.get("disease", "")
                    if d_name.lower() not in ["healthy", "none"]:
                        crop_diseases.append(d_name)

            if crop_diseases:
                d_list_str = "\n".join([f"• {d}" for d in sorted(list(set(crop_diseases)))])
                resp = f"🦠 **Diseases Affecting {target_crop} (AgriNex Supported):**\n\n{d_list_str}\n\n💡 You can ask about causes, prevention, or treatment for any of these specific diseases."
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 4. Crop Irrigation / Water Query
        if target_crop and any(k in text_norm for k in ["water", "watering", "irrigation", "how often"]):
            if target_crop in self.crops:
                guide = self.crops[target_crop]
                resp = f"💧 **Irrigation Guidance for {target_crop}:**\n{guide.get('irrigation')}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 5. Crop Soil / Fertilizer Query
        if target_crop and any(k in text_norm for k in ["soil", "fertilizer", "npk", "manure", "compost", "nutrient"]):
            if target_crop in self.crops:
                guide = self.crops[target_crop]
                resp = f"🌱 **Soil & Fertilizer Guidance for {target_crop}:**\n{guide.get('soil_fertilizer')}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 6. Crop Common Pests Query
        if target_crop and any(k in text_norm for k in ["pest", "pests", "insect", "insects", "bug", "bugs"]):
            if target_crop in self.crops:
                guide = self.crops[target_crop]
                resp = f"🐛 **Common Pests Affecting {target_crop}:**\n{guide.get('common_pests')}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 7. General Crop Overview
        if target_crop and target_crop in self.crops:
            guide = self.crops[target_crop]
            resp = (
                f"🌾 **{target_crop} Overview & Care Guide**\n\n"
                f"**Basic Info:** {guide.get('basic_info')}\n\n"
                f"**Irrigation:** {guide.get('irrigation')}\n\n"
                f"**Soil & Fertilizer:** {guide.get('soil_fertilizer')}\n\n"
                f"**Common Pests:** {guide.get('common_pests')}"
            )
            return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": context_used}

        # 8. General Agricultural FAQs matching
        for faq in self.faqs:
            keywords = faq.get("keywords", [])
            if any(kw in text_norm for kw in keywords):
                resp = f"💡 **{faq.get('topic')}:**\n{faq.get('answer')}"
                return {"response": resp, "source": "AgriNex Knowledge Base", "context_used": False}

        # 9. Fallback response for unsupported queries
        supported_crops = ", ".join(list(self.crops.keys())[:8]) + ", etc."
        fallback_resp = (
            "ℹ️ AgriNex Knowledge Base currently does not have specific information for that query.\n\n"
            f"You can ask about:\n"
            f"• Supported crops ({supported_crops})\n"
            f"• Specific disease causes, symptoms, prevention, or treatments\n"
            f"• Watering, soil, or pest control guidance\n"
            "• Or upload a leaf image to run AgriNex V2-B disease detection first!"
        )
        return {"response": fallback_resp, "source": "AgriNex Knowledge Base", "context_used": False}


# Global singleton instance
_CHATBOT_INSTANCE = None


def get_chatbot_response(message: str, context: Optional[Dict[str, Any]] = None, knowledge_path: Optional[Path] = None) -> Dict[str, Any]:
    """Module-level function to handle chatbot queries."""
    global _CHATBOT_INSTANCE
    if _CHATBOT_INSTANCE is None or knowledge_path:
        _CHATBOT_INSTANCE = AgriNexChatbot(knowledge_path=knowledge_path)

    return _CHATBOT_INSTANCE.ask(message, context=context)


if __name__ == "__main__":
    bot = AgriNexChatbot()

    test_queries = [
        ("What is tomato early blight?", None),
        ("How often should I water tomato plants?", None),
        ("What diseases affect bitter gourd?", None),
        ("What should I do?", {"plant": "Tomato", "disease": "Early Blight", "status": "Diseased", "confidence": 0.93}),
        ("How to grow pineapples on Mars?", None)
    ]

    print("=" * 80)
    print("AGRINEX CHATBOT TEST RUN")
    print("=" * 80)

    for q, ctx in test_queries:
        print(f"\nQuery   : '{q}'")
        print(f"Context : {ctx}")
        res = bot.ask(q, ctx)
        print(f"Context Used : {res['context_used']}")
        print(f"Response     :\n{res['response']}")
        print("-" * 80)
