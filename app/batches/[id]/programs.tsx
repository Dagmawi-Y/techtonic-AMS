import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { Text } from '../../../components';
import { db } from '../../../config/firebase';

interface Program {
  id: string;
  name: string;
  description: string;
  duration: number;
}

interface Batch {
  id: string;
  name: string;
  programs: Program[];
}

const EmptyState = memo(() => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons
      name="book-open-page-variant"
      size={80}
      color={COLORS.secondary}
      style={styles.emptyStateIcon}
    />
    <Text style={styles.emptyStateTitle} bold>No Programs Assigned</Text>
    <Text style={styles.emptyStateMessage}>
      This batch doesn't have any programs assigned to it yet
    </Text>
  </View>
));

export default function BatchProgramsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatchPrograms = async () => {
    try {
      const batchDoc = await db.collection('batches').doc(id as string).get();
      
      if (!batchDoc.exists) {
        Alert.alert('Error', 'Batch not found');
        router.back();
        return;
      }

      const batchData = batchDoc.data();
      if (batchData?.isDeleted) {
        Alert.alert('Error', 'Batch not found');
        router.back();
        return;
      }

      setBatch({
        id: batchDoc.id,
        name: batchData?.name || '',
        programs: batchData?.programs || [],
      });
    } catch (error) {
      console.error('Error fetching batch programs:', error);
      Alert.alert('Error', 'Failed to fetch batch programs');
    }
  };

  useEffect(() => {
    fetchBatchPrograms();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBatchPrograms();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  };

  if (!batch) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.emptyText}>Loading...</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>{batch.name} - Programs</Text>
      </View>

      {batch.programs.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <EmptyState />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.programList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {batch.programs.map((program) => (
            <View key={program.id} style={styles.programCard}>
              <View style={styles.programHeader}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={24}
                  color={COLORS.primary}
                />
                <View style={styles.programInfo}>
                  <Text style={styles.programName} bold>{program.name}</Text>
                  <Text style={styles.programDuration}>{program.duration} weeks</Text>
                </View>
              </View>
              <Text style={styles.programDescription}>{program.description}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    flex: 1,
  },
  programList: {
    padding: SPACING.md,
  },
  programCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  programInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  programName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  programDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },
  programDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 300,
  },
}); 