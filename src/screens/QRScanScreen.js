import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBooking } from '../context/BookingContext';
import { successNotification, lightImpact, errorNotification } from '../utils/haptics';

const QRScanScreen = () => {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { createBooking } = useBooking();

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }) => {
        if (isProcessing) return;

        setScanned(true);
        setIsProcessing(true);

        try {
            // Haptic feedback on successful scan
            successNotification();

            // Parse QR code data
            // Expected format: STUDY-LOCATION-FLOOR-SEATID
            const parts = data.split('-');
            if (parts.length < 4 || parts[0] !== 'STUDY') {
                throw new Error('Invalid QR code format');
            }

            const seatId = parts.slice(3).join('-');
            const location = parts[1] || 'Library';

            // Create booking
            const result = await createBooking(seatId, 60, location);

            if (result) {
                navigation.goBack();
            } else {
                throw new Error('Failed to create booking');
            }
        } catch (error) {
            errorNotification();
            alert(error.message || 'Failed to process QR code');
            setScanned(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        lightImpact();
        navigation.goBack();
    };

    if (hasPermission === null) {
        return (
            <View style={styles.permissionView}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.permissionView}>
                <MaterialIcons name="camera-alt" size={64} color="#64748b" />
                <Text style={[styles.permissionText, { marginTop: 16, marginBottom: 8 }]}>
                    Camera Access Required
                </Text>
                <Text style={styles.permissionSubtext}>
                    Please enable camera access in your device settings to scan QR codes
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "pdf417"],
                }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.overlayTop}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.titleText}>Scan QR Code</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.overlayMiddle}>
                    <View style={styles.frameContainer}>
                        <View style={styles.frame} />
                        <View style={styles.scanLine} />
                    </View>
                    <Text style={styles.hintText}>
                        {isProcessing ? 'Processing...' : 'Align QR code within frame'}
                    </Text>
                </View>

                <View style={styles.overlayBottom}>
                    {scanned && !isProcessing && (
                        <TouchableOpacity
                            style={styles.rescanButton}
                            onPress={() => setScanned(false)}
                        >
                            <MaterialIcons name="refresh" size={20} color="white" />
                            <Text style={styles.rescanText}>Scan Again</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionView: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    permissionSubtext: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 24,
        paddingTop: 48,
    },
    overlayTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
    },
    titleText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    overlayMiddle: {
        alignItems: 'center',
        gap: 16,
    },
    frameContainer: {
        position: 'relative',
        width: 256,
        height: 256,
        marginBottom: 16,
    },
    frame: {
        width: 256,
        height: 256,
        borderWidth: 3,
        borderColor: '#3b82f6',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    scanLine: {
        position: 'absolute',
        top: '50%',
        left: 8,
        right: 8,
        height: 2,
        backgroundColor: '#3b82f6',
        borderRadius: 1,
    },
    hintText: {
        color: 'white',
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    overlayBottom: {
        alignItems: 'center',
        minHeight: 50,
    },
    rescanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    rescanText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default QRScanScreen;
