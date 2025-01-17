import React, {
  useState,
  useEffect,
  memo,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
  RefreshControl,
  Animated,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { Text, TextInput } from "../../components";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { db } from "../../config/firebase";
import { useAuthStore } from "../../store/authStore";
import debounce from "lodash/debounce";

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
  searchableFields: string[];
}

interface FormErrors {
  studentId?: string;
  name?: string;
  department?: string;
  batch?: string;
  programs?: string;
}

interface FormData {
  id: string;
  studentId: string;
  name: string;
  department: string;
  batch: Batch | null;
  programs: Program[];
}

const DEPARTMENTS = ["SE", "IS", "IT", "CS", "DS"];

// Dropdown component for single selection
const Dropdown = memo(
  ({
    label,
    options,
    value,
    onSelect,
  }: {
    label: string;
    options: string[];
    value: string;
    onSelect: (value: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <View>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.dropdownButtonText}>
            {value || `Select ${label}`}
          </Text>
          <MaterialCommunityIcons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  value === option && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === option && styles.dropdownItemTextSelected,
                  ]}
                  bold
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }
);

// BatchSelector component for single batch selection
const BatchSelector = memo(
  ({
    batches,
    selectedBatch,
    onSelect,
    onNavigateToBatches,
  }: {
    batches: Batch[];
    selectedBatch: Batch | null;
    onSelect: (batch: Batch | null) => void;
    onNavigateToBatches: () => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (batches.length === 0) {
      return (
        <View style={styles.selectorEmpty}>
          <Text style={styles.selectorEmptyText}>No batches available</Text>
          <TouchableOpacity
            style={styles.selectorEmptyButton}
            onPress={onNavigateToBatches}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.selectorEmptyButtonText} bold>
              Add Batch
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedBatch ? selectedBatch.name : "Select Batch"}
          </Text>
          <MaterialCommunityIcons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.selectorList}>
            {batches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={[
                  styles.selectorItem,
                  selectedBatch?.id === batch.id && styles.selectorItemSelected,
                ]}
                onPress={() => {
                  onSelect(batch);
                  setIsOpen(false);
                }}
              >
                <View style={styles.selectorItemContent}>
                  <Text
                    style={[
                      styles.selectorItemText,
                      selectedBatch?.id === batch.id &&
                        styles.selectorItemTextSelected,
                    ]}
                    bold
                  >
                    {batch.name}
                  </Text>
                  <Text style={styles.selectorItemDates}>
                    {batch.startDate} - {batch.endDate}
                  </Text>
                </View>
                {selectedBatch?.id === batch.id && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={COLORS.white}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }
);

// ProgramSelector component for multi-selection
const ProgramSelector = memo(
  ({
    programs,
    selectedPrograms,
    onSelect,
    onNavigateToPrograms,
  }: {
    programs: Program[];
    selectedPrograms: Program[];
    onSelect: (programs: Program[]) => void;
    onNavigateToPrograms: () => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (programs.length === 0) {
      return (
        <View style={styles.selectorEmpty}>
          <Text style={styles.selectorEmptyText}>No programs available</Text>
          <TouchableOpacity
            style={styles.selectorEmptyButton}
            onPress={onNavigateToPrograms}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.selectorEmptyButtonText} bold>
              Add Program
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedPrograms.length === 0
              ? "Select Programs"
              : `${selectedPrograms.length} Program${
                  selectedPrograms.length === 1 ? "" : "s"
                } Selected`}
          </Text>
          <MaterialCommunityIcons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.selectorList}>
            {programs.map((program) => {
              const isSelected = selectedPrograms.some(
                (p) => p.id === program.id
              );
              return (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.selectorItem,
                    isSelected && styles.selectorItemSelected,
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      onSelect(
                        selectedPrograms.filter((p) => p.id !== program.id)
                      );
                    } else {
                      onSelect([...selectedPrograms, program]);
                    }
                  }}
                >
                  <View style={styles.selectorItemContent}>
                    <Text
                      style={[
                        styles.selectorItemText,
                        isSelected && styles.selectorItemTextSelected,
                      ]}
                      bold
                    >
                      {program.name}
                    </Text>
                    <Text
                      style={styles.selectorItemDescription}
                      numberOfLines={1}
                    >
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
  }
);

// BarcodeScanner component
const BarcodeScanner = memo(
  ({
    onScan,
    onClose,
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
            <Text style={styles.buttonText} bold>
              Close
            </Text>
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
            barcodeTypes: ["code128"],
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
  }
);

const StudentCard = memo(
  ({ student, onPress }: { student: Student; onPress: () => void }) => (
    <TouchableOpacity style={styles.studentCard} onPress={onPress}>
      <View style={styles.studentHeader}>
        <View>
          <Text style={styles.studentName} bold>
            {student.name}
          </Text>
          <Text style={styles.studentId}>{student.studentId}</Text>
        </View>
        <View style={styles.departmentBadge}>
          <Text style={styles.departmentText} bold>
            {student.department}
          </Text>
        </View>
      </View>
      <View style={styles.studentDetails}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.detailText}>
            {student.batch?.name || "No Batch"}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.detailText}>
            {student.programs.length} Program
            {student.programs.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
);

const CreateStudentModal = memo(
  ({
    isVisible,
    onClose,
    formData,
    onUpdateForm,
    onNavigateToBatches,
    onNavigateToPrograms,
    onSave,
    availableBatches,
    availablePrograms,
    formErrors,
    onClearError,
  }: {
    isVisible: boolean;
    onClose: () => void;
    formData: FormData;
    onUpdateForm: (data: FormData) => void;
    onNavigateToBatches: () => void;
    onNavigateToPrograms: () => void;
    onSave: () => void;
    availableBatches: Batch[];
    availablePrograms: Program[];
    formErrors: FormErrors;
    onClearError: (field: keyof FormErrors) => void;
  }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Clear errors when modal is closed
    useEffect(() => {
      if (!isVisible) {
        setErrors({});
      }
    }, [isVisible]);

    const validateForm = useCallback(() => {
      const newErrors: FormErrors = {};

      // Student ID validation
      if (!formData.studentId.trim()) {
        newErrors.studentId = "Student ID is required";
      }

      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      } else if (formData.name.length < 2) {
        newErrors.name = "Name must be at least 2 characters long";
      }

      // Department validation
      if (!formData.department) {
        newErrors.department = "Department is required";
      } else if (!DEPARTMENTS.includes(formData.department)) {
        newErrors.department = "Invalid department selected";
      }

      // Batch validation
      if (!formData.batch) {
        newErrors.batch = "Batch is required";
      }

      // Programs validation
      if (!formData.programs.length) {
        newErrors.programs = "At least one program must be selected";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleUpdateForm = useCallback(
      (newData: FormData) => {
        // Clear any errors for fields that have changed
        const changedFields = Object.keys(newData).filter(
          (key) =>
            newData[key as keyof FormData] !== formData[key as keyof FormData]
        );

        if (changedFields.length > 0) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            changedFields.forEach((field) => {
              delete newErrors[field as keyof FormErrors];
            });
            return newErrors;
          });
        }

        onUpdateForm(newData);
      },
      [formData, onUpdateForm]
    );

    const handleSaveClick = useCallback(() => {
      if (validateForm()) {
        onSave();
      }
    }, [validateForm, onSave]);

    if (showScanner) {
      return (
        <Modal
          animationType="slide"
          transparent={false}
          visible={true}
          onRequestClose={() => setShowScanner(false)}
        >
          <BarcodeScanner
            onScan={(data) => {
              handleUpdateForm({ ...formData, studentId: data });
            }}
            onClose={() => setShowScanner(false)}
          />
        </Modal>
      );
    }

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} bold>
                {formData.id ? "Edit Student" : "Add Student"}
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
                <Text style={styles.label}>Student ID</Text>
                <View style={styles.idInputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.idInput,
                      errors.studentId && styles.inputError,
                    ]}
                    placeholder="Enter student ID"
                    placeholderTextColor={COLORS.gray}
                    value={formData.studentId}
                    onChangeText={(text) =>
                      handleUpdateForm({ ...formData, studentId: text })
                    }
                  />
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => setShowScanner(true)}
                  >
                    <MaterialCommunityIcons
                      name="barcode-scan"
                      size={24}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
                {errors.studentId && (
                  <Text style={styles.errorText}>{errors.studentId}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter student name"
                  placeholderTextColor={COLORS.gray}
                  value={formData.name}
                  onChangeText={(text) =>
                    handleUpdateForm({ ...formData, name: text })
                  }
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <Dropdown
                  label="Department"
                  options={DEPARTMENTS}
                  value={formData.department}
                  onSelect={(value) =>
                    handleUpdateForm({ ...formData, department: value })
                  }
                />
                {errors.department && (
                  <Text style={styles.errorText}>{errors.department}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Batch</Text>
                <BatchSelector
                  batches={availableBatches}
                  selectedBatch={formData.batch}
                  onSelect={(batch) => handleUpdateForm({ ...formData, batch })}
                  onNavigateToBatches={onNavigateToBatches}
                />
                {errors.batch && (
                  <Text style={styles.errorText}>{errors.batch}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Programs</Text>
                <ProgramSelector
                  programs={availablePrograms}
                  selectedPrograms={formData.programs}
                  onSelect={(programs) =>
                    handleUpdateForm({ ...formData, programs })
                  }
                  onNavigateToPrograms={onNavigateToPrograms}
                />
                {errors.programs && (
                  <Text style={styles.errorText}>{errors.programs}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText} bold>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveClick}
              >
                <Text style={[styles.buttonText, { color: COLORS.white }]} bold>
                  {formData.id ? "Save Changes" : "Add Student"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

// StudentDetailsModal component
const StudentDetailsModal = memo(
  ({
    isVisible,
    onClose,
    student,
    onEdit,
    onDelete,
  }: {
    isVisible: boolean;
    onClose: () => void;
    student: Student | null;
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
  }) => {
    if (!student) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailsModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} bold>
                Student Details
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
              <View style={styles.detailsHeader}>
                <View style={styles.detailsHeaderLeft}>
                  <View style={styles.studentAvatar}>
                    <MaterialCommunityIcons
                      name="account"
                      size={40}
                      color={COLORS.white}
                    />
                  </View>
                  <View>
                    <Text style={styles.studentDetailName} bold>
                      {student.name}
                    </Text>
                    <Text style={styles.studentDetailId}>
                      {student.studentId}
                    </Text>
                  </View>
                </View>
                <View style={styles.departmentBadge}>
                  <Text style={styles.departmentText} bold>
                    {student.department}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle} bold>
                  Batch Information
                </Text>
                <View style={styles.detailCard}>
                  {student.batch ? (
                    <>
                      <Text style={styles.detailCardTitle} bold>
                        {student.batch.name}
                      </Text>
                      <Text style={styles.detailCardSubtitle}>
                        {student.batch.startDate} - {student.batch.endDate}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.noDataText}>No batch assigned</Text>
                  )}
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle} bold>
                  Enrolled Programs
                </Text>
                {student.programs.length > 0 ? (
                  student.programs.map((program) => (
                    <View key={program.id} style={styles.detailCard}>
                      <Text style={styles.detailCardTitle} bold>
                        {program.name}
                      </Text>
                      <Text style={styles.detailCardSubtitle}>
                        {program.description}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.detailCard}>
                    <Text style={styles.noDataText}>No programs enrolled</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.detailsFooter}>
              <TouchableOpacity
                style={[styles.detailsButton, styles.deleteButton]}
                onPress={() => onDelete(student)}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={20}
                  color={COLORS.white}
                />
                <Text
                  style={[styles.detailsButtonText, styles.deleteButtonText]}
                  bold
                >
                  Delete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailsButton, styles.editButton]}
                onPress={() => onEdit(student)}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={COLORS.white}
                />
                <Text
                  style={[styles.detailsButtonText, styles.editButtonText]}
                  bold
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

// DeleteConfirmationDialog component
const DeleteConfirmationDialog = memo(
  ({
    isVisible,
    student,
    onConfirm,
    onCancel,
  }: {
    isVisible: boolean;
    student: Student;
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
            <Text style={styles.confirmationTitle} bold>
              Delete Student
            </Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to delete {student.name}? This action cannot
              be undone.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.buttonText} bold>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.confirmButton]}
                onPress={onConfirm}
              >
                <Text style={[styles.buttonText, { color: COLORS.white }]} bold>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

const EmptyState = memo(() => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons
      name="account-group-outline"
      size={80}
      color={COLORS.secondary}
      style={styles.emptyStateIcon}
    />
    <Text style={styles.emptyStateTitle} bold>
      No Students Yet
    </Text>
    <Text style={styles.emptyStateMessage}>
      Click the plus icon in the top right corner to add the first student
    </Text>
  </View>
));

const StudentSkeleton = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View>
          <Animated.View
            style={[styles.skeletonText, styles.skeletonTitle, { opacity }]}
          />
          <Animated.View
            style={[styles.skeletonText, styles.skeletonSubtitle, { opacity }]}
          />
        </View>
        <Animated.View
          style={[styles.skeletonText, styles.skeletonBadge, { opacity }]}
        />
      </View>
      <View style={styles.studentDetails}>
        <View style={styles.detailItem}>
          <Animated.View style={[styles.skeletonIcon, { opacity }]} />
          <Animated.View
            style={[styles.skeletonText, styles.skeletonDetail, { opacity }]}
          />
        </View>
        <View style={styles.detailItem}>
          <Animated.View style={[styles.skeletonIcon, { opacity }]} />
          <Animated.View
            style={[styles.skeletonText, styles.skeletonDetail, { opacity }]}
          />
        </View>
      </View>
    </View>
  );
};

// Update the main component to include student selection and details modal
export default function StudentsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id: "",
    studentId: "",
    name: "",
    department: "",
    batch: null,
    programs: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Add debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        setIsLoading(true);
        setLastVisible(null);
        setHasMore(true);
        try {
          let searchQuery = db
            .collection("students")
            .where("isDeleted", "==", false);

          if (query.trim()) {
            searchQuery = searchQuery.where(
              "searchableFields",
              "array-contains",
              query.toLowerCase().trim()
            );
          }

          searchQuery = searchQuery.limit(10);

          const snapshot = await searchQuery.get();
          const fetchedStudents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Student[];

          setStudents(fetchedStudents);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMore(snapshot.docs.length === 10);
        } catch (error) {
          console.error("Error searching students:", error);
          Alert.alert("Error", "Failed to search students");
        } finally {
          setIsLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Add useFocusEffect for automatic refetch
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const fetchInitialData = async () => {
    await Promise.all([fetchStudents(), fetchBatches(), fetchPrograms()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setLastVisible(null);
    setHasMore(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const fetchStudents = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      let query = db.collection("students").where("isDeleted", "==", false);

      // Add search query if present
      if (searchQuery.trim()) {
        // Get all words that start with the search query
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);

        // Use the first term for the main query
        query = query.where(
          "searchableFields",
          "array-contains",
          searchTerms[0]
        );
      }

      // Add limit after all other conditions
      query = query.limit(10);

      // Add start after if we have a last document
      if (loadMore && lastVisible) {
        query = query.startAfter(lastVisible);
      }

      const snapshot = await query.get();
      const fetchedStudents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      // If there are additional search terms, filter results client-side
      if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        const filteredStudents = fetchedStudents.filter((student) => {
          const searchableFields = student.searchableFields || [];
          return searchTerms.every((term) =>
            searchableFields.some((field) => field.includes(term))
          );
        });

        if (loadMore) {
          setStudents((prev) => [...prev, ...filteredStudents]);
        } else {
          setStudents(filteredStudents);
        }
      } else {
        if (loadMore) {
          setStudents((prev) => [...prev, ...fetchedStudents]);
        } else {
          setStudents(fetchedStudents);
        }
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error("Error fetching students:", error);
      Alert.alert("Error", "Failed to fetch students");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchStudents(true);
    }
  };

  const fetchBatches = async () => {
    try {
      const batchesSnapshot = await db
        .collection("batches")
        .where("isDeleted", "==", false)
        .get();
      const fetchedBatches = batchesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
      })) as Batch[];
      setBatches(fetchedBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      Alert.alert("Error", "Failed to fetch batches");
    }
  };

  const fetchPrograms = async () => {
    try {
      const programsSnapshot = await db
        .collection("programs")
        .where("isDeleted", "==", false)
        .get();
      const fetchedPrograms = programsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
      })) as Program[];
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
      Alert.alert("Error", "Failed to fetch programs");
    }
  };

  const validateForm = (data: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.studentId.trim()) {
      errors.studentId = "Student ID is required";
    }

    if (!data.name.trim()) {
      errors.name = "Name is required";
    }

    if (!data.department) {
      errors.department = "Department is required";
    }

    if (!data.batch) {
      errors.batch = "Batch is required";
    }

    if (!data.programs.length) {
      errors.programs = "Select at least one program";
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const studentData = {
        studentId: formData.studentId,
        name: formData.name,
        department: formData.department,
        batch: formData.batch,
        programs: formData.programs,
        createdBy: user?.id || "",
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      // Add student to the students collection
      const studentRef = await db.collection("students").add(studentData);

      // Add student to the batch's students subcollection
      if (formData.batch) {
        const batchRef = db.collection("batches").doc(formData.batch.id);
        const studentInBatch = {
          id: studentRef.id,
          studentId: formData.studentId,
          name: formData.name,
          department: formData.department,
          createdAt: new Date().toISOString(),
          isDeleted: false,
        };

        await batchRef
          .collection("students")
          .doc(studentRef.id)
          .set(studentInBatch);

        // Update batch's student count
        const batchDoc = await batchRef.get();
        if (batchDoc.exists) {
          const studentsSnapshot = await batchRef
            .collection("students")
            .where("isDeleted", "==", false)
            .get();
          await batchRef.update({
            studentCount: studentsSnapshot.size,
          });
        }
      }

      await fetchStudents();
      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      console.error("Error saving student:", error);
      Alert.alert("Error", "Failed to save student");
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      studentId: "",
      name: "",
      department: "",
      batch: null,
      programs: [],
    });
    setFormErrors({});
  };

  const clearError = (field: keyof FormErrors) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    resetForm();
  }, []);

  const handleNavigateToBatches = useCallback(() => {
    router.push("/batches");
  }, [router]);

  const handleNavigateToPrograms = useCallback(() => {
    router.push("/programs");
  }, [router]);

  const handleEditStudent = useCallback((student: Student) => {
    setFormData({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      department: student.department,
      batch: student.batch,
      programs: student.programs,
    });
    setSelectedStudent(null);
    setIsModalVisible(true);
  }, []);

  const handleDeleteStudent = useCallback(async (student: Student) => {
    try {
      // Mark student as deleted in main students collection
      await db.collection("students").doc(student.id).update({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });

      // Update student count in batch
      if (student.batch) {
        const batchRef = db.collection("batches").doc(student.batch.id);

        // Mark student as deleted in batch's students subcollection
        await batchRef.collection("students").doc(student.id).update({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });

        // Update batch's student count
        const studentsSnapshot = await batchRef
          .collection("students")
          .where("isDeleted", "==", false)
          .get();
        await batchRef.update({
          studentCount: studentsSnapshot.size,
        });
      }

      // Update student count in programs
      for (const program of student.programs) {
        const programRef = db.collection("programs").doc(program.id.toString());
        const programDoc = await programRef.get();

        if (programDoc.exists) {
          // Get all batches of this program
          const programBatches = programDoc.data()?.batches || [];

          // Calculate new student count for the program
          let totalStudents = 0;
          for (const batch of programBatches) {
            const batchStudentsSnapshot = await db
              .collection("batches")
              .doc(batch.id)
              .collection("students")
              .where("isDeleted", "==", false)
              .get();
            totalStudents += batchStudentsSnapshot.size;
          }

          // Update program's student count
          await programRef.update({
            studentCount: totalStudents,
          });
        }
      }

      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      Alert.alert("Error", "Failed to delete student");
    }
  }, []);

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      try {
        // Mark student as deleted in main students collection
        await db.collection("students").doc(studentToDelete.id).update({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });

        // Update student count in batch
        if (studentToDelete.batch) {
          const batchRef = db
            .collection("batches")
            .doc(studentToDelete.batch.id);

          // Mark student as deleted in batch's students subcollection
          await batchRef.collection("students").doc(studentToDelete.id).update({
            isDeleted: true,
            deletedAt: new Date().toISOString(),
          });

          // Update batch's student count
          const studentsSnapshot = await batchRef
            .collection("students")
            .where("isDeleted", "==", false)
            .get();
          await batchRef.update({
            studentCount: studentsSnapshot.size,
          });
        }

        // Update student count in programs
        for (const program of studentToDelete.programs) {
          const programRef = db
            .collection("programs")
            .doc(program.id.toString());
          const programDoc = await programRef.get();

          if (programDoc.exists) {
            // Get all batches of this program
            const programBatches = programDoc.data()?.batches || [];

            // Calculate new student count for the program
            let totalStudents = 0;
            for (const batch of programBatches) {
              const batchStudentsSnapshot = await db
                .collection("batches")
                .doc(batch.id)
                .collection("students")
                .where("isDeleted", "==", false)
                .get();
              totalStudents += batchStudentsSnapshot.size;
            }

            // Update program's student count
            await programRef.update({
              studentCount: totalStudents,
            });
          }
        }

        setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
        setStudentToDelete(null);
        setSelectedStudent(null);
      } catch (error) {
        console.error("Error deleting student:", error);
        Alert.alert("Error", "Failed to delete student");
      }
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Student }) => (
      <StudentCard
        key={item.id}
        student={item}
        onPress={() => setSelectedStudent(item)}
      />
    ),
    []
  );

  const ListEmptyComponent = useCallback(() => <EmptyState />, []);

  const LoadingComponent = useCallback(
    () => (
      <>
        <StudentSkeleton />
        <StudentSkeleton />
        <StudentSkeleton />
      </>
    ),
    []
  );

  // Add navigation handler
  const handleNavigateToMigrations = useCallback(() => {
    router.push("/migrations");
  }, [router]);

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
            placeholder="Search students..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              debouncedSearch(text);
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNavigateToMigrations}
        >
          <MaterialCommunityIcons
            name="database-cog"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.content}>
          <LoadingComponent />
        </View>
      ) : (
        <FlatList
          data={students}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          style={styles.flatList}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <CreateStudentModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        formData={formData}
        onUpdateForm={setFormData}
        onNavigateToBatches={handleNavigateToBatches}
        onNavigateToPrograms={handleNavigateToPrograms}
        onSave={handleSave}
        availableBatches={batches}
        availablePrograms={programs}
        formErrors={formErrors}
        onClearError={clearError}
      />

      <StudentDetailsModal
        isVisible={selectedStudent !== null}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />

      {studentToDelete && (
        <DeleteConfirmationDialog
          isVisible={true}
          student={studentToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setStudentToDelete(null)}
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
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  studentName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  studentId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  departmentBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  departmentText: {
    color: COLORS.gray,
    fontSize: FONT_SIZES.xs,
  },
  studentDetails: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: "90%",
    maxHeight: "80%",
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  idInputContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  idInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  dropdownItem: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primary,
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  dropdownItemTextSelected: {
    color: COLORS.white,
  },
  selectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectorList: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectorItemSelected: {
    backgroundColor: COLORS.primary,
  },
  selectorItemContent: {
    flex: 1,
  },
  selectorItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  selectorItemTextSelected: {
    color: COLORS.white,
  },
  selectorItemDates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  selectorItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  selectorEmpty: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectorEmptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  selectorEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  selectorEmptyButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.md,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scannerTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
  },
  closeButton: {
    position: "absolute",
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  detailsModalContent: {
    maxHeight: "80%",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  detailsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  studentAvatar: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  studentDetailName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  studentDetailId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  detailsSection: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  detailCardTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detailCardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  noDataText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    textAlign: "center",
  },
  detailsFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.white,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  editButtonText: {
    color: COLORS.white,
  },
  detailsButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  quickActions: {
    position: "absolute",
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  quickActionButton: {
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  quickEditButton: {
    backgroundColor: COLORS.primary,
  },
  quickDeleteButton: {
    backgroundColor: COLORS.error,
  },
  confirmationDialog: {
    width: "80%",
    maxHeight: "auto",
    alignItems: "center",
    padding: SPACING.lg,
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
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  confirmationButtons: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  confirmationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 100,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: COLORS.error,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
  emptyStateMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: "center",
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
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.lightGray,
  },
  skeletonText: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonTitle: {
    width: 150,
    height: 16,
    marginBottom: SPACING.xs,
  },
  skeletonSubtitle: {
    width: 100,
    height: 14,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonDetail: {
    width: 120,
    height: 14,
    marginLeft: SPACING.xs,
  },
  flatList: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  loadingMore: {
    paddingVertical: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  iconButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
});
