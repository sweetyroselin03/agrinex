import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { X, Zap, Image as ImageIcon, Scan, RefreshCcw, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import BottomNav from '../components/BottomNav';
import { MotiView, MotiText } from 'moti';
import client from '../api/client';

const { width, height } = Dimensions.get('window');

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access</Text>
        <Text style={styles.permissionText}>We need your permission to scan crops for diseases.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async () => {
    setIsScanning(true);
    setResult(null);
    try {
      const response = await client.post('/ai/detect-disease', {
        image_url: "https://agrinex.ai/sample-crop.jpg" // Placeholder for now
      });
      setResult(response.data);
    } catch (error) {
      console.error('Scan failed', error);
      Alert.alert('Scan Failed', 'Unable to analyze the image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <X color="white" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Zap color="white" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.scanContainer}>
            <MotiView
              animate={{
                opacity: isScanning ? 1 : 0.6,
                scale: isScanning ? 1.05 : 1,
              }}
              style={styles.scanFrame}
            >
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {isScanning && (
                <MotiView
                  from={{ translateY: -100 }}
                  animate={{ translateY: 260 }}
                  transition={{
                    loop: true,
                    duration: 1500,
                    type: 'timing',
                  }}
                  style={styles.scanLine}
                />
              )}
            </MotiView>

            <MotiText
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ loop: true, duration: 2000 }}
              style={styles.scanHint}
            >
              {isScanning ? 'AgriNex AI Analyzing...' : 'Align crop leaf in frame'}
            </MotiText>
          </View>

          {result ? (
            <MotiView
              from={{ translateY: 500 }}
              animate={{ translateY: 0 }}
              style={styles.resultCard}
            >
              <BlurView intensity={80} tint="dark" style={styles.resultBlur}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.resultHeader}>
                    <View style={styles.diseaseBadge}>
                      <AlertCircle color={result.disease_name === 'Healthy' ? '#10B981' : '#EF4444'} size={20} />
                      <Text style={[styles.diseaseName, result.disease_name === 'Healthy' && { color: '#10B981' }]}>
                        {result.disease_name}
                      </Text>
                    </View>
                    <Text style={styles.confidence}>{Math.round(result.confidence * 100)}% Confidence</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Symptoms</Text>
                    <Text style={styles.infoText}>{result.symptoms || 'N/A'}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Treatment (Organic)</Text>
                    <Text style={styles.infoText}>{result.organic_treatment || 'N/A'}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Pesticide Recommendations</Text>
                    <Text style={styles.infoText}>{result.pesticide_recommendations || 'N/A'}</Text>
                  </View>

                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Recovery Plan</Text>
                    <Text style={styles.infoText}>{result.recovery_steps || 'N/A'}</Text>
                    <Text style={styles.estimatedTime}>Est. Time: {result.estimated_recovery_time || 'N/A'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => setResult(null)}
                  >
                    <RefreshCcw color="white" size={20} />
                    <Text style={styles.resetText}>New Scan</Text>
                  </TouchableOpacity>
                </ScrollView>
              </BlurView>
            </MotiView>
          ) : (
            <BlurView intensity={20} tint="dark" style={styles.bottomBar}>
              <TouchableOpacity style={styles.sideButton}>
                <ImageIcon color="white" size={28} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleScan}
                disabled={isScanning}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.captureInner}
                >
                  {isScanning ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Scan color="white" size={32} />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideButton}>
                <RefreshCcw color="white" size={28} />
              </TouchableOpacity>
            </BlurView>
          )}
        </View>
      </CameraView>

      {!isScanning && !result && <BottomNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#071226',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  permissionText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: width * 0.75,
    height: width * 0.75,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10B981',
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  scanHint: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 32,
    letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomBar: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
  },
  captureInner: {
    flex: 1,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultBlur: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  diseaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  diseaseName: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '800',
  },
  confidence: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
  },
  estimatedTime: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    fontStyle: 'italic',
  },
  treatmentTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  treatmentText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  resetBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  resetText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
