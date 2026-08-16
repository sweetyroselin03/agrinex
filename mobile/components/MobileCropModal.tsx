import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Crop, RotateCw, RefreshCw, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MobileCropModalProps {
  visible: boolean;
  imageUri: string;
  onConfirmCrop: (croppedUri: string) => void;
  onCancel: () => void;
}

export default function MobileCropModal({
  visible,
  imageUri,
  onConfirmCrop,
  onCancel,
}: MobileCropModalProps) {
  const [currentUri, setCurrentUri] = useState<string>(imageUri);
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  React.useEffect(() => {
    setCurrentUri(imageUri);
    setRotation(0);
  }, [imageUri, visible]);

  const handleRotate = async () => {
    try {
      setIsProcessing(true);
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);

      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentUri(manipResult.uri);
    } catch (e) {
      console.warn('Rotation failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentUri(imageUri);
    setRotation(0);
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      // Perform central foliage crop manipulation
      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [
          {
            crop: {
              originX: 0,
              originY: 0,
              width: 1000,
              height: 1000,
            },
          },
        ],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      ).catch(() => null);

      onConfirmCrop(manipResult?.uri || currentUri);
    } catch (e) {
      onConfirmCrop(currentUri);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <X color="white" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Crop color="#10B981" size={20} />
            <Text style={styles.headerTitle}>Crop Plant Area</Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <RefreshCw color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Image Preview & Crop Frame */}
        <View style={styles.viewport}>
          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          )}

          <Image
            source={{ uri: currentUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          {/* Interactive Crop Frame Overlay */}
          <View style={styles.cropFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Text style={styles.cropFrameBadge}>FOLIAGE CROP ZONE</Text>
          </View>
        </View>

        {/* Toolbar Controls */}
        <View style={styles.toolbar}>
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleRotate} disabled={isProcessing}>
              <RotateCw color="white" size={22} />
              <Text style={styles.controlText}>Rotate ({rotation}°)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={handleReset} disabled={isProcessing}>
              <RefreshCw color="white" size={22} />
              <Text style={styles.controlText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelActionBtn} onPress={onCancel}>
              <Text style={styles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmActionBtn} onPress={handleConfirm} disabled={isProcessing}>
              <Check color="#064E3B" size={20} />
              <Text style={styles.confirmActionText}>Confirm Crop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 20,
    alignItems: 'center',
    justify: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.55,
  },
  cropFrame: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 24,
    alignItems: 'center',
    justify: 'center',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  topLeft: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  cropFrameBadge: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 1,
  },
  toolbar: {
    padding: 20,
    backgroundColor: '#0F172A',
    gap: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlRow: {
    flexDirection: 'row',
    justify: 'space-around',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  controlText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justify: 'center',
  },
  cancelActionText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
    gap: 8,
  },
  confirmActionText: {
    color: '#064E3B',
    fontSize: 15,
    fontWeight: '800',
  },
});
