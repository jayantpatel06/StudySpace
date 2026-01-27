import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getLibraries, deleteLibrary } from '../../services/adminApi';
import { lightImpact, errorNotification } from '../../utils/haptics';

const LibraryCard = ({ library, onEdit, onDelete, onViewSeats, colors }) => (
    <View style={[styles.libraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.libraryHeader}>
            <View style={[styles.libraryIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="local-library" size={24} color={colors.primary} />
            </View>
            <View style={styles.libraryInfo}>
                <Text style={[styles.libraryName, { color: colors.text }]}>{library.name}</Text>
                <Text style={[styles.libraryAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                    {library.address || 'No address provided'}
                </Text>
            </View>
            <View style={[
                styles.statusBadge,
                { backgroundColor: library.is_active ? '#dcfce7' : '#fee2e2' }
            ]}>
                <Text style={[
                    styles.statusText,
                    { color: library.is_active ? '#16a34a' : '#dc2626' }
                ]}>
                    {library.is_active ? 'Active' : 'Inactive'}
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
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#dbeafe' }]}
                onPress={() => onViewSeats(library)}
            >
                <MaterialIcons name="event-seat" size={18} color="#2563eb" />
                <Text style={[styles.actionButtonText, { color: '#2563eb' }]}>Seats</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
                onPress={() => onDelete(library)}
            >
                <MaterialIcons name="delete" size={18} color="#dc2626" />
                <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>Delete</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const AdminLibrariesScreen = ({ navigation }) => {
    const { colors } = useTheme();
    
    const [libraries, setLibraries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLibraries = useCallback(async () => {
        try {
            const { data, error } = await getLibraries(false); // Include inactive
            if (!error) {
                setLibraries(data || []);
            }
        } catch (error) {
            console.error('Error fetching libraries:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLibraries();
    }, [fetchLibraries]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
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
        navigation.navigate('AdminAddLibrary');
    };

    const handleEditLibrary = (library) => {
        lightImpact();
        navigation.navigate('AdminEditLibrary', { library });
    };

    const handleViewSeats = (library) => {
        lightImpact();
        navigation.navigate('AdminManageSeats', { library });
    };

    const handleDeleteLibrary = (library) => {
        lightImpact();
        Alert.alert(
            'Delete Library',
            `Are you sure you want to delete "${library.name}"? This action will deactivate the library.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteLibrary(library.id);
                            fetchLibraries();
                        } catch (error) {
                            console.error('Error deleting library:', error);
                            errorNotification();
                            Alert.alert('Error', 'Failed to delete library');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Libraries</Text>
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
                        <MaterialIcons name="local-library" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            No Libraries Yet
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
                            colors={colors}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    libraryIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    libraryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    libraryName: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        marginBottom: 2,
    },
    libraryAddress: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
    },
    libraryDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
    },
    libraryActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    actionButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#fff',
    },
});

export default AdminLibrariesScreen;
