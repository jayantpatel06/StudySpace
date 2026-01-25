import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAdmin } from '../../context/AdminContext';
import { createLibrary, updateLibrary } from '../../services/adminApi';
import { lightImpact, successNotification, errorNotification } from '../../utils/haptics';

const AddEditLibraryScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { adminUser } = useAdmin();
    
    const isEditing = route.params?.library != null;
    const existingLibrary = route.params?.library;

    const [formData, setFormData] = useState({
        name: existingLibrary?.name || '',
        address: existingLibrary?.address || '',
        latitude: existingLibrary?.latitude?.toString() || '',
        longitude: existingLibrary?.longitude?.toString() || '',
        radiusMeters: existingLibrary?.radius_meters?.toString() || '100',
        openingTime: existingLibrary?.opening_time || '08:00',
        closingTime: existingLibrary?.closing_time || '22:00',
        totalSeats: existingLibrary?.total_seats?.toString() || '0',
        description: existingLibrary?.description || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const latitudeRef = useRef();
    const longitudeRef = useRef();

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Library name is required';
        }

        if (!formData.latitude.trim()) {
            newErrors.latitude = 'Latitude is required';
        } else {
            const lat = parseFloat(formData.latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                newErrors.latitude = 'Invalid latitude (-90 to 90)';
            }
        }

        if (!formData.longitude.trim()) {
            newErrors.longitude = 'Longitude is required';
        } else {
            const lng = parseFloat(formData.longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                newErrors.longitude = 'Invalid longitude (-180 to 180)';
            }
        }

        const radius = parseInt(formData.radiusMeters);
        if (isNaN(radius) || radius < 10 || radius > 5000) {
            newErrors.radiusMeters = 'Radius must be between 10-5000 meters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        lightImpact();
        
        if (!validateForm()) {
            errorNotification();
            return;
        }

        setIsLoading(true);

        try {
            const libraryData = {
                name: formData.name.trim(),
                address: formData.address.trim(),
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radiusMeters: parseInt(formData.radiusMeters),
                openingTime: formData.openingTime,
                closingTime: formData.closingTime,
                totalSeats: parseInt(formData.totalSeats) || 0,
                description: formData.description.trim(),
                createdBy: adminUser?.id,
            };

            let result;
            if (isEditing) {
                result = await updateLibrary(existingLibrary.id, {
                    name: libraryData.name,
                    address: libraryData.address,
                    latitude: libraryData.latitude,
                    longitude: libraryData.longitude,
                    radius_meters: libraryData.radiusMeters,
                    opening_time: libraryData.openingTime,
                    closing_time: libraryData.closingTime,
                    total_seats: libraryData.totalSeats,
                    description: libraryData.description,
                });
            } else {
                result = await createLibrary(libraryData);
            }

            if (result.error) {
                throw new Error(result.error.message);
            }

            successNotification();
            navigation.goBack();
        } catch (error) {
            console.error('Error saving library:', error);
            errorNotification();
            Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} library. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCurrentLocation = async () => {
        lightImpact();
        Alert.alert(
            'Get Current Location',
            'This will use your device\'s current GPS coordinates. Make sure you are at the library location.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Get Location',
                    onPress: async () => {
                        try {
                            const { getCurrentLocation } = await import('../services/geolocation');
                            const location = await getCurrentLocation();
                            if (location) {
                                updateField('latitude', location.latitude.toString());
                                updateField('longitude', location.longitude.toString());
                                successNotification();
                            } else {
                                Alert.alert('Error', 'Could not get current location');
                            }
                        } catch (error) {
                            console.error('Location error:', error);
                            Alert.alert('Error', 'Failed to get location');
                        }
                    },
                },
            ]
        );
    };

    const renderInput = (
        label,
        field,
        placeholder,
        options = {}
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
            <View style={[
                styles.inputContainer,
                { backgroundColor: colors.surface, borderColor: errors[field] ? '#ef4444' : colors.border }
            ]}>
                {options.icon && (
                    <MaterialIcons name={options.icon} size={20} color={colors.textMuted} />
                )}
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    value={formData[field]}
                    onChangeText={(value) => updateField(field, value)}
                    keyboardType={options.keyboardType || 'default'}
                    multiline={options.multiline}
                    numberOfLines={options.numberOfLines}
                    ref={options.ref}
                    onSubmitEditing={options.onSubmitEditing}
                    returnKeyType={options.returnKeyType}
                />
            </View>
            {errors[field] && (
                <Text style={styles.errorText}>{errors[field]}</Text>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isEditing ? 'Edit Library' : 'Add Library'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
                    
                    {renderInput('Library Name *', 'name', 'e.g., Central Library', {
                        icon: 'local-library',
                    })}

                    {renderInput('Address', 'address', 'Full address of the library', {
                        icon: 'location-on',
                    })}

                    {renderInput('Description', 'description', 'Brief description of the library', {
                        icon: 'description',
                        multiline: true,
                        numberOfLines: 3,
                    })}
                </View>

                {/* Location Coordinates */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Coordinates</Text>
                        <TouchableOpacity
                            style={[styles.locationButton, { backgroundColor: colors.primaryLight }]}
                            onPress={handleGetCurrentLocation}
                        >
                            <MaterialIcons name="my-location" size={16} color={colors.primary} />
                            <Text style={[styles.locationButtonText, { color: colors.primary }]}>
                                Use Current
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            {renderInput('Latitude *', 'latitude', 'e.g., 28.6139', {
                                keyboardType: 'numeric',
                                ref: latitudeRef,
                            })}
                        </View>
                        <View style={styles.halfInput}>
                            {renderInput('Longitude *', 'longitude', 'e.g., 77.2090', {
                                keyboardType: 'numeric',
                                ref: longitudeRef,
                            })}
                        </View>
                    </View>

                    {renderInput('Geofence Radius (meters)', 'radiusMeters', '100', {
                        icon: 'radar',
                        keyboardType: 'numeric',
                    })}
                    <Text style={[styles.helpText, { color: colors.textMuted }]}>
                        Users must be within this radius to book seats at this library.
                    </Text>
                </View>

                {/* Operating Hours */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Operating Hours</Text>
                    
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            {renderInput('Opening Time', 'openingTime', '08:00', {
                                icon: 'schedule',
                            })}
                        </View>
                        <View style={styles.halfInput}>
                            {renderInput('Closing Time', 'closingTime', '22:00', {
                                icon: 'schedule',
                            })}
                        </View>
                    </View>
                </View>

                {/* Capacity */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Capacity</Text>
                    
                    {renderInput('Total Seats', 'totalSeats', '0', {
                        icon: 'event-seat',
                        keyboardType: 'numeric',
                    })}
                    <Text style={[styles.helpText, { color: colors.textMuted }]}>
                        You can add and manage individual seats after creating the library.
                    </Text>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name={isEditing ? 'save' : 'add'} size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                {isEditing ? 'Save Changes' : 'Add Library'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        marginBottom: 16,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    locationButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        minHeight: 52,
        gap: 12,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        paddingVertical: 14,
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    helpText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});

export default AddEditLibraryScreen;
