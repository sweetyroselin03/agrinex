import client from '../api/client';
import * as FileSystem from 'expo-file-system/legacy';

export interface AIServiceResponse {
  text: string;
  conversationId?: string;
}

async function retryRequest<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[aiService] Attempt ${attempt} failed:`, error);
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
  throw lastError;
}

export async function sendMessage(
  message: string,
  conversationId: string,
  imageUri?: string,
  history: string[] = [],
  language?: string
): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed && !imageUri) {
    return 'Please provide a question or attach an image so I can help you.';
  }

  let formattedImageUrl = imageUri;
  if (imageUri && (imageUri.startsWith('file://') || imageUri.startsWith('content://') || !imageUri.startsWith('http'))) {
    try {
      let normalizedUri = imageUri;
      if (imageUri.startsWith('content://')) {
        const fileName = `chat_${Date.now()}.jpg`;
        const destUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: imageUri, to: destUri });
        normalizedUri = destUri;
      } else if (!imageUri.startsWith('file://')) {
        normalizedUri = `file://${imageUri}`;
      }
      const base64 = await FileSystem.readAsStringAsync(normalizedUri, { encoding: 'base64' });
      formattedImageUrl = `data:image/jpeg;base64,${base64}`;
    } catch (e) {
      console.warn('[aiService] Failed to convert imageUri to base64:', e);
    }
  }

  // Route chat strictly through backend /ai/chat (Gemini API)
  const payload: any = {
    message: trimmed || 'Analyze this crop image',
    conversation_id: conversationId,
  };
  if (formattedImageUrl) {
    payload.image_url = formattedImageUrl;
  }
  if (language) {
    payload.language = language;
  }

  try {
    const response = await retryRequest(() => client.post('/ai/chat', payload), 2, 1200);
    const data = response.data;
    // Unwrap envelope: { success: true, data: { message, reply } } or root payload
    const payloadData = (data && typeof data === 'object' && 'data' in data && data.data) ? data.data : data;
    const replyText = payloadData?.message || payloadData?.reply || payloadData?.response;

    if (replyText && typeof replyText === 'string') {
      return replyText;
    }
  } catch (backendError) {
    console.warn('[aiService] Backend /ai/chat call failed:', backendError);
  }

  return '⚠️ **AI service temporarily unavailable.**\n\nPlease check your internet connection and try again in a moment.';
}

export async function analyzeCropImage(imageUri: string) {
  const { analyzeImage } = require('./diseaseDetection');
  return await analyzeImage(imageUri);
}

export async function generateTreatment(diseaseName: string, cropType: string): Promise<string> {
  return `### Remediation for ${diseaseName} on ${cropType}
- **Chemical Treatment**: Apply standard fungicides or pesticides matching ${diseaseName}.
- **Organic Pathways**: Spray organic neem oil or copper soap.
- **Prevention**: Rotate crops regularly and maintain good spacing.`;
}
