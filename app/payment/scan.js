import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Button, Title, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { parseQrCode } from '../../utils/upiUtils';

export default function ScanScreen() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handlePermissionRequest = async () => {
    const permissionResult = await requestPermission();
    
    if (!permissionResult.granted) {
      Alert.alert(
        "Camera Permission Required",
        "We need camera access to scan QR codes. Would you like to open settings and grant permission?",
        [
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings()
          },
          {
            text: "Cancel",
            onPress: () => router.back(),
            style: "cancel"
          }
        ]
      );
    }
  };

  // Request permission on first render
  React.useEffect(() => {
    if (permission && !permission.granted) {
      handlePermissionRequest();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    
    // Parse the QR code
    const parsedData = parseQrCode(data);
    
    if (parsedData) {
      // Navigate to manual payment screen with pre-filled data
      router.push({
        pathname: '/payment/manual',
        params: {
          upiId: parsedData.upiId,
          payee: parsedData.payee,
          amount: parsedData.amount,
          notes: parsedData.notes,
        }
      });
    } else {
      // Handle invalid QR code
      alert('Invalid UPI QR code. Please try again.');
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      {!permission ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Title style={styles.loadingText}>Checking camera permissions...</Title>
        </View>
      ) : !permission.granted ? (
        <View style={styles.centered}>
          <Title style={styles.permissionText}>Camera permission is required</Title>
          <Button 
            mode="contained" 
            onPress={handlePermissionRequest}
            style={styles.button}
            icon="camera"
          >
            Grant Permission
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            style={[styles.button, styles.backButton]}
          >
            Go Back
          </Button>
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.scanner}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Title style={styles.scanText}>Scan UPI QR Code</Title>
            </View>
          </CameraView>
          
          <Button 
            mode="contained" 
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          
          {scanned && (
            <Button 
              mode="contained" 
              onPress={() => setScanned(false)}
              style={styles.rescanButton}
            >
              Tap to Scan Again
            </Button>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#fff',
    marginTop: 16,
  },
  button: {
    margin: 8,
    width: '80%',
  },
  backButton: {
    marginTop: 8,
  },
  loadingText: {
    marginTop: 16,
  },
  permissionText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
  }
});
