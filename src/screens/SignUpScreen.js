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
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSignUp } from '@clerk/clerk-expo';
import { useTheme } from '../context/ThemeContext';
import { lightImpact, successNotification } from '../utils/haptics';

const SignUpScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { signUp, setActive, isLoaded } = useSignUp();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');

    const handleSignUp = useCallback(async () => {
        lightImpact();
        setError('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!isLoaded || !signUp) return;

        setIsLoading(true);
        try {
            await signUp.create({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                username: username.trim(),
                emailAddress: email.trim(),
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err) {
            console.error('Sign up error:', err);
            setError(err.errors?.[0]?.message || 'Sign up failed');
        } finally {
            setIsLoading(false);
        }
    }, [firstName, lastName, username, email, password, signUp, isLoaded]);

    const handleVerify = useCallback(async () => {
        if (!isLoaded || !signUp) return;

        setIsLoading(true);
        try {
            const result = await signUp.attemptEmailAddressVerification({ code });

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                successNotification();
            } else {
                setError('Verification incomplete. Please try again.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            const errorMessage = err.errors?.[0]?.message || '';

            // Handle "already verified" case
            if (errorMessage.toLowerCase().includes('already been verified')) {
                if (signUp.status === 'complete') {
                    await setActive({ session: signUp.createdSessionId });
                    successNotification();
                    return;
                }
            }
            setError(errorMessage || 'Invalid code');
        } finally {
            setIsLoading(false);
        }
    }, [code, signUp, setActive, isLoaded]);

    // Verification screen
    if (pendingVerification) {
        return (
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <MaterialIcons name="mark-email-read" size={64} color={colors.primary} />
                        <Text style={[styles.title, { color: colors.text }]}>Verify Email</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Enter the 6-digit code sent to {email}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {error ? (
                            <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Text style={{ color: '#ef4444' }}>{error}</Text>
                            </View>
                        ) : null}

                        <TextInput
                            style={[styles.codeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="000000"
                            placeholderTextColor={colors.textMuted}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: colors.primary }]}
                            onPress={handleVerify}
                            disabled={isLoading}
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.loginButtonText}>Verify</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Join StudySync and start earning focus points
                </Text>

                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <Text style={{ color: '#ef4444' }}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="First name"
                                placeholderTextColor={colors.textMuted}
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={[styles.inputContainer, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Last name"
                                placeholderTextColor={colors.textMuted}
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="person" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Username"
                            placeholderTextColor={colors.textMuted}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

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
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MaterialIcons name="lock" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Password (min 8 chars)"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.loginButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={[styles.signUpText, { color: colors.primary }]}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    backButton: { marginBottom: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
    form: { gap: 16, marginTop: 24 },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    errorBox: { padding: 12, borderRadius: 12 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
    },
    input: { flex: 1, fontSize: 16 },
    codeInput: {
        fontSize: 32, textAlign: 'center', letterSpacing: 8,
        paddingVertical: 20, borderRadius: 12, borderWidth: 1,
    },
    loginButton: {
        paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8,
    },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 24 },
    footerText: { fontSize: 14 },
    signUpText: { fontSize: 14, fontWeight: '600' },
});

export default SignUpScreen;
