import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../components';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  isPresent: boolean;
  markedBy: 'manual' | 'scan';
  timestamp: Date;
}

interface AttendanceSubmission {
  id: string;
  date: Date;
  batchName: string;
  programName: string;
  submittedBy: string;
  records: AttendanceRecord[];
}

// Mock data for attendance details
const mockSubmission: AttendanceSubmission = {
  id: '1',
  date: new Date('2024-01-15'),
  batchName: '2024 Batch',
  programName: 'Web Development',
  submittedBy: 'John Instructor',
  records: [
    {
      studentId: 'STU001',
      studentName: 'John Doe',
      isPresent: true,
      markedBy: 'scan',
      timestamp: new Date('2024-01-15T09:30:00'),
    },
    {
      studentId: 'STU002',
      studentName: 'Jane Smith',
      isPresent: true,
      markedBy: 'manual',
      timestamp: new Date('2024-01-15T09:35:00'),
    },
    {
      studentId: 'STU003',
      studentName: 'Mike Johnson',
      isPresent: false,
      markedBy: 'manual',
      timestamp: new Date('2024-01-15T09:35:00'),
    },
  ],
};

export default function AttendanceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // In a real app, we would fetch the submission data using the id
  const submission = mockSubmission;
  const presentCount = submission.records.filter(r => r.isPresent).length;
  const totalCount = submission.records.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>Attendance Details</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.date} bold>
              {submission.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue} bold>
                  {presentCount}/{totalCount}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue} bold>
                  {Math.round((presentCount / totalCount) * 100)}%
                </Text>
                <Text style={styles.statLabel}>Rate</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="book-education" size={20} color={COLORS.primary} />
              <Text style={styles.summaryText}>{submission.programName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
              <Text style={styles.summaryText}>{submission.batchName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
              <Text style={styles.summaryText}>Submitted by {submission.submittedBy}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} bold>Student Records</Text>
          {submission.records.map((record, index) => (
            <View 
              key={record.studentId} 
              style={[
                styles.recordCard,
                index === submission.records.length - 1 && { marginBottom: 0 }
              ]}
            >
              <View style={styles.recordInfo}>
                <Text style={styles.studentName} bold>{record.studentName}</Text>
                <Text style={styles.studentId}>{record.studentId}</Text>
                <View style={styles.recordMeta}>
                  <MaterialCommunityIcons 
                    name={record.markedBy === 'scan' ? 'barcode-scan' : 'gesture-tap'}
                    size={16}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.metaText}>
                    {record.markedBy === 'scan' ? 'Scanned' : 'Manual'} at{' '}
                    {record.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                record.isPresent ? styles.presentBadge : styles.absentBadge
              ]}>
                <MaterialCommunityIcons
                  name={record.isPresent ? 'check' : 'close'}
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.statusText} bold>
                  {record.isPresent ? 'Present' : 'Absent'}
                </Text>
              </View>
            </View>
          ))}
        </View>
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
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  summaryHeader: {
    marginBottom: SPACING.md,
  },
  date: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  attendanceStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  summaryContent: {
    gap: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  recordInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  presentBadge: {
    backgroundColor: COLORS.success,
  },
  absentBadge: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
}); 