import React, { useState, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  programCount: number;
  studentCount: number;
}

const mockBatches: Batch[] = [
  {
    id: '1',
    name: '2024 Batch',
    startDate: '01/01/2024',
    endDate: '12/31/2024',
    programCount: 3,
    studentCount: 25,
  },
  {
    id: '2',
    name: '2025 Batch',
    startDate: '01/01/2025',
    endDate: '12/31/2025',
    programCount: 2,
    studentCount: 20,
  },
];

const getInitialDateForPicker = (dateString: string): Date => {
  if (!dateString) {
    return new Date(); // Default to current date
  }
  
  const [month, day, year] = dateString.split('/').map(num => parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  
  return isNaN(date.getTime()) ? new Date() : date;
};

// Memoize the BatchModal to prevent re-renders
const BatchModal = memo(({ isEdit, isVisible, onClose, formData, onSave, onUpdateForm }: {
  isEdit: boolean;
  isVisible: boolean;
  onClose: () => void;
  formData: any;
  onSave: () => void;
  onUpdateForm: (data: any) => void;
}) => (
  <Modal
    animationType="fade"
    transparent={true}
    hardwareAccelerated={true}
    statusBarTranslucent={true}
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} bold>
            {isEdit ? 'Edit Batch' : 'Create New Batch'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Batch Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter batch name"
              placeholderTextColor={COLORS.gray}
              value={formData.name}
              onChangeText={(text) => onUpdateForm({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              onPress={() => onUpdateForm({ ...formData, showStartDatePicker: true })}
              style={styles.dateInput}
            >
              <TextInput
                style={styles.input}
                placeholder="Select start date"
                placeholderTextColor={COLORS.gray}
                value={formData.startDate}
                editable={false}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              onPress={() => onUpdateForm({ ...formData, showEndDatePicker: true })}
              style={styles.dateInput}
            >
              <TextInput
                style={styles.input}
                placeholder="Select end date"
                placeholderTextColor={COLORS.gray}
                value={formData.endDate}
                editable={false}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText} bold>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSave}
          >
            <Text style={styles.buttonText} bold>{isEdit ? 'Save' : 'Create'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
));

// Memoize the DatePickerComponent to prevent re-renders
const DatePickerComponent = memo(({ 
  showStartDatePicker,
  showEndDatePicker,
  formData,
  onDateChange,
  onClose
}: {
  showStartDatePicker: boolean;
  showEndDatePicker: boolean;
  formData: any;
  onDateChange: (event: any, date: Date | undefined, isStartDate: boolean) => void;
  onClose: () => void;
}) => {
  const initialDate = getInitialDateForPicker(
    showStartDatePicker ? formData.startDate : formData.endDate
  );

  if (Platform.OS === 'ios') {
    return (
      <Modal
        transparent={true}
        animationType="slide"
        visible={showStartDatePicker || showEndDatePicker}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.datePickerModalOverlay}>
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.datePickerHeaderText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.datePickerHeaderText, { color: COLORS.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={initialDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => onDateChange(event, date, showStartDatePicker)}
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (showStartDatePicker || showEndDatePicker) ? (
    <DateTimePicker
      value={initialDate}
      mode="date"
      display="default"
      onChange={(event, date) => onDateChange(event, date, showStartDatePicker)}
    />
  ) : null;
});

export default function BatchesScreen() {
  const { action } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    showStartDatePicker: false,
    showEndDatePicker: false,
  });

  useEffect(() => {
    if (action === 'create') {
      setCreateModalVisible(true);
    }
  }, [action]);

  const handleDelete = (batchId: string) => {
    Alert.alert(
      'Delete Batch',
      'Are you sure you want to delete this batch?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBatches(batches.filter(batch => batch.id !== batchId));
            setExpandedBatch(null);
          },
        },
      ],
    );
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormData({
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate,
      showStartDatePicker: false,
      showEndDatePicker: false,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (selectedBatch) {
      setBatches(batches.map(batch =>
        batch.id === selectedBatch.id
          ? { ...batch, ...formData }
          : batch
      ));
      setEditModalVisible(false);
      setSelectedBatch(null);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, isStartDate: boolean) => {
    const currentFormData = { ...formData };
    
    if (Platform.OS === 'android') {
      currentFormData.showStartDatePicker = false;
      currentFormData.showEndDatePicker = false;
    }

    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      currentFormData[isStartDate ? 'startDate' : 'endDate'] = formattedDate;
    }

    setFormData(currentFormData);
  };

  const closeDatePicker = () => {
    setFormData(prev => ({
      ...prev,
      showStartDatePicker: false,
      showEndDatePicker: false,
    }));
  };

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (batchId: string) => {
    setExpandedBatch(expandedBatch === batchId ? null : batchId);
  };

  const BatchCard = ({ batch }: { batch: Batch }) => {
    const isExpanded = expandedBatch === batch.id;

    return (
      <View style={styles.batchCard}>
        <TouchableOpacity
          style={styles.batchHeader}
          onPress={() => toggleExpand(batch.id)}
        >
          <View style={styles.batchHeaderContent}>
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={COLORS.primary}
            />
            <View style={styles.batchHeaderText}>
              <Text style={styles.batchName} bold>{batch.name}</Text>
              <Text style={styles.batchDates}>
                {batch.startDate} - {batch.endDate}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.batchDetails}>
            <View style={styles.detailRow}>
              <TouchableOpacity
                style={styles.detailItem}
                onPress={() => router.push({
                  pathname: "/batches/[id]/programs",
                  params: { id: batch.id }
                })}
              >
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.detailText}>
                  {batch.programCount} Programs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailItem}
                onPress={() => router.push({
                  pathname: "/batches/[id]/students",
                  params: { id: batch.id }
                })}
              >
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.detailText}>
                  {batch.studentCount} Students
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(batch)}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.actionButtonText} bold>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(batch.id)}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.actionButtonText} bold>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

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
            placeholder="Search batches..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.batchList}>
        {filteredBatches.map((batch) => (
          <BatchCard key={batch.id} batch={batch} />
        ))}
      </ScrollView>

      <BatchModal
        isEdit={false}
        isVisible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        formData={formData}
        onSave={() => setCreateModalVisible(false)}
        onUpdateForm={setFormData}
      />
      <BatchModal
        isEdit={true}
        isVisible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        formData={formData}
        onSave={handleSaveEdit}
        onUpdateForm={setFormData}
      />

      <DatePickerComponent
        showStartDatePicker={formData.showStartDatePicker}
        showEndDatePicker={formData.showEndDatePicker}
        formData={formData}
        onDateChange={handleDateChange}
        onClose={closeDatePicker}
      />
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
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.sm,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  batchList: {
    padding: SPACING.md,
  },
  batchCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  batchHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchHeaderText: {
    marginLeft: SPACING.md,
  },
  batchName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  batchDates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  batchDetails: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    width: '90%',
    maxHeight: '80%',
    ...SHADOWS.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  dateInput: {
    width: '100%',
  },
  datePicker: {
    backgroundColor: COLORS.white,
    height: 200,
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Ensure it's above other modals
  },
  datePickerContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
    paddingBottom: SPACING.xl,
    zIndex: 1001, // Ensure it's above the overlay
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  datePickerHeaderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
}); 