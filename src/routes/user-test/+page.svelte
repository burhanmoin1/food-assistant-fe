<script lang="ts">
	import { authState, logout as authLogout } from '$lib/stores/auth';

	function handleLogout() {
		authLogout();
	}
</script>

<main class="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-50">
	<p class="text-xl font-semibold">Hi {$authState.username ?? 'user'}</p>
	<button
		class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-sm font-medium"
		on:click={handleLogout}
	>
		Log out
	</button>
</main>
