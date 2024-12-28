import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import { useRouter } from 'expo-router';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';

interface Program {
  id: string;
  name: string;
  description: string;
}

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Student {
  id: string;
  studentId: string;
  name: string;
  department: string;
  batch: Batch | null;
  programs: Program[];
}

interface AttendanceRecord {
  studentId: string;
  isPresent: boolean;
  markedBy: 'manual' | 'scan';
  timestamp: Date;
}

interface InvalidStudentDialogProps {
  isVisible: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
}

// Reuse mock data from students screen
const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Web Development',
    description: 'Full stack web development with modern technologies',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Cross-platform mobile app development',
  },
];

const mockBatches: Batch[] = [
  {
    id: '1',
    name: '2024 Batch',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  {
    id: '2',
    name: '2025 Batch',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
];

const mockStudents: Student[] = [
  {
    id: '1',
    studentId: 'DBUR/3503/11',
    name: 'John Doe',
    department: 'SE',
    batch: mockBatches[0],
    programs: [mockPrograms[0]],
  },
  {
    id: '2',
    studentId: 'STU002',
    name: 'Jane Smith',
    department: 'CS',
    batch: mockBatches[1],
    programs: [mockPrograms[0], mockPrograms[1]],
  },
  {
    id: '3',
    studentId: 'STU003',
    name: 'Mike Johnson',
    department: 'IT',
    batch: mockBatches[0],
    programs: [mockPrograms[1]],
  },
  {
    id: '4',
    studentId: 'STU004',
    name: 'Sarah Williams',
    department: 'DS',
    batch: mockBatches[1],
    programs: [mockPrograms[0], mockPrograms[1]],
  },
];

// helper function to convert MM/DD/YYYY to YYYY-MM-DD
const convertDateFormat = (dateStr: string) => {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// helper function to check if batch is active
const isActiveBatch = (batch: Batch) => {
  try {
    const today = new Date();
    // Convert MM/DD/YYYY to YYYY-MM-DD before parsing
    const isoEndDate = convertDateFormat(batch.endDate);
    const endDate = new Date(isoEndDate + 'T23:59:59');
    
    console.log('Date comparison:', {
      batch: batch.name,
      today: today.toISOString(),
      endDate: endDate.toISOString(),
      isActive: endDate >= today
    });
    return endDate >= today;
  } catch (error) {
    console.error('Error checking batch activity:', error);
    return false;
  }
};

// BarcodeScanner component
const BarcodeScanner = memo(({ 
  onScan,
  onClose 
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.scannerContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.scannerContainer}>
        <Text>No access to camera</Text>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.buttonText} bold>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={styles.scanner}
        onBarcodeScanned={({ data }) => {
          onScan(data);
          onClose();
        }}
        barcodeScannerSettings={{
          barcodeTypes: ['code128'],
        }}
        facing="back"
      >
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerTarget} />
        </View>
      </CameraView>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton, styles.closeButton]}
        onPress={onClose}
      >
        <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );
});

// BatchSelector component
const BatchSelector = memo(({ 
  value,
  onSelect,
}: {
  value: Batch | null;
  onSelect: (batch: Batch | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const batchesSnapshot = await db.collection('batches')
        .where('isDeleted', '==', false)
        .get();
      
      const fetchedBatches = batchesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Keep dates in their original MM/DD/YYYY format
        return {
          id: doc.id,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
        };
      }) as Batch[];
      
      console.log('Fetched batches:', fetchedBatches);
      setBatches(fetchedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to fetch batches');
    }
  };

  const activeBatches = batches.filter(isActiveBatch);

  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.filterButtonText}>
          {value ? value.name : 'Select Batch'}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.filterList}>
          {activeBatches.length > 0 ? (
            activeBatches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={[
                  styles.filterItem,
                  value?.id === batch.id && styles.filterItemSelected
                ]}
                onPress={() => {
                  onSelect(batch);
                  setIsOpen(false);
                }}
              >
                <View style={styles.filterItemContent}>
                  <Text style={[
                    styles.filterItemText,
                    value?.id === batch.id && styles.filterItemTextSelected
                  ]} bold>{batch.name}</Text>
                  <Text style={styles.filterItemDates}>
                    {batch.startDate} - {batch.endDate}
                  </Text>
                </View>
                {value?.id === batch.id && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={COLORS.white}
                  />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.filterEmpty}>
              <Text style={styles.filterEmptyText}>No active batches available</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// ProgramSelector component
const ProgramSelector = memo(({ 
  value,
  onSelect,
  disabled,
}: {
  value: Program | null;
  onSelect: (program: Program | null) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const programsSnapshot = await db.collection('programs')
        .where('isDeleted', '==', false)
        .get();
      const fetchedPrograms = programsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
      })) as Program[];
      console.log('Fetched programs:', fetchedPrograms);
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    }
  };

  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          disabled && styles.filterButtonDisabled
        ]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Text style={[
          styles.filterButtonText,
          disabled && styles.filterButtonTextDisabled
        ]}>
          {value ? value.name : 'Select Program'}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={disabled ? COLORS.gray : COLORS.text}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.filterList}>
          {programs.length > 0 ? (
            programs.map((program) => (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.filterItem,
                  value?.id === program.id && styles.filterItemSelected
                ]}
                onPress={() => {
                  onSelect(program);
                  setIsOpen(false);
                }}
              >
                <View style={styles.filterItemContent}>
                  <Text style={[
                    styles.filterItemText,
                    value?.id === program.id && styles.filterItemTextSelected
                  ]} bold>{program.name}</Text>
                  <Text style={styles.filterItemDescription}>{program.description}</Text>
                </View>
                {value?.id === program.id && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={COLORS.white}
                  />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.filterEmpty}>
              <Text style={styles.filterEmptyText}>No programs available</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// ConfirmationDialog component
const ConfirmationDialog = memo(({
  isVisible,
  onConfirm,
  onCancel,
  presentCount,
  absentCount,
}: {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  presentCount: number;
  absentCount: number;
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.confirmationDialog]}>
          <View style={styles.confirmationIcon}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={48}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.confirmationTitle} bold>Submit Attendance</Text>
          <Text style={styles.confirmationMessage}>
            Are you sure you want to submit the attendance?{'\n\n'}
            Present: {presentCount} students{'\n'}
            Absent: {absentCount} students
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText} bold>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, { color: COLORS.white }]} bold>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const InvalidStudentDialog = memo(({ isVisible, onClose, studentName, studentId }: InvalidStudentDialogProps) => {
  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.confirmationDialog}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color={COLORS.error}
              style={styles.confirmationIcon}
            />
            <Text style={styles.confirmationTitle} bold>Invalid Student</Text>
            <Text style={styles.confirmationMessage}>
              {studentName} ({studentId}) is not enrolled in the selected batch and program.
            </Text>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.confirmButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: COLORS.white }]} bold>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default function AttendanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const currentDate = new Date().toLocaleDateString();
  const [invalidStudent, setInvalidStudent] = useState<{ name: string; id: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchBatches(),
        fetchPrograms(),
        fetchStudents(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const fetchBatches = async () => {
    try {
      const batchesSnapshot = await db.collection('batches')
        .where('isDeleted', '==', false)
        .get();
      
      const fetchedBatches = batchesSnapshot.docs.map(doc => {
        const data = doc.data();
        // Keep dates in their original MM/DD/YYYY format
        return {
          id: doc.id,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
        };
      }) as Batch[];
      
      console.log('Fetched batches:', fetchedBatches);
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
        description: doc.data().description,
      })) as Program[];
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsSnapshot = await db.collection('students')
        .where('isDeleted', '==', false)
        .get();
      const fetchedStudents = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(fetchedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to fetch students');
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = !selectedBatch || student.batch?.id === selectedBatch.id;
    const matchesProgram = !selectedProgram || student.programs.some(p => p.id === selectedProgram.id);
    return matchesSearch && matchesBatch && matchesProgram;
  });

  const handleScan = useCallback(async (scannedId: string) => {
    const student = students.find(s => s.studentId === scannedId);
    if (!student) return;

    const isInSelectedBatch = !selectedBatch || student.batch?.id === selectedBatch.id;
    const isInSelectedProgram = !selectedProgram || student.programs.some(p => p.id === selectedProgram.id);

    if (!isInSelectedBatch || !isInSelectedProgram) {
      setInvalidStudent({ name: student.name, id: student.studentId });
      return;
    }

    setAttendance(prev => ({
      ...prev,
      [student.id]: {
        studentId: student.studentId,
        isPresent: true,
        markedBy: 'scan',
        timestamp: new Date(),
      },
    }));
  }, [selectedBatch, selectedProgram, students]);

  const isSelectionValid = selectedBatch && selectedProgram;

  const handleToggleAttendance = useCallback((studentId: string) => {
    if (!isSelectionValid) return;

    setAttendance(prev => {
      const record = prev[studentId];
      if (!record) {
        return {
          ...prev,
          [studentId]: {
            studentId,
            isPresent: true,
            markedBy: 'manual',
            timestamp: new Date(),
          },
        };
      }
      return {
        ...prev,
        [studentId]: {
          ...record,
          isPresent: !record.isPresent,
        },
      };
    });
  }, [isSelectionValid]);

  const handleMarkAll = useCallback((isPresent: boolean) => {
    if (!isSelectionValid) return;

    const newAttendance: Record<string, AttendanceRecord> = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = {
        studentId: student.studentId,
        isPresent,
        markedBy: 'manual',
        timestamp: new Date(),
      };
    });
    setAttendance(newAttendance);
  }, [filteredStudents, isSelectionValid]);

  const handleSubmit = useCallback(async () => {
    if (!selectedBatch || !selectedProgram || !user) return;

    try {
      const attendanceData = {
        batchId: selectedBatch.id,
        programId: selectedProgram.id,
        date: new Date().toISOString().split('T')[0],
        records: Object.entries(attendance).map(([studentId, record]) => ({
          studentId,
          isPresent: record.isPresent,
          markedBy: record.markedBy,
          timestamp: record.timestamp.toISOString(),
        })),
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      };

      // Add attendance record to Firestore
      await db.collection('attendance').add(attendanceData);

      // Reset the form
      setAttendance({});
      setSelectedBatch(null);
      setSelectedProgram(null);
      setSearchQuery('');
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      Alert.alert('Error', 'Failed to submit attendance');
    }
  }, [attendance, selectedBatch, selectedProgram, user]);

  const presentCount = Object.values(attendance).filter(record => record.isPresent).length;
  const absentCount = Object.values(attendance).filter(record => !record.isPresent).length;

  // Reset program selection when batch changes
  useEffect(() => {
    if (!selectedBatch) {
      setSelectedProgram(null);
    }
  }, [selectedBatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchInitialData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View>
          <View style={styles.header}>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.dateText} bold>{currentDate}</Text>
            </View>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => router.push('/attendance-history')}
            >
              <MaterialCommunityIcons name="history" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filters}>
            <BatchSelector
              value={selectedBatch}
              onSelect={setSelectedBatch}
            />
            <ProgramSelector
              value={selectedProgram}
              onSelect={setSelectedProgram}
              disabled={!selectedBatch}
            />
          </View>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={COLORS.primary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[
                styles.bulkActionButton,
                styles.presentButton,
                !isSelectionValid && styles.disabledButton
              ]}
              onPress={() => handleMarkAll(true)}
              disabled={!isSelectionValid}
            >
              <MaterialCommunityIcons name="check-all" size={20} color={COLORS.white} />
              <Text style={styles.bulkActionText} bold>Mark All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.bulkActionButton,
                styles.absentButton,
                !isSelectionValid && styles.disabledButton
              ]}
              onPress={() => handleMarkAll(false)}
              disabled={!isSelectionValid}
            >
              <MaterialCommunityIcons name="close" size={20} color={COLORS.white} />
              <Text style={styles.bulkActionText} bold>Mark All Absent</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {filteredStudents.map((student) => {
              const record = attendance[student.id];
              const isPresent = record?.isPresent;
              return (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.studentCard,
                    isPresent !== undefined && (isPresent ? styles.presentCard : styles.absentCard),
                    !isSelectionValid && styles.disabledCard
                  ]}
                  onPress={() => handleToggleAttendance(student.id)}
                  disabled={!isSelectionValid}
                >
                  <View style={styles.studentInfo}>
                    <Text style={[
                      styles.studentName,
                      !isSelectionValid && styles.disabledText
                    ]} bold>{student.name}</Text>
                    <Text style={[
                      styles.studentId,
                      !isSelectionValid && styles.disabledText
                    ]}>{student.studentId}</Text>
                    <View style={styles.studentMeta}>
                      <Text style={[
                        styles.metaText,
                        !isSelectionValid && styles.disabledText
                      ]}>{student.batch?.name}</Text>
                      <Text style={[
                        styles.metaText,
                        !isSelectionValid && styles.disabledText
                      ]}>{student.department}</Text>
                    </View>
                  </View>
                  <View style={styles.attendanceStatus}>
                    {record?.markedBy === 'scan' && (
                      <MaterialCommunityIcons
                        name="barcode-scan"
                        size={20}
                        color={!isSelectionValid ? COLORS.gray : COLORS.textLight}
                        style={styles.scanIcon}
                      />
                    )}
                    <MaterialCommunityIcons
                      name={isPresent ? 'check-circle' : isPresent === false ? 'close-circle' : 'circle-outline'}
                      size={24}
                      color={!isSelectionValid ? COLORS.gray : (isPresent ? COLORS.success : isPresent === false ? COLORS.error : COLORS.gray)}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {Object.keys(attendance).length > 0 && (
          <View style={styles.footer}>
            <View style={styles.attendanceSummary}>
              <Text style={styles.summaryText}>Present: {presentCount}</Text>
              <Text style={styles.summaryText}>Absent: {absentCount}</Text>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowConfirmation(true)}
            >
              <Text style={styles.submitButtonText} bold>Submit Attendance</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.fab,
          Object.keys(attendance).length > 0 && { bottom: 100 },
          !isSelectionValid && styles.disabledButton
        ]}
        onPress={() => setShowScanner(true)}
        disabled={!isSelectionValid}
      >
        <MaterialCommunityIcons name="barcode-scan" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {showScanner && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={true}
          onRequestClose={() => setShowScanner(false)}
        >
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        </Modal>
      )}

      <ConfirmationDialog
        isVisible={showConfirmation}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmation(false)}
        presentCount={presentCount}
        absentCount={absentCount}
      />

      <InvalidStudentDialog
        isVisible={!!invalidStudent}
        onClose={() => setInvalidStudent(null)}
        studentName={invalidStudent?.name || ''}
        studentId={invalidStudent?.id || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  bulkActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.sm,
  },
  presentButton: {
    backgroundColor: COLORS.success,
  },
  absentButton: {
    backgroundColor: COLORS.error,
  },
  bulkActionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
    ...SHADOWS.small,
  },
  presentCard: {
    borderLeftColor: COLORS.success,
  },
  absentCard: {
    borderLeftColor: COLORS.error,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  studentMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scanIcon: {
    opacity: 0.5,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  selectorContainer: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectorList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 1000,
    ...SHADOWS.medium,
  },
  selectorItem: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectorItemSelected: {
    backgroundColor: COLORS.primary,
  },
  selectorItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectorItemTextSelected: {
    color: COLORS.white,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '80%',
    ...SHADOWS.medium,
  },
  confirmationDialog: {
    alignItems: 'center',
  },
  confirmationIcon: {
    marginBottom: SPACING.md,
  },
  confirmationTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  confirmationMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  confirmationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  disabledCard: {
    opacity: 0.7,
    backgroundColor: COLORS.lightGray,
  },
  disabledText: {
    color: COLORS.gray,
  },
  historyButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  filterContainer: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterButtonTextDisabled: {
    color: COLORS.gray,
  },
  filterList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 1000,
    ...SHADOWS.medium,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterItemSelected: {
    backgroundColor: COLORS.primary,
  },
  filterItemContent: {
    flex: 1,
  },
  filterItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterItemTextSelected: {
    color: COLORS.white,
  },
  filterItemDates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  filterItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  filterEmpty: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  filterEmptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
}); 