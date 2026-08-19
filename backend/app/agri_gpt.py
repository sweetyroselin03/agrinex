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
from fastapi import HTTPException

logger = logging.getLogger("uvicorn.error")


class AgriGPTReasoningEngine:
    def __init__(self):
        from dotenv import load_dotenv
        load_dotenv()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.configured_model = os.getenv("GEMINI_MODEL")
        self.client = None
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")  # Primary model for all AI operations

        valid_models = ["gemini-3.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-flash-latest"]
        if self.gemini_api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.gemini_api_key)
                logger.info("[AgriGPT] Gemini client initialized successfully")
                
                if self.configured_model and self.configured_model in valid_models:
                    self.model_name = self.configured_model
                    logger.info(f"[AgriGPT] Using configured GEMINI_MODEL: {self.model_name}")
                else:
                    self.model_name = "gemini-3.5-flash-lite"
                    logger.info(f"[AgriGPT] Using default model: {self.model_name}")
            except Exception as e:
                logger.error(f"[AgriGPT] Failed to initialize Gemini: {e}")

    def generate_domain_reasoning(self, message: str, scan_context: str = "") -> str:
        """
        Rule-based agricultural domain expert fallbacks for offline or direct reasoning.
        """
        msg_lower = message.lower()

        # 1. Multilingual Support
        if any(kw in msg_lower for kw in ["hindi", "हिंदी", "namaste"]):
            return (
                "🌱 **AgriGPT कृषक सहायक (Hindi)**\n\n"
                "नमस्ते! मैं आपका एग्रीजीपीटी सहायक हूं। मैं निम्नलिखित विषयों में सहायता कर सकता हूं:\n"
                "• 🔬 **फसल रोग निदान**: पत्तियों की तस्वीर अपलोड करें।\n"
                "• 🧪 **एनपीके (NPK) खाद**: प्रति एकड़ सही मात्रा की गणना।\n"
                "• 💧 **सिंचाई और मौसम**: मौसम के अनुसार पानी देने का समय।\n"
                "• 🏛️ **सरकारी योजनाएं और मंडी भाव**: पीएम-किसान, फसल बीमा, और मंडी की जानकारी।\n\n"
                "कृपया अपनी समस्या विस्तार से बताएं!"
            )

        if any(kw in msg_lower for kw in ["tamil", "தமிழ்", "vanakkam"]):
            return (
                "🌱 **AgriGPT உழவர் உதவியாளர் (Tamil)**\n\n"
                "வணக்கம்! நான் அக்ரிஜிபிடி. உங்களுக்கு பின்வரும் வழிகளில் நான் உதவ முடியும்:\n"
                "• 🔬 **பயிர் நோய் கண்டறிதல்**: பாதிக்கப்பட்ட இலையின் புகைப்படத்தை பதிவேற்றவும்.\n"
                "• 🧪 **NPK உர மேலாண்மை**: ஏக்கருக்கு தேவையான உர அளவுகள்.\n"
                "• 💧 **நீர்ப்பாசனம் மற்றும் வானிலை**: பயிர்களுக்கான நீர் மேலாண்மை.\n"
                "• 🏛️ **அரசு திட்டங்கள் & மண்டி விலை**: விவசாய மானியங்கள் மற்றும் சந்தை நிலவரங்கள்.\n\n"
                "உங்கள் கேள்வியை தமிழிலோ அல்லது ஆங்கிலத்திலோ கேட்கலாம்!"
            )

        if any(kw in msg_lower for kw in ["telugu", "తెలుగు", "namaste"]):
            return (
                "🌱 **AgriGPT రైతు సహాయకుడు (Telugu)**\n\n"
                "నమస్తే! నేను అగ్రిజిపిటి. మీకు ఈ క్రింది అంశాలలో సహాయం చేయగలను:\n"
                "• 🔬 **పంట తెగుళ్ల నిర్ధారణ**: ఆకుల ఫోటోను అప్‌లోడ్ చేయండి.\n"
                "• 🧪 **NPK ఎరువుల యాజమాన్యం**: ఎకరానికి ఎరువుల మోతాదు లెక్కింపు.\n"
                "• 💧 **నీటి పారుదల & వాతావరణం**: వాతావरण సూచనలు.\n"
                "• 🏛️ **ప్రభుత్వ పథకాలు & మార్కెట్ ధరలు**: పీఎం-కిసాన్ మరియు పంట ఇన్సూరెన్స్ సమాచారం.\n\n"
                "దయచేసి మీ ప్రశ్నను అడగండి!"
            )

        if any(kw in msg_lower for kw in ["spanish", "español", "hola"]):
            return (
                "🌱 **AgriGPT Asistente Agrónomo (Spanish)**\n\n"
                "¡Hola! Soy su asistente AgriGPT. Le puedo ayudar con:\n"
                "• 🔬 **Diagnóstico de enfermedades**: Suba fotos de hojas afectadas.\n"
                "• 🧪 **Fertilizantes NPK**: Cálculo de dosis por hectárea.\n"
                "• 💧 **Riego y Clima**: Programación y cuidado del suelo.\n"
                "• 🏛️ **Mercados y Precios**: Tendencias de precios locales.\n\n"
                "¡Escriba su consulta para comenzar!"
            )

        if any(kw in msg_lower for kw in ["malayalam", "മലയാളം", "namaskaram"]):
            return (
                "🌱 **AgriGPT കർഷക സഹായി (Malayalam)**\n\n"
                "നമസ്കാരം! ഞാൻ അഗ്രിജിപിറ്റി സഹായി ആണ്. എനിക്ക് താഴെ പറയുന്ന കാര്യങ്ങളിൽ സഹായിക്കാൻ കഴിയും:\n"
                "• 🔬 **വിള രോഗ നിർണ്ണയം**: രോഗം ബാധിച്ച ഇലയുടെ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക.\n"
                "• 🧪 **NPK വളങ്ങൾ**: ഏക്കറിന് ആവശ്യമുള്ള വളത്തിന്റെ കൃത്യമായ അളവ്.\n"
                "• 💧 **ജലസേചനവും കാലാവസ്ഥയും**: കാലാവസ്ഥയ്ക്ക് അനുയോജ്യമായ നനയ്ക്കൽ സമയം.\n"
                "• 🏛️ **സർക്കാർ പദ്ധതികളും വിപണി വിലയും**: കൃഷി ആനുകൂല്യങ്ങളും വിപണി നിരക്കുകളും.\n\n"
                "ദയവായി നിങ്ങളുടെ സംശയം വിശദമായി ചോദിക്കുക!"
            )

        # 2. Scanner Context Query ("I uploaded a leaf", "What disease", "How do I treat my scan")
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
                f"Would you like dosage calculations per acre or fertilizer adjustments for your soil type?"
            )

        # 3. Organic Farming
        if any(kw in msg_lower for kw in ["organic", "bio", "compost", "natural farming", "manure", "panchagavya"]):
            return (
                "🌿 **AgriGPT Organic & Natural Farming Guide**\n\n"
                "**1. Soil Enrichment**:\n"
                "• **Vermicompost**: Apply 2-3 tonnes per acre during land preparation.\n"
                "• **Panchagavya**: Spray 3% solution (300ml in 10L water) for growth promotion & immunity.\n"
                "• **Green Manuring**: Sow Sunnhemp or Dhaincha and incorporate into soil at 45 days before main crop.\n\n"
                "**2. Bio-Pest Control**:\n"
                "• **Neem Oil (Azadirachtin)**: Mix 10,000 ppm @ 3ml/L water + mild soap emulsifier for sucking pests.\n"
                "• **Trichoderma viride**: Soil application @ 1kg mixed with 100kg farmyard manure for root rot diseases.\n"
                "• **Beauchamp Spray**: Dilute fermented cow urine and ginger-garlic-chilli extract to manage caterpillars.\n\n"
                "💡 **Pro Tip**: Use yellow sticky traps (15-20 traps/acre) to monitor whiteflies and thrips organically."
            )

        # 4. Crop Recommendation
        if any(kw in msg_lower for kw in ["recommendation", "recommend", "which crop", "what to grow", "suitability"]):
            return (
                "🌾 **AgriGPT Crop Selection & Recommendation Advisor**\n\n"
                "**1. Clayey/Black Cotton Soil (Retains moisture)**:\n"
                "• **Best Crops**: Cotton, Soybean, Wheat, Gram, and Sugarcane.\n"
                "• **Climate**: Warm temperate with moderate rainfall.\n\n"
                "**2. Sandy/Loamy Soil (Well-drained)**:\n"
                "• **Best Crops**: Maize, Groundnut, Mustard, Vegetables, and Millets.\n"
                "• **Climate**: Low moisture, requires moderate organic manure.\n\n"
                "**3. Clayey Loam (Alluvial - High fertility)**:\n"
                "• **Best Crops**: Rice (Paddy), Banana, Sugarcane, and Jute.\n"
                "• **Climate**: High water availability or heavy rainfall.\n\n"
                "💡 **Pro Tip**: Rotate deep-rooted crops (e.g. pulses) with shallow-rooted crops (e.g. cereals) to restore soil structure."
            )

        # 5. Irrigation & Water Management
        if any(kw in msg_lower for kw in ["irrigation", "water", "drip", "sprinkler", "watering"]):
            return (
                "💧 **AgriGPT Irrigation & Water Conservation Guide**\n\n"
                "**1. Drip Irrigation (Efficiency >90%)**:\n"
                "• Highly recommended for Row Crops (Banana, Tomato, Sugarcane, Cotton).\n"
                "• **Operation**: Run drip line for 1-2 hours daily depending on evapotranspiration.\n\n"
                "**2. Sprinkler Irrigation (Efficiency 75-80%)**:\n"
                "• Ideal for Close-Spaced Crops (Groundnut, Wheat, Leafy Greens, Potato).\n"
                "• Avoid spraying during afternoon hours to reduce evaporative losses.\n\n"
                "**3. Soil Moisture Assessment**:\n"
                "• Perform the 'squeeze test' at 4-inch depth: if soil forms a ball but doesn't crumble, moisture is adequate.\n\n"
                "💡 **Pro Tip**: Mulch beds with plastic sheet or crop residue to reduce evaporation by up to 40%."
            )

        # 6. Specific Symptom Reasoning (Tomato yellow spots, Rice brown lesions, Potato spots)
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

        # 7. Fertilizer Calculation Reasoning
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

        # 8. Weather & Irrigation Reasoning
        if "weather" in msg_lower or "rain" in msg_lower or "temp" in msg_lower:
            return (
                "🌤️ **AgriGPT Weather-Driven Farming Guide**\n\n"
                "• **High Humidity Alert (>80%)**: Postpone chemical spraying until dry weather to prevent wash-off.\n"
                "• **High Heat (>35°C)**: Increase morning drip irrigation frequency to prevent leaf wilting.\n"
                "• **Rain Forecast**: Good opportunity for basal split urea application prior to light showers.\n\n"
                "💡 **Pro Tip**: Soil moisture should be checked at 4-inch depth before starting pumps."
            )

        # 9. Government Schemes & Mandi Prices
        if "scheme" in msg_lower or "pm-kisan" in msg_lower or "subsidy" in msg_lower or "mandi" in msg_lower or "price" in msg_lower:
            return (
                "🏛️ **AgriGPT Welfare & Mandi Market Intelligence**\n\n"
                "**Key Government Welfare Programs**:\n"
                "1. **PM-KISAN**: ₹6,000 annual direct income support in 3 installments.\n"
                "2. **PM Fasal Bima Yojana (PMFBY)**: Crop insurance cover at 1.5-2% premium rates.\n"
                "3. **Sub-Mission on Agricultural Mechanization (SMAM)**: 40-50% subsidy on farm implements.\n\n"
                "📊 **Mandi Price Strategy**: Check daily e-NAM prices across adjacent mandis before harvesting to maximize profit margins."
            )

        # 10. Default Response (Direct & Helpful)
        return (
            f"I have received your query regarding: \"{message.strip()}\".\n\n"
            "How can I assist you further with this topic or any other questions you have?"
        )

    async def get_response(
        self,
        message: str,
        history: List[Dict[str, Any]] = [],
        scan_context: str = "",
        language: str = None
    ) -> str:
        """
        Generates AI response using Gemini with context retrieval + fallbacks.
        """
        if not self.client:
            return self.generate_domain_reasoning(message, scan_context=scan_context)

        system_prompt = (
            "You are **AgriGPT**, an intelligent AI assistant.\n\n"
            "## DIRECT ANSWER INSTRUCTIONS:\n"
            "1. Identify the user's intent FIRST and answer their EXACT question directly, accurately, and thoroughly.\n"
            "2. DO NOT assume every question is about agriculture. If the user asks a general knowledge question (e.g., politics, geography, science, history, famous people, general knowledge), answer the question directly and accurately without appending forced agricultural context or farming advice.\n"
            "3. Answer the current question first. Do NOT add unrelated information (such as agricultural budget, government schemes, crop info, or NPK fertilizers) unless the user specifically asked for it.\n"
            "4. Do not repeat old answers from context unless requested.\n"
            "5. Be concise and precise unless the user requests detailed explanation.\n"
            "6. Structure responses cleanly using **bold headings** (e.g. **Heading Name**), emojis, and bullet points. DO NOT use `#` or `##` markdown tags for headings.\n"
            "7. Give exact dosages (e.g. 2g/L water, 45kg/acre Urea) and clear step-by-step solutions when asked about crop protection or farming.\n"
            "8. Never invent facts. State uncertainty if a fact is uncertain.\n\n"
        )

        if language and language.strip():
            system_prompt += f"## LANGUAGE INSTRUCTION:\nRespond strictly in {language.strip()}.\n\n"
        else:
            system_prompt += "## LANGUAGE INSTRUCTION:\nDetect the user's language and respond naturally in the same language (e.g. English, Tamil, Hindi, Telugu, Malayalam). Default to English.\n\n"

        if scan_context:
            system_prompt += (
                f"## RECENT CROP SCAN DIAGNOSTIC CONTEXT:\n"
                f"The user has recently scanned a leaf with the following details:\n"
                f"{scan_context}\n"
                f"Note: Use this scan history ONLY if relevant to the user's current question. Do NOT substitute scan details if the user is asking about a different topic.\n\n"
            )

        # Sanitize and deduplicate role sequence for Gemini API:
        # Gemini requires strict alternating user/model roles.
        sanitized_history = []
        last_role = None
        for msg in history[-20:]:
            msg_text = msg.get("message", "").strip() if isinstance(msg, dict) else ""
            if not msg_text:
                continue
            role = "model" if msg.get("is_ai") else "user"
            if role != last_role:
                sanitized_history.append({"role": role, "parts": [{"text": msg_text}]})
                last_role = role

        # If the last history item is user, remove it so the new question is the only trailing user message
        if sanitized_history and sanitized_history[-1]["role"] == "user":
            sanitized_history.pop()

        contents = sanitized_history
        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        # Structured Logs: selected model & prompt
        logger.info(f"[AgriGPT Chat] Selected Model: {self.model_name}")
        logger.info(f"[AgriGPT Chat] User Message: {message}")
        logger.info(f"[AgriGPT Chat] System Prompt: {system_prompt}")
        logger.info(f"[AgriGPT Chat] Sanitized contents count: {len(contents)}")

        import asyncio
        from google.genai import types

        retries = 2
        for attempt in range(retries):
            try:
                timeout = 15.0 if "pytest" in sys.modules else 30.0

                config = types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=4000,
                    system_instruction=system_prompt,
                )

                response_stream = await asyncio.wait_for(
                    self.client.aio.models.generate_content_stream(
                        model=self.model_name,
                        contents=contents,
                        config=config,
                    ),
                    timeout=timeout
                )

                full_text = ""
                async for chunk in response_stream:
                    if chunk.text:
                        full_text += chunk.text

                if full_text.strip():
                    logger.info(f"[AgriGPT Chat] Gemini Response: {full_text}")
                    return full_text
                else:
                    raise ValueError("Empty response received from Gemini.")

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "Quota exceeded" in err_str or "quota" in err_str.lower():
                    logger.warning(f"[AgriGPT Chat Fallback] Gemini API Quota Exceeded (429): {e}. Using domain reasoning fallback.")
                    return self.generate_domain_reasoning(message, scan_context=scan_context)
                logger.error(f"[AgriGPT Chat Attempt {attempt + 1} Failed] Error: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(0.3)

        logger.error("[AgriGPT Chat Error] All Gemini attempts failed. Fallback reasoning activated.")
        fallback_text = self.generate_domain_reasoning(message, scan_context=scan_context)
        logger.info(f"[AgriGPT Chat] Fallback Response: {fallback_text}")
        return fallback_text

    async def get_response_stream(
        self,
        message: str,
        history: List[Dict[str, Any]] = [],
        scan_context: str = "",
        language: str = None
    ):
        """
        Yields text chunks of the AI response in real-time.
        """
        if not self.client:
            fallback_text = self.generate_domain_reasoning(message, scan_context=scan_context)
            for i in range(0, len(fallback_text), 20):
                yield fallback_text[i:i+20]
                await asyncio.sleep(0.01)
            return

        system_prompt = (
            "You are **AgriGPT**, an intelligent AI assistant.\n\n"
            "## DIRECT ANSWER INSTRUCTIONS:\n"
            "1. Identify the user's intent FIRST and answer their EXACT question directly, accurately, and thoroughly.\n"
            "2. DO NOT assume every question is about agriculture. If the user asks a general knowledge question (e.g., politics, geography, science, history, famous people, general knowledge), answer the question directly and accurately without appending forced agricultural context or farming advice.\n"
            "3. Answer the current question first. Do NOT add unrelated information (such as agricultural budget, government schemes, crop info, or NPK fertilizers) unless the user specifically asked for it.\n"
            "4. Do not repeat old answers from context unless requested.\n"
            "5. Be concise and precise unless the user requests detailed explanation.\n"
            "6. Structure responses cleanly using **bold headings** (e.g. **Heading Name**), emojis, and bullet points. DO NOT use `#` or `##` markdown tags for headings.\n"
            "7. Give exact dosages (e.g. 2g/L water, 45kg/acre Urea) and clear step-by-step solutions when asked about crop protection or farming.\n"
            "8. Never invent facts. State uncertainty if a fact is uncertain.\n\n"
        )

        if language and language.strip():
            system_prompt += f"## LANGUAGE INSTRUCTION:\nRespond strictly in {language.strip()}.\n\n"
        else:
            system_prompt += "## LANGUAGE INSTRUCTION:\nDetect the user's language and respond naturally in the same language. Default to English.\n\n"

        if scan_context:
            system_prompt += (
                f"## RECENT CROP SCAN DIAGNOSTIC CONTEXT:\n"
                f"The user has recently scanned a leaf with the following details:\n"
                f"{scan_context}\n"
                f"Note: Use this scan history ONLY if relevant to the user's current question.\n\n"
            )

        sanitized_history = []
        last_role = None
        for msg in history[-20:]:
            msg_text = msg.get("message", "").strip() if isinstance(msg, dict) else ""
            if not msg_text:
                continue
            role = "model" if msg.get("is_ai") else "user"
            if role != last_role:
                sanitized_history.append({"role": role, "parts": [{"text": msg_text}]})
                last_role = role

        if sanitized_history and sanitized_history[-1]["role"] == "user":
            sanitized_history.pop()

        contents = sanitized_history
        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        logger.info(f"[AgriGPT Stream] Selected Model: {self.model_name}")

        import asyncio
        from google.genai import types

        retries = 2
        for attempt in range(retries):
            try:
                timeout = 15.0 if "pytest" in sys.modules else 30.0
                config = types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=4000,
                    system_instruction=system_prompt,
                )

                response_stream = await asyncio.wait_for(
                    self.client.aio.models.generate_content_stream(
                        model=self.model_name,
                        contents=contents,
                        config=config,
                    ),
                    timeout=timeout
                )

                async for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                return

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "Quota exceeded" in err_str or "quota" in err_str.lower():
                    logger.error(f"[AgriGPT Stream Error] Gemini API Quota Exceeded (429): {e}")
                    yield "Gemini API quota is temporarily exhausted. Please try again later."
                    return
                logger.error(f"[AgriGPT Stream Attempt {attempt + 1} Failed] Error: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(0.5)

        fallback_text = self.generate_domain_reasoning(message, scan_context=scan_context)
        for i in range(0, len(fallback_text), 20):
            yield fallback_text[i:i+20]
            await asyncio.sleep(0.01)


agri_gpt_engine = AgriGPTReasoningEngine()

