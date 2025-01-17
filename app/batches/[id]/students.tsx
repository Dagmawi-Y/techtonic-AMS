import React, { useState, useEffect, memo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../../constants/theme";
import { Text } from "../../../components";
import { db } from "../../../config/firebase";

interface Student {
  id: string;
  studentId: string;
  name: string;
  department: string;
  batch: {
    id: string;
    name: string;
  };
  programs: Array<{
    id: number;
    name: string;
  }>;
}

interface Batch {
  id: string;
  name: string;
  studentCount: number;
}

const EmptyState = memo(() => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons
      name="account-group-outline"
      size={80}
      color={COLORS.secondary}
      style={styles.emptyStateIcon}
    />
    <Text style={styles.emptyStateTitle} bold>
      No Students Yet
    </Text>
    <Text style={styles.emptyStateMessage}>
      This batch doesn't have any students enrolled yet
    </Text>
  </View>
));

const StudentItem = memo(({ student }: { student: Student }) => (
  <View style={styles.studentCard}>
    <View style={styles.studentHeader}>
      <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} bold>
          {student.name}
        </Text>
        <Text style={styles.studentId}>{student.studentId}</Text>
      </View>
      <View style={styles.departmentBadge}>
        <Text style={styles.departmentText} bold>
          {student.department}
        </Text>
      </View>
    </View>
    <View style={styles.studentDetails}>
      <View style={styles.detailRow}>
        <MaterialCommunityIcons
          name="book-open-variant"
          size={16}
          color={COLORS.secondary}
        />
        <Text style={styles.detailText}>
          {student.programs.length} Program
          {student.programs.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  </View>
));

export default function BatchStudentsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatchStudents = async () => {
    try {
      // Fetch batch details
      const batchDoc = await db
        .collection("batches")
        .doc(id as string)
        .get();

      if (!batchDoc.exists) {
        Alert.alert("Error", "Batch not found");
        router.back();
        return;
      }

      const batchData = batchDoc.data();
      if (batchData?.isDeleted) {
        Alert.alert("Error", "Batch not found");
        router.back();
        return;
      }

      setBatch({
        id: batchDoc.id,
        name: batchData?.name || "",
        studentCount: batchData?.studentCount || 0,
      });

      // Fetch students in this batch
      const studentsSnapshot = await db
        .collection("students")
        .where("batch.id", "==", id)
        .where("isDeleted", "==", false)
        .get();

      const fetchedStudents = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error fetching batch students:", error);
      Alert.alert("Error", "Failed to fetch students");
    }
  };

  useEffect(() => {
    fetchBatchStudents();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBatchStudents();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
    setRefreshing(false);
  };

  if (!batch) {
    return (
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={styles.loadingContainer}
          data={[]}
          renderItem={() => null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.loadingText}>Loading...</Text>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <Text style={styles.title} bold>
          {batch.name} - Students
        </Text>
      </View>

      <FlatList
        data={students}
        renderItem={({ item }) => <StudentItem student={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={students.length === 0 && { flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={<EmptyState />}
        style={styles.studentList}
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
  studentList: {
    padding: SPACING.md,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  studentInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  studentName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  departmentBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  departmentText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.xs,
  },
  studentDetails: {
    marginTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
  emptyStateMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: "center",
    maxWidth: 300,
  },
});
