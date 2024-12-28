import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { Platform, Pressable, View, Modal, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { Text } from '../../components';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmationModalProps) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle} bold>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalActions}>
          <Pressable
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.modalButton, styles.confirmButton]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

export default function TabLayout() {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const AvatarDropdown = () => (
    <View style={styles.dropdownMenu}>
      <Pressable
        style={styles.dropdownItem}
        onPress={() => {
          setShowDropdown(false);
          setShowConfirmation(true);
        }}
      >
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.text} />
        <Text style={styles.dropdownText}>Logout</Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: Platform.select({
            ios: {
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              height: 60,
              paddingBottom: 5,
            },
            android: {
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              height: 60,
              paddingBottom: 5,
              elevation: 5,
            },
          }),
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontFamily: 'Ubuntu-Bold',
          },
          tabBarLabelStyle: {
            fontFamily: 'Ubuntu-Regular',
          },
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          headerRight: () => (
            <View>
              <Pressable
                onPress={() => setShowDropdown(!showDropdown)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  marginRight: 15,
                })}
              >
                <MaterialCommunityIcons
                  name="account-circle"
                  size={28}
                  color={COLORS.white}
                />
              </Pressable>
              {showDropdown && <AvatarDropdown />}
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <Pressable {...props} android_ripple={null} style={props.style} />
            ),
          }}
        />
        <Tabs.Screen
          name="batches"
          options={{
            title: 'Batches',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <Pressable {...props} android_ripple={null} style={props.style} />
            ),
          }}
        />
        <Tabs.Screen
          name="programs"
          options={{
            title: 'Programs',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <Pressable {...props} android_ripple={null} style={props.style} />
            ),
          }}
        />
        <Tabs.Screen
          name="students"
          options={{
            title: 'Students',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-multiple" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <Pressable {...props} android_ripple={null} style={props.style} />
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calendar-check" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <Pressable {...props} android_ripple={null} style={props.style} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="file-chart" size={size} color={color} />
            ),
            tabBarButton: (props) => (
              <Pressable {...props} android_ripple={null} style={props.style} />
            ),
          }}
        />
      </Tabs>

      <ConfirmationModal
        isVisible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => {
          setShowConfirmation(false);
          handleLogout();
        }}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
      />
    </>
  );
}

const styles = StyleSheet.create({
  dropdownMenu: {
    position: 'absolute',
    top: 30,
    right: 15,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
    zIndex: 5000,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
  },
}); 