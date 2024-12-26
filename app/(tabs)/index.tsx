import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ActivityItemProps {
  type: 'attendance' | 'registration' | 'batch';
  description: string;
  time: string;
}

const mockData = {
  stats: {
    batches: 2,
    programs: 4,
    students: 45,
    attendance: 92,
  },
  recentActivity: [
    {
      id: 1,
      type: 'attendance' as const,
      description: 'John Doe marked present in Bootstrap Workshop',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'registration' as const,
      description: 'New student Jane Smith registered',
      time: '4 hours ago',
    },
    {
      id: 3,
      type: 'batch' as const,
      description: 'Mobile App Bootcamp session completed',
      time: '1 day ago',
    },
  ],
};

export default function DashboardScreen() {
  const StatCard = ({ title, value, icon }: StatCardProps) => (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={32} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const ActivityItem = ({ type, description, time }: ActivityItemProps) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <MaterialCommunityIcons
          name={
            type === 'attendance'
              ? 'calendar-check'
              : type === 'registration'
              ? 'account-plus'
              : 'school'
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, Admin!</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Batches"
          value={mockData.stats.batches}
          icon="account-group"
        />
        <StatCard
          title="Programs"
          value={mockData.stats.programs}
          icon="book-open-variant"
        />
        <StatCard
          title="Students"
          value={mockData.stats.students}
          icon="account-multiple"
        />
        <StatCard
          title="Attendance %"
          value={mockData.stats.attendance}
          icon="chart-line"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {mockData.recentActivity.map((activity) => (
          <ActivityItem key={activity.id} {...activity} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialCommunityIcons
              name="account-plus"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText}>Add Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialCommunityIcons
              name="calendar-plus"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText}>Mark Attendance</Text>
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
    backgroundColor: COLORS.primary,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    marginTop: -SPACING.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    margin: '1%',
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  statTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 0.48,
    backgroundColor: COLORS.secondary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickActionText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
}); 