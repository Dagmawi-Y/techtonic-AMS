import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text } from '../../components';

interface Program {
  id: number;
  name: string;
  description: string;
  batches: number;
  students: number;
}

const mockPrograms: Program[] = [
  {
    id: 1,
    name: 'Web Development',
    description: 'Full stack web development with modern technologies',
    batches: 2,
    students: 25,
  },
  {
    id: 2,
    name: 'Mobile App Development',
    description: 'Cross-platform mobile app development',
    batches: 1,
    students: 15,
  },
];

export default function ProgramsScreen() {
  const ProgramCard = ({ program }: { program: Program }) => (
    <TouchableOpacity style={styles.programCard}>
      <View style={styles.programHeader}>
        <Text style={styles.programName} bold>{program.name}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.programDescription}>{program.description}</Text>
      <View style={styles.programStats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
          <Text style={styles.statText}>{program.batches} Batches</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="account-multiple" size={20} color={COLORS.primary} />
          <Text style={styles.statText}>{program.students} Students</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} bold>Programs</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockPrograms.map((program) => (
          <ProgramCard key={program.id} program={program} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  programCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  programDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  programStats: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
}); 