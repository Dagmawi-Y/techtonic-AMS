import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
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
import { useRouter } from "expo-router";
import { db } from "../config/firebase";
import { useBatchStore } from "../store/batchStore";

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

const ITEMS_PER_PAGE = 10;

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<AttendanceSubmission[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { batches, setBatches } = useBatchStore();

  // Cache for program and user data to avoid duplicate queries
  const [programCache, setProgramCache] = useState<Record<string, any>>({});
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  const fetchSubmissions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLastDoc(null);
        setHasMore(true);
      }

      // First, fetch all batches and update the batch store
      const batchesSnapshot = await db
        .collection("batches")
        .where("isDeleted", "==", false)
        .get();

      const batchesData: Record<string, any> = {};
      batchesSnapshot.docs.forEach((doc) => {
        batchesData[doc.id] = {
          id: doc.id,
          ...doc.data(),
        };
      });
      setBatches(batchesData);

      let query = db
        .collection("attendance")
        .orderBy("createdAt", "desc")
        .limit(ITEMS_PER_PAGE);

      if (!isRefresh && lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const attendanceSnapshot = await query.get();

      if (attendanceSnapshot.empty) {
        setHasMore(false);
        if (isRefresh) setSubmissions([]);
        return;
      }

      // Update lastDoc for pagination
      setLastDoc(attendanceSnapshot.docs[attendanceSnapshot.docs.length - 1]);

      // Collect all unique IDs that need to be fetched
      const programIds = new Set<string>();
      const userIds = new Set<string>();

      attendanceSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!programCache[data.programId]) {
          programIds.add(data.programId);
        }
        if (!userCache[data.createdBy]) {
          userIds.add(data.createdBy);
        }
      });

      // Fetch all missing data in parallel
      const [programDocs, userDocs] = await Promise.all([
        Promise.all(
          Array.from(programIds).map((id) =>
            db.collection("programs").doc(id).get()
          )
        ),
        Promise.all(
          Array.from(userIds).map((id) => db.collection("users").doc(id).get())
        ),
      ]);

      // Update caches with new data
      const newProgramCache = { ...programCache };
      programDocs.forEach((doc) => {
        if (doc.exists) {
          newProgramCache[doc.id] = doc.data();
        }
      });
      setProgramCache(newProgramCache);

      const newUserCache = { ...userCache };
      userDocs.forEach((doc) => {
        if (doc.exists) {
          newUserCache[doc.id] = doc.data();
        }
      });
      setUserCache(newUserCache);

      // Map submissions with complete cache data
      const fetchedSubmissions = attendanceSnapshot.docs.map((doc) => {
        const data = doc.data();
        const batch = batchesData[data.batchId];
        const program = newProgramCache[data.programId];
        const user = newUserCache[data.createdBy];

        const presentCount = data.records.filter(
          (r: any) => r.isPresent
        ).length;
        const totalCount = data.records.length;

        return {
          id: doc.id,
          date: data.date,
          batchId: data.batchId,
          batchName: batch?.name || "Unknown Batch",
          programId: data.programId,
          programName: program?.name || "Unknown Program",
          presentCount,
          totalCount,
          submittedBy: user?.name || "Unknown User",
          createdAt: data.createdAt,
        } as AttendanceSubmission;
      });

      setSubmissions((prev) =>
        isRefresh ? fetchedSubmissions : [...prev, ...fetchedSubmissions]
      );
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      Alert.alert("Error", "Failed to load attendance history");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchSubmissions();
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} bold>
            Attendance History
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
          Attendance History
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
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 50;
          if (isCloseToBottom && hasMore && !isLoadingMore) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {submissions.map((submission) => (
          <TouchableOpacity
            key={submission.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/attendance-details",
                params: { id: submission.id },
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.date} bold>
                {new Date(submission.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
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
                <Text style={styles.programName} bold>
                  {submission.programName}
                </Text>
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
                    {Math.round(
                      (submission.presentCount / submission.totalCount) * 100
                    )}
                    %
                  </Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>
              </View>

              <Text style={styles.submittedBy}>
                Submitted by {submission.submittedBy}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {isLoadingMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}

        {!hasMore && submissions.length > 0 && (
          <Text style={styles.noMoreData}>No more records to load</Text>
        )}

        {submissions.length === 0 && (
          <View style={styles.emptyState}>
            <Text>No attendance records found</Text>
          </View>
        )}
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
    ...SHADOWS.medium,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.white,
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
    padding: SPACING.sm,
  },
  card: {
    ...SHADOWS.small,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  date: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  cardContent: {
    gap: SPACING.sm,
  },
  programInfo: {
    gap: SPACING.xs,
  },
  programName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  batchName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  attendanceStats: {
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  submittedBy: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMore: {
    padding: SPACING.md,
    alignItems: "center",
  },
  noMoreData: {
    textAlign: "center",
    padding: SPACING.md,
    color: COLORS.textLight,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: "center",
  },
});
