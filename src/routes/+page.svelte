<script>
	import { auth } from '$lib/firebase-client/config';
	import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
	import { goto } from '$app/navigation'; 
	import { db } from '$lib/firebase-client/config'; // Import the Firestore instance
	import { doc, setDoc } from 'firebase/firestore';
	const provider = new GoogleAuthProvider();

	// Check if user is already logged in
	onAuthStateChanged(auth, (user) => {
		if (user) {
			// User is signed in, redirect to /projects
			goto('/projects');
		}
	});

	async function loginWithGoogle() {
		try {
			const result = await signInWithPopup(auth, provider);
				console.log('User signed in: ', result.user);

			// Create a new user document in Firestore
			const userDocRef = doc(db, 'users', result.user.uid);
			await setDoc(userDocRef, {
				// Add basic user info here
				email: result.user.email,
				displayName: result.user.displayName,
				// Add more fields as needed
			});
			goto('/projects'); 
		} catch (error) {
				console.error('Error signing in: ', error);
	}
	}
</script>

<button on:click={loginWithGoogle}> Login with Google </button>
