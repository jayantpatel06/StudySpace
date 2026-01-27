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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSignIn } from '@clerk/clerk-expo';
import { useTheme } from '../context/ThemeContext';
import { lightImpact, successNotification } from '../utils/haptics';

const LoginScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { signIn, setActive, isLoaded } = useSignIn();

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

        if (!isLoaded || !signIn) return;

        setIsLoading(true);
        try {
            // Step 1: Create sign-in with identifier only
            await signIn.create({
                identifier: email.trim(),
            });

            // Step 2: Attempt password authentication
            const result = await signIn.attemptFirstFactor({
                strategy: 'password',
                password,
            });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                successNotification();
            } else {
                // For any other status, show generic error
                setError('Unable to sign in. Please check your credentials.');
            }
        } catch (err) {
            console.error('Sign in error:', err);
            
            // Parse Clerk error messages
            const clerkError = err.errors?.[0];
            if (clerkError) {
                if (clerkError.code === 'form_identifier_not_found') {
                    setError('No account found with this email. Please sign up first.');
                } else if (clerkError.code === 'form_password_incorrect') {
                    setError('Incorrect password. Please try again.');
                } else if (clerkError.code === 'form_identifier_invalid') {
                    setError('Please enter a valid email address.');
                } else if (clerkError.code === 'strategy_for_user_invalid') {
                    setError('No account found with this email. Please sign up first.');
                } else {
                    setError(clerkError.message || 'Sign in failed. Please try again.');
                }
            } else {
                setError(err.message || 'Invalid email or password');
            }
        } finally {
            setIsLoading(false);
        }
    }, [email, password, signIn, setActive, isLoaded]);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* Logo/Header */}
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
                        <MaterialIcons name="menu-book" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>StudySync</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sign in to continue
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
                            placeholder="Email address"
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
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={[styles.signUpText, { color: colors.primary }]}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                {/* Admin Login Link */}
                <TouchableOpacity 
                    style={styles.adminLink} 
                    onPress={() => navigation.navigate('AdminLogin')}
                >
                    <MaterialIcons name="admin-panel-settings" size={16} color={colors.textMuted} />
                    <Text style={[styles.adminLinkText, { color: colors.textMuted }]}>
                        Admin Login
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: {
        width: 96, height: 96, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 16 },
    form: { gap: 16 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, borderRadius: 12,
    },
    errorText: { fontSize: 14, flex: 1 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
    },
    input: { flex: 1, fontSize: 16 },
    loginButton: {
        paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8,
    },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { fontSize: 14 },
    signUpText: { fontSize: 14, fontWeight: '600' },
    adminLink: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 24,
        gap: 6,
    },
    adminLinkText: { 
        fontSize: 13, 
        fontFamily: 'Inter_400Regular',
    },
});

export default LoginScreen;
