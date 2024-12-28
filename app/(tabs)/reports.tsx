import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform as RNPlatform,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../../config/firebase';
import { useFocusEffect } from 'expo-router';

interface Program {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
}

interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface Report {
  id: string;
  batchId: string;
  batchName: string;
  programId: string;
  programName: string;
  startDate: string;
  endDate: string;
  records: AttendanceRecord[];
  summary: {
    totalSessions: number;
    averageAttendance: number;
    totalStudents: number;
  };
}

const FilterSection = memo(({ 
  selectedBatch,
  selectedProgram,
  onBatchChange,
  onProgramChange,
  batches,
  programs,
}: {
  selectedBatch: string;
  selectedProgram: string;
  onBatchChange: (batch: string) => void;
  onProgramChange: (program: string) => void;
  batches: Batch[];
  programs: Program[];
}) => {
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);

  const selectedBatchName = batches.find(b => b.id === selectedBatch)?.name || 'Select Batch';
  const selectedProgramName = programs.find(p => p.id === selectedProgram)?.name || 'Select Program';

  // Close dropdowns when clicking outside
  const handlePressOutside = useCallback(() => {
    setShowBatchDropdown(false);
    setShowProgramDropdown(false);
  }, []);

  return (
    <View style={styles.filterSection}>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            setShowBatchDropdown(!showBatchDropdown);
            setShowProgramDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <Text numberOfLines={1} style={styles.dropdownItemText}>
            {selectedBatchName}
          </Text>
          <MaterialCommunityIcons 
            name={showBatchDropdown ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={COLORS.text} 
          />
        </TouchableOpacity>
        {showBatchDropdown && (
          <>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={() => setShowBatchDropdown(false)} 
            />
            <ScrollView style={styles.dropdownList} bounces={false}>
              {batches.map(batch => (
                <TouchableOpacity
                  key={batch.id}
                  style={[
                    styles.dropdownItem,
                    selectedBatch === batch.id && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onBatchChange(batch.id);
                    setShowBatchDropdown(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.dropdownItemText,
                      selectedBatch === batch.id && styles.dropdownItemTextSelected
                    ]} 
                    numberOfLines={1}
                    bold
                  >
                    {batch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </View>

      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            setShowProgramDropdown(!showProgramDropdown);
            setShowBatchDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <Text numberOfLines={1} style={styles.dropdownItemText}>
            {selectedProgramName}
          </Text>
          <MaterialCommunityIcons 
            name={showProgramDropdown ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={COLORS.text} 
          />
        </TouchableOpacity>
        {showProgramDropdown && (
          <>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={() => setShowProgramDropdown(false)} 
            />
            <ScrollView style={styles.dropdownList} bounces={false}>
              {programs.map(program => (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.dropdownItem,
                    selectedProgram === program.id && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onProgramChange(program.id);
                    setShowProgramDropdown(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.dropdownItemText,
                      selectedProgram === program.id && styles.dropdownItemTextSelected
                    ]} 
                    numberOfLines={1}
                    bold
                  >
                    {program.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
});

const ChartSection = memo(({ report }: { report: Report }) => {
  // Format date for x-axis labels
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return { month, day, year };
  };

  // Prepare data for charts with improved formatting
  const barData = report.records.map((record, index, array) => {
    const { month, day, year } = formatDate(record.date);
    const prevYear = index > 0 ? formatDate(array[index - 1].date).year : year;
    
    return {
      value: record.percentage,
      label: `${month} ${day}`,
      frontColor: COLORS.primary,
      // Add year separator
      yearSeparator: year !== prevYear,
      year: year,
    };
  });

  const pieData = [
    { value: report.summary.averageAttendance, color: COLORS.primary, text: 'Present' },
    { value: 100 - report.summary.averageAttendance, color: COLORS.error, text: 'Absent' },
  ];

  const lineData = report.records.map(record => {
    const { month, day } = formatDate(record.date);
    return {
      value: record.percentage,
      dataPointText: `${record.percentage}%`,
      label: `${month} ${day}`,
    };
  });

  return (
    <View style={styles.chartSection}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle} bold>Attendance Trend</Text>
        <View style={styles.chartWrapper}>
          <BarChart
            data={barData}
            width={300}
            height={200}
            barWidth={30}
            spacing={20}
            barBorderRadius={4}
            frontColor={COLORS.primary}
            yAxisThickness={1}
            xAxisThickness={1}
            hideRules={false}
            xAxisLabelTextStyle={styles.xAxisLabel}
            yAxisTextStyle={styles.xAxisLabel}
            noOfSections={5}
            maxValue={100}
            yAxisLabelSuffix="%"
          />
          <Text style={styles.xAxisLabel}>Date</Text>
          <View style={styles.yAxisLabelContainer}>
            <Text style={styles.yAxisLabel}>Attendance Percentage</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle} bold>Overall Attendance</Text>
        <View style={styles.pieChartContainer}>
          <PieChart
            data={pieData}
            donut
            radius={80}
            innerRadius={60}
            showText
            textColor={COLORS.white}
            textSize={12}
            centerLabelComponent={() => (
              <View style={styles.pieChartCenter}>
                <Text style={styles.pieChartLabel} bold>
                  {report.summary.averageAttendance}%
                </Text>
                <Text style={styles.pieChartSubLabel}>Average</Text>
              </View>
            )}
          />
          <View style={styles.legend}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle} bold>Attendance Progress</Text>
        <View style={styles.chartWrapper}>
          <LineChart
            data={lineData}
            width={300}
            height={200}
            spacing={40}
            color={COLORS.primary}
            thickness={2}
            startFillColor={COLORS.primary}
            endFillColor={COLORS.background}
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={20}
            noOfSections={5}
            maxValue={100}
            yAxisLabelSuffix="%"
            yAxisThickness={1}
            xAxisThickness={1}
            hideRules={false}
            xAxisLabelTextStyle={styles.xAxisLabel}
            yAxisTextStyle={styles.xAxisLabel}
            rulesType="solid"
            rulesColor={COLORS.border}
            yAxisLabelWidth={40}
          />
          <Text style={styles.xAxisLabel}>Date</Text>
          <View style={styles.yAxisLabelContainer}>
            <Text style={styles.yAxisLabel}>Attendance Percentage</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const ReportCard = memo(({ 
  report,
  onExportPDF,
  onExportCSV,
}: {
  report: Report;
  onExportPDF: () => void;
  onExportCSV: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.reportCard}>
      <TouchableOpacity
        style={styles.reportHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View>
          <Text style={styles.reportTitle} bold>{report.batchName}</Text>
          <Text style={styles.reportSubtitle}>{report.programName}</Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.reportContent}>
          <View style={styles.summarySection}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.summaryValue} bold>{report.summary.totalSessions}</Text>
              <Text style={styles.summaryLabel}>Sessions</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
              <Text style={styles.summaryValue} bold>{report.summary.totalStudents}</Text>
              <Text style={styles.summaryLabel}>Students</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="percent" size={24} color={COLORS.primary} />
              <Text style={styles.summaryValue} bold>{report.summary.averageAttendance}%</Text>
              <Text style={styles.summaryLabel}>Average</Text>
            </View>
          </View>

          {isExpanded && <ChartSection report={report} />}

          <View style={styles.exportSection}>
            <TouchableOpacity
              style={[styles.exportButton, styles.pdfButton]}
              onPress={onExportPDF}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={24} color={COLORS.white} />
              <Text style={styles.exportButtonText} bold>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, styles.csvButton]}
              onPress={onExportCSV}
            >
              <MaterialCommunityIcons name="file-excel" size={24} color={COLORS.white} />
              <Text style={styles.exportButtonText} bold>Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

export default function ReportsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatches = async () => {
    try {
      const batchesSnapshot = await db.collection('batches')
        .where('isDeleted', '==', false)
        .get();
      const fetchedBatches = batchesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      })) as Batch[];
      setBatches(fetchedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to fetch batches');
    }
  };

  const fetchPrograms = async () => {
    try {
      const programsSnapshot = await db.collection('programs')
        .where('isDeleted', '==', false)
        .get();
      const fetchedPrograms = programsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      })) as Program[];
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    }
  };

  const fetchReports = async () => {
    try {
      const attendanceSnapshot = await db.collection('attendance')
        .orderBy('createdAt', 'desc')
        .get();

      const reportMap = new Map<string, Report>();

      for (const doc of attendanceSnapshot.docs) {
        const data = doc.data();
        const batchId = data.batchId;
        const programId = data.programId;
        const date = data.date;

        // Get batch and program details
        const batchDoc = await db.collection('batches').doc(batchId).get();
        const programDoc = await db.collection('programs').doc(programId).get();
        
        if (!batchDoc.exists || !programDoc.exists) continue;

        const batchData = batchDoc.data();
        const programData = programDoc.data();

        const reportKey = `${batchId}-${programId}`;
        let report = reportMap.get(reportKey);

        if (!report) {
          report = {
            id: doc.id,
            batchId,
            batchName: batchData?.name || '',
            programId,
            programName: programData?.name || '',
            startDate: date,
            endDate: date,
            records: [],
            summary: {
              totalSessions: 0,
              averageAttendance: 0,
              totalStudents: batchData?.studentCount || 0,
            },
          };
          reportMap.set(reportKey, report);
        }

        // Update date range
        if (date < report.startDate) report.startDate = date;
        if (date > report.endDate) report.endDate = date;

        // Calculate attendance for this session
        const presentCount = data.records.filter((r: any) => r.isPresent).length;
        const totalCount = data.records.length;
        const absentCount = totalCount - presentCount;
        const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

        report.records.push({
          date,
          present: presentCount,
          absent: absentCount,
          total: totalCount,
          percentage,
        });

        // Update summary
        report.summary.totalSessions = report.records.length;
        report.summary.averageAttendance = report.records.reduce((sum, r) => sum + r.percentage, 0) / report.records.length;
      }

      setReports(Array.from(reportMap.values()));
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to fetch reports');
    }
  };

  const fetchInitialData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchBatches(),
        fetchPrograms(),
        fetchReports(),
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

  const handleExportPDF = useCallback(() => {
    // TODO: Implement PDF export
    Alert.alert('Coming Soon', 'PDF export will be available in a future update');
  }, []);

  const handleExportCSV = useCallback(() => {
    // TODO: Implement CSV export
    Alert.alert('Coming Soon', 'CSV export will be available in a future update');
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.programName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = !selectedBatch || report.batchId === selectedBatch;
    const matchesProgram = !selectedProgram || report.programId === selectedProgram;
    return matchesSearch && matchesBatch && matchesProgram;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={COLORS.primary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filters}>
        <FilterSection
          selectedBatch={selectedBatch}
          selectedProgram={selectedProgram}
          onBatchChange={setSelectedBatch}
          onProgramChange={setSelectedProgram}
          batches={batches}
          programs={programs}
        />
      </View>

      <ScrollView style={styles.content}>
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color={COLORS.gray}
            />
            <Text style={styles.emptyStateTitle} bold>No Reports Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your filters or search query
            </Text>
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
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filters: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    zIndex: 2,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  datePickerContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  datePicker: {
    backgroundColor: COLORS.lightGray,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  reportTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  reportSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  reportContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  chartSection: {
    marginBottom: SPACING.lg,
  },
  chartContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  pieChartLabel: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  exportSection: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.sm,
  },
  pdfButton: {
    backgroundColor: COLORS.error,
  },
  csvButton: {
    backgroundColor: COLORS.success,
  },
  exportButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
    ...SHADOWS.medium,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.lightGray,
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
  },
  chartWrapper: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  xAxisLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  yAxisLabelContainer: {
    position: 'absolute',
    left: -SPACING.xl,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
  },
  yAxisLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  tooltip: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.medium,
  },
  tooltipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartCenter: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  pieChartSubLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
}); 