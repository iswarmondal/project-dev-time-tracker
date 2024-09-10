<script>
	import { auth } from '$lib/firebase-client/config';
	import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { db } from '$lib/firebase-client/config'; // Import the Firestore instance
	import { doc, setDoc } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
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
				displayName: result.user.displayName
				// Add more fields as needed
			});
			goto('/projects');
		} catch (error) {
			console.error('Error signing in: ', error);
		}
	}
</script>

<div class="flex h-screen flex-col items-center justify-center gap-5">
	<p class="w-1/2 text-center text-2xl">
		Track how much time is spent on your side-projects.
		<br />
		Simple and enough
	</p>
	<Button variant="default" on:click={loginWithGoogle}>Login with Google</Button>
</div>
