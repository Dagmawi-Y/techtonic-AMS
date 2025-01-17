import { db } from "../config/firebase";
import type {
  QuerySnapshot,
  DocumentData,
  DocumentSnapshot,
} from "@firebase/firestore";

interface MigrationStats {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
}

const BATCH_SIZE = 450; // Firestore batch limit is 500, keeping buffer

const createSearchableFields = (student: any): string[] => {
  const searchableFields: string[] = [];

  // Add all searchable fields in lowercase
  if (student.name) searchableFields.push(student.name.toLowerCase());
  if (student.studentId) searchableFields.push(student.studentId.toLowerCase());
  if (student.department)
    searchableFields.push(student.department.toLowerCase());

  // Add individual words from name for partial matching
  if (student.name) {
    const nameWords = student.name.toLowerCase().split(" ");
    searchableFields.push(...nameWords);
  }

  // Remove duplicates and empty strings
  return [...new Set(searchableFields)].filter((field) => field.trim() !== "");
};

// Test migration on a single document first
export const testMigration = async (studentId: string) => {
  try {
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      console.log("Student not found");
      return;
    }

    const student = studentDoc.data();
    console.log("Original student data:", student);

    const searchableFields = createSearchableFields(student);
    console.log("Generated searchable fields:", searchableFields);

    // Don't actually update, just show what would be updated
    console.log("Would update with:", {
      searchableFields,
      lastMigration: "add_searchable_fields",
      lastMigrationAt: new Date().toISOString(),
    });

    return searchableFields;
  } catch (error) {
    console.error("Test migration failed:", error);
    throw error;
  }
};

// Migrate a batch of students
const migrateStudentsBatch = async (
  students: QuerySnapshot<DocumentData>,
  stats: MigrationStats
): Promise<void> => {
  const batch = db.batch();

  students.docs.forEach((doc) => {
    try {
      const student = doc.data();

      // Check if searchableFields exists and is non-empty
      if (
        student.searchableFields &&
        Array.isArray(student.searchableFields) &&
        student.searchableFields.length > 0
      ) {
        stats.skipped++;
        return;
      }

      const searchableFields = createSearchableFields(student);

      // Only update if we generated some searchable fields
      if (searchableFields.length > 0) {
        const studentRef = db.collection("students").doc(doc.id);
        batch.update(studentRef, {
          searchableFields,
          lastMigration: "add_searchable_fields",
          lastMigrationAt: new Date().toISOString(),
        });
        stats.processed++;
      } else {
        stats.skipped++;
      }
    } catch (error) {
      console.error(`Failed to process student ${doc.id}:`, error);
      stats.failed++;
    }
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Failed to commit batch:", error);
    throw error;
  }
};

// Main migration function
export const migrateAllStudents = async (): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    total: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Get total count first
    const totalSnapshot = await db.collection("students").count().get();
    stats.total = totalSnapshot.data().count;

    let lastDoc = null;

    while (true) {
      // Build query
      let query = db.collection("students").limit(BATCH_SIZE);

      // Add start after if we have a last document
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      // Get batch of students
      const snapshot = await query.get();

      // Break if no more documents
      if (snapshot.empty) break;

      // Process batch
      await migrateStudentsBatch(snapshot, stats);

      // Update last document for next iteration
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      // Log progress
      console.log(
        `Processed ${stats.processed}/${stats.total} students (${stats.failed} failed, ${stats.skipped} skipped)`
      );

      // Add small delay to prevent overloading
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Migration completed:", stats);
    return stats;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};
