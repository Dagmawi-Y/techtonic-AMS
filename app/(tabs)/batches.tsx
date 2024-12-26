import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

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

export default function BatchesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const filteredBatches = mockBatches.filter((batch) =>
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
              <Text style={styles.batchName}>{batch.name}</Text>
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
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.detailText}>
                  {batch.programCount} Programs
                </Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.detailText}>
                  {batch.studentCount} Students
                </Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.actionButtonText}>Delete</Text>
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
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.addButtonText}>Add Batch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.batchList}
        showsVerticalScrollIndicator={false}
      >
        {filteredBatches.map((batch) => (
          <BatchCard key={batch.id} batch={batch} />
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
    fontWeight: 'bold',
  },
  batchList: {
    padding: SPACING.md,
  },
  batchCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
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
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  batchDates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
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
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
}); 