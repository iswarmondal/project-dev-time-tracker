<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase-client/config';
	import { onAuthStateChanged } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';

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

<div class="h-screen flex flex-col justify-center items-center">
	<div>
		<div>
			<input
				type="text"
				placeholder="New project name..."
				bind:value={newProjectName}
				class="border-2 border-black px-4"
			/>
			<button
				on:click={handleAddNewProject}
				disabled={loading}
				class="border-2 border-black px-2 m-2"
			>
				Add project</button
			>
		</div>

		{#if loading}
			<p>Loading projects...</p>
		{:else}
			<div>
				<h2 class="text-2xl my-4">Your Projects</h2>
				<ul class="border-l-2 border-black pl-2 items-center">
					{#each projects as project}
						<li>
							<a href={`/project/${project.id}`} class="text-blue-700 underline">
								{project.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
