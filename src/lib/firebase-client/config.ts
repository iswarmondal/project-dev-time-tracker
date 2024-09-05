import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyDKw3mGpmREx1nClIu3lhzC7gOe-R_aFXs',
	authDomain: 'project-dev-time-tracker.firebaseapp.com',
	projectId: 'project-dev-time-tracker',
	storageBucket: 'project-dev-time-tracker.appspot.com',
	messagingSenderId: '781457735492',
	appId: '1:781457735492:web:d93f48a71d6f26d422e111'
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
