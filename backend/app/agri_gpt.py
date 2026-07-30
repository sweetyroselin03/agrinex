"""
AgriGPT Domain-Specific Agricultural Reasoning Assistant Engine
Handles conversation memory, domain reasoning (diseases, NPK fertilizers, weather risks, schemes),
and seamless integration with recent crop scanner diagnostic results.
"""

import os
import sys
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("uvicorn.error")


class AgriGPTReasoningEngine:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.client = None
        if self.groq_api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.groq_api_key)
                logger.info("[AgriGPT] Groq client initialized successfully")
            except Exception as e:
                logger.warning(f"[AgriGPT] Failed to initialize Groq: {e}")

    def generate_domain_reasoning(self, message: str, scan_context: str = "") -> str:
        """
        Rule-based agricultural domain expert fallbacks for offline or direct reasoning.
        """
        msg_lower = message.lower()

        # 1. Scanner Context Query ("I uploaded a leaf", "What disease", "How do I treat my scan")
        if scan_context and any(kw in msg_lower for kw in ["uploaded", "scan", "leaf", "disease", "treatment", "this", "my crop", "result"]):
            return (
                f"🌱 **AgriGPT Diagnostic Analysis & Action Plan**\n\n"
                f"Based on your recent crop scan findings:\n"
                f"{scan_context}\n\n"
                f"💡 **Recommended Agronomist Action Items**:\n"
                f"• **Immediate Isolation**: Clip and safely burn severely infected leaves to halt spore spread.\n"
                f"• **Organic Spray**: Apply 5ml/L Neem Oil solution or Copper Hydroxide early morning.\n"
                f"• **Chemical Option**: If infection exceeds 20% of foliage, apply Mancozeb 75% WP @ 2.5g/L water.\n"
                f"• **Irrigation Hygiene**: Drip irrigate at plant base. Avoid splashing water onto foliage.\n\n"
                f" Would you like dosage calculations per acre or fertilizer adjustments for your soil type?"
            )

        # 2. Specific Symptom Reasoning (Tomato yellow spots, Rice brown lesions, Potato spots)
        if "tomato" in msg_lower and ("yellow" in msg_lower or "spot" in msg_lower or "blight" in msg_lower):
            return (
                "🍅 **AgriGPT Diagnosis: Tomato Early / Late Blight Alert**\n\n"
                "**Observed Symptoms**: Yellowing foliage with target-like concentric brown spots on lower leaves.\n\n"
                "🧪 **NPK & Chemical Treatment**:\n"
                "• **Fungicide**: Spray Chlorothalonil 75% WP @ 2g per liter water.\n"
                "• **Organic Alternative**: Apply Copper Oxychloride 50% WP @ 3g/L or Baking Soda solution.\n"
                "• **Nutrition**: Boost Calcium and Potassium to reinforce cell wall strength.\n\n"
                "💧 **Watering Advice**: Avoid overhead sprinkler irrigation. Drip irrigate strictly at soil root zone.\n\n"
                "💡 **Pro Tip**: Prune the lowest 6 inches of tomato foliage to prevent soil-splash infection."
            )

        if "rice" in msg_lower and ("brown" in msg_lower or "lesion" in msg_lower or "spot" in msg_lower or "blast" in msg_lower):
            return (
                "🌾 **AgriGPT Diagnosis: Rice Blast (Magnaporthe oryzae) / Brown Spot**\n\n"
                "**Observed Symptoms**: Spindle-shaped lesions with reddish-brown margins on leaf blades and nodes.\n\n"
                "🧪 **Recommended Control Measures**:\n"
                "• **Fungicide**: Spray Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L.\n"
                "• **Organic Control**: Apply Pseudomonas fluorescens bio-fungicide @ 10g/L.\n"
                "• **Nitrogen Management**: Avoid excessive Nitrogen fertilizer application during damp weather.\n\n"
                "💡 **Pro Tip**: Maintain 2-5cm water level in paddy fields to regulate root temperature."
            )

        # 3. Fertilizer Calculation Reasoning
        if "fertilizer" in msg_lower or "npk" in msg_lower or "dosage" in msg_lower or "urea" in msg_lower:
            return (
                "🧪 **AgriGPT Smart NPK Fertilizer Advisory**\n\n"
                "**Standard NPK Recommendation (per Acre)**:\n"
                "• **Urea (46% N)**: 45 kg/acre (split into 3 basal & top-dressing applications)\n"
                "• **DAP (18-46-0)**: 50 kg/acre at sowing time\n"
                "• **MOP (60% K)**: 25 kg/acre for root & grain filling stage\n\n"
                "🌿 **Organic Bio-Fertilizers**:\n"
                "• Apply Vermicompost @ 2 tonnes/acre along with Azotobacter & PSB soil inoculants.\n\n"
                "💡 **Pro Tip**: Conduct a Soil Health Card test before heavy fertilizer application to prevent soil acidification."
            )

        # 4. Weather & Irrigation Reasoning
        if "weather" in msg_lower or "rain" in msg_lower or "irrigation" in msg_lower or "water" in msg_lower:
            return (
                "🌤️ **AgriGPT Weather-Driven Farming Guide**\n\n"
                "• **High Humidity Alert (>80%)**: Postpone chemical spraying until dry weather to prevent wash-off.\n"
                "• **High Heat (>35°C)**: Increase morning drip irrigation frequency to prevent leaf wilting.\n"
                "• **Rain Forecast**: Good opportunity for basal split urea application prior to light showers.\n\n"
                "💡 **Pro Tip**: Soil moisture should be checked at 4-inch depth before starting pumps."
            )

        # 5. Government Schemes & Mandi Prices
        if "scheme" in msg_lower or "pm-kisan" in msg_lower or "subsidy" in msg_lower or "mandi" in msg_lower or "price" in msg_lower:
            return (
                "🏛️ **AgriGPT Welfare & Mandi Market Intelligence**\n\n"
                "**Key Government Welfare Programs**:\n"
                "1. **PM-KISAN**: ₹6,000 annual direct income support in 3 installments.\n"
                "2. **PM Fasal Bima Yojana (PMFBY)**: Crop insurance cover at 1.5-2% premium rates.\n"
                "3. **Sub-Mission on Agricultural Mechanization (SMAM)**: 40-50% subsidy on farm implements.\n\n"
                "📊 **Mandi Price Strategy**: Check daily e-NAM prices across adjacent mandis before harvesting to maximize profit margins."
            )

        # 6. Default Comprehensive Agricultural Response
        return (
            "🌱 **AgriGPT Intelligent Agronomist Assistant**\n\n"
            "I'm ready to assist with your agricultural decisions:\n"
            "• 🔬 **Crop Disease Pathology**: Describe leaf symptoms or upload a scan photo\n"
            "• 🧪 **NPK & Organic Fertilizer**: Precise dosage calculations per acre\n"
            "• 🌤️ **Weather & Irrigation**: Optimal watering schedules and risk warnings\n"
            "• 🏛️ **Government Schemes & Mandi Prices**: Subsidy advice and market trends\n\n"
            "💡 **Pro Tip**: Mention your crop type, location, and soil condition for tailored recommendations!"
        )

    async def get_response(
        self,
        message: str,
        history: List[Dict[str, Any]] = [],
        scan_context: str = ""
    ) -> str:
        """
        Generates AI response using LLM with context retrieval + fallbacks.
        """
        if not self.client:
            return self.generate_domain_reasoning(message, scan_context=scan_context)

        try:
            import asyncio

            system_prompt = (
                "You are **AgriGPT**, an expert AI Agricultural Reasoning Assistant for farmers and agronomists.\n\n"
                "## CORE INSTRUCTIONS:\n"
                "1. Provide intelligent, highly specific agricultural advice.\n"
                "2. Structure responses cleanly using **bold headings**, emojis, and bullet points.\n"
                "3. Give exact dosages (e.g. 2g/L water, 45kg/acre Urea) and clear step-by-step solutions.\n"
                "4. Distinguish clearly between Organic Remedies and Chemical Treatments.\n\n"
            )

            if scan_context:
                system_prompt += (
                    f"## RECENT CROP SCAN DIAGNOSTIC CONTEXT:\n"
                    f"The user has recently scanned a leaf with the following details:\n"
                    f"{scan_context}\n"
                    f"Seamlessly incorporate these scan details into your answer if relevant without asking the user to upload or explain again!\n\n"
                )

            messages = [{"role": "system", "content": system_prompt}]

            # Add multi-turn conversation history
            for msg in history[-8:]:
                role = "assistant" if msg.get("is_ai") else "user"
                messages.append({"role": role, "content": msg.get("message", "")})

            messages.append({"role": "user", "content": message})

            timeout = 2.0 if "pytest" in sys.modules else 15.0
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.client.chat.completions.create,
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.5,
                    max_tokens=800,
                ),
                timeout=timeout
            )

            result = response.choices[0].message.content
            return result

        except Exception as e:
            logger.error(f"[AgriGPT Error] LLM fallback activated: {e}")
            return self.generate_domain_reasoning(message, scan_context=scan_context)


agri_gpt_engine = AgriGPTReasoningEngine()
