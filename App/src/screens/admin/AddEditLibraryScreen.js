import React, { useState, useCallback, useRef } from "react";
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
  Modal,
  Clipboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAdmin } from "../../context/AdminContext";
import {
  createLibrary,
  updateLibrary,
  createLibraryClient,
} from "../../services/adminApi";
import {
  lightImpact,
  successNotification,
  errorNotification,
} from "../../utils/haptics";

const AddEditLibraryScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { adminUser } = useAdmin();

  const isEditing = route.params?.library != null;
  const existingLibrary = route.params?.library;

  const [formData, setFormData] = useState({
    name: existingLibrary?.name || "",
    address: existingLibrary?.address || "",
    latitude: existingLibrary?.latitude?.toString() || "",
    longitude: existingLibrary?.longitude?.toString() || "",
    radiusMeters: existingLibrary?.radius_meters?.toString() || "100",
    openingTime: existingLibrary?.opening_time || "08:00",
    closingTime: existingLibrary?.closing_time || "22:00",
    description: existingLibrary?.description || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [clientCredentials, setClientCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  const latitudeRef = useRef();
  const longitudeRef = useRef();

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Library name is required";
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = "Latitude is required";
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = "Invalid latitude (-90 to 90)";
      }
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = "Longitude is required";
    } else {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = "Invalid longitude (-180 to 180)";
      }
    }

    const radius = parseInt(formData.radiusMeters);
    if (isNaN(radius) || radius < 10 || radius > 5000) {
      newErrors.radiusMeters = "Radius must be between 10-5000 meters";
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
        totalSeats: 0, // Seats are managed by client dashboard
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
          description: libraryData.description,
        });
      } else {
        result = await createLibrary(libraryData);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // If creating a new library, also create client credentials
      if (!isEditing && result.data) {
        const credentialsResult = await createLibraryClient(
          result.data.id,
          result.data.name,
          adminUser?.id,
        );

        if (credentialsResult.error) {
          console.error(
            "Failed to create client credentials:",
            credentialsResult.error,
          );
          Alert.alert(
            "Warning",
            "Library created but failed to generate client credentials. You can create them later.",
          );
        } else if (credentialsResult.credentials) {
          setClientCredentials(credentialsResult.credentials);
          setShowCredentialsModal(true);
        }
      }

      successNotification();

      // If editing, go back immediately. If creating, wait for credentials modal to close
      if (isEditing) {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error saving library:", error);
      errorNotification();
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "create"} library. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert("Copied", `${label} copied to clipboard`);
    lightImpact();
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    navigation.goBack();
  };

  const handleGetCurrentLocation = async () => {
    lightImpact();
    Alert.alert(
      "Get Current Location",
      "This will use your device's current GPS coordinates. Make sure you are at the library location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Get Location",
          onPress: async () => {
            try {
              const { getCurrentLocation } =
                await import("../services/geolocation");
              const location = await getCurrentLocation();
              if (location) {
                updateField("latitude", location.latitude.toString());
                updateField("longitude", location.longitude.toString());
                successNotification();
              } else {
                Alert.alert("Error", "Could not get current location");
              }
            } catch (error) {
              console.error("Location error:", error);
              Alert.alert("Error", "Failed to get location");
            }
          },
        },
      ],
    );
  };

  const renderInput = (label, field, placeholder, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: errors[field] ? "#ef4444" : colors.border,
          },
        ]}
      >
        {options.icon && (
          <MaterialIcons
            name={options.icon}
            size={20}
            color={colors.textMuted}
          />
        )}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          keyboardType={options.keyboardType || "default"}
          multiline={options.multiline}
          numberOfLines={options.numberOfLines}
          ref={options.ref}
          onSubmitEditing={options.onSubmitEditing}
          returnKeyType={options.returnKeyType}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          {isEditing ? "Edit Library" : "Add Library"}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Basic Information
          </Text>

          {renderInput("Library Name *", "name", "e.g., Central Library", {
            icon: "local-library",
          })}

          {renderInput("Address", "address", "Full address of the library", {
            icon: "location-on",
          })}

          {renderInput(
            "Description",
            "description",
            "Brief description of the library",
            {
              icon: "description",
              multiline: true,
              numberOfLines: 3,
            },
          )}
        </View>

        {/* Location Coordinates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location Coordinates
            </Text>
            <TouchableOpacity
              style={[
                styles.locationButton,
                { backgroundColor: colors.primaryLight },
              ]}
              onPress={handleGetCurrentLocation}
            >
              <MaterialIcons
                name="my-location"
                size={16}
                color={colors.primary}
              />
              <Text
                style={[styles.locationButtonText, { color: colors.primary }]}
              >
                Use Current
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              {renderInput("Latitude *", "latitude", "e.g., 28.6139", {
                keyboardType: "numeric",
                ref: latitudeRef,
              })}
            </View>
            <View style={styles.halfInput}>
              {renderInput("Longitude *", "longitude", "e.g., 77.2090", {
                keyboardType: "numeric",
                ref: longitudeRef,
              })}
            </View>
          </View>

          {renderInput("Geofence Radius (meters)", "radiusMeters", "100", {
            icon: "radar",
            keyboardType: "numeric",
          })}
          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            Users must be within this radius to book seats at this library.
          </Text>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Operating Hours
          </Text>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              {renderInput("Opening Time", "openingTime", "08:00", {
                icon: "schedule",
              })}
            </View>
            <View style={styles.halfInput}>
              {renderInput("Closing Time", "closingTime", "22:00", {
                icon: "schedule",
              })}
            </View>
          </View>
        </View>

        {/* Info about seat management */}
        {!isEditing && (
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={[styles.infoBannerText, { color: colors.primary }]}>
              Floors, rooms, and seats can be configured by the library owner
              through their dashboard after the library is created.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons
                name={isEditing ? "save" : "add"}
                size={20}
                color="#fff"
              />
              <Text style={styles.saveButtonText}>
                {isEditing ? "Save Changes" : "Add Library"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Client Credentials Modal */}
      <Modal
        visible={showCredentialsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCredentialsModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <MaterialIcons name="vpn-key" size={32} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Client Credentials Created
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Save these credentials securely. The password will not be shown
                again.
              </Text>
            </View>

            {clientCredentials && (
              <View style={styles.credentialsContainer}>
                <View
                  style={[
                    styles.credentialItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.credentialLabel,
                      { color: colors.textMuted },
                    ]}
                  >
                    Library Name
                  </Text>
                  <Text
                    style={[styles.credentialValue, { color: colors.text }]}
                  >
                    {clientCredentials.libraryName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.credentialItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.credentialHeader}>
                    <Text
                      style={[
                        styles.credentialLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Username
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(clientCredentials.username, "Username")
                      }
                      style={[
                        styles.copyButton,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.copyButtonText,
                          { color: colors.primary },
                        ]}
                      >
                        Copy
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.credentialValue, { color: colors.text }]}
                  >
                    {clientCredentials.username}
                  </Text>
                </View>

                <View
                  style={[
                    styles.credentialItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.credentialHeader}>
                    <Text
                      style={[
                        styles.credentialLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      Password
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(clientCredentials.password, "Password")
                      }
                      style={[
                        styles.copyButton,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.copyButtonText,
                          { color: colors.primary },
                        ]}
                      >
                        Copy
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[
                      styles.credentialValuePassword,
                      { color: colors.text },
                    ]}
                  >
                    {clientCredentials.password}
                  </Text>
                </View>

                <View
                  style={[styles.warningBox, { backgroundColor: "#fef3c7" }]}
                >
                  <MaterialIcons name="warning" size={20} color="#f59e0b" />
                  <Text style={styles.warningText}>
                    Please save these credentials now. The password cannot be
                    retrieved later, only reset.
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleCloseCredentialsModal}
            >
              <Text style={styles.modalButtonText}>
                I've Saved the Credentials
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Montserrat_700Bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  locationButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  helpText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  credentialsContainer: {
    marginBottom: 24,
  },
  credentialItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  credentialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  credentialLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  credentialValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  credentialValuePassword: {
    fontFamily: "Courier",
    fontSize: 16,
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  warningBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  modalButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AddEditLibraryScreen;
