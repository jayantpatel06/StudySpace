import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAdmin } from '../../context/AdminContext';
import { lightImpact, successNotification, errorNotification } from '../../utils/haptics';

const AdminLoginScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { adminLogin } = useAdmin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = useCallback(async () => {
        lightImpact();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }
        if (!password) {
            setError('Please enter your password');
            return;
        }

        setIsLoading(true);
        try {
            const result = await adminLogin(email, password);
            
            if (result.success) {
                successNotification();
                if (result.needsPasswordChange) {
                    Alert.alert(
                        'Password Change Required',
                        'You are using the default password. Please change it for security.',
                        [{ text: 'OK' }]
                    );
                }
            } else {
                errorNotification();
                setError(result.error || 'Invalid credentials');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            errorNotification();
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [email, password, adminLogin]);

    const handleBackToUser = () => {
        lightImpact();
        navigation.navigate('Login');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: '#fee2e2' }]}>
                        <MaterialIcons name="admin-panel-settings" size={48} color="#dc2626" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Admin Panel</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sign in to manage libraries
                    </Text>
                </View>

                {/* Default Credentials Info */}
                <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MaterialIcons name="info" size={18} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Default: admin@studysync.com / admin123
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <MaterialIcons name="error-outline" size={18} color="#ef4444" />
                            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="email" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Admin email"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="lock" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Password"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoComplete="password"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <MaterialIcons
                                name={showPassword ? 'visibility-off' : 'visibility'}
                                size={20}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: '#dc2626' }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="login" size={20} color="#fff" />
                                <Text style={styles.loginButtonText}>Sign In as Admin</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Back to User Login */}
                <TouchableOpacity style={styles.backLink} onPress={handleBackToUser}>
                    <MaterialIcons name="arrow-back" size={18} color={colors.primary} />
                    <Text style={[styles.backLinkText, { color: colors.primary }]}>
                        Back to User Login
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 96,
        height: 96,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 28,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 20,
        gap: 8,
    },
    infoText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        flex: 1,
    },
    form: {
        gap: 16,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
    },
    loginButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    backLinkText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
    },
});

export default AdminLoginScreen;
