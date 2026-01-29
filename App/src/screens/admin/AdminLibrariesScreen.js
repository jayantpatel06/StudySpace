import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Clipboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import {
  getLibraries,
  deleteLibrary,
  getClientByLibraryId,
  resetClientPassword,
  createLibraryClient,
} from "../../services/adminApi";
import { useAdmin } from "../../context/AdminContext";
import {
  lightImpact,
  errorNotification,
  successNotification,
} from "../../utils/haptics";

const LibraryCard = ({
  library,
  onEdit,
  onDelete,
  onViewSeats,
  onViewCredentials,
  colors,
}) => (
  <View
    style={[
      styles.libraryCard,
      { backgroundColor: colors.surface, borderColor: colors.border },
    ]}
  >
    <View style={styles.libraryHeader}>
      <View
        style={[styles.libraryIcon, { backgroundColor: colors.primaryLight }]}
      >
        <MaterialIcons name="local-library" size={24} color={colors.primary} />
      </View>
      <View style={styles.libraryInfo}>
        <Text style={[styles.libraryName, { color: colors.text }]}>
          {library.name}
        </Text>
        <Text
          style={[styles.libraryAddress, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {library.address || "No address provided"}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: library.is_active ? "#dcfce7" : "#fee2e2" },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: library.is_active ? "#16a34a" : "#dc2626" },
          ]}
        >
          {library.is_active ? "Active" : "Inactive"}
        </Text>
      </View>
    </View>

    <View style={styles.libraryDetails}>
      <View style={styles.detailItem}>
        <MaterialIcons name="my-location" size={16} color={colors.textMuted} />
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {library.latitude?.toFixed(4)}, {library.longitude?.toFixed(4)}
        </Text>
      </View>
      <View style={styles.detailItem}>
        <MaterialIcons name="radar" size={16} color={colors.textMuted} />
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {library.radius_meters}m radius
        </Text>
      </View>
      <View style={styles.detailItem}>
        <MaterialIcons name="event-seat" size={16} color={colors.textMuted} />
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {library.total_seats || 0} seats
        </Text>
      </View>
    </View>

    <View style={styles.libraryActions}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
        onPress={() => onEdit(library)}
      >
        <MaterialIcons name="edit" size={18} color={colors.primary} />
        <Text style={[styles.actionButtonText, { color: colors.primary }]}>
          Edit
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#fef3c7" }]}
        onPress={() => onViewCredentials(library)}
      >
        <MaterialIcons name="vpn-key" size={18} color="#d97706" />
        <Text style={[styles.actionButtonText, { color: "#d97706" }]}>
          Login
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#dbeafe" }]}
        onPress={() => onViewSeats(library)}
      >
        <MaterialIcons name="event-seat" size={18} color="#2563eb" />
        <Text style={[styles.actionButtonText, { color: "#2563eb" }]}>
          Seats
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#fee2e2" }]}
        onPress={() => onDelete(library)}
      >
        <MaterialIcons name="delete" size={18} color="#dc2626" />
      </TouchableOpacity>
    </View>
  </View>
);

const AdminLibrariesScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const [libraries, setLibraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Credentials modal state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [clientCredentials, setClientCredentials] = useState(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState(null);

  const { adminUser } = useAdmin();

  const fetchLibraries = useCallback(async () => {
    try {
      const { data, error } = await getLibraries(false); // Include inactive
      if (!error) {
        setLibraries(data || []);
      }
    } catch (error) {
      console.error("Error fetching libraries:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchLibraries();
    });
    return unsubscribe;
  }, [navigation, fetchLibraries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLibraries();
  }, [fetchLibraries]);

  const handleAddLibrary = () => {
    lightImpact();
    navigation.navigate("AdminAddLibrary");
  };

  const handleEditLibrary = (library) => {
    lightImpact();
    navigation.navigate("AdminEditLibrary", { library });
  };

  const handleViewSeats = (library) => {
    lightImpact();
    navigation.navigate("AdminManageSeats", { library });
  };

  const handleDeleteLibrary = (library) => {
    lightImpact();
    Alert.alert(
      "Delete Library",
      `Are you sure you want to delete "${library.name}"? This action will deactivate the library.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLibrary(library.id);
              fetchLibraries();
            } catch (error) {
              console.error("Error deleting library:", error);
              errorNotification();
              Alert.alert("Error", "Failed to delete library");
            }
          },
        },
      ],
    );
  };

  const handleViewCredentials = async (library) => {
    lightImpact();
    setSelectedLibrary(library);
    setCredentialsLoading(true);
    setNewPassword(null);
    setShowCredentialsModal(true);

    try {
      const { data, error } = await getClientByLibraryId(library.id);
      if (error) {
        // No client exists yet, offer to create one
        setClientCredentials(null);
      } else {
        setClientCredentials(data);
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setClientCredentials(null);
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!clientCredentials) return;

    lightImpact();
    setCredentialsLoading(true);

    try {
      const result = await resetClientPassword(clientCredentials.id);
      if (result.error) {
        throw result.error;
      }
      // The newPassword is returned separately from data
      if (result.newPassword) {
        setNewPassword(result.newPassword);
        successNotification();
        Alert.alert(
          "Success",
          "Password has been reset. Please share the new password with the library owner.",
        );
      } else {
        throw new Error("Failed to generate new password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      errorNotification();
      Alert.alert("Error", "Failed to reset password");
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleCreateCredentials = async () => {
    if (!selectedLibrary || !adminUser) {
      Alert.alert("Error", "Admin session not found. Please log in again.");
      return;
    }

    lightImpact();
    setCredentialsLoading(true);

    try {
      const { data, error, credentials } = await createLibraryClient(
        selectedLibrary.id,
        selectedLibrary.name,
        adminUser.id,
      );
      if (error) {
        throw error;
      }
      setClientCredentials(data);
      setNewPassword(credentials?.password);
      successNotification();
      Alert.alert("Success", "Client credentials created successfully.");
    } catch (error) {
      console.error("Error creating credentials:", error);
      errorNotification();
      Alert.alert("Error", error.message || "Failed to create credentials");
    } finally {
      setCredentialsLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    successNotification();
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Libraries
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddLibrary}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {libraries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="local-library"
              size={64}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Libraries Yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Add your first library to get started
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={handleAddLibrary}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          libraries.map((library) => (
            <LibraryCard
              key={library.id}
              library={library}
              onEdit={handleEditLibrary}
              onDelete={handleDeleteLibrary}
              onViewSeats={handleViewSeats}
              onViewCredentials={handleViewCredentials}
              colors={colors}
            />
          ))
        )}
      </ScrollView>

      {/* Credentials Modal */}
      <Modal
        visible={showCredentialsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCredentialsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Client Dashboard Login
              </Text>
              <TouchableOpacity
                onPress={() => setShowCredentialsModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.libraryNameModal, { color: colors.primary }]}>
              {selectedLibrary?.name}
            </Text>

            {credentialsLoading ? (
              <View style={styles.loadingCredentials}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[styles.loadingText, { color: colors.textSecondary }]}
                >
                  Loading credentials...
                </Text>
              </View>
            ) : clientCredentials ? (
              <View style={styles.credentialsContainer}>
                <View style={styles.credentialRow}>
                  <Text
                    style={[
                      styles.credentialLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Username
                  </Text>
                  <View style={styles.credentialValueRow}>
                    <Text
                      style={[styles.credentialValue, { color: colors.text }]}
                    >
                      {clientCredentials.username}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        copyToClipboard(clientCredentials.username, "Username")
                      }
                      style={styles.copyBtn}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {newPassword ? (
                  <View style={styles.credentialRow}>
                    <Text
                      style={[
                        styles.credentialLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      New Password
                    </Text>
                    <View style={styles.credentialValueRow}>
                      <Text
                        style={[styles.credentialValue, { color: colors.text }]}
                      >
                        {newPassword}
                      </Text>
                      <TouchableOpacity
                        onPress={() => copyToClipboard(newPassword, "Password")}
                        style={styles.copyBtn}
                      >
                        <MaterialIcons
                          name="content-copy"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.credentialRow}>
                    <Text
                      style={[
                        styles.credentialLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Password
                    </Text>
                    <Text
                      style={[styles.passwordNote, { color: colors.textMuted }]}
                    >
                      For security, the password is hidden. Use reset to
                      generate a new one.
                    </Text>
                  </View>
                )}

                <View style={styles.statusRow}>
                  <Text
                    style={[
                      styles.credentialLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Status
                  </Text>
                  <View
                    style={[
                      styles.statusBadgeModal,
                      {
                        backgroundColor: clientCredentials.is_active
                          ? "#dcfce7"
                          : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTextModal,
                        {
                          color: clientCredentials.is_active
                            ? "#16a34a"
                            : "#dc2626",
                        },
                      ]}
                    >
                      {clientCredentials.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: "#fef3c7" }]}
                  onPress={handleResetPassword}
                  disabled={credentialsLoading}
                >
                  <MaterialIcons name="refresh" size={20} color="#d97706" />
                  <Text style={[styles.resetButtonText, { color: "#d97706" }]}>
                    Reset Password
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noCredentials}>
                <MaterialIcons name="warning" size={48} color="#d97706" />
                <Text
                  style={[styles.noCredentialsText, { color: colors.text }]}
                >
                  No client credentials found
                </Text>
                <Text
                  style={[
                    styles.noCredentialsSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Create credentials to allow the library owner to access their
                  dashboard.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleCreateCredentials}
                  disabled={credentialsLoading}
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>
                    Create Credentials
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  libraryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  libraryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  libraryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  libraryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  libraryName: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
    marginBottom: 2,
  },
  libraryAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  libraryDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  libraryActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#fff",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
  },
  closeButton: {
    padding: 4,
  },
  libraryNameModal: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    marginBottom: 24,
  },
  loadingCredentials: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 12,
  },
  credentialsContainer: {
    gap: 20,
  },
  credentialRow: {
    gap: 8,
  },
  credentialLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  credentialValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  credentialValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    flex: 1,
    color: "#1f2937", // Dark text color for visibility
  },
  copyBtn: {
    padding: 4,
  },
  passwordNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    fontStyle: "italic",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadgeModal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextModal: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
  },
  resetButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  noCredentials: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noCredentialsText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  noCredentialsSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});

export default AdminLibrariesScreen;
