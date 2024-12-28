import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text } from '../../components';
import { router, useFocusEffect } from 'expo-router';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';
import { useState, useCallback, useEffect } from 'react';

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

interface Stats {
  batches: number;
  programs: number;
  students: number;
  attendance: number;
}

interface Activity {
  id: string;
  type: 'attendance' | 'registration' | 'batch';
  description: string;
  time: string;
  timestamp: Date;
}

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

  const fetchStats = async () => {
    try {
      // Fetch active batches count
      const batchesSnapshot = await db.collection('batches')
        .where('isDeleted', '==', false)
        .get();
      const batchesCount = batchesSnapshot.size;

      // Fetch active programs count
      const programsSnapshot = await db.collection('programs')
        .where('isDeleted', '==', false)
        .get();
      const programsCount = programsSnapshot.size;

      // Fetch active students count
      const studentsSnapshot = await db.collection('students')
        .where('isDeleted', '==', false)
        .get();
      const studentsCount = studentsSnapshot.size;

      // Calculate average attendance
      const attendanceSnapshot = await db.collection('attendance')
        .orderBy('createdAt', 'desc')
        .limit(100) // Get last 100 attendance records
        .get();

      let totalAttendance = 0;
      let totalRecords = 0;

      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const records = data.records || [];
        const presentCount = records.filter((r: any) => r.isPresent).length;
        const totalCount = records.length;
        if (totalCount > 0) {
          totalAttendance += (presentCount / totalCount) * 100;
          totalRecords++;
        }
      });

      const averageAttendance = totalRecords > 0 
        ? Math.round(totalAttendance / totalRecords) 
        : 0;

      setStats({
        batches: batchesCount,
        programs: programsCount,
        students: studentsCount,
        attendance: averageAttendance,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities: Activity[] = [];

      // Fetch recent attendance records
      const attendanceSnapshot = await db.collection('attendance')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      for (const doc of attendanceSnapshot.docs) {
        const data = doc.data();
        const batchDoc = await db.collection('batches').doc(data.batchId).get();
        const programDoc = await db.collection('programs').doc(data.programId).get();
        
        if (batchDoc.exists && programDoc.exists) {
          const batchName = batchDoc.data()?.name;
          const programName = programDoc.data()?.name;
          
          activities.push({
            id: doc.id,
            type: 'attendance',
            description: `Attendance marked for ${batchName} - ${programName}`,
            timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
            time: getTimeAgo(data.createdAt ? new Date(data.createdAt) : new Date()),
          });
        }
      }

      // Fetch recent student registrations
      const studentsSnapshot = await db.collection('students')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      for (const doc of studentsSnapshot.docs) {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'registration',
          description: `New student ${data.name} registered`,
          timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          time: getTimeAgo(data.createdAt ? new Date(data.createdAt) : new Date()),
        });
      }

      // Fetch recent batch creations
      const batchesSnapshot = await db.collection('batches')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      for (const doc of batchesSnapshot.docs) {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'batch',
          description: `New batch ${data.name} created`,
          timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          time: getTimeAgo(data.createdAt ? new Date(data.createdAt) : new Date()),
        });
      }

      // Sort activities by timestamp and take the most recent 5
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const fetchInitialData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Add useFocusEffect for automatic refetch
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const StatCard = ({ title, value, icon }: StatCardProps) => {
    const handlePress = () => {
      switch (title.toLowerCase()) {
        case 'batches':
          router.push('/batches');
          break;
        case 'programs':
          router.push('/programs');
          break;
        case 'students':
          router.push('/students');
          break;
        case 'attendance %':
          router.push('/reports');
          break;
      }
    };

    return (
      <TouchableOpacity style={styles.statCard} onPress={handlePress}>
        <MaterialCommunityIcons name={icon} size={32} color={COLORS.primary} />
        <Text style={styles.statValue} bold>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.welcomeText} bold>Welcome, {user?.name || 'Admin'}!</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.statsContainer}>
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
          title="Attendance %"
          value={stats.attendance}
          icon="chart-line"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} bold>Recent Activity</Text>
        {recentActivity.map((activity) => (
          <ActivityItem key={activity.id} {...activity} />
        ))}
      </View>

      <View style={{...styles.section, marginBottom: '5%'}}>
        <Text style={styles.sectionTitle} bold>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push({
              pathname: '/students',
              params: { action: 'add' }
            })}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>Add Student</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push({
              pathname: '/attendance',
              params: { action: 'mark' }
            })}
          >
            <MaterialCommunityIcons
              name="calendar-plus"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>Mark Attendance</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.quickActions, { marginTop: SPACING.md }]}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: COLORS.primary }]}
            onPress={() => router.push({
              pathname: '/batches',
              params: { action: 'create' }
            })}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>Create Batch</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: COLORS.primary }]}
            onPress={() => router.push({
              pathname: '/programs',
              params: { action: 'create' }
            })}
          >
            <MaterialCommunityIcons
              name="book-open-variant"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.quickActionText} bold>Create Program</Text>
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
    height: '12%',
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
    ...SHADOWS.small,
  },
  quickActionText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
}); 