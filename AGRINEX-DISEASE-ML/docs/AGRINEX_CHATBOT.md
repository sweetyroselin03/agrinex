# AgriNex Local Agricultural AI Chatbot

## Overview
The **AgriNex AI Agricultural Chatbot** is an offline-capable, local knowledge-retrieval conversational system built directly into the AgriNex backend. It provides farmers and growers with immediate, structured agricultural advice, crop care guidance, disease causes, prevention, and treatment recommendations **without requiring external AI APIs (such as Gemini or OpenAI)**.

It seamlessly integrates with the **AgriNex Disease Model V2-B (60 classes)**, leveraging disease prediction context from the `/predict` endpoint to answer ambiguous follow-up questions intelligently.

---

## Architecture

```
                       +-----------------------------------+
                       |    AgriNex Mobile / Web Client    |
                       +-----------------------------------+
                                    |         ^
                       POST /predict|         | Prediction Payload
                                    v         |
                       +-----------------------------------+
                       |    AgriNex FastAPI Service        |
                       |    (src/api.py)                   |
                       +-----------------------------------+
                                    |         ^
                          POST /chat|         | Structured Answer
                     (Message + Context)      |
                                    v         |
                       +-----------------------------------+
                       |    AgriNex Chatbot Engine         |
                       |    (src/agri_chatbot.py)          |
                       +-----------------------------------+
                                         |
                   +---------------------+---------------------+
                   |                                           |
                   v                                           v
       +-----------------------+                   +-----------------------+
       | Disease Model V2-B    |                   | Local Knowledge Base  |
       | (60 Classes ResNet18) |                   | (chatbot_knowledge)   |
       +-----------------------+                   +-----------------------+
```

### Key Architectural Characteristics
1. **Offline & Self-Contained**: Operates strictly using local JSON knowledge storage (`data/chatbot_knowledge.json`). No API keys or internet connection required for AI processing.
2. **Context-Aware**: Receives optional prediction context (`plant`, `disease`, `status`, `confidence`) from previous `/predict` calls to resolve pronouns like *"What should I do for this disease?"*.
3. **Intent & Keyword Matching**: Uses regex word boundaries and multi-word phrase matching to identify crops, diseases, symptoms, causes, prevention, watering, soil, and pest management queries.
4. **Deterministic & Safe**: Eliminates AI hallucination by providing verified agricultural information or returning a polite fallback message when a topic is unsupported.

---

## Knowledge Base Structure (`data/chatbot_knowledge.json`)

The knowledge database contains three main sections:
1. **`diseases`**: 60 entries corresponding to all V2-B supported class names (causes, symptoms, prevention, management).
2. **`crops`**: 19 supported crop guides (basic info, irrigation schedules, soil/fertilizer requirements, common pests, healthy foliage appearance).
3. **`faqs`**: General agricultural topics (watering principles, soil NPK balance, general disease prevention, pest control).

---

## API Endpoints

### 1. `POST /chat`
Submits a user question to the chatbot, optionally passing latest disease prediction context.

#### Request (With Prediction Context)
```json
POST /chat
Content-Type: application/json

{
  "message": "What should I do for this disease?",
  "context": {
    "plant": "Tomato",
    "disease": "Early Blight",
    "status": "Diseased",
    "confidence": 0.93
  }
}
```

#### Response
```json
{
  "response": "🚨 **Management & Treatment for Tomato Early Blight:**\n\n**Recommended Actions:**\n• Apply bio-fungicides or chlorothalonil at first sign\n\n**Preventive Care:**\n• Mulch base of plants to prevent soil splash\n• Rotate crops every 2 years",
  "source": "AgriNex Knowledge Base",
  "context_used": true
}
```

#### Request (Without Context)
```json
POST /chat
Content-Type: application/json

{
  "message": "What diseases affect bitter gourd?"
}
```

#### Response
```json
{
  "response": "🦠 **Diseases Affecting Bitter Gourd (AgriNex Supported):**\n\n• Downy Mildew\n• Fusarium Wilt\n• Mosaic Virus\n\n💡 You can ask about causes, prevention, or treatment for any of these specific diseases.",
  "source": "AgriNex Knowledge Base",
  "context_used": false
}
```

---

### 2. `GET /health`
Verifies backend model and chatbot availability.

#### Response
```json
{
  "status": "ok",
  "model_loaded": true,
  "chatbot_loaded": true,
  "device": "cuda",
  "number_of_classes": 60,
  "model_version": "V2-B (60 classes)"
}
```

---

## How the Chatbot Uses Prediction Context

When a farmer scans a leaf image using `/predict`, the client receives a structured response:
```json
{
  "plant": "Tomato",
  "disease": "Early Blight",
  "status": "Diseased",
  "confidence": 0.7468
}
```

If the farmer subsequently opens the chat screen and asks:
* *"What is this?"*
* *"What should I do?"*
* *"How can I prevent it?"*
* *"What causes it?"*

The frontend attaches the latest prediction object as `context` in the `POST /chat` payload. The chatbot engine detects contextual keywords (*"this"*, *"it"*, *"what should I do"*) and automatically supplies information specifically for **Tomato Early Blight** without requiring the user to retype the disease name.

---

## Integration in Expo / Mobile App

In your React Native / Expo application, call the chatbot endpoint using Axios or Fetch:

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://YOUR_SERVER_IP:8000';

export const sendChatMessage = async (
  userMessage: string,
  latestPrediction?: {
    plant: string;
    disease: string;
    status: string;
    confidence: number;
  }
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message: userMessage,
      context: latestPrediction || null,
    });
    return response.data; // { response: string, source: string, context_used: boolean }
  } catch (error) {
    console.error('Error calling AgriNex Chatbot:', error);
    throw error;
  }
};
```

---

## Limitations
1. **Scope Limit**: Information is limited to the 60 crops/diseases in the AgriNex V2-B unified dataset and core agricultural guides.
2. **Deterministic Retrieval**: Answers rely on structured knowledge matching rather than free-form generative storytelling, prioritizing accuracy over speculative generation.

---

## How to Add New Crops/Diseases Later

To add a new crop or disease to the chatbot knowledge base:
1. Open `data/chatbot_knowledge.json`.
2. Add a new disease entry under `"diseases"` with keys: `plant`, `disease`, `cause`, `symptoms`, `prevention`, `management`.
3. Add or update the crop guide under `"crops"` with keys: `basic_info`, `irrigation`, `soil_fertilizer`, `common_pests`, `healthy_appearance`.
4. Restart the FastAPI server. The updated knowledge base will reload automatically on startup.
