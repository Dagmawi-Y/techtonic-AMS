import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  total: number;
}

interface BatchReport {
  id: string;
  name: string;
  program: string;
  attendanceData: AttendanceData[];
}

const mockReports: BatchReport[] = [
  {
    id: '1',
    name: '2024 Batch',
    program: 'Bootstrap Workshop',
    attendanceData: [
      {
        date: '2024-01-01',
        present: 22,
        absent: 3,
        total: 25,
      },
      {
        date: '2024-01-02',
        present: 20,
        absent: 5,
        total: 25,
      },
      {
        date: '2024-01-03',
        present: 24,
        absent: 1,
        total: 25,
      },
    ],
  },
  {
    id: '2',
    name: '2024 Batch',
    program: 'Mobile App Bootcamp',
    attendanceData: [
      {
        date: '2024-02-01',
        present: 18,
        absent: 2,
        total: 20,
      },
      {
        date: '2024-02-02',
        present: 19,
        absent: 1,
        total: 20,
      },
    ],
  },
];

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<BatchReport | null>(null);

  const calculateAttendancePercentage = (present: number, total: number) => {
    return ((present / total) * 100).toFixed(1);
  };

  const ReportCard = ({ report }: { report: BatchReport }) => {
    const isSelected = selectedReport?.id === report.id;
    const totalPresent = report.attendanceData.reduce(
      (sum, data) => sum + data.present,
      0
    );
    const totalSessions = report.attendanceData.length;
    const averageAttendance = calculateAttendancePercentage(
      totalPresent,
      report.attendanceData.reduce((sum, data) => sum + data.total, 0)
    );

    return (
      <TouchableOpacity
        style={[styles.reportCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedReport(isSelected ? null : report)}
      >
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.batchName}>{report.name}</Text>
            <Text style={styles.programName}>{report.program}</Text>
          </View>
          <MaterialCommunityIcons
            name={isSelected ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.reportSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalSessions}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{averageAttendance}%</Text>
            <Text style={styles.summaryLabel}>Attendance</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.detailedReport}>
            <View style={styles.reportTableHeader}>
              <Text style={[styles.tableCell, styles.dateCell]}>Date</Text>
              <Text style={styles.tableCell}>Present</Text>
              <Text style={styles.tableCell}>Absent</Text>
              <Text style={styles.tableCell}>%</Text>
            </View>
            {report.attendanceData.map((data, index) => (
              <View key={index} style={styles.reportTableRow}>
                <Text style={[styles.tableCell, styles.dateCell]}>
                  {new Date(data.date).toLocaleDateString()}
                </Text>
                <Text style={styles.tableCell}>{data.present}</Text>
                <Text style={styles.tableCell}>{data.absent}</Text>
                <Text style={styles.tableCell}>
                  {calculateAttendancePercentage(data.present, data.total)}%
                </Text>
              </View>
            ))}
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={[styles.exportButton, styles.pdfButton]}
              >
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, styles.csvButton]}
              >
                <MaterialCommunityIcons
                  name="file-excel"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Reports</Text>
        <Text style={styles.subtitle}>
          View and export attendance reports by batch and program
        </Text>
      </View>

      <ScrollView style={styles.reportList}>
        {mockReports.map((report) => (
          <ReportCard key={report.id} report={report} />
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
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  reportList: {
    padding: SPACING.md,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  programName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  reportSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  detailedReport: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  reportTableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  reportTableRow: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  dateCell: {
    flex: 1.5,
    textAlign: 'left',
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  exportButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  pdfButton: {
    backgroundColor: COLORS.error,
  },
  csvButton: {
    backgroundColor: COLORS.secondary,
  },
  exportButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
}); 