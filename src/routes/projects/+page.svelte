<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase-client/config';
	import { onAuthStateChanged } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { collection, addDoc, query, type DocumentData, onSnapshot } from 'firebase/firestore';

	import type { Project } from '$lib/types';

	let newProjectName = '';
	let projects: Project[] = [];
	let loading = true;

	onMount(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
			if (!user) {
				goto('/');
			} else {
				// Fetch projects when user is logged in
				const projectsQuery = query(collection(db, `users/${user.uid}/projects`));

				// Use onSnapshot for real-time updates
				const unsubscribeSnapshot = onSnapshot(projectsQuery, (snapshot) => {
					projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Project);
					loading = false; // Set loading to false after fetching projects
				});

				// Return unsubscribe function to stop listening for changes when component unmounts
				return () => {
					unsubscribeSnapshot();
				};
			}
		});

		// Unsubscribe from auth state changes when component unmounts
		return unsubscribeAuth;
	});

	const handleAddNewProject = async () => {
		if (newProjectName === '') {
			alert('Please enter a project name');
			return;
		}

		try {
			const user = auth.currentUser;
			if (user) {
				const newProjectObj: Project = {
					name: newProjectName,
					totalSecondsSpent: 0,
					lastCountStarted: null,
					isCounting: false
				};
				// Add new project to Firestore
				await addDoc(collection(db, `users/${user.uid}/projects`), newProjectObj);

				// Clear input field - onSnapshot will update the projects list
				newProjectName = '';
			}
		} catch (error) {
			console.error('Error adding project: ', error);
		}
	};
</script>

<input type="text" placeholder="Add new project..." bind:value={newProjectName} />
<button on:click={handleAddNewProject} disabled={loading}> Add project</button>

{#if loading}
	<p>Loading projects...</p>
{:else}
	<h2>Your Projects</h2>
	<ul>
		{#each projects as project}
			<li>
				<a href={`/project/${project.id}`}> {project.name} </a>
			</li>
		{/each}
	</ul>
{/if}
