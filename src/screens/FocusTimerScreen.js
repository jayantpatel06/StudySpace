import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated as RNAnimated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { successNotification, lightImpact } from '../utils/haptics';

// Simple Confetti Component
const Confetti = ({ visible }) => {
    const particles = useRef(
        Array(20).fill(null).map(() => ({
            x: new RNAnimated.Value(Math.random() * 300),
            y: new RNAnimated.Value(-50),
            color: ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
            size: Math.random() * 8 + 4,
        }))
    ).current;

    useEffect(() => {
        if (visible) {
            particles.forEach((p, i) => {
                p.y.setValue(-50);
                RNAnimated.timing(p.y, {
                    toValue: 600,
                    duration: 2000 + Math.random() * 1000,
                    delay: i * 50,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {particles.map((p, i) => (
                <RNAnimated.View
                    key={i}
                    style={{
                        position: 'absolute',
                        left: p.x,
                        transform: [{ translateY: p.y }],
                        width: p.size,
                        height: p.size,
                        borderRadius: p.size / 2,
                        backgroundColor: p.color,
                    }}
                />
            ))}
        </View>
    );
};

const FocusTimerScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();

    // Timer states
    const WORK_DURATION = 25 * 60; // 25 minutes
    const BREAK_DURATION = 5 * 60; // 5 minutes

    const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION);
    const [isPaused, setIsPaused] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [completedBlocks, setCompletedBlocks] = useState(3);

    useEffect(() => {
        if (isPaused || secondsLeft <= 0) {
            if (secondsLeft <= 0 && !isPaused) {
                // Timer completed
                successNotification();

                if (!isBreak) {
                    // Work phase completed - show confetti and switch to break
                    setShowConfetti(true);
                    setCompletedBlocks(prev => prev + 1);
                    setTimeout(() => {
                        setShowConfetti(false);
                        setIsBreak(true);
                        setSecondsLeft(BREAK_DURATION);
                    }, 2500);
                } else {
                    // Break completed - switch back to work
                    setIsBreak(false);
                    setSecondsLeft(WORK_DURATION);
                }
            }
            return undefined;
        }
        const interval = setInterval(() => {
            setSecondsLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, secondsLeft, isBreak]);

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const togglePause = () => {
        lightImpact();
        setIsPaused(prev => !prev);
    };

    const handleLeave = () => {
        lightImpact();
        navigation.goBack();
    };

    // Calculate progress for the ring
    const totalDuration = isBreak ? BREAK_DURATION : WORK_DURATION;
    const progress = secondsLeft / totalDuration;
    const circumference = 2 * Math.PI * 130; // r = 130
    const strokeDashoffset = circumference * (1 - progress);

    // Ring color changes based on phase
    const ringColor = isBreak ? colors.success : colors.primary;

    const getStatusText = () => {
        if (secondsLeft === 0) return showConfetti ? '🎉 GREAT JOB!' : 'COMPLETED';
        if (isPaused) return 'PAUSED';
        return isBreak ? 'BREAK TIME' : 'FOCUSING';
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Confetti Overlay */}
            <Confetti visible={showConfetti} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
                <TouchableOpacity onPress={handleLeave} style={styles.headerButton}>
                    <MaterialIcons name="arrow-back-ios-new" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Library Room 402</Text>
                <View style={[styles.headerButton, styles.lightModeButton, { backgroundColor: colors.primaryLight }]}>
                    <MaterialIcons name={isBreak ? "local-cafe" : "timer"} size={24} color={colors.primary} />
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Live Indicators */}
                <View style={[styles.liveIndicator, { backgroundColor: isBreak ? 'rgba(34, 197, 94, 0.1)' : colors.primaryLight }]}>
                    <View style={[styles.liveDot, { backgroundColor: isBreak ? colors.success : colors.primary }]} />
                    <Text style={[styles.liveText, { color: isBreak ? colors.success : colors.primary }]}>
                        {isBreak ? 'Break Time' : 'Live Session'}
                    </Text>
                </View>
                <Text style={[styles.sessionTitle, { color: colors.text }]}>
                    {isBreak ? 'Take a break! 🧘' : 'Exam Prep - Biology'}
                </Text>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Svg height="280" width="280" viewBox="0 0 280 280">
                        <Circle
                            cx="140"
                            cy="140"
                            r="130"
                            stroke={isDark ? colors.border : '#e2e8f0'}
                            strokeWidth="12"
                            fill="transparent"
                        />
                        <Circle
                            cx="140"
                            cy="140"
                            r="130"
                            stroke={ringColor}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin="140, 140"
                        />
                    </Svg>
                    <View style={styles.timerTextContainer}>
                        <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(secondsLeft)}</Text>
                        <Text style={[styles.timerLabel, { color: isBreak ? colors.success : colors.primary }]}>
                            {getStatusText()}
                        </Text>
                    </View>
                </View>

                {/* Avatars */}
                <View style={styles.avatarsRow}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={[styles.avatarContainer, { borderColor: colors.surface }]}>
                            <Image
                                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGHVQ-Mt3YkX4t0Br8qqWmwztLKLr0kR7hI-6KyrGNYTQ3cj-xMtxNgw5tdnHt9-4MB2NkjSYpMqKUPVCwCSZp-QThHzXgDiFdb3p3RVr_gKAMT709mjA6Xs-DyoR8u1PwoWH5WtzbtdFygV8cCNQlD8_zB3HH-RovOUZmVfTcJSUUcWygt4u8PHw5WtzbtdFygV8cCNQlD8_zB3HH-RovOUZmVfTcJSUUcWygt4u8PHwpo-AcGBaAZNhFSFctfv-B2LwiZs1LFMoWTxRUC_J9T635okgghLpLTeNyRwxSJV6zcMPiyBl6AUH5dRxQzm8Q" }}
                                style={styles.avatar}
                            />
                        </View>
                    ))}
                    <View style={[styles.avatarContainer, styles.moreAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.moreAvatarText}>+12</Text>
                    </View>
                </View>
                <Text style={[styles.studentsText, { color: colors.textSecondary }]}>15 students are in the zone</Text>

                {/* Progress Bar */}
                <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Session Progress</Text>
                            <Text style={[styles.progressValue, { color: colors.text }]}>{completedBlocks} of 4 Focus Blocks</Text>
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round((completedBlocks / 4) * 100)}%</Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSecondary }]}>
                        <View style={[styles.progressBarFill, { width: `${(completedBlocks / 4) * 100}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.pauseButton, { backgroundColor: isBreak ? colors.success : colors.primary }]}
                        onPress={togglePause}
                    >
                        <MaterialIcons name={isPaused ? "play-arrow" : "pause"} size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.pauseButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.leaveButton, { backgroundColor: colors.surfaceSecondary }]}
                        onPress={handleLeave}
                    >
                        <MaterialIcons name="exit-to-app" size={24} color={colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={[styles.leaveButtonText, { color: colors.textSecondary }]}>Leave</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lightModeButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202124',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    liveText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ef4444',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sessionTitle: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 32,
    },
    timerContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    timerTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#202124',
    },
    timerLabel: {
        color: '#64748b',
        fontWeight: '500',
        marginTop: 8,
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: 'white',
        backgroundColor: '#e2e8f0',
        overflow: 'hidden',
        marginLeft: -16,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    moreAvatar: {
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreAvatarText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    studentsText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 32,
    },
    progressCard: {
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 'auto',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    progressLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    progressValue: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: '700',
    },
    progressPercent: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e2e8f0',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        width: '75%',
    },
    controls: {
        width: '100%',
        gap: 16,
        paddingBottom: 32,
    },
    pauseButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    pauseButtonText: {
        color: 'white',
        fontWeight: '700',
    },
    leaveButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leaveButtonText: {
        color: '#64748b',
        fontWeight: '700',
    },
});

export default FocusTimerScreen;
