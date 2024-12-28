import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/authStore';

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  duration: number;
  batches: Batch[];
  createdBy: string;
  isDeleted: boolean;
  createdAt: string;
}

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

const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Web Development',
    description: 'Full stack web development with modern technologies',
    duration: 12,
    batches: [mockBatches[0]],
    createdBy: 'John Doe',
    isDeleted: false,
    createdAt: '2024-01-01T12:00:00',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Cross-platform mobile app development',
    duration: 16,
    batches: [mockBatches[1]],
    createdBy: 'Jane Doe',
    isDeleted: false,
    createdAt: '2025-01-01T12:00:00',
  },
];

const BatchSelector = memo(({ 
  batches,
  selectedBatches,
  onSelect,
  onNavigateToBatches
}: {
  batches: Batch[];
  selectedBatches: Batch[];
  onSelect: (batches: Batch[]) => void;
  onNavigateToBatches: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (batches.length === 0) {
    return (
      <View style={styles.batchSelectorEmpty}>
        <Text style={styles.batchSelectorEmptyText}>No batches available</Text>
        <TouchableOpacity
          style={styles.batchSelectorEmptyButton}
          onPress={onNavigateToBatches}
        >
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
          <Text style={styles.batchSelectorEmptyButtonText} bold>Add Batch</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.batchSelectorButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.batchSelectorButtonText}>
          {selectedBatches.length === 0
            ? 'Select Batches'
            : `${selectedBatches.length} Batch${selectedBatches.length === 1 ? '' : 'es'} Selected`}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.batchList}>
          {batches.map((batch) => {
            const isSelected = selectedBatches.some(b => b.id === batch.id);
            return (
              <TouchableOpacity
                key={batch.id}
                style={[
                  styles.batchItem,
                  isSelected && styles.batchItemSelected
                ]}
                onPress={() => {
                  if (isSelected) {
                    onSelect(selectedBatches.filter(b => b.id !== batch.id));
                  } else {
                    onSelect([...selectedBatches, batch]);
                  }
                }}
              >
                <View style={styles.batchItemContent}>
                  <Text style={[
                    styles.batchItemText,
                    isSelected && styles.batchItemTextSelected
                  ]} bold>{batch.name}</Text>
                  <Text style={styles.batchItemDates} numberOfLines={1}>
                    {batch.startDate} - {batch.endDate}
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

const ProgramModal = memo(({ 
  isVisible, 
  onClose,
  formData,
  onUpdateForm,
  onNavigateToBatches,
  onSave,
  availableBatches,
  isEdit,
}: {
  isVisible: boolean;
  onClose: () => void;
  formData: any;
  onUpdateForm: (data: any) => void;
  onNavigateToBatches: () => void;
  onSave: () => void;
  availableBatches: Batch[];
  isEdit: boolean;
}) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} bold>{isEdit ? 'Edit Program' : 'Create New Program'}</Text>
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
            <Text style={styles.label}>Program Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter program name"
              placeholderTextColor={COLORS.gray}
              value={formData.name}
              onChangeText={(text) => onUpdateForm({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter program description"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => onUpdateForm({ ...formData, description: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration (weeks)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter duration"
              placeholderTextColor={COLORS.gray}
              keyboardType="numeric"
              value={formData.duration}
              onChangeText={(text) => onUpdateForm({ ...formData, duration: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Batches</Text>
            <BatchSelector
              batches={availableBatches}
              selectedBatches={formData.batches}
              onSelect={(batches) => onUpdateForm({ ...formData, batches })}
              onNavigateToBatches={onNavigateToBatches}
            />
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

const DeleteConfirmationDialog = memo(({
  isVisible,
  program,
  onConfirm,
  onCancel,
}: {
  isVisible: boolean;
  program: Program;
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
          <Text style={styles.confirmationTitle} bold>Delete Program</Text>
          <Text style={styles.confirmationMessage}>
            Are you sure you want to delete {program.name}? This action cannot be undone.
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

const ProgramDetailsModal = memo(({ 
  isVisible,
  onClose,
  program,
  onDelete,
  onEdit,
}: {
  isVisible: boolean;
  onClose: () => void;
  program: Program | null;
  onDelete: (programId: string) => void;
  onEdit: (program: Program) => void;
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (!isVisible || !program) {
      setShowDeleteConfirmation(false);
    }
  }, [isVisible, program]);

  if (!program) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        setShowDeleteConfirmation(false);
        onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} bold>{program.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailText}>{program.description}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Duration</Text>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
                <Text style={styles.detailText}>{program.duration} Weeks</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Batches ({program.batches.length})</Text>
              {program.batches.length > 0 ? (
                program.batches.map((batch) => (
                  <View key={batch.id} style={styles.batchDetailCard}>
                    <Text style={styles.batchDetailName} bold>{batch.name}</Text>
                    <Text style={styles.batchDetailDates}>
                      {batch.startDate} - {batch.endDate}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No batches assigned</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => {
                onEdit(program!);
                onClose();
              }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={COLORS.white} />
              <Text style={[styles.buttonText, { color: COLORS.white, marginLeft: SPACING.xs }]} bold>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => setShowDeleteConfirmation(true)}
            >
              <MaterialCommunityIcons name="delete" size={20} color={COLORS.white} />
              <Text style={[styles.buttonText, { color: COLORS.white, marginLeft: SPACING.xs }]} bold>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DeleteConfirmationDialog
        isVisible={showDeleteConfirmation}
        program={program}
        onConfirm={() => {
          onDelete(program.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirmation(false)}
      />
    </Modal>
  );
});

const EmptyState = memo(() => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons
      name="book-open-page-variant"
      size={80}
      color={COLORS.secondary}
      style={styles.emptyStateIcon}
    />
    <Text style={styles.emptyStateTitle} bold>No Programs Yet</Text>
    <Text style={styles.emptyStateMessage}>
      Click the plus icon in the top right corner to add the first program
    </Text>
  </View>
));

export default function ProgramsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    duration: '',
    batches: [] as Batch[],
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    return () => {
      setIsModalVisible(false);
      resetForm();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsModalVisible(false);
      resetForm();
    }, [])
  );

  useEffect(() => {
    fetchPrograms();
    fetchBatches();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPrograms(), fetchBatches()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  }, []);

  const fetchBatches = async () => {
    try {
      const batchesSnapshot = await db.collection('batches')
        .where('isDeleted', '==', false)
        .get();
      const fetchedBatches = batchesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
      })) as Batch[];
      setBatches(fetchedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to fetch batches');
    }
  };

  const handleProgramPress = useCallback((program: Program) => {
    setSelectedProgram(program);
  }, []);

  const fetchPrograms = async () => {
    try {
      const programsSnapshot = await db.collection('programs')
        .where('isDeleted', '==', false)
        .get();
      const fetchedPrograms = programsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        batches: doc.data().batches || [],
      })) as Program[];
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    }
  };

  const handleEdit = useCallback((program: Program) => {
    setIsEdit(true);
    setFormData({
      id: program.id,
      name: program.name,
      description: program.description,
      duration: program.duration.toString(),
      batches: program.batches || [],
    });
    setIsModalVisible(true);
    setSelectedProgram(null); // Close the details modal
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const programData = {
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        batches: formData.batches,
        createdBy: user?.name || 'Unknown',
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      if (isEdit && formData.id) {
        await db.collection('programs').doc(formData.id).update(programData);
      } else {
        await db.collection('programs').add(programData);
      }

      await fetchPrograms();
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving program:', error);
      Alert.alert('Error', 'Failed to save program');
    }
  };

  const handleDelete = useCallback((programId: string) => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      setProgramToDelete(program);
    }
  }, [programs]);

  const handleDeleteConfirm = async () => {
    if (programToDelete) {
      try {
        await db.collection('programs').doc(programToDelete.id).update({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });
        setPrograms(programs.filter(p => p.id !== programToDelete.id));
        setProgramToDelete(null);
        setSelectedProgram(null);
      } catch (error) {
        console.error('Error deleting program:', error);
        Alert.alert('Error', 'Failed to delete program');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      duration: '',
      batches: [],
    });
    setIsEdit(false);
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[
          styles.searchContainer,
          programs.length === 0 && styles.searchContainerDisabled
        ]}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={programs.length === 0 ? COLORS.gray : COLORS.primary}
          />
          <TextInput
            style={[
              styles.searchInput,
              programs.length === 0 && styles.searchInputDisabled
            ]}
            placeholder="Search programs..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={programs.length > 0}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {programs.length === 0 ? (
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
          style={styles.content}
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
          {filteredPrograms.map((program) => (
            <TouchableOpacity 
              key={program.id} 
              style={styles.programCard}
              onPress={() => handleProgramPress(program)}
            >
              <View style={styles.programHeader}>
                <Text style={styles.programName} bold>{program.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.programDescription}>{program.description}</Text>
              <View style={styles.programStats}>
                <View style={styles.stat}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.statText}>{program.duration} Weeks</Text>
                </View>
                <View style={styles.stat}>
                  <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
                  <Text style={styles.statText}>{program.batches.length} Batches</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ProgramModal
        isVisible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          resetForm();
        }}
        formData={formData}
        onUpdateForm={setFormData}
        onNavigateToBatches={() => router.push('/batches')}
        onSave={handleSave}
        availableBatches={batches}
        isEdit={isEdit}
      />

      {programToDelete && (
        <DeleteConfirmationDialog
          isVisible={true}
          program={programToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setProgramToDelete(null)}
        />
      )}

      <ProgramDetailsModal
        isVisible={selectedProgram !== null}
        onClose={() => setSelectedProgram(null)}
        program={selectedProgram}
        onDelete={handleDelete}
        onEdit={handleEdit}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  programCard: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '90%',
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
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
    color: COLORS.black,
    fontSize: FONT_SIZES.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  batchSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchSelectorButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  batchList: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  batchItemSelected: {
    backgroundColor: COLORS.primary,
  },
  batchItemContent: {
    flex: 1,
  },
  batchItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  batchItemTextSelected: {
    color: COLORS.white,
  },
  batchItemDates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  batchSelectorEmpty: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchSelectorEmptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  batchSelectorEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  batchSelectorEmptyButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.md,
  },
  detailSection: {
    marginBottom: SPACING.lg,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  batchDetailCard: {
    backgroundColor: COLORS.lightGray,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchDetailName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  batchDetailDates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
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
  editButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
}); 