import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../components';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../constants/theme';
import { useRouter } from 'expo-router';

interface AttendanceSubmission {
  id: string;
  date: Date;
  batchName: string;
  programName: string;
  presentCount: number;
  totalCount: number;
  submittedBy: string;
}

// Mock data for attendance history
const mockSubmissions: AttendanceSubmission[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    batchName: '2024 Batch',
    programName: 'Web Development',
    presentCount: 18,
    totalCount: 20,
    submittedBy: 'John Instructor',
  },
  {
    id: '2',
    date: new Date('2024-01-14'),
    batchName: '2024 Batch',
    programName: 'Mobile App Development',
    presentCount: 15,
    totalCount: 15,
    submittedBy: 'Jane Teacher',
  },
  {
    id: '3',
    date: new Date('2024-01-13'),
    batchName: '2025 Batch',
    programName: 'Web Development',
    presentCount: 12,
    totalCount: 15,
    submittedBy: 'John Instructor',
  },
];

export default function AttendanceHistoryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>Attendance History</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {mockSubmissions.map((submission) => (
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
                {submission.date.toLocaleDateString('en-US', {
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