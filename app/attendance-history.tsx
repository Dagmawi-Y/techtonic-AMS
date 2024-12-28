import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../components';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../constants/theme';
import { useRouter } from 'expo-router';
import { db } from '../config/firebase';

interface AttendanceSubmission {
  id: string;
  date: string;
  batchId: string;
  batchName: string;
  programId: string;
  programName: string;
  presentCount: number;
  totalCount: number;
  submittedBy: string;
  createdAt: string;
}

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<AttendanceSubmission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmissions = async () => {
    try {
      // Get attendance records ordered by date
      const attendanceSnapshot = await db.collection('attendance')
        .orderBy('createdAt', 'desc')
        .get();

      const fetchedSubmissions = await Promise.all(
        attendanceSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Get batch and program names
          const batchDoc = await db.collection('batches').doc(data.batchId).get();
          const programDoc = await db.collection('programs').doc(data.programId).get();
          
          const batchData = batchDoc.data();
          const programData = programDoc.data();

          // Calculate present count
          const presentCount = data.records.filter((r: any) => r.isPresent).length;
          const totalCount = data.records.length;

          // Get submitter's name
          const userDoc = await db.collection('users').doc(data.createdBy).get();
          const userData = userDoc.data();

          return {
            id: doc.id,
            date: data.date,
            batchId: data.batchId,
            batchName: batchData?.name || 'Unknown Batch',
            programId: data.programId,
            programName: programData?.name || 'Unknown Program',
            presentCount,
            totalCount,
            submittedBy: userData?.name || 'Unknown User',
            createdAt: data.createdAt,
          } as AttendanceSubmission;
        })
      );

      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      Alert.alert('Error', 'Failed to load attendance history');
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSubmissions();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>Attendance History</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {submissions.map((submission) => (
          <TouchableOpacity
            key={submission.id}
            style={styles.card}
            onPress={() => router.push({
              pathname: '/attendance-details',
              params: { id: submission.id }
            })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.date} bold>
                {new Date(submission.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={COLORS.primary} 
              />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.programInfo}>
                <Text style={styles.programName} bold>{submission.programName}</Text>
                <Text style={styles.batchName}>{submission.batchName}</Text>
              </View>

              <View style={styles.attendanceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue} bold>
                    {submission.presentCount}/{submission.totalCount}
                  </Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue} bold>
                    {Math.round((submission.presentCount / submission.totalCount) * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <MaterialCommunityIcons name="account" size={16} color={COLORS.textLight} />
              <Text style={styles.submittedBy}>{submission.submittedBy}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  date: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  batchName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  submittedBy: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
}); 