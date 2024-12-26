import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  batch: string;
  program: string;
  yearOfStudy: string;
}

const mockStudents: Student[] = [
  {
    id: '12345',
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    department: 'Computer Science',
    batch: '2024 Batch',
    program: 'Bootstrap Workshop',
    yearOfStudy: '2nd Year',
  },
  {
    id: '12346',
    name: 'Jane Smith',
    email: 'janesmith@gmail.com',
    department: 'Information Technology',
    batch: '2024 Batch',
    program: 'Mobile App Bootcamp',
    yearOfStudy: '3rd Year',
  },
];

export default function StudentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistrationModalVisible, setRegistrationModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = mockStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.includes(searchQuery)
  );

  const RegistrationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isRegistrationModalVisible}
      onRequestClose={() => setRegistrationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} bold>
              {selectedStudent ? 'Edit Student' : 'Register New Student'}
            </Text>
            <TouchableOpacity
              onPress={() => setRegistrationModalVisible(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Student ID</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter ID or scan barcode"
                  value={selectedStudent?.id}
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity style={styles.scanButton}>
                  <MaterialCommunityIcons
                    name="barcode-scan"
                    size={24}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={selectedStudent?.name}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                value={selectedStudent?.email}
                keyboardType="email-address"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Department</Text>
              <TextInput
                style={styles.input}
                placeholder="Select department"
                value={selectedStudent?.department}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Year of Study</Text>
              <TextInput
                style={styles.input}
                placeholder="Select year"
                value={selectedStudent?.yearOfStudy}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Batch</Text>
              <TextInput
                style={styles.input}
                placeholder="Select batch"
                value={selectedStudent?.batch}
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Program</Text>
              <TextInput
                style={styles.input}
                placeholder="Select program"
                value={selectedStudent?.program}
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setRegistrationModalVisible(false)}
            >
              <Text style={styles.buttonText} bold>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => setRegistrationModalVisible(false)}
            >
              <Text style={styles.buttonText} bold>
                {selectedStudent ? 'Update' : 'Register'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const StudentCard = ({ student }: { student: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <View style={styles.studentHeader}>
          <Text style={styles.studentName} bold >{student.name}</Text>
          <Text style={styles.studentId}>ID: {student.id}</Text>
        </View>
        <View style={styles.studentDetails}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="email"
              size={16}
              color={COLORS.secondary}
            />
            <Text style={styles.detailText}>{student.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="school"
              size={16}
              color={COLORS.secondary}
            />
            <Text style={styles.detailText}>
              {student.department} - {student.yearOfStudy}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="account-group"
              size={16}
              color={COLORS.secondary}
            />
            <Text style={styles.detailText}>{student.batch}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={16}
              color={COLORS.secondary}
            />
            <Text style={styles.detailText}>{student.program}</Text>
          </View>
        </View>
      </View>
      <View style={styles.studentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedStudent(student);
            setRegistrationModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

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
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setSelectedStudent(null);
            setRegistrationModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
          <Text style={styles.addButtonText} bold>Add Student</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.studentList}
        showsVerticalScrollIndicator={false}
      >
        {filteredStudents.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </ScrollView>

      <RegistrationModal />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
  studentList: {
    padding: SPACING.md,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  studentName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  studentId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  studentDetails: {
    marginTop: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
  },
  actionButton: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
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
  modalBody: {
    padding: SPACING.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  button: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
}); 