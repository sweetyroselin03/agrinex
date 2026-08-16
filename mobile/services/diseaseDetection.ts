import client from '../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export interface DiseaseResult {
  disease_name: string;
  confidence: number;
  severity_level: string;
  symptoms: string;
  causes: string;
  prevention: string;
  treatment: string;
  organic_treatment: string;
  pesticide_recommendations: string;
  irrigation_recommendations: string;
  fertilizer_recommendations: string;
  recovery_steps: string;
  estimated_recovery_time: string;
  weather_risk: string;
  prevention_tips: string;
  is_valid_crop?: boolean;
  detected_object?: string;
  rejection_reason?: string;
  quality_issue?: string;
  health_score?: number;
  yield_impact?: string;
  pro_tips?: string;
  scan_mode?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAGE 2 — Image Quality Validation (Frontend)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Image as RNImage } from 'react-native';

async function validateImageQuality(imageUri: string): Promise<{ valid: boolean; issue?: string }> {
  try {
    const info = await FileSystem.getInfoAsync(imageUri, { size: true } as any);

    if (!info.exists) {
      return { valid: false, issue: 'Image file not found. Please try again.' };
    }

    // Check file size — too small likely means very low quality or extremely poor lighting
    const sizeKB = ((info as any).size || 0) / 1024;
    if (sizeKB < 5) {
      return { valid: false, issue: 'Image is too blurry or dark. Ensure good lighting and take the photo closer.' };
    }

    // Check if file size is suspiciously large
    const sizeMB = sizeKB / 1024;
    if (sizeMB > 25) {
      return { valid: false, issue: 'Image file size is too large.' };
    }

    // Aspect ratio check using react-native RNImage.getSize
    const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      RNImage.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), (err) => reject(err));
    }).catch(() => null);

    if (dims) {
      const aspect = dims.width / dims.height;
      if (aspect < 0.45 || aspect > 2.2) {
        return { valid: false, issue: 'Invalid aspect ratio. Align the leaf centered inside the camera borders.' };
      }
    }

    return { valid: true };
  } catch (error) {
    console.log('Quality validation error:', error);
    return { valid: true };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Analysis Function — Multi-Stage Pipeline
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function analyzeImage(imageUri: string, scanMode: 'crop' | 'full' = 'full'): Promise<DiseaseResult> {

  // ── STAGE 2: Image Quality Validation ──
  const quality = await validateImageQuality(imageUri);
  if (!quality.valid) {
    return {
      disease_name: 'Quality Issue',
      confidence: 0,
      severity_level: 'Warning',
      symptoms: quality.issue || 'Image quality too low.',
      causes: 'The captured image does not meet quality requirements for analysis.',
      prevention: 'Ensure good lighting and hold the camera steady.',
      treatment: '',
      organic_treatment: '',
      pesticide_recommendations: '',
      irrigation_recommendations: '',
      fertilizer_recommendations: '',
      recovery_steps: '',
      estimated_recovery_time: '',
      weather_risk: '',
      prevention_tips: '',
      is_valid_crop: false,
      quality_issue: quality.issue,
    };
  }

  // ── STAGE 1 + 3: Backend handles crop validation AND disease detection (Gemini) ──
  try {
    // Normalize image URI safely for iOS / Android content URIs
    let normalizedUri = imageUri;
    if (imageUri.startsWith('content://')) {
      const fileName = `scan_${Date.now()}.jpg`;
      const destUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: imageUri, to: destUri });
      normalizedUri = destUri;
    } else if (!imageUri.startsWith('file://') && !imageUri.startsWith('http')) {
      normalizedUri = `file://${imageUri}`;
    }

    const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
    if (!fileInfo.exists) {
      return {
        disease_name: 'Image Error',
        confidence: 0,
        severity_level: 'Warning',
        symptoms: 'Selected image file could not be read.',
        causes: 'The image file may have been deleted or moved.',
        prevention: 'Please pick or take a new photo.',
        treatment: '',
        organic_treatment: '',
        pesticide_recommendations: '',
        irrigation_recommendations: '',
        fertilizer_recommendations: '',
        recovery_steps: '',
        estimated_recovery_time: '',
        weather_risk: '',
        prevention_tips: '',
        is_valid_crop: false,
        quality_issue: 'Please select a valid crop image.',
      };
    }

    // HEIC / HEIF format conversion to JPEG if needed
    const isHeic = normalizedUri.toLowerCase().includes('.heic') || normalizedUri.toLowerCase().includes('.heif');
    if (isHeic) {
      try {
        const manip = await ImageManipulator.manipulateAsync(
          normalizedUri,
          [],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        normalizedUri = manip.uri;
      } catch (manipErr) {
        console.warn('[Mobile Scanner Debug] HEIC conversion warning:', manipErr);
      }
    }

    const rawFilename = normalizedUri.split('/').pop() || `scan_${Date.now()}.jpg`;
    const filename = rawFilename.endsWith('.jpg') || rawFilename.endsWith('.jpeg') || rawFilename.endsWith('.png') || rawFilename.endsWith('.webp')
      ? rawFilename 
      : `crop_scan.jpg`;
    const mimeType = filename.endsWith('.png') ? 'image/png' : filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    const fileSize = (fileInfo as any).size || 0;

    // Fetch actual image bytes as Blob if fetch is available
    let blob: Blob | null = null;
    try {
      const fetchResp = await fetch(normalizedUri);
      blob = await fetchResp.blob();
    } catch (e) {
      console.warn('[Mobile Scanner Debug] fetch blob fallback to FileSystem base64:', e);
    }

    const base64 = await FileSystem.readAsStringAsync(normalizedUri, {
      encoding: 'base64',
    });
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // In React Native (Hermes engine), FormData requires { uri, name, type } format
    const fileObj = {
      uri: normalizedUri,
      name: filename,
      type: mimeType,
    };

    console.log("=== MOBILE CROP UPLOAD ===");
    console.log("URI:", imageUri);
    console.log("WebPath:", normalizedUri);
    console.log("Filename:", filename);
    console.log("MIME:", mimeType);
    console.log("Size:", fileSize);

    // Prepare FormData payload matching Web multipart specification
    const formData = new FormData();
    formData.append('file', fileObj as any);
    formData.append('scan_mode', scanMode);

    console.log('[Mobile Scanner Debug] FormData Field Name: file');
    console.log('[Mobile Scanner Debug] API URL:', `${client.defaults.baseURL || 'https://agrinex.onrender.com'}/ai/detect-disease`);

    // 30-second timeout for backend Gemini vision scan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      // 1. Attempt Multipart FormData Upload first
      response = await client.post('/ai/detect-disease', formData, {
        headers: {
          'Accept': 'application/json',
        },
        transformRequest: [(data, headers) => {
          if (headers) {
            delete headers['Content-Type'];
            delete headers['content-type'];
          }
          return data;
        }],
        signal: controller.signal,
        timeout: 30000,
      });
    } catch (formDataErr: any) {
      console.warn('[Mobile Scanner Debug] Multipart FormData upload failed/falling back to JSON Base64 DataURL:', formDataErr?.message);
      // 2. Fallback to JSON payload matching reference Web scanner
      response = await client.post('/ai/detect-disease', {
        image_url: dataUrl,
        scan_mode: scanMode,
      }, {
        signal: controller.signal,
        timeout: 30000,
      });
    }

    clearTimeout(timeoutId);

    console.log("Status:", response.status);
    console.log("Response:", response.data);

    // Unwrap standardize_json_middleware response if present
    const resPayload = (response.data && typeof response.data === 'object' && 'data' in response.data && response.data.data) 
      ? response.data.data 
      : response.data;

    if (resPayload && resPayload.disease_name) {
      const isValidCrop = resPayload.is_valid_crop !== false && resPayload.disease_name !== 'Non-Crop Object';
      return {
        disease_name: resPayload.disease_name || 'Unknown',
        confidence: parseFloat(resPayload.confidence) || (isValidCrop ? 85.0 : 0),
        severity_level: resPayload.severity_level || (isValidCrop ? 'Warning' : 'Low'),
        symptoms: resPayload.symptoms || (isValidCrop ? 'Analysis completed' : 'Please upload a clearer image of the affected crop/leaf.'),
        causes: resPayload.causes || 'Under investigation',
        prevention: resPayload.prevention || 'Consult local expert',
        treatment: resPayload.treatment || resPayload.recovery_steps || 'Consult agricultural expert',
        organic_treatment: resPayload.organic_treatment || 'Neem oil spray recommended',
        pesticide_recommendations: resPayload.pesticide_recommendations || '',
        irrigation_recommendations: resPayload.irrigation_recommendations || '',
        fertilizer_recommendations: resPayload.fertilizer_recommendations || '',
        recovery_steps: resPayload.recovery_steps || '',
        estimated_recovery_time: resPayload.estimated_recovery_time || '',
        weather_risk: resPayload.weather_risk || '',
        prevention_tips: resPayload.prevention_tips || '',
        is_valid_crop: isValidCrop,
        detected_object: resPayload.detected_object,
        rejection_reason: resPayload.rejection_reason || (!isValidCrop ? 'Please upload a clearer image of the affected crop/leaf.' : undefined),
        health_score: resPayload.health_score,
        yield_impact: resPayload.yield_impact,
        pro_tips: resPayload.pro_tips,
        scan_mode: resPayload.scan_mode || scanMode,
      };
    }
    throw new Error('Invalid response structure from backend AI service.');
  } catch (error: any) {
    console.warn('[diseaseDetection] Backend Gemini analysis call failed:', error?.message);
    const isTimeout = error?.message?.includes('timeout') || error?.code === 'ECONNABORTED' || error?.name === 'AbortError';

    return {
      disease_name: isTimeout ? 'Scanner Timeout' : 'Service Unavailable',
      confidence: 0,
      severity_level: 'Warning',
      symptoms: isTimeout 
        ? 'Crop analysis is taking longer than expected. Please try again.'
        : 'Unable to connect to the crop diagnosis service.',
      causes: 'Network connection delay or temporary server busyness.',
      prevention: 'Ensure a stable internet connection before re-scanning.',
      treatment: 'Please try again in a few moments.',
      organic_treatment: '',
      pesticide_recommendations: '',
      irrigation_recommendations: '',
      fertilizer_recommendations: '',
      recovery_steps: '1. Check your internet connection\n2. Hold camera steady\n3. Tap scan again',
      estimated_recovery_time: '',
      weather_risk: '',
      prevention_tips: '',
      is_valid_crop: false,
      quality_issue: isTimeout 
        ? 'Crop analysis is taking longer than expected. Please try again.'
        : 'Unable to process crop image. Please check your connection and try again.',
    };
  }
}

export function getDiseaseColor(diseaseName: string): string {
  if (diseaseName.toLowerCase().includes('healthy')) return '#10B981';
  if (diseaseName.toLowerCase().includes('early blight')) return '#EF4444';
  if (diseaseName.toLowerCase().includes('late blight')) return '#DC2626';
  if (diseaseName.toLowerCase().includes('powdery')) return '#F59E0B';
  if (diseaseName.toLowerCase().includes('bacterial')) return '#8B5CF6';
  return '#EF4444';
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'High Confidence';
  if (confidence >= 75) return 'Moderate Confidence';
  return 'Low Confidence';
}

export function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'healthy': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'critical': return '#EF4444';
    default: return '#F59E0B';
  }
}

export function getSeverityEmoji(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'healthy': return '🟢';
    case 'warning': return '🟡';
    case 'critical': return '🔴';
    default: return '🟡';
  }
}
