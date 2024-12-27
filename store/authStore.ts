import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import { User } from './types';
import { auth, db } from '../config/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  hydrated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const createUserProfile = async (firebaseUser: FirebaseAuthTypes.User, name: string): Promise<User> => {
  const userProfile: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    name: name,
    role: 'admin',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  await firestore().collection('users').doc(firebaseUser.uid).set({
    ...userProfile,
    createdAt: firestore.FieldValue.serverTimestamp(),
    lastLoginAt: firestore.FieldValue.serverTimestamp(),
  });

  return userProfile;
};

const getUserProfile = async (firebaseUser: FirebaseAuthTypes.User): Promise<User | null> => {
  const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
  if (userDoc.exists) {
    return userDoc.data() as User;
  }
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      hydrated: false,

      setHydrated: (hydrated) => set({ hydrated }),

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      signUp: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });
          const { user: firebaseUser } = await auth().createUserWithEmailAndPassword(email, password);
          const userProfile = await createUserProfile(firebaseUser, name);
          set({ 
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ 
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },
      
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { user: firebaseUser } = await auth().signInWithEmailAndPassword(email, password);
          const userProfile = await getUserProfile(firebaseUser);
          
          if (!userProfile) {
            throw new Error('User profile not found');
          }
          
          // Update last login
          await firestore().collection('users').doc(firebaseUser.uid).update({
            lastLoginAt: firestore.FieldValue.serverTimestamp(),
          });
          
          set({ 
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ 
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },
      
      signOut: async () => {
        try {
          await auth().signOut();
          set({ 
            user: null, 
            isAuthenticated: false,
            error: null 
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      initialize: () => {
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            const userProfile = await getUserProfile(firebaseUser);
            set({ 
              user: userProfile,
              isAuthenticated: !!userProfile,
              isLoading: false,
            });
          } else {
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
); 