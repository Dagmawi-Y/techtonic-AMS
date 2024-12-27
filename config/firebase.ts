import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

// Initialize Firebase
const androidCredentials = {
  clientId: '1:91355796172:android:526cfc0dbf661e8daaa869',
  apiKey: 'AIzaSyC0aiv_t-hqGNmSipw2543Bic1evA9XobU',
  projectId: 'techtonic-ams',
  storageBucket: 'techtonic-ams.firebasestorage.app',
  messagingSenderId: '91355796172',
  appId: '1:91355796172:android:526cfc0dbf661e8daaa869',
};

// Auth and Firestore are automatically initialized by the packages
export { auth };
export const db = firestore(); 