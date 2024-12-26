import { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TextInput } from '../components';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === '123') {
      router.replace('/(tabs)');
    } else {
      setError('Invalid credentials');
      Alert.alert('Error', 'Invalid username or password');
    }
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
        <Text style={styles.welcome}>Welcome Back!</Text>
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText} bold>Login</Text>
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.black,
    marginVertical: SPACING.sm,
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
  loginButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
});
