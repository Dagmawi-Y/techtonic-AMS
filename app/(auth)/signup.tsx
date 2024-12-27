import { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TextInput } from '../../components';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Here you would typically make an API call to register the user
    // For now, we'll just show a success message and redirect
    Alert.alert('Success', 'Account created successfully', [
      {
        text: 'OK',
        onPress: () => router.replace('/login'),
      },
    ]);
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.content, { flex: 1 }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -500}
      >
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="school" size={80} color={COLORS.white} />
          <Text style={styles.title} bold>Techtonic Tribe</Text>     
          <Text style={styles.subtitle}>Member Management Portal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcome}>Create Account</Text>
          
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email" size={24} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock" size={24} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-check" size={24} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={COLORS.gray}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText} bold>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextBold} bold>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  welcome: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.black,
    marginVertical: SPACING.sm,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  inputIcon: {
    padding: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  signupButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  loginLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  loginLinkTextBold: {
    color: COLORS.primary,
  },
}); 