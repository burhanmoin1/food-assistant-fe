<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { authState } from '$lib/stores/auth';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	// Sync authState with server data on the client
	$effect(() => {
		if (browser && data.user) {
			authState.set(data.user);
		} else if (browser) {
			authState.set({ username: null, roles: [] });
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
