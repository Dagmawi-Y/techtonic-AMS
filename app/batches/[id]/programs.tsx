import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import { Text } from '../../../components';

interface Program {
  id: string;
  name: string;
  description: string;
  duration: string;
}

// Mock data - replace with actual API call
const mockPrograms: Record<string, Program[]> = {
  '1': [
    { id: '1', name: 'Web Development', description: 'Full stack web development course', duration: '6 months' },
    { id: '2', name: 'Mobile Development', description: 'Cross-platform mobile development', duration: '4 months' },
    { id: '3', name: 'UI/UX Design', description: 'User interface and experience design', duration: '3 months' },
  ],
};

export default function BatchProgramsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const programs = mockPrograms[id as string] || [];

  return (
    <View style={styles.container}>

      <ScrollView style={styles.programList}>
        {programs.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={24}
                color={COLORS.primary}
              />
              <View style={styles.programInfo}>
                <Text style={styles.programName} bold>{program.name}</Text>
                <Text style={styles.programDuration}>{program.duration}</Text>
              </View>
            </View>
            <Text style={styles.programDescription}>{program.description}</Text>
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
}); 