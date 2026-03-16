<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let localTime = '';
	let timeZone = '';
	let isoString = '';
	let latitude: number | null = null;
	let longitude: number | null = null;
	let locationError = '';
	let interval: any;

	function updateTime() {
		const now = new Date();
		localTime = now.toString();
		isoString = now.toISOString();
		
		// Extract timezone
		if (browser) {
			timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	}

	function getLocation() {
		if (!browser) return;

		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by your browser';
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				latitude = position.coords.latitude;
				longitude = position.coords.longitude;
				console.log('User Location:', { latitude, longitude });
			},
			(error) => {
				switch(error.code) {
					case error.PERMISSION_DENIED:
						locationError = "User denied the request for Geolocation.";
						break;
					case error.POSITION_UNAVAILABLE:
						locationError = "Location information is unavailable.";
						break;
					case error.TIMEOUT:
						locationError = "The request to get user location timed out.";
						break;
					default:
						locationError = "An unknown error occurred.";
						break;
				}
				console.error('Geolocation Error:', locationError);
			}
		);
	}

	onMount(() => {
		updateTime();
		getLocation();
		// Update every second for a live clock effect
		interval = setInterval(updateTime, 1000);

		return () => {
			if (interval) clearInterval(interval);
		};
	});
</script>

<main class="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 space-y-8">
	<div class="text-center space-y-2">
		<h1 class="text-4xl font-bold text-emerald-400">Time & Location Test</h1>
		<p class="text-slate-400">Extracting user's local time, timezone, and geolocation.</p>
	</div>

	<div class="w-full max-w-lg p-8 bg-slate-900 rounded-lg border border-slate-800 space-y-6 shadow-xl">
		
		<div class="space-y-2">
			<h2 class="text-sm font-medium text-slate-400 uppercase tracking-wider">Detected Timezone</h2>
			<div class="text-2xl font-mono bg-slate-950 p-4 rounded border border-slate-800 text-emerald-400">
				{timeZone || 'Detecting...'}
			</div>
		</div>

		<div class="space-y-2">
			<h2 class="text-sm font-medium text-slate-400 uppercase tracking-wider">Local Time String</h2>
			<div class="text-lg font-mono bg-slate-950 p-4 rounded border border-slate-800 break-words">
				{localTime || 'Loading...'}
			</div>
		</div>

		<div class="space-y-2">
			<h2 class="text-sm font-medium text-slate-400 uppercase tracking-wider">ISO String (UTC)</h2>
			<div class="text-sm font-mono bg-slate-950 p-4 rounded border border-slate-800 text-slate-400 break-all">
				{isoString || 'Loading...'}
			</div>
		</div>

		<div class="space-y-2">
			<h2 class="text-sm font-medium text-slate-400 uppercase tracking-wider">Geolocation</h2>
			<div class="bg-slate-950 p-4 rounded border border-slate-800">
				{#if latitude !== null && longitude !== null}
					<div class="grid grid-cols-2 gap-4">
						<div>
							<span class="text-slate-500 text-xs block">Latitude</span>
							<span class="font-mono text-emerald-400">{latitude.toFixed(6)}</span>
						</div>
						<div>
							<span class="text-slate-500 text-xs block">Longitude</span>
							<span class="font-mono text-emerald-400">{longitude.toFixed(6)}</span>
						</div>
					</div>
					<div class="mt-2 pt-2 border-t border-slate-800">
						<a 
							href="https://www.google.com/maps?q={latitude},{longitude}" 
							target="_blank" 
							class="text-xs text-blue-400 hover:text-blue-300 underline"
						>
							View on Google Maps
						</a>
					</div>
				{:else if locationError}
					<p class="text-red-400 text-sm">{locationError}</p>
				{:else}
					<p class="text-slate-500 text-sm animate-pulse">Requesting location access...</p>
				{/if}
			</div>
		</div>

		<div class="pt-4 border-t border-slate-800">
			<p class="text-xs text-slate-500">
				Check your browser console (F12) to see the logs.
			</p>
		</div>

		<div class="pt-2 text-center">
			<a href="/" class="text-emerald-500 hover:text-emerald-400 underline text-sm">Back to Home</a>
		</div>

	</div>
</main>
