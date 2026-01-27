import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAdmin } from '../../context/AdminContext';
import { lightImpact, successNotification, errorNotification } from '../../utils/haptics';

const AdminSettingsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { adminUser, changeAdminPassword, adminLogout, needsPasswordChange } = useAdmin();

    const [showPasswordSection, setShowPasswordSection] = useState(needsPasswordChange);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const handleChangePassword = useCallback(async () => {
        lightImpact();

        if (!currentPassword) {
            Alert.alert('Error', 'Please enter your current password');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const result = await changeAdminPassword(currentPassword, newPassword);
            if (result.success) {
                successNotification();
                Alert.alert('Success', 'Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordSection(false);
            } else {
                errorNotification();
                Alert.alert('Error', result.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Change password error:', error);
            errorNotification();
            Alert.alert('Error', 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    }, [currentPassword, newPassword, confirmPassword, changeAdminPassword]);

    const handleLogout = useCallback(() => {
        lightImpact();
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: adminLogout,
                },
            ]
        );
    }, [adminLogout]);

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Admin Info */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
                            <MaterialIcons name="admin-panel-settings" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.adminInfo}>
                            <Text style={[styles.adminName, { color: colors.text }]}>
                                {adminUser?.name || 'Admin'}
                            </Text>
                            <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>
                                {adminUser?.email}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Password Change Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setShowPasswordSection(!showPasswordSection)}
                    >
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                                <MaterialIcons name="lock" size={20} color="#d97706" />
                            </View>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Change Password
                                </Text>
                                {needsPasswordChange && (
                                    <Text style={styles.warningLabel}>Recommended</Text>
                                )}
                            </View>
                        </View>
                        <MaterialIcons
                            name={showPasswordSection ? 'expand-less' : 'expand-more'}
                            size={24}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>

                    {showPasswordSection && (
                        <View style={[styles.passwordForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
                                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Enter current password"
                                        placeholderTextColor={colors.textMuted}
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        secureTextEntry={!showPasswords}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Enter new password"
                                        placeholderTextColor={colors.textMuted}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPasswords}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        placeholder="Confirm new password"
                                        placeholderTextColor={colors.textMuted}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPasswords}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.togglePassword}
                                onPress={() => setShowPasswords(!showPasswords)}
                            >
                                <MaterialIcons
                                    name={showPasswords ? 'visibility-off' : 'visibility'}
                                    size={18}
                                    color={colors.textMuted}
                                />
                                <Text style={[styles.togglePasswordText, { color: colors.textMuted }]}>
                                    {showPasswords ? 'Hide passwords' : 'Show passwords'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.changePasswordButton, { backgroundColor: colors.primary }]}
                                onPress={handleChangePassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialIcons name="save" size={18} color="#fff" />
                                        <Text style={styles.changePasswordButtonText}>Update Password</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: '#fecaca' }]}
                    onPress={handleLogout}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                        <MaterialIcons name="logout" size={20} color="#dc2626" />
                    </View>
                    <Text style={styles.logoutText}>Logout</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#dc2626" />
                </TouchableOpacity>
            </ScrollView>
        </View>
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
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminInfo: {
        marginLeft: 16,
    },
    adminName: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 18,
        marginBottom: 4,
    },
    adminEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
    },
    warningLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        color: '#d97706',
        marginTop: 2,
    },
    passwordForm: {
        marginTop: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        marginBottom: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
    },
    input: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        paddingVertical: 12,
    },
    togglePassword: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    togglePasswordText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
    },
    changePasswordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 10,
        gap: 8,
    },
    changePasswordButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#fff',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutText: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#dc2626',
        marginLeft: 12,
    },
});

export default AdminSettingsScreen;
