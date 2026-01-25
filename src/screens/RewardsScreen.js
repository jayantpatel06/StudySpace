import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const RewardsScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <MaterialIcons name="arrow-back-ios-new" size={24} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rewards & Leaderboard</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialIcons name="history" size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Profile & Points */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiiQBP1yD9U9ZbJjczqW4TvW3h3dgGoZykZBvwsurQYMe7Z5wF0-fQRdqg9DSVCDIHI5neVkYnYEaW7Yet6aiHW9PgEMrnKzMr-dK7D74PNEFEFNzzVXwaLRnpIwm2qQa0Jjh0VoqZuOtm5EN8bE_hVhFW6nJusjKYTYe40uaF7EifVsj_PEY4rmLq_PZWB5MDUlGWj-dovlSAV3kQcuHblKEDbxhs-kszHu_qcId6lynm09pEdz3f4lKh4tdmnVUQLX_yDK76Flxj" }}
                            style={styles.profileAvatar}
                        />
                        <View style={styles.verifiedBadge}>
                            <MaterialIcons name="verified" size={16} color="white" />
                        </View>
                    </View>
                    <Text style={styles.pointsText}>2,450 Focus Points</Text>
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>University Rank: #14</Text>
                    </View>
                    <Text style={styles.motivationText}>You're in the top 5% of learners this month!</Text>
                </View>

                {/* Streak */}
                <View style={styles.section}>
                    <View style={styles.streakCard}>
                        <View style={styles.streakHeader}>
                            <View style={styles.streakTitle}>
                                <MaterialIcons name="local-fire-department" size={20} color="#f97316" />
                                <Text style={styles.streakTitleText}>7-Day Streak</Text>
                            </View>
                            <Text style={styles.perfectWeek}>Perfect Week!</Text>
                        </View>
                        <View style={styles.daysRow}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                <View key={i} style={styles.dayItem}>
                                    <View style={styles.dayIcon}>
                                        <MaterialIcons name="local-fire-department" size={16} color="white" />
                                    </View>
                                    <Text style={styles.dayLabel}>{day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Leaderboard */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>University Leaderboard</Text>
                        <Text style={styles.viewAll}>View All</Text>
                    </View>
                    <View style={styles.leaderboardList}>
                        <View style={styles.leaderboardItem}>
                            <View style={styles.leaderboardLeft}>
                                <Text style={[styles.rankNumber, { color: '#eab308' }]}>1</Text>
                                <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4aPi3zVAqVFidQh2-XmO4-20TcPdKmX5mqH0Ow73BNAeueIWcUJAJo2bTtUOjH8OrshB3d1ps4mPhUbvXmA3tcHRNoWotJEXrIcxrap9CAdKZzksD5AraVDXAC_EzoBUZTi7MwD__xE4zPmhHdNEI4ykfY6vA8LQyhexB1SzPQXwSj3xw83w6WFycyyKQNE2Xtzi4up8Jzxy97d05dQkMdGLIZyGPo7sgbKuMW06SnouNX-hEwf8mmrJ3NuhbfoyxfQkVikz16Z2w" }} style={styles.leaderboardAvatar} />
                                <View>
                                    <Text style={styles.leaderboardName}>Marcus Chen</Text>
                                    <Text style={styles.leaderboardDept}>Eng Department</Text>
                                </View>
                            </View>
                            <Text style={styles.leaderboardPoints}>5,120 pts</Text>
                        </View>
                        <View style={styles.leaderboardItem}>
                            <View style={styles.leaderboardLeft}>
                                <Text style={[styles.rankNumber, { color: '#94a3b8' }]}>2</Text>
                                <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSLda2SPhUBBaDGUYL4vk7nb6jfJksbxya4RV4AiUeFbOUvpqLXKgNLDHKeYlvDSZoLn0CFzdAzzfsD1eEUOiIx-95qp4KYrlfuUmjrsjMK5EFSC0RKdjEbKP5j9_RlSFEaBVVnZmKdAtomWrVOWj2xqBxFGl5FfheartlxlSItPMKhhTwtE7bR5WlFNJzvcMaK68i1V8QftiD7Qb6nl0xhHXuNngNWwy7OTZ1xSFUH75t-kcuRS4XmyWonBWrhwxN-weKD-xHjC9T" }} style={styles.leaderboardAvatar} />
                                <View>
                                    <Text style={styles.leaderboardName}>Sarah Jenkins</Text>
                                    <Text style={styles.leaderboardDept}>Med School</Text>
                                </View>
                            </View>
                            <Text style={styles.leaderboardPoints}>4,890 pts</Text>
                        </View>
                    </View>
                </View>

                {/* Rewards */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Rewards</Text>
                        <Text style={styles.viewAll}>Store</Text>
                    </View>
                    <View style={styles.rewardCard}>
                        <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVlAYW2nn0kFTxqFkXuASYaiCgFibA8wNhmemoXbF8XpQ-I79WrjNWrYwhLTnTV-Sw1L4h5xeULdawyN_CYfn68h_NFA3Q0ptQHrJ2nslzighI0vpGGg9uk0nWIK_Pup013gZJtxBCwQXJyDPqqnVmPyqKaPU93Q4AinMGIUkQTV1m6AJAPf1WXN2IWa_OCqA7V8BOtOT_FFL89tOUxDbNQuTBCj5dgeDUyox9eC_Zdp01y1gfWIMaL8IlpjAqo0XVpCyfOIpJDeQX" }} style={styles.rewardImage} resizeMode="cover" />
                        <View style={styles.rewardInfo}>
                            <View>
                                <Text style={styles.rewardTitle}>Free Campus Coffee</Text>
                                <Text style={styles.rewardSubtitle}>Any size at Central Cafe</Text>
                            </View>
                            <View style={styles.rewardFooter}>
                                <Text style={styles.rewardCost}>500 pts</Text>
                                <TouchableOpacity style={styles.redeemButton}>
                                    <Text style={styles.redeemText}>Redeem</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 48,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: 'rgba(248, 249, 250, 0.8)',
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#202124',
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        padding: 24,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    profileAvatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 4,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        padding: 6,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    pointsText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#202124',
    },
    rankBadge: {
        marginTop: 4,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rankText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '700',
    },
    motivationText: {
        color: '#64748b',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 32,
    },
    streakCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
    },
    streakHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    streakTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    streakTitleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#202124',
    },
    perfectWeek: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayItem: {
        alignItems: 'center',
        gap: 8,
    },
    dayIcon: {
        backgroundColor: '#3b82f6',
        padding: 10,
        borderRadius: 20,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94a3b8',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202124',
    },
    viewAll: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    leaderboardList: {
        gap: 12,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
    },
    leaderboardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    rankNumber: {
        width: 32,
        textAlign: 'center',
        fontWeight: '700',
    },
    leaderboardAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    leaderboardName: {
        fontWeight: '700',
        fontSize: 14,
        color: '#202124',
    },
    leaderboardDept: {
        fontSize: 12,
        color: '#64748b',
    },
    leaderboardPoints: {
        fontWeight: '700',
        color: '#3b82f6',
    },
    rewardCard: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rewardImage: {
        width: 96,
        height: 96,
    },
    rewardInfo: {
        padding: 12,
        flex: 1,
        justifyContent: 'space-between',
    },
    rewardTitle: {
        fontWeight: '700',
        fontSize: 14,
        color: '#202124',
    },
    rewardSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    rewardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    rewardCost: {
        color: '#3b82f6',
        fontWeight: '700',
        fontSize: 14,
    },
    redeemButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    redeemText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
});

export default RewardsScreen;
