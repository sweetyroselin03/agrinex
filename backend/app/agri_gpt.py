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
        from dotenv import load_dotenv
        load_dotenv()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.configured_model = os.getenv("GEMINI_MODEL")
        self.client = None
        self.model_name = "gemini-3.5-flash"  # Default fallback if discovery fails entirely

        if self.gemini_api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.gemini_api_key)
                logger.info("[AgriGPT] Gemini client initialized successfully")
                
                # Model discovery process
                selected_model = self.configured_model
                if selected_model:
                    # Test if the configured model is available
                    try:
                        logger.info(f"[AgriGPT] Testing configured GEMINI_MODEL: {selected_model}")
                        model_id = selected_model if selected_model.startswith("models/") else f"models/{selected_model}"
                        self.client.models.get(model=model_id)
                        logger.info(f"[AgriGPT] Configured model '{selected_model}' is available.")
                        self.model_name = selected_model
                    except Exception as e:
                        logger.warning(f"[AgriGPT] Configured model '{selected_model}' is unavailable: {e}. Starting auto-discovery.")
                        selected_model = None

                if not selected_model:
                    try:
                        logger.info("[AgriGPT] Listing available Gemini models...")
                        models = list(self.client.models.list())
                        
                        # Print all available models to logs
                        all_names = [m.name for m in models]
                        logger.info(f"[AgriGPT] Available Gemini API models: {all_names}")
                        
                        # Filter for supported vision-capable Gemini models
                        supported_models = []
                        for m in models:
                            actions = getattr(m, "supported_actions", [])
                            name_lower = m.name.lower()
                            if "generatecontent" in [a.lower() for a in actions] and "gemini" in name_lower:
                                # Exclude robotics, embedding, computer-use, and other non-standard text/image models
                                if not any(ex in name_lower for ex in ["robotics", "embedding", "aqa", "computer-use"]):
                                    supported_models.append(m.name)
                        
                        logger.info(f"[AgriGPT] Discovered supported Gemini models: {supported_models}")
                        
                        # Active validation of candidate models to avoid 429/Resource Exhausted models
                        priority_list = [
                            "gemini-3.5-flash",
                            "gemini-3.5-flash-lite",
                            "gemini-3.1-flash-lite",
                            "gemini-3.1-flash",
                            "gemini-3.6-flash",
                            "gemini-2.0-flash",
                            "gemini-2.0-flash-lite",
                            "gemini-2.5-flash-lite",
                            "gemini-2.5-flash",
                            "gemini-2.5-pro",
                            "gemini-3.1-pro-preview"
                        ]
                        
                        chosen = None
                        from google.genai import types
                        
                        # 1. Try testing priority models
                        for priority_kw in priority_list:
                            matches = [m for m in supported_models if priority_kw in m.lower()]
                            for name in matches:
                                logger.info(f"[AgriGPT] Testing model quota for '{name}'...")
                                try:
                                    self.client.models.generate_content(
                                        model=name,
                                        contents="test",
                                        config=types.GenerateContentConfig(max_output_tokens=1)
                                    )
                                    logger.info(f"[AgriGPT] Test succeeded! Selected: {name}")
                                    chosen = name
                                    break
                                except Exception as test_err:
                                    logger.warning(f"[AgriGPT] Test failed for model '{name}': {test_err}")
                            if chosen:
                                break
                                
                        # 2. If no priority model succeeded, test any flash or pro model in supported list
                        if not chosen:
                            logger.info("[AgriGPT] No priority model succeeded. Testing other available models in supported list...")
                            for name in supported_models:
                                logger.info(f"[AgriGPT] Testing model quota for fallback: '{name}'...")
                                try:
                                    self.client.models.generate_content(
                                        model=name,
                                        contents="test",
                                        config=types.GenerateContentConfig(max_output_tokens=1)
                                    )
                                    logger.info(f"[AgriGPT] Fallback test succeeded! Selected: {name}")
                                    chosen = name
                                    break
                                except Exception as test_err:
                                    logger.warning(f"[AgriGPT] Fallback test failed for model '{name}': {test_err}")
                                    
                        if chosen:
                            self.model_name = chosen
                            logger.info(f"[AgriGPT] Auto-discovered and selected working Gemini model: {self.model_name}")
                        else:
                            logger.warning("[AgriGPT] No supported Gemini model successfully passed the quota test. Using default fallback: gemini-3.5-flash-lite")
                            self.model_name = "gemini-3.5-flash-lite"
                    except Exception as list_err:
                        logger.error(f"[AgriGPT] Failed to auto-discover model: {list_err}. Defaulting to gemini-3.5-flash-lite")
                        self.model_name = "gemini-3.5-flash-lite"
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

        # 10. Default Comprehensive Agricultural Response
        return (
            "🌱 **AgriGPT Intelligent Agronomist Assistant**\n\n"
            "I'm ready to assist with your agricultural decisions:\n"
            "• 🔬 **Crop Disease Pathology**: Describe leaf symptoms or upload a scan photo\n"
            "• 🧪 **NPK & Organic Fertilizer**: Precise dosage calculations per acre\n"
            "• 🌾 **Crop Recommendation**: Soil-based crop selection\n"
            "• 💧 **Irrigation & Water**: Schedule optimization\n"
            "• 🌿 **Organic Farming**: Biopesticide and compost recipes\n"
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
        Generates AI response using Gemini with context retrieval + fallbacks.
        """
        if not self.client:
            return self.generate_domain_reasoning(message, scan_context=scan_context)

        system_prompt = (
            "You are **AgriGPT**, an expert AI Agricultural Reasoning Assistant for farmers and agronomists.\n\n"
            "## CORE INSTRUCTIONS:\n"
            "1. Provide intelligent, highly specific agricultural advice.\n"
            "2. Structure responses cleanly using **bold headings** (e.g. **Heading Name**), emojis, and bullet points.\n"
            "3. DO NOT use `#` or `##` markdown tags for headings; instead use double asterisks for bold headings to ensure a clean visual flow.\n"
            "4. Detect the user's language and respond naturally in the same language. Fully support Tamil, Hindi, Malayalam, Telugu, and English.\n"
            "5. Give exact dosages (e.g. 2g/L water, 45kg/acre Urea) and clear step-by-step solutions.\n"
            "6. Distinguish clearly between Organic Remedies and Chemical Treatments.\n\n"
            "## MARKDOWN PRESERVATION:\n"
            "You MUST preserve and output proper Markdown formatting including markdown tables, numbered lists, code blocks, and bullet points. Never truncate or omit them.\n\n"
        )

        if scan_context:
            system_prompt += (
                f"## RECENT CROP SCAN DIAGNOSTIC CONTEXT:\n"
                f"The user has recently scanned a leaf with the following details:\n"
                f"{scan_context}\n"
                f"Seamlessly incorporate these scan details into your answer if relevant without asking the user to upload or explain again!\n\n"
            )

        contents = []

        # Add conversation history (up to 20 messages as required)
        for msg in history[-20:]:
            role = "model" if msg.get("is_ai") else "user"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("message", "")}]
            })

        contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        # Structured Logs: selected model & prompt
        logger.info(f"[AgriGPT Chat] Selected Model: {self.model_name}")
        logger.info(f"[AgriGPT Chat] User Message: {message}")
        logger.info(f"[AgriGPT Chat] System Prompt: {system_prompt}")
        logger.info(f"[AgriGPT Chat] History count: {len(history)}")

        import asyncio
        from google.genai import types

        retries = 2
        for attempt in range(retries):
            try:
                # 30-second timeout as required: "Timeout after 30 seconds."
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
                    # Structured Logs: Gemini response & final API response
                    logger.info(f"[AgriGPT Chat] Gemini Response: {full_text}")
                    logger.info(f"[AgriGPT Chat] Final API Response: {full_text}")
                    return full_text
                else:
                    raise ValueError("Empty response received from Gemini.")

            except Exception as e:
                logger.error(f"[AgriGPT Chat Attempt {attempt + 1} Failed] Error: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(0.5)

        logger.error("[AgriGPT Chat Error] All Gemini attempts failed. Fallback reasoning activated.")
        fallback_text = self.generate_domain_reasoning(message, scan_context=scan_context)
        logger.info(f"[AgriGPT Chat] Fallback Response: {fallback_text}")
        return fallback_text

    async def get_response_stream(
        self,
        message: str,
        history: List[Dict[str, Any]] = [],
        scan_context: str = ""
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
            "You are **AgriGPT**, an expert AI Agricultural Reasoning Assistant for farmers and agronomists.\n\n"
            "## CORE INSTRUCTIONS:\n"
            "1. Provide intelligent, highly specific agricultural advice.\n"
            "2. Structure responses cleanly using **bold headings** (e.g. **Heading Name**), emojis, and bullet points.\n"
            "3. DO NOT use `#` or `##` markdown tags for headings; instead use double asterisks for bold headings to ensure a clean visual flow.\n"
            "4. Detect the user's language and respond naturally in the same language. Fully support Tamil, Hindi, Malayalam, Telugu, and English.\n"
            "5. Give exact dosages (e.g. 2g/L water, 45kg/acre Urea) and clear step-by-step solutions.\n"
            "6. Distinguish clearly between Organic Remedies and Chemical Treatments.\n\n"
            "## MARKDOWN PRESERVATION:\n"
            "You MUST preserve and output proper Markdown formatting including markdown tables, numbered lists, code blocks, and bullet points. Never truncate or omit them.\n\n"
        )

        if scan_context:
            system_prompt += (
                f"## RECENT CROP SCAN DIAGNOSTIC CONTEXT:\n"
                f"The user has recently scanned a leaf with the following details:\n"
                f"{scan_context}\n"
                f"Seamlessly incorporate these scan details into your answer if relevant without asking the user to upload or explain again!\n\n"
            )

        contents = []

        # Add conversation history (up to 20 messages as required)
        for msg in history[-20:]:
            role = "model" if msg.get("is_ai") else "user"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("message", "")}]
            })

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
                logger.error(f"[AgriGPT Stream Attempt {attempt + 1} Failed] Error: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(0.5)

        fallback_text = self.generate_domain_reasoning(message, scan_context=scan_context)
        for i in range(0, len(fallback_text), 20):
            yield fallback_text[i:i+20]
            await asyncio.sleep(0.01)


agri_gpt_engine = AgriGPTReasoningEngine()

