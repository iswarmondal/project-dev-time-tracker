<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase-client/config';
	import { onAuthStateChanged } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { collection, addDoc, query, onSnapshot } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

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

<div class="flex h-screen flex-col items-center justify-center">
	<div class="min-w-sm max-w-md">
		<form
			class="flex w-full max-w-sm items-center space-x-2"
			on:submit|preventDefault={handleAddNewProject}
		>
			<Input type="text" placeholder="New project name..." bind:value={newProjectName} />
			{#if loading}
				<Button disabled><LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Wait</Button>
			{:else}
				<Button type="submit">Add project</Button>
			{/if}
		</form>

		{#if loading}
			<p>Loading projects...</p>
		{:else}
			<div>
				<h2 class="my-4 text-2xl">Your Projects</h2>
				<ul class="items-center border-l-2 border-black pl-2">
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
