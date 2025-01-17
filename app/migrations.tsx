import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, TextInput } from "../components";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../constants/theme";
import { testMigration, migrateAllStudents } from "../utils/migrations";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function MigrationsScreen() {
  const [testId, setTestId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const handleTestMigration = async () => {
    if (!testId) {
      Alert.alert("Error", "Please enter a student ID to test");
      return;
    }

    try {
      addLog(`Starting test migration for student ${testId}`);
      const result = await testMigration(testId);
      addLog(`Test migration completed. Result: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`Test migration failed: ${error}`);
      Alert.alert("Error", "Test migration failed. Check logs for details.");
    }
  };

  const handleRunMigration = async () => {
    Alert.alert(
      "Confirm Migration",
      "This will add searchable fields to all students. This operation is safe and won't delete any existing data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: async () => {
            try {
              setIsRunning(true);
              addLog("Starting full migration...");

              const stats = await migrateAllStudents();

              addLog(`Migration completed successfully!`);
              addLog(`Total: ${stats.total}`);
              addLog(`Processed: ${stats.processed}`);
              addLog(`Skipped: ${stats.skipped}`);
              addLog(`Failed: ${stats.failed}`);

              Alert.alert(
                "Success",
                `Migration completed!\nProcessed: ${stats.processed}\nSkipped: ${stats.skipped}\nFailed: ${stats.failed}`
              );
            } catch (error) {
              addLog(`Migration failed: ${error}`);
              Alert.alert("Error", "Migration failed. Check logs for details.");
            } finally {
              setIsRunning(false);
            }
          },
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: "Database Migrations",
          headerTitleStyle: {
            color: COLORS.text,
          },
          headerStyle: {
            backgroundColor: COLORS.white,
          },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title} bold>
          Add Searchable Fields Migration
        </Text>

        <View style={styles.testSection}>
          <Text style={styles.sectionTitle} bold>
            Test Migration
          </Text>
          <Text style={styles.description}>
            Test the migration on a single student first to verify the results.
          </Text>
          <View style={styles.testInput}>
            <TextInput
              style={styles.input}
              placeholder="Enter student ID to test"
              value={testId}
              onChangeText={setTestId}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleTestMigration}
              disabled={isRunning}
            >
              <Text style={styles.buttonText} bold>
                Test
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.migrationSection}>
          <Text style={styles.sectionTitle} bold>
            Run Full Migration
          </Text>
          <Text style={styles.description}>
            This will add searchable fields to all students in the database.
            This operation is safe and won't delete any existing data.
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.runButton]}
            onPress={handleRunMigration}
            disabled={isRunning}
          >
            <Text style={[styles.buttonText, styles.runButtonText]} bold>
              {isRunning ? "Running Migration..." : "Run Migration"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle} bold>
            Migration Logs
          </Text>
          <ScrollView style={styles.logs}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logEntry}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  testSection: {
    marginBottom: SPACING.xl,
  },
  testInput: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  migrationSection: {
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  runButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
  },
  runButtonText: {
    fontSize: FONT_SIZES.md,
  },
  logsSection: {
    flex: 1,
  },
  logs: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  logEntry: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});
