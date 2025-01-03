import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "../components";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZES,
} from "../constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../config/firebase";

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  isPresent: boolean;
  markedBy: "manual" | "scan";
  timestamp: string;
}

interface AttendanceSubmission {
  id: string;
  date: string;
  batchId: string;
  batchName: string;
  programId: string;
  programName: string;
  submittedBy: string;
  submitterName: string;
  records: AttendanceRecord[];
}

export default function AttendanceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [submission, setSubmission] = useState<AttendanceSubmission | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubmissionDetails = async () => {
    try {
      const submissionDoc = await db
        .collection("attendance")
        .doc(id as string)
        .get();
      if (!submissionDoc.exists) {
        Alert.alert("Error", "Attendance record not found");
        router.back();
        return;
      }

      const data = submissionDoc.data();
      if (!data) return;

      // Get batch and program details
      const [batchDoc, programDoc, userDoc] = await Promise.all([
        db.collection("batches").doc(data.batchId).get(),
        db.collection("programs").doc(data.programId).get(),
        db.collection("users").doc(data.createdBy).get(),
      ]);

      const batchData = batchDoc.data();
      const programData = programDoc.data();
      const userData = userDoc.data();

      // Get student names for each record
      const studentRecords = await Promise.all(
        data.records.map(async (record: any) => {
          const studentDoc = await db
            .collection("students")
            .doc(record.studentId)
            .get();
          const studentData = studentDoc.data();
          return {
            studentId: record.studentId,
            studentName: studentData?.name || "Unknown Student",
            isPresent: record.isPresent,
            markedBy: record.markedBy,
            timestamp: record.timestamp,
          } as AttendanceRecord;
        }),
      );

      setSubmission({
        id: submissionDoc.id,
        date: data.date,
        batchId: data.batchId,
        batchName: batchData?.name || "Unknown Batch",
        programId: data.programId,
        programName: programData?.name || "Unknown Program",
        submittedBy: data.createdBy,
        submitterName: userData?.name || "Unknown User",
        records: studentRecords,
      });
    } catch (error) {
      console.error("Error fetching attendance details:", error);
      Alert.alert("Error", "Failed to load attendance details");
    }
  };

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSubmissionDetails();
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  if (!submission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} bold>
            Attendance Details
          </Text>
        </View>
        <View style={[styles.content, styles.centerContent]}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  const presentCount = submission.records.filter((r) => r.isPresent).length;
  const totalCount = submission.records.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>
          Attendance Details
        </Text>
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
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.date} bold>
              {new Date(submission.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
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
              <MaterialCommunityIcons
                name="book-education"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.summaryText}>{submission.programName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.summaryText}>{submission.batchName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.summaryText}>
                Submitted by {submission.submitterName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} bold>
            Student Records
          </Text>
          {submission.records.map((record, index) => (
            <View
              key={record.studentId}
              style={[
                styles.recordCard,
                index === submission.records.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={styles.recordInfo}>
                <Text style={styles.studentName} bold>
                  {record.studentName}
                </Text>
                <Text style={styles.studentId}>{record.studentId}</Text>
                <View style={styles.recordMeta}>
                  <MaterialCommunityIcons
                    name={
                      record.markedBy === "scan"
                        ? "barcode-scan"
                        : "gesture-tap"
                    }
                    size={16}
                    color={COLORS.textLight}
                  />
                  <Text style={styles.metaText}>
                    {record.markedBy === "scan" ? "Scanned" : "Manual"} at{" "}
                    {new Date(record.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  record.isPresent ? styles.presentBadge : styles.absentBadge,
                ]}
              >
                <MaterialCommunityIcons
                  name={record.isPresent ? "check" : "close"}
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.statusText} bold>
                  {record.isPresent ? "Present" : "Absent"}
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
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    gap: SPACING.xl,
  },
  statItem: {
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  recordCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  recordInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  recordMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
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
