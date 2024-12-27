import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text } from '../../components';
import { useLocalSearchParams } from 'expo-router';

interface Student {
  id: string;
  name: string;
  batch: string;
  program: string;
  isPresent: boolean;
}

const mockStudents: Student[] = [
  {
    id: '12345',
    name: 'John Doe',
    batch: '2024 Batch',
    program: 'Bootstrap Workshop',
    isPresent: false,
  },
  {
    id: '12346',
    name: 'Jane Smith',
    batch: '2024 Batch',
    program: 'Mobile App Bootcamp',
    isPresent: false,
  },
];

export default function AttendanceScreen() {
  const { action } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBatch, setSelectedBatch] = useState('2024 Batch');
  const [selectedProgram, setSelectedProgram] = useState('Bootstrap Workshop');
  const [students, setStudents] = useState(mockStudents);
  const [isScannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    if (action === 'mark') {
      setScannerVisible(true);
    }
  }, [action]);

  const toggleAttendance = (studentId: string) => {
    setStudents(
      students.map((student) =>
        student.id === studentId
          ? { ...student, isPresent: !student.isPresent }
          : student
      )
    );
  };

  const handleBarcodeScan = (scannedId: string) => {
    const student = students.find((s) => s.id === scannedId);
    if (student) {
      toggleAttendance(scannedId);
    }
  };

  const ScannerModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isScannerVisible}
      onRequestClose={() => setScannerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} bold>Scan Student ID</Text>
            <TouchableOpacity onPress={() => setScannerVisible(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.scannerContainer}>
            <View style={styles.scanner}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={100}
                color={COLORS.primary}
              />
              <Text style={styles.scannerText}>
                Position the barcode within the frame
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const AttendanceCard = ({ student }: { student: Student }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} bold>{student.name}</Text>
        <Text style={styles.studentId}>ID: {student.id}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.attendanceButton,
          student.isPresent && styles.presentButton,
        ]}
        onPress={() => toggleAttendance(student.id)}
      >
        <MaterialCommunityIcons
          name={student.isPresent ? 'check-circle' : 'circle-outline'}
          size={24}
          color={student.isPresent ? COLORS.white : COLORS.primary}
        />
        <Text
          style={[
            styles.attendanceButtonText,
            student.isPresent && styles.presentButtonText,
          ]}
          bold
        >
          {student.isPresent ? 'Present' : 'Absent'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date:</Text>
          <Text style={styles.dateText} bold>
            {selectedDate.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.batchContainer}>
          <Text style={styles.batchLabel}>Batch:</Text>
          <Text style={styles.batchText} bold>{selectedBatch}</Text>
        </View>
        <View style={styles.programContainer}>
          <Text style={styles.programLabel}>Program:</Text>
          <Text style={styles.programText} bold>{selectedProgram}</Text>
        </View>
      </View>

      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScannerVisible(true)}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.scanButtonText} bold>Scan Student ID</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.attendanceList}>
        {students.map((student) => (
          <AttendanceCard key={student.id} student={student} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText} bold>Submit Attendance</Text>
        </TouchableOpacity>
      </View>

      <ScannerModal />
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  batchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  batchLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },
  batchText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  programContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },
  programText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  scanButtonContainer: {
    padding: SPACING.lg,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  scanButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
  attendanceList: {
    flex: 1,
    padding: SPACING.md,
  },
  attendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
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
    marginTop: SPACING.xs,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  presentButton: {
    backgroundColor: COLORS.primary,
  },
  attendanceButtonText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  presentButtonText: {
    color: COLORS.white,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
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
    width: '90%',
    maxHeight: '80%',
    ...SHADOWS.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  scannerContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  scanner: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  scannerText: {
    marginTop: SPACING.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
}); 