<script lang="ts">
	import { loginWithPassword, logout } from '$lib/stores/auth';
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { User, Lock, Loader2, Badge } from 'lucide-svelte';

	let username = '';
	let password = '';
	let error = '';
	let isSubmitting = false;

	$: user = $page.data.user;

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'light') {
			document.documentElement.classList.remove('dark');
		} else {
			document.documentElement.classList.add('dark');
		}

		if (user) {
			goto('/chat');
		}

		// Initialize Google AdSense ads
		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (e) {
			console.error('AdSense initialization failed:', e);
		}
	});

	async function handleLogin() {
		if (!username || !password) {
			error = 'Please enter both username and password';
			return;
		}

		try {
			error = '';
			isSubmitting = true;
			await loginWithPassword(username, password);
			await invalidateAll();
			goto('/chat');
		} catch (e) {
			error = 'Invalid username or password';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-white dark:bg-black p-4 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
	<div class="w-full max-w-md space-y-8 p-4 transition-all duration-300">
		<!-- Google AdSense - Home Top -->
		<div class="mb-8">
			<ins class="adsbygoogle"
				 style="display:block"
				 data-ad-client="ca-pub-4995716486045157"
				 data-ad-slot="YOUR_AD_SLOT_HERE_TOP"
				 data-ad-format="auto"
				 data-full-width-responsive="true"></ins>
		</div>

		<div class="text-center">
			<img src="/logoicon.png" alt="Logo" class="mx-auto h-20 w-20 object-cover rounded-full border-2 border-[#b91c1c]/20 p-1 shadow-lg" />
			<h2 class="mt-6 text-3xl font-bold tracking-tight">Welcome Back</h2>
			<p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Log in to Food Assistant</p>
		</div>

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
			<div class="space-y-4 rounded-md shadow-sm">
				<div class="relative flex items-center">
					<div class="absolute left-4 pointer-events-none text-slate-400">
						<User size={20} />
					</div>
					<input
						bind:value={username}
						type="text"
						required
						class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all placeholder:text-slate-500 text-slate-900 dark:text-white"
						placeholder="Username"
					/>
				</div>
				<div class="relative flex items-center">
					<div class="absolute left-4 pointer-events-none text-slate-400">
						<Lock size={20} />
					</div>
					<input
						bind:value={password}
						type="password"
						required
						class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all placeholder:text-slate-500 text-slate-900 dark:text-white"
						placeholder="Password"
					/>
				</div>
			</div>

			{#if error}
				<div class="rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-center text-sm text-red-400">
					{error}
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={isSubmitting}
					class="group relative flex w-full justify-center rounded-xl bg-[#b91c1c] py-4 text-sm font-bold text-white transition-all hover:bg-[#b91c1c]/90 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-50 shadow-lg shadow-[#b91c1c]/20"
				>
					{#if isSubmitting}
						<Loader2 size={18} class="animate-spin mr-2" />
						Logging in...
					{:else}
						Log in
					{/if}
				</button>
			</div>

			<div class="text-center">
				<p class="text-sm text-slate-500 dark:text-slate-400">
					Don't have an account? 
					<a href="/signup" class="font-medium text-[#b91c1c] hover:underline">Sign up</a>
				</p>
			</div>
		</form>

		<!-- Google AdSense - Home Bottom -->
		<div class="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
			<ins class="adsbygoogle"
				 style="display:block"
				 data-ad-client="ca-pub-4995716486045157"
				 data-ad-slot="YOUR_AD_SLOT_HERE"
				 data-ad-format="auto"
				 data-full-width-responsive="true"></ins>
		</div>
	</div>
</div>

<style>
	:global(body) { font-family: 'Inter', sans-serif; }
	
	.material-symbols-outlined {
		font-family: 'Material Symbols Outlined';
		font-weight: normal;
		font-style: normal;
		font-size: 24px;
		display: inline-block;
		line-height: 1;
		text-transform: none;
		letter-spacing: normal;
		word-wrap: normal;
		white-space: nowrap;
		direction: ltr;
		/* Prevent ligatures from showing as text before font loads */
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-feature-settings: 'liga';
		overflow: hidden;
		width: 1em;
		height: 1em;
	}
</style>
