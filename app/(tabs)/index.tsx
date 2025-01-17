import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { Text } from "../../components";
import { router, useFocusEffect } from "expo-router";
import { db } from "../../config/firebase";
import { useAuthStore } from "../../store/authStore";
import { useState, useCallback, useEffect, useRef } from "react";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ActivityItemProps {
  type: "attendance" | "registration" | "batch";
  description: string;
  time: string;
}

interface Stats {
  batches: number;
  programs: number;
  students: number;
  attendance: number;
}

interface Activity {
  id: string;
  type: "attendance" | "registration" | "batch";
  description: string;
  time: string;
  timestamp: Date;
}

const ActivitySkeleton = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.activityItem}>
      <Animated.View style={[styles.skeletonIcon, { opacity }]} />
      <View style={styles.activityContent}>
        <Animated.View
          style={[styles.skeletonText, styles.skeletonTitle, { opacity }]}
        />
        <Animated.View
          style={[styles.skeletonText, styles.skeletonSubtitle, { opacity }]}
        />
      </View>
    </View>
  );
};

const StatSkeleton = ({ title, icon }: Omit<StatCardProps, "value">) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={32} color={COLORS.primary} />
      <Animated.View
        style={[styles.skeletonText, styles.skeletonStatValue, { opacity }]}
      />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
};

const EmptyActivity = () => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons
      name="calendar-blank"
      size={48}
      color={COLORS.textLight}
      style={styles.emptyIcon}
    />
    <Text style={styles.emptyText}>No recent activity</Text>
    <Text style={styles.emptySubtext}>
      Activities will appear here as you use the app
    </Text>
  </View>
);

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    batches: 0,
    programs: 0,
    students: 0,
    attendance: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds cooldown

  const fetchStats = async () => {
    try {
      // Check if we have recent stats in cache
      const now = Date.now();
      if (now - lastFetchRef.current < FETCH_COOLDOWN && stats.batches > 0) {
        return;
      }

      // Fetch all stats in parallel
      const [batchesSnapshot, programsSnapshot, studentsSnapshot] =
        await Promise.all([
          db.collection("batches").where("isDeleted", "==", false).get(),
          db.collection("programs").where("isDeleted", "==", false).get(),
          db.collection("students").where("isDeleted", "==", false).get(),
        ]);

      // Calculate counts
      const batchesCount = batchesSnapshot.size;
      const programsCount = programsSnapshot.size;
      const studentsCount = studentsSnapshot.size;

      // Fetch this week's attendance
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to start of week (Sunday)

      const attendanceSnapshot = await db
        .collection("attendance")
        // .where("date", ">=", startOfWeek.toISOString())
        .orderBy("date", "desc")
        .get();

      // Calculate average attendance more efficiently
      const attendanceStats = attendanceSnapshot.docs.reduce(
        (acc, doc) => {
          const data = doc.data();
          const records = data.records || [];
          if (records.length > 0) {
            const presentCount = records.filter((r: any) => r.isPresent).length;
            acc.totalAttendance += (presentCount / records.length) * 100;
            acc.totalRecords++;
          }
          return acc;
        },
        { totalAttendance: 0, totalRecords: 0 }
      );

      const averageAttendance =
        attendanceStats.totalRecords > 0
          ? Math.round(
              attendanceStats.totalAttendance / attendanceStats.totalRecords
            )
          : 0;

      setStats({
        batches: batchesCount,
        programs: programsCount,
        students: studentsCount,
        attendance: averageAttendance,
      });

      lastFetchRef.current = now;
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Check if we have recent activity in cache
      const now = Date.now();
      if (
        now - lastFetchRef.current < FETCH_COOLDOWN &&
        recentActivity.length > 0
      ) {
        return;
      }

      setIsLoading(true);

      // Get recent attendance records with specific fields only
      const attendanceSnapshot = await db
        .collection("attendance")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (attendanceSnapshot.empty) {
        setRecentActivity([]);
        return;
      }

      // Get unique batch and program IDs
      const batchIds = new Set<string>();
      const programIds = new Set<string>();

      attendanceSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        batchIds.add(data.batchId);
        programIds.add(data.programId);
      });

      // Fetch all required batches and programs in parallel
      const [batchDocs, programDocs] = await Promise.all([
        db
          .collection("batches")
          .where("__name__", "in", Array.from(batchIds))
          .get(),
        db
          .collection("programs")
          .where("__name__", "in", Array.from(programIds))
          .get(),
      ]);

      // Create lookup maps for batch and program data
      const batchMap = new Map(
        batchDocs.docs.map(
          (doc) => [doc.id, doc.data().name] as [string, string]
        )
      );
      const programMap = new Map(
        programDocs.docs.map(
          (doc) => [doc.id, doc.data().name] as [string, string]
        )
      );

      // Map attendance records to activities
      const activities = attendanceSnapshot.docs.map((doc) => {
        const data = doc.data();
        const batchName = batchMap.get(data.batchId) || "Unknown Batch";
        const programName = programMap.get(data.programId) || "Unknown Program";

        return {
          id: doc.id,
          type: "attendance" as const,
          description: `Attendance marked for ${batchName} - ${programName}`,
          timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          time: getTimeAgo(
            data.createdAt ? new Date(data.createdAt) : new Date()
          ),
        };
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  const fetchInitialData = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchRecentActivity()]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
    setRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch on focus only if enough time has passed
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current >= FETCH_COOLDOWN) {
        fetchInitialData();
      }
    }, [])
  );

  const StatCard = ({ title, value, icon }: StatCardProps) => {
    const handlePress = () => {
      switch (title.toLowerCase()) {
        case "batches":
          router.push("/batches");
          break;
        case "programs":
          router.push("/programs");
          break;
        case "students":
          router.push("/students");
          break;
        case "attendance overall %":
          router.push("/reports");
          break;
      }
    };

    return (
      <TouchableOpacity style={styles.statCard} onPress={handlePress}>
        <MaterialCommunityIcons name={icon} size={32} color={COLORS.primary} />
        <Text style={styles.statValue} bold>
          {value}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const ActivityItem = ({ type, description, time }: ActivityItemProps) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <MaterialCommunityIcons
          name={
            type === "attendance"
              ? "calendar-check"
              : type === "registration"
              ? "account-plus"
              : "school"
          }
          size={24}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{description}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchInitialData}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText} bold>
          Welcome, {user?.name || "Admin"}!
        </Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.statsContainer}>
        {isLoading ? (
          <>
            <StatSkeleton title="Batches" icon="account-group" />
            <StatSkeleton title="Programs" icon="book-open-variant" />
            <StatSkeleton title="Students" icon="account-multiple" />
            <StatSkeleton title="Attendance Overall %" icon="chart-line" />
          </>
        ) : (
          <>
            <StatCard
              title="Batches"
              value={stats.batches}
              icon="account-group"
            />
            <StatCard
              title="Programs"
              value={stats.programs}
              icon="book-open-variant"
            />
            <StatCard
              title="Students"
              value={stats.students}
              icon="account-multiple"
            />
            <StatCard
              title="Attendance Overall %"
              value={stats.attendance}
              icon="chart-line"
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} bold>
          Recent Activity
        </Text>
        {isLoading ? (
          <>
            <ActivitySkeleton />
            <ActivitySkeleton />
            <ActivitySkeleton />
          </>
        ) : recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <ActivityItem key={activity.id} {...activity} />
          ))
        ) : (
          <EmptyActivity />
        )}
      </View>

      <View style={{ ...styles.section, marginBottom: "5%" }}>
        <Text style={styles.sectionTitle} bold>
          Quick Actions
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() =>
              router.push({
                pathname: "/students",
                params: { action: "add" },
              })
            }
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>
              Add Student
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() =>
              router.push({
                pathname: "/attendance",
                params: { action: "mark" },
              })
            }
          >
            <MaterialCommunityIcons
              name="calendar-plus"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>
              Mark Attendance
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.quickActions, { marginTop: SPACING.md }]}>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: COLORS.primary },
            ]}
            onPress={() =>
              router.push({
                pathname: "/batches",
                params: { action: "create" },
              })
            }
          >
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>
              Create Batch
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: COLORS.primary },
            ]}
            onPress={() =>
              router.push({
                pathname: "/programs",
                params: { action: "create" },
              })
            }
          >
            <MaterialCommunityIcons
              name="book-open-variant"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>
              Create Program
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    minHeight: 100,
    backgroundColor: COLORS.primary,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: SPACING.sm,
    marginTop: -SPACING.xl,
    minHeight: 160,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    margin: "1%",
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    ...SHADOWS.medium,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  statTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: "center",
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  activityTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    flex: 0.48,
    backgroundColor: COLORS.secondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  quickActionText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.md,
  },
  skeletonText: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonTitle: {
    width: "70%",
    height: 16,
    marginBottom: SPACING.xs,
  },
  skeletonSubtitle: {
    width: "40%",
    height: 14,
  },
  skeletonStatValue: {
    width: "40%",
    height: 24,
    marginVertical: SPACING.xs,
  },
  skeletonStatTitle: {
    width: "60%",
    height: 14,
  },
  emptyContainer: {
    alignItems: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: "center",
  },
});
