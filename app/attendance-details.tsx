import React, { useState, useEffect, memo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
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
import { useBatchStore } from "../store/batchStore";

interface RawAttendanceRecord {
  studentId: string;
  isPresent: boolean;
  markedBy: "manual" | "scan";
  timestamp: string;
}

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
  totalRecords: number;
}

const STUDENTS_PER_PAGE = 20;

const StudentRecordItem = memo(({ record }: { record: AttendanceRecord }) => (
  <View style={styles.recordCard}>
    <View style={styles.recordInfo}>
      <Text style={styles.studentName} bold>
        {record.studentName}
      </Text>
      <Text style={styles.studentId}>{record.studentId}</Text>
      <View style={styles.recordMeta}>
        <MaterialCommunityIcons
          name={record.markedBy === "scan" ? "barcode-scan" : "gesture-tap"}
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
));

const calculateStats = (records: RawAttendanceRecord[]) => {
  const total = records.length;
  const present = records.filter((record) => record.isPresent).length;
  const absent = total - present;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
  return { total, present, absent, rate };
};

export default function AttendanceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [submission, setSubmission] = useState<AttendanceSubmission | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { batches } = useBatchStore();

  // Cache for program, user, and student data
  const [dataCache, setDataCache] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [allRecords, setAllRecords] = useState<any[]>([]);

  // Add stats state
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: "0.0",
  });

  const fetchStudentBatch = async (studentIds: string[]) => {
    const missingStudents = studentIds.filter(
      (id) => !dataCache[`student_${id}`]
    );

    if (missingStudents.length === 0) {
      return dataCache;
    }

    const newCache = { ...dataCache };
    const studentBatches = [];

    // Split into batches of 10 (Firestore limit)
    for (let i = 0; i < missingStudents.length; i += 10) {
      const batch = missingStudents.slice(i, i + 10);
      studentBatches.push(
        db.collection("students").where("__name__", "in", batch).get()
      );
    }

    const results = await Promise.all(studentBatches);
    results.forEach((batch) => {
      batch.docs.forEach((doc) => {
        if (doc.exists) {
          newCache[`student_${doc.id}`] = doc.data();
        }
      });
    });

    setDataCache(newCache);
    return newCache;
  };

  const loadMoreRecords = async () => {
    if (!hasMoreRecords || loadingMore || !submission) return;

    setLoadingMore(true);
    try {
      const startIndex = currentPage * STUDENTS_PER_PAGE;
      const endIndex = startIndex + STUDENTS_PER_PAGE;
      const nextPageRecords = allRecords.slice(startIndex, endIndex);

      if (nextPageRecords.length === 0) {
        setHasMoreRecords(false);
        return;
      }

      // Fetch student data for the next page
      const updatedCache = await fetchStudentBatch(
        nextPageRecords.map((record) => record.studentId)
      );

      const newRecords = nextPageRecords.map((record: RawAttendanceRecord) => ({
        studentId: record.studentId,
        studentName:
          (updatedCache || dataCache)[`student_${record.studentId}`]?.name ||
          "Unknown Student",
        isPresent: record.isPresent,
        markedBy: record.markedBy,
        timestamp: record.timestamp,
      }));

      setSubmission((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          records: [...prev.records, ...newRecords],
        };
      });

      setCurrentPage((prev) => prev + 1);
      setHasMoreRecords(endIndex < allRecords.length);
    } catch (error) {
      console.error("Error loading more records:", error);
      Alert.alert("Error", "Failed to load more records");
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
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

      // Store all records for pagination
      setAllRecords(data.records || []);
      // Calculate stats from all records
      setStats(calculateStats(data.records || []));
      setCurrentPage(0);
      setHasMoreRecords(true);

      // Collect IDs for initial page
      const initialRecords = (data.records || []).slice(0, STUDENTS_PER_PAGE);

      // Create a new cache with existing data
      const newCache = { ...dataCache };

      // Fetch program data
      const programDoc = await db
        .collection("programs")
        .doc(data.programId)
        .get();
      if (programDoc.exists) {
        newCache[`program_${data.programId}`] = programDoc.data();
      }

      // Fetch user data
      const userDoc = await db.collection("users").doc(data.createdBy).get();
      if (userDoc.exists) {
        newCache[`user_${data.createdBy}`] = userDoc.data();
      }

      // Fetch initial student batch and update cache
      const updatedCache = await fetchStudentBatch(
        initialRecords.map((record: RawAttendanceRecord) => record.studentId)
      );

      // Map the submission data with cached data for initial page
      const studentRecords = initialRecords.map(
        (record: RawAttendanceRecord) => ({
          studentId: record.studentId,
          studentName:
            updatedCache[`student_${record.studentId}`]?.name ||
            "Unknown Student",
          isPresent: record.isPresent,
          markedBy: record.markedBy,
          timestamp: record.timestamp,
        })
      );

      setSubmission({
        id: submissionDoc.id,
        date: data.date,
        batchId: data.batchId,
        batchName: batches[data.batchId]?.name || "Unknown Batch",
        programId: data.programId,
        programName:
          newCache[`program_${data.programId}`]?.name || "Unknown Program",
        submittedBy: data.createdBy,
        submitterName:
          newCache[`user_${data.createdBy}`]?.name || "Unknown User",
        records: studentRecords,
        totalRecords: data.records?.length || 0,
      });

      setCurrentPage(1);
      setHasMoreRecords(data.records?.length > STUDENTS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching attendance details:", error);
      Alert.alert("Error", "Failed to load attendance details");
    } finally {
      setLoading(false);
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

  if (!submission || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} bold>
            Attendance Details
          </Text>
        </View>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} bold>
          Attendance Details
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue} bold>
            {stats.present}
          </Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue} bold>
            {stats.absent}
          </Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue} bold>
            {stats.rate}%
          </Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
      </View>

      <FlatList
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
        ListHeaderComponent={() => (
          <>
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
                      {stats.present}/{stats.total}
                    </Text>
                    <Text style={styles.statLabel}>Present</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue} bold>
                      {stats.rate}%
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
                  <Text style={styles.summaryText}>
                    {submission.programName}
                  </Text>
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

            {/* <View style={styles.section}>
              <Text style={styles.sectionTitle} bold>
                Student Records ({submission.records.length} of {totalCount})
              </Text>
            </View> */}
          </>
        )}
        data={submission.records}
        keyExtractor={(item) => `${item.studentId}_${item.timestamp}`}
        renderItem={({ item: record }) => <StudentRecordItem record={record} />}
        ListFooterComponent={() =>
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasMoreRecords && !loadingMore) {
            loadMoreRecords();
          }
        }}
        onEndReachedThreshold={0.2}
        contentContainerStyle={styles.section}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
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
    flex: 1,
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
  loadingMore: {
    padding: SPACING.md,
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  statCard: {
    alignItems: "center",
  },
});
