import React, { useState, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';

interface Program {
  id: number;
  name: string;
  description: string;
}

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  programCount: number;
  studentCount: number;
  programs: Program[];
  createdBy: string;
  isDeleted: boolean;
}

const getInitialDateForPicker = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  try {
    // If it's a new form with today's date from toLocaleDateString()
    if (dateString === new Date().toLocaleDateString()) {
      return new Date();
    }

    // Parse the MM/DD/YYYY format
    const [month, day, year] = dateString.split('/').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);
    
    return isNaN(date.getTime()) ? new Date() : date;
  } catch (error) {
    return new Date(); // Default to today if any parsing error
  }
};

const ProgramSelector = memo(({ 
  programs,
  selectedPrograms,
  onSelect,
  onNavigateToPrograms
}: {
  programs: Program[];
  selectedPrograms: Program[];
  onSelect: (programs: Program[]) => void;
  onNavigateToPrograms: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (programs.length === 0) {
    return (
      <View style={styles.programSelectorEmpty}>
        <Text style={styles.programSelectorEmptyText}>No programs available</Text>
        <TouchableOpacity
          style={styles.programSelectorEmptyButton}
          onPress={onNavigateToPrograms}
        >
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
          <Text style={styles.programSelectorEmptyButtonText} bold>Add Program</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.programSelectorButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.programSelectorButtonText}>
          {selectedPrograms.length === 0
            ? 'Select Programs'
            : `${selectedPrograms.length} Program${selectedPrograms.length === 1 ? '' : 's'} Selected`}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.programList}>
          {programs.map((program) => {
            const isSelected = selectedPrograms.some(p => p.id === program.id);
            return (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.programItem,
                  isSelected && styles.programItemSelected
                ]}
                onPress={() => {
                  if (isSelected) {
                    onSelect(selectedPrograms.filter(p => p.id !== program.id));
                  } else {
                    onSelect([...selectedPrograms, program]);
                  }
                }}
              >
                <View style={styles.programItemContent}>
                  <Text style={[
                    styles.programItemText,
                    isSelected && styles.programItemTextSelected
                  ]} bold>{program.name}</Text>
                  <Text style={styles.programItemDescription} numberOfLines={1}>
                    {program.description}
                  </Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={COLORS.white}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
});

interface FormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
  programs?: string;
}

// Memoize the BatchModal to prevent re-renders
const BatchModal = memo(({ 
  isEdit,
  isVisible,
  onClose,
  formData,
  formErrors,
  onUpdateForm,
  onNavigateToPrograms,
  onSave,
  onClearError,
  onShowStartDatePicker,
  onShowEndDatePicker,
  availablePrograms,
}: {
  isEdit: boolean;
  isVisible: boolean;
  onClose: () => void;
  formData: any;
  formErrors: FormErrors;
  onUpdateForm: (data: any) => void;
  onNavigateToPrograms: () => void;
  onSave: () => void;
  onClearError: (field: keyof FormErrors) => void;
  onShowStartDatePicker: () => void;
  onShowEndDatePicker: () => void;
  availablePrograms: Program[];
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
              style={[
                styles.input,
                formErrors.name && styles.inputError
              ]}
              placeholder="Enter batch name"
              placeholderTextColor={COLORS.gray}
              value={formData.name}
              onChangeText={(text) => {
                onUpdateForm({ ...formData, name: text });
                if (formErrors.name) {
                  onClearError('name');
                }
              }}
            />
            {formErrors.name && (
              <Text style={styles.errorText}>{formErrors.name}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Programs</Text>
            <ProgramSelector
              programs={availablePrograms}
              selectedPrograms={formData.programs || []}
              onSelect={(programs) => {
                onUpdateForm({ ...formData, programs });
                if (formErrors.programs) {
                  onClearError('programs');
                }
              }}
              onNavigateToPrograms={onNavigateToPrograms}
            />
            {formErrors.programs && (
              <Text style={styles.errorText}>{formErrors.programs}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              onPress={onShowStartDatePicker}
              style={styles.dateInput}
            >
              <TextInput
                style={[
                  styles.input,
                  formErrors.startDate && styles.inputError
                ]}
                placeholder="Select start date"
                placeholderTextColor={COLORS.gray}
                value={formData.startDate}
                editable={false}
              />
            </TouchableOpacity>
            {formErrors.startDate && (
              <Text style={styles.errorText}>{formErrors.startDate}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              onPress={onShowEndDatePicker}
              style={styles.dateInput}
            >
              <TextInput
                style={[
                  styles.input,
                  formErrors.endDate && styles.inputError
                ]}
                placeholder="Select end date"
                placeholderTextColor={COLORS.gray}
                value={formData.endDate}
                editable={false}
              />
            </TouchableOpacity>
            {formErrors.endDate && (
              <Text style={styles.errorText}>{formErrors.endDate}</Text>
            )}
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
            <Text style={[styles.buttonText, { color: COLORS.white }]} bold>
              {isEdit ? 'Save' : 'Create'}
            </Text>
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

const DeleteConfirmationDialog = memo(({
  isVisible,
  batch,
  onConfirm,
  onCancel,
}: {
  isVisible: boolean;
  batch: Batch;
  onConfirm: () => void;
  onCancel: () => void;
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
              name="alert-circle-outline"
              size={48}
              color={COLORS.error}
            />
          </View>
          <Text style={styles.confirmationTitle} bold>Delete Batch</Text>
          <Text style={styles.confirmationMessage}>
            Are you sure you want to delete {batch.name}? This action cannot be undone.
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
              <Text style={[styles.buttonText, { color: COLORS.white }]} bold>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const EmptyState = memo(() => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons
      name="account-group"
      size={80}
      color={COLORS.secondary}
      style={styles.emptyStateIcon}
    />
    <Text style={styles.emptyStateTitle} bold>No Batches Yet</Text>
    <Text style={styles.emptyStateMessage}>
      Click the plus icon in the top right corner to add the first batch
    </Text>
  </View>
));

export default function BatchesScreen() {
  const { action } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    startDate: new Date().toLocaleDateString(),
    endDate: new Date().toLocaleDateString(),
    programs: [] as Program[],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (action === 'create') {
      setIsModalVisible(true);
    }
  }, [action]);

  // Add cleanup effect for modal state
  useEffect(() => {
    return () => {
      setIsModalVisible(false);
      resetForm();
    };
  }, []);

  // Handle screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset modal state when screen comes into focus
      if (!action) {
        setIsModalVisible(false);
        resetForm();
      }
    }, [action])
  );

  useEffect(() => {
    fetchBatches();
    fetchPrograms();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchBatches(), fetchPrograms()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  };

  const fetchPrograms = async () => {
    try {
      const programsSnapshot = await db.collection('programs')
        .where('isDeleted', '==', false)
        .get();
      const fetchedPrograms = programsSnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        name: doc.data().name,
        description: doc.data().description,
      })) as Program[];
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    }
  };

  const fetchBatches = async () => {
    try {
      const batchesSnapshot = await db.collection('batches')
        .where('isDeleted', '==', false)
        .get();
      const fetchedBatches = batchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        programs: doc.data().programs || [],
        programCount: doc.data().programs?.length || 0,
        studentCount: doc.data().studentCount || 0,
      })) as Batch[];
      setBatches(fetchedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to fetch batches');
    }
  };

  const handleDelete = (batch: Batch) => {
    setBatchToDelete(batch);
  };

  const handleDeleteConfirm = async () => {
    if (batchToDelete) {
      try {
        await db.collection('batches').doc(batchToDelete.id).update({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });
        setBatches(batches.filter(b => b.id !== batchToDelete.id));
        setExpandedBatchId(null);
        setBatchToDelete(null);
      } catch (error) {
        console.error('Error deleting batch:', error);
        Alert.alert('Error', 'Failed to delete batch');
      }
    }
  };

  const handleEdit = (batch: Batch) => {
    setIsEdit(true);
    setFormData({
      id: batch.id,
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate,
      programs: batch.programs,
    });
    setIsModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (formData.id) {
      setBatches(batches.map(batch =>
        batch.id === formData.id
          ? { ...batch, ...formData }
          : batch
      ));
      setIsModalVisible(false);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, isStartDate: boolean) => {
    if (Platform.OS === 'android') {
      isStartDate ? setShowStartDatePicker(false) : setShowEndDatePicker(false);
    }

    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      setFormData({
        ...formData,
        [isStartDate ? 'startDate' : 'endDate']: formattedDate,
      });
    }
  };

  const closeDatePicker = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (batchId: string) => {
    setExpandedBatchId(expandedBatchId === batchId ? null : batchId);
  };

  const BatchCard = ({ batch }: { batch: Batch }) => {
    const isExpanded = expandedBatchId === batch.id;

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
                onPress={() => handleDelete(batch)}
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

  const handleNavigateToPrograms = () => {
    router.push('/programs');
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    // Remove program validation
    // if (formData.programs.length === 0) {
    //   errors.programs = 'At least one program is required';
    // }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const batchData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        programs: formData.programs,
        programCount: formData.programs.length,
        studentCount: 0,
        createdBy: user?.id || '',
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      if (isEdit && formData.id) {
        await db.collection('batches').doc(formData.id).update(batchData);
      } else {
        await db.collection('batches').add(batchData);
      }

      resetForm();
      setIsModalVisible(false);
      fetchBatches();
    } catch (error) {
      console.error('Error saving batch:', error);
      Alert.alert('Error', 'Failed to save batch');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      startDate: new Date().toLocaleDateString(),
      endDate: new Date().toLocaleDateString(),
      programs: [],
    });
    setFormErrors({});
    setIsEdit(false);
  };

  const clearError = (field: keyof FormErrors) => {
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[
          styles.searchContainer,
          batches.length === 0 && styles.searchContainerDisabled
        ]}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={batches.length === 0 ? COLORS.gray : COLORS.primary}
          />
          <TextInput
            style={[
              styles.searchInput,
              batches.length === 0 && styles.searchInputDisabled
            ]}
            placeholder="Search batches..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={batches.length > 0}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {batches.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <EmptyState />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.batchList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredBatches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </ScrollView>
      )}

      <BatchModal
        isEdit={isEdit}
        isVisible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          resetForm();
        }}
        formData={formData}
        formErrors={formErrors}
        onUpdateForm={setFormData}
        onNavigateToPrograms={handleNavigateToPrograms}
        onSave={handleSave}
        onClearError={clearError}
        onShowStartDatePicker={() => setShowStartDatePicker(true)}
        onShowEndDatePicker={() => setShowEndDatePicker(true)}
        availablePrograms={programs}
      />

      <DatePickerComponent
        showStartDatePicker={showStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        formData={formData}
        onDateChange={handleDateChange}
        onClose={closeDatePicker}
      />

      {batchToDelete && (
        <DeleteConfirmationDialog
          isVisible={true}
          batch={batchToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setBatchToDelete(null)}
        />
      )}
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
  programSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  programSelectorButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  programList: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    maxHeight: 200,
    ...SHADOWS.small,
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  programItemSelected: {
    backgroundColor: COLORS.primary,
  },
  programItemContent: {
    flex: 1,
  },
  programItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  programItemTextSelected: {
    color: COLORS.white,
  },
  programItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  programSelectorEmpty: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  programSelectorEmptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  programSelectorEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  programSelectorEmptyButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.md,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  confirmationDialog: {
    width: '80%',
    maxWidth: 400,
    padding: SPACING.lg,
  },
  confirmationIcon: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  confirmationTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    textAlign: 'center',
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
    justifyContent: 'center',
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
    backgroundColor: COLORS.error,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 300,
  },
  searchContainerDisabled: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  searchInputDisabled: {
    color: COLORS.gray,
  },
}); 