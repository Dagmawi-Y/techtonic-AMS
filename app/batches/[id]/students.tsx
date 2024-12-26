import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { Text } from '../../../components';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
}

// Mock data - replace with actual API call
const mockStudents: Record<string, Student[]> = {
  '1': [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', enrollmentDate: '01/15/2024' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', enrollmentDate: '01/16/2024' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', enrollmentDate: '01/17/2024' },
  ],
};

export default function BatchStudentsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const students = mockStudents[id as string] || [];

  return (
    <View style={styles.container}>

      <ScrollView style={styles.studentList}>
        {students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={COLORS.primary}
              />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName} bold>{student.name}</Text>
                <Text style={styles.studentEmail}>{student.email}</Text>
              </View>
            </View>
            <View style={styles.studentDetails}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone" size={16} color={COLORS.secondary} />
                <Text style={styles.detailText}>{student.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={16} color={COLORS.secondary} />
                <Text style={styles.detailText}>Enrolled: {student.enrollmentDate}</Text>
              </View>
            </View>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
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
    flexDirection: 'row',
    alignItems: 'center',
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
  studentEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },
  studentDetails: {
    marginTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
  },
}); 