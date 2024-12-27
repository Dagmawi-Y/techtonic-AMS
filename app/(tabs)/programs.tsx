import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Program {
  id: number;
  name: string;
  description: string;
  duration: number;
  batches: Batch[];
}

const mockBatches: Batch[] = [
  {
    id: '1',
    name: '2024 Batch',
    startDate: '01/01/2024',
    endDate: '12/31/2024',
  },
  {
    id: '2',
    name: '2025 Batch',
    startDate: '01/01/2025',
    endDate: '12/31/2025',
  },
];

const mockPrograms: Program[] = [
  {
    id: 1,
    name: 'Web Development',
    description: 'Full stack web development with modern technologies',
    duration: 12,
    batches: [mockBatches[0]],
  },
  {
    id: 2,
    name: 'Mobile App Development',
    description: 'Cross-platform mobile app development',
    duration: 16,
    batches: [mockBatches[1]],
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

export default function ProgramsScreen() {
  const { action } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    batches: [] as Batch[],
  });

  useEffect(() => {
    if (action === 'create') {
      setCreateModalVisible(true);
    }
  }, [action]);

  const handleNavigateToBatches = () => {
    router.push('/batches');
  };

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CreateProgramModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isCreateModalVisible}
      onRequestClose={() => setCreateModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} bold>Create New Program</Text>
            <TouchableOpacity
              onPress={() => setCreateModalVisible(false)}
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
              <Text style={styles.label}>Program Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter program name"
                placeholderTextColor={COLORS.gray}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
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
                onChangeText={(text) => setFormData({ ...formData, description: text })}
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
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Batches</Text>
              <BatchSelector
                batches={mockBatches}
                selectedBatches={formData.batches}
                onSelect={(batches) => setFormData({ ...formData, batches })}
                onNavigateToBatches={handleNavigateToBatches}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setCreateModalVisible(false)}
            >
              <Text style={styles.buttonText} bold>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => setCreateModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: COLORS.white }]} bold>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
            placeholder="Search programs..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredPrograms.map((program) => (
          <TouchableOpacity key={program.id} style={styles.programCard}>
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

      <CreateProgramModal />
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
    padding: SPACING.lg,
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
    color: COLORS.white,
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
}); 