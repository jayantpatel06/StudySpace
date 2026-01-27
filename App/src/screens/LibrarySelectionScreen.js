import React, { useCallback, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { useLocation } from '../context/LocationContext';
import { lightImpact, successNotification } from '../utils/haptics';

const LibraryCard = ({ library, isSelected, onSelect, colors }) => (
    <TouchableOpacity
        style={[
            styles.libraryCard,
            { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
            isSelected && styles.selectedCard,
        ]}
        onPress={() => onSelect(library)}
    >
        <View style={styles.cardContent}>
            <View style={[
                styles.libraryIcon,
                { backgroundColor: isSelected ? colors.primaryLight : colors.background }
            ]}>
                <MaterialIcons
                    name="local-library"
                    size={28}
                    color={isSelected ? colors.primary : colors.textMuted}
                />
            </View>
            
            <View style={styles.libraryInfo}>
                <Text style={[styles.libraryName, { color: colors.text }]}>{library.name}</Text>
                {library.address && (
                    <Text style={[styles.libraryAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                        {library.address}
                    </Text>
                )}
                <View style={styles.libraryMeta}>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="radar" size={14} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                            {library.radius_meters}m radius
                        </Text>
                    </View>
                    {library.total_seats > 0 && (
                        <View style={styles.metaItem}>
                            <MaterialIcons name="event-seat" size={14} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                {library.total_seats} seats
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={[
                styles.radioOuter,
                { borderColor: isSelected ? colors.primary : colors.border }
            ]}>
                {isSelected && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
            </View>
        </View>
    </TouchableOpacity>
);

const LibrarySelectionScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { 
        libraries, 
        selectedLibrary, 
        isLoading, 
        error,
        fetchLibraries, 
        selectLibrary,
    } = useLibrary();
    const { setTargetLibrary } = useLocation();

    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        fetchLibraries();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLibraries().finally(() => setRefreshing(false));
    }, [fetchLibraries]);

    const handleSelectLibrary = useCallback(async (library) => {
        lightImpact();
        await selectLibrary(library);
        // setTargetLibrary already calls refreshLocation internally
        setTargetLibrary(library);
        successNotification();
        navigation.goBack();
    }, [selectLibrary, navigation]);

    if (isLoading && libraries.length === 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading libraries...
                </Text>
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Select Library</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>
                    Select a library to enable location-based seat booking. You must be within the library's geofence to book seats.
                </Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                    <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to Load</Text>
                    <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={fetchLibraries}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : libraries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="local-library" size={64} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Libraries Available</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Libraries will appear here once they are registered by an administrator.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {selectedLibrary && (
                        <View style={styles.currentSelection}>
                            <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
                                Currently Selected
                            </Text>
                        </View>
                    )}

                    {libraries.map((library) => (
                        <LibraryCard
                            key={library.id}
                            library={library}
                            isSelected={selectedLibrary?.id === library.id}
                            onSelect={handleSelectLibrary}
                            colors={colors}
                        />
                    ))}
                </ScrollView>
            )}
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
    loadingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        marginTop: 12,
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
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        lineHeight: 18,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    currentSelection: {
        marginBottom: 8,
    },
    currentLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    libraryCard: {
        borderRadius: 16,
        borderWidth: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    selectedCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    libraryIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    libraryInfo: {
        flex: 1,
        marginLeft: 14,
    },
    libraryName: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 16,
        marginBottom: 4,
    },
    libraryAddress: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        marginBottom: 8,
        lineHeight: 18,
    },
    libraryMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
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
        textAlign: 'center',
        lineHeight: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorTitle: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 20,
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#fff',
    },
});

export default LibrarySelectionScreen;
