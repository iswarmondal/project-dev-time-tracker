<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { db, auth } from '$lib/firebase-client/config';
	import { doc, getDoc, Timestamp, type DocumentData, updateDoc } from 'firebase/firestore';
	import type { Project } from '$lib/types';

	let projectId = $page.params.projectId;
	let projectData: Project = {};
	let projectRef: any;

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

					const currentSessionOfCounting =
						projectData.lastCountStarted && projectData.isCounting
							? Math.floor(Date.now() / 1000 - projectData.lastCountStarted.toMillis() / 1000)
							: 0;
					console.log(currentSessionOfCounting);
					elapsedSeconds =
						projectData.totalSecondsSpent !== undefined
							? projectData.totalSecondsSpent + currentSessionOfCounting
							: 0;
					console.log(projectData.totalSecondsSpent);
					console.log(elapsedSeconds);

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

<div>
	Timer: {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds
		.toString()
		.padStart(2, '0')}
</div>
<button on:click={startTimer} disabled={timerRunning}>Play</button>
<button on:click={pauseTimer} disabled={!timerRunning}>Pause</button>
