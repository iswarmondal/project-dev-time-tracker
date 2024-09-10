<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { db, auth } from '$lib/firebase-client/config';
	import {
		doc,
		getDoc,
		Timestamp,
		type DocumentData,
		updateDoc,
		deleteDoc
	} from 'firebase/firestore';
	import type { Project } from '$lib/types';
	import { Button, buttonVariants } from '@/components/ui/button/index';
	import * as Dialog from '@/components/ui/dialog/index';
	import { Input } from '@/components/ui/input';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	let projectId = $page.params.projectId;
	let projectData: Project = {};
	let projectRef: any;

	let newProjectName = 'MyProject';
	let isLoading = false;

	// Timer functionality
	let timerInterval: NodeJS.Timeout;
	let timerRunning = false;
	let elapsedSeconds = 0;

	const startTimer = async () => {
		try {
			timerRunning = true;
			timerInterval = setInterval(() => {
				elapsedSeconds++;
			}, 1000);
			const newValues: Project = {
				isCounting: true,
				lastCountStarted: Timestamp.now()
			};
			await updateDoc(projectRef, newValues);
		} catch (error) {
			console.error('Error updating document:', error);
		}
	};

	const pauseTimer = async () => {
		try {
			timerRunning = false;
			clearInterval(timerInterval);
			const newTotalSecondsSpent = projectData.totalSecondsSpent
				? projectData.totalSecondsSpent + elapsedSeconds
				: elapsedSeconds;

			const newValues: Project = {
				isCounting: false,
				totalSecondsSpent: newTotalSecondsSpent
			};
			await updateDoc(projectRef, newValues);
		} catch (error) {
			console.error('Error updating document:', error);
		}
	};

	const setProjectName = async (name: string) => {
		try {
			isLoading = true;
			const newValues: Project = {
				name: name.trim()
			};

			await updateDoc(projectRef, newValues);
			location.reload();
		} catch (error) {
			console.error(error);
			isLoading = false;
		}
	};

	const deleteThisProject = async () => {
		try {
			isLoading = true;

			if (confirm(`Your project ${projectData.name} will be deleted permanently`)) {
				deleteDoc(projectRef);
				console.log('Your project is deleted!!!');
				goto('/');
			}
			isLoading = false;
		} catch (error) {
			console.error(error);
			isLoading = false;
		}
	};

	$: hours = Math.floor(elapsedSeconds / 3600);
	$: minutes = Math.floor((elapsedSeconds % 3600) / 60);
	$: seconds = elapsedSeconds % 60;

	onMount(() => {
		const unsubscribe = auth.onAuthStateChanged(async (user) => {
			if (!user) {
				goto('/');
			} else {
				// User is logged in, fetch the project
				projectRef = doc(db, 'users', user.uid, 'projects', projectId);
				const projectSnapshot = await getDoc(projectRef);

				if (projectSnapshot.data()) {
					projectData = projectSnapshot.data() as DocumentData;
					newProjectName = projectData.name ?? newProjectName;
					const currentSessionOfCounting =
						projectData.lastCountStarted && projectData.isCounting
							? Math.floor(Date.now() / 1000 - projectData.lastCountStarted.toMillis() / 1000)
							: 0;

					elapsedSeconds =
						projectData.totalSecondsSpent !== undefined
							? projectData.totalSecondsSpent + currentSessionOfCounting
							: 0;

					// Start timer if isCounting is true in the fetched data
					if (projectData.isCounting) {
						timerRunning = true;
						timerInterval = setInterval(() => {
							elapsedSeconds++;
						}, 1000);
					}
				} else {
					console.error('Project not found.');
				}
			}
		});

		return unsubscribe;
	});
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<pre class="text-4xl">{hours.toString().padStart(2, '0')}:{minutes
			.toString()
			.padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
	</pre>
	<div>
		<button
			on:click={startTimer}
			disabled={timerRunning}
			class="cursor-pointer p-4"
			class:opacity-30={timerRunning}>Play</button
		>
		<button
			on:click={pauseTimer}
			disabled={!timerRunning}
			class="cursor-pointer p-4"
			class:opacity-30={!timerRunning}>Pause</button
		>
	</div>
	<div class="absolute bottom-4 text-xs">
		<h2>{projectData.name ?? ''}</h2>
	</div>

	<div class="absolute bottom-4 right-4">
		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ variant: 'ghost' })}>i</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<form
					class="mt-4 flex gap-2"
					on:submit|preventDefault={() => {
						setProjectName(newProjectName);
					}}
				>
					<Input id="name" bind:value={newProjectName} disabled={isLoading} />
					{#if isLoading}
						<Button disabled><LoaderCircle class="mr-2 h-4 w-4 animate-spin" />Wait</Button>
					{:else}
						<Button variant="outline" type="submit">Set name</Button>
					{/if}
				</form>
				{#if !isLoading}
					<Button variant="destructive" on:click={deleteThisProject} type="button">
						Delete project from database
					</Button>
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	</div>
</div>
