import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Text, TextInput } from '../../components';
import { useLocalSearchParams } from 'expo-router';

interface Program {
  id: number;
  name: string;
  description: string;
  batches: number;
  students: number;
}

const mockPrograms: Program[] = [
  {
    id: 1,
    name: 'Web Development',
    description: 'Full stack web development with modern technologies',
    batches: 2,
    students: 25,
  },
  {
    id: 2,
    name: 'Mobile App Development',
    description: 'Cross-platform mobile app development',
    batches: 1,
    students: 15,
  },
];

export default function ProgramsScreen() {
  const { action } = useLocalSearchParams();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    if (action === 'create') {
      setCreateModalVisible(true);
    }
  }, [action]);

  const CreateProgramModal = () => (
    <Modal
      animationType="slide"
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
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (weeks)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter duration"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
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
              <Text style={styles.buttonText} bold>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ProgramCard = ({ program }: { program: Program }) => (
    <TouchableOpacity style={styles.programCard}>
      <View style={styles.programHeader}>
        <Text style={styles.programName} bold>{program.name}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.programDescription}>{program.description}</Text>
      <View style={styles.programStats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
          <Text style={styles.statText}>{program.batches} Batches</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="account-multiple" size={20} color={COLORS.primary} />
          <Text style={styles.statText}>{program.students} Students</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} bold>Programs</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockPrograms.map((program) => (
          <ProgramCard key={program.id} program={program} />
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
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
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
}); 