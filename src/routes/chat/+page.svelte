<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		History,
		ChevronLeft,
		ChevronRight,
		User,
		LogOut,
		Sun,
		Moon,
		Bell,
		Plus,
		Search,
		MessageSquare,
		Wallet,
		Star,
		Bot,
		MapPin,
		X
	} from 'lucide-svelte';
	import {
		getMore,
		listSessions,
		readSession,
		resolveScope,
		sendMessage,
		startSession,
		type ChatMessage,
		type ChatMode,
		type ChatResultItem
	} from '$lib/features/chat/api';

	type SessionListItem = {
		id: string;
		mode: ChatMode;
		query_text: string;
		offset: number;
		status: string;
		created_at: string;
		updated_at: string;
	};

	let mode: ChatMode = 'budget';
	let foodInput = '';
	let budgetInput = '';
	let promptInput = '';
	let followupInput = '';
	let isSubmitting = false;
	let error = '';
	let lat = 24.797411;
	let lng = 67.046227;
	let usingDefaultLocation = true;
	let scopeId: number | null = null;
	let sessionId: string | null = null;
	let hasMore = false;
	let messages: ChatMessage[] = [];
	let sessions: SessionListItem[] = [];
	let threadEl: HTMLDivElement | null = null;
	let isDarkMode = true;
	let isSidebarOpen = true;
	let isMobileSidebarOpen = false;
	let currentTime = new Date();

	$: user = $page.data.user;
	$: filteredSessions = sessions.filter((s) => s.mode === mode);
	$: if (messages.length > 0) {
		tick().then(() => {
			threadEl?.scrollTo({ top: threadEl.scrollHeight, behavior: 'smooth' });
		});
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function toggleMobileSidebar() {
		isMobileSidebarOpen = !isMobileSidebarOpen;
	}

	function toResult(raw: any): ChatResultItem {
		return {
			restaurant_id: String(raw?.restaurant_id ?? ''),
			restaurant_name: String(raw?.restaurant_name ?? ''),
			city: String(raw?.city ?? ''),
			rating: Number(raw?.rating ?? 0),
			vendor_code: String(raw?.vendor_code ?? ''),
			item_id: String(raw?.item_id ?? ''),
			item_name: String(raw?.item_name ?? ''),
			category: String(raw?.category ?? ''),
			description: String(raw?.description ?? ''),
			image_url: String(raw?.image_url ?? ''),
			price: Number(raw?.price ?? 0),
			tags: Array.isArray(raw?.tags) ? raw.tags.map((t: unknown) => String(t)) : [],
			llm_reason: String(raw?.llm_reason ?? ''),
			score: Number(raw?.score ?? 0)
		};
	}

	function switchMode(next: ChatMode) {
		mode = next;
		sessionId = null;
		scopeId = null;
		messages = [];
		hasMore = false;
		error = '';
		followupInput = '';
	}

	function buildQuery() {
		if (mode === 'prompt') return promptInput.trim();
		const base = foodInput.trim();
		if (!base) return '';
		if (mode === 'budget' && budgetInput.trim()) {
			return `${base} under ${budgetInput.trim()} PKR`;
		}
		return base;
	}

	async function fetchBrowserLocation() {
		if (!navigator.geolocation) return;
		try {
			const coords = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				});
			});
			lat = Number(coords.coords.latitude.toFixed(6));
			lng = Number(coords.coords.longitude.toFixed(6));
			usingDefaultLocation = false;
		} catch {
			usingDefaultLocation = true;
		}
	}

	async function loadSessions() {
		if (!user) return;
		try {
			sessions = await listSessions();
		} catch {
			sessions = [];
		}
	}

	async function handleStart() {
		if (!user) return;
		const query = buildQuery();
		if (!query) {
			error = 'Please enter what you want to eat.';
			return;
		}
		error = '';
		isSubmitting = true;
		try {
			const scope = await resolveScope({ lat, lng });
			scopeId = scope.scope_id;
			const started = await startSession({
				mode,
				query,
				scope_id: scope.scope_id,
				budget_pkr:
					mode === 'budget' && Number.isFinite(Number(budgetInput)) && Number(budgetInput) > 0
						? Number(budgetInput)
						: undefined
			});
			sessionId = started.session_id;
			hasMore = started.has_more;
			messages = [
				{
					id: Date.now(),
					role: 'user',
					content: query,
					payload_json: {},
					created_at: new Date().toISOString()
				},
				{
					id: Date.now() + 1,
					role: 'assistant',
					content: started.assistant_text,
					payload_json: started.answer_payload ?? { results: started.results, answer_type: 'menu_list' },
					created_at: new Date().toISOString()
				}
			];
			followupInput = '';
			await loadSessions();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to start chat';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleMore() {
		if (!sessionId) return;
		isSubmitting = true;
		error = '';
		try {
			const more = await getMore(sessionId, 5);
			hasMore = more.has_more;
			messages = [
				...messages,
				{
					id: Date.now(),
					role: 'assistant',
					content: more.assistant_text,
					payload_json: more.answer_payload ?? { results: more.results, answer_type: 'menu_list' },
					created_at: new Date().toISOString()
				}
			];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load more';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleFollowup() {
		if (!sessionId || !followupInput.trim()) return;
		const text = followupInput.trim();
		followupInput = '';
		isSubmitting = true;
		error = '';
		try {
			messages = [
				...messages,
				{
					id: Date.now(),
					role: 'user',
					content: text,
					payload_json: {},
					created_at: new Date().toISOString()
				}
			];
			const reply = await sendMessage(sessionId, text);
			messages = [
				...messages,
				{
					id: Date.now() + 1,
					role: 'assistant',
					content: reply.assistant_text,
					payload_json:
						reply.answer_payload ?? { results: reply.referenced_results, answer_type: 'menu_list' },
					created_at: new Date().toISOString()
				}
			];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send message';
		} finally {
			isSubmitting = false;
		}
	}

	async function openSession(id: string) {
		error = '';
		isSubmitting = true;
		isMobileSidebarOpen = false; // Close mobile sidebar if open
		try {
			const data = await readSession(id);
			mode = data.mode;
			sessionId = data.id;
			scopeId = data.scope_id;
			messages = data.messages;
			hasMore = data.offset < data.candidate_ids_json.length;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to open session';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleLogout() {
		try {
			// You might need a logout endpoint in the backend, or just clear cookies
			// Assuming there's a /api/auth/logout or we just clear the session
			await fetch('/api/auth/logout', { method: 'POST' });
			window.location.href = '/signup';
		} catch (e) {
			window.location.href = '/signup';
		}
	}

	function fallbackImage(e: Event) {
		const target = e.currentTarget as HTMLImageElement;
		target.src =
			'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180"><rect width="100%" height="100%" fill="%23111c2c"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238aa0bf" font-family="Arial" font-size="14">No image</text></svg>';
	}

	function answerType(payload: Record<string, unknown> | null | undefined) {
		return String(payload?.answer_type ?? 'menu_list');
	}

	function dealSuggestions(payload: Record<string, unknown> | null | undefined) {
		const raw = payload?.deal_suggestions;
		return Array.isArray(raw) ? raw : [];
	}

	const tabs: ChatMode[] = ['prompt', 'budget', 'quality'];

	onMount(async () => {
		const timer = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		if (!user) {
			goto('/signup');
			return;
		}

		// Load theme
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'light') {
			isDarkMode = false;
			document.documentElement.classList.remove('dark');
		} else {
			isDarkMode = true;
			document.documentElement.classList.add('dark');
		}

		await fetchBrowserLocation();
		await loadSessions();
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
</svelte:head>

<div class="flex h-screen overflow-hidden bg-slate-100 dark:bg-black text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
	<!-- Sidebar -->
	<aside class={`${isSidebarOpen ? 'w-80' : 'w-20'} hidden lg:flex flex-shrink-0 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0a] flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden`}>
		<div class="w-full h-full flex flex-col">
			<!-- Sidebar Header -->
			<div class="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-center relative h-16 flex-shrink-0">
				{#if isSidebarOpen}
					<div class="flex items-center gap-3 w-full px-2">
						<div class="w-10 h-10 rounded-full bg-[#b91c1c]/10 flex items-center justify-center text-[#b91c1c] flex-shrink-0">
							<History size={20} />
						</div>
						<div class="min-w-0">
							<h1 class="text-base font-semibold truncate">Food Journal</h1>
							<p class="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium truncate">Your food journey</p>
						</div>
						<button 
							on:click={toggleSidebar}
							class="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-400 group"
							title="Close Sidebar"
						>
							<ChevronLeft size={20} />
						</button>
					</div>
				{:else}
					<button 
						on:click={toggleSidebar}
						class="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 transition-colors text-[#b91c1c] shadow-sm hover:shadow-md group overflow-hidden"
						title="Open Sidebar"
					>
						<ChevronRight size={24} />
					</button>
				{/if}
			</div>

			<!-- Navigation/History -->
			<nav class="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
				<div class="w-full p-4">
					{#if isSidebarOpen}
						<p class="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-3">Past Discovery</p>
					{/if}
					
					<div class="space-y-2">
						{#if filteredSessions.length === 0}
							{#if isSidebarOpen}
								<div class="px-3 py-2 text-sm text-slate-500">No history yet.</div>
							{:else}
								<div class="flex justify-center text-slate-400 py-4" title="No history yet">
									<History size={20} />
								</div>
							{/if}
						{:else}
							{#each filteredSessions.slice(0, isSidebarOpen ? filteredSessions.length : 1) as s}
								<button 
									class={`w-full flex items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer group transition-colors ${isSidebarOpen ? 'px-3 py-2 gap-3' : 'p-3 justify-center'}`}
									on:click="{() => openSession(s.id)}"
									title={!isSidebarOpen ? s.query_text : ''}
								>
									<div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1a1a1a] flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0 group-hover:text-[#b91c1c] transition-colors">
										<History size={18} />
									</div>
									{#if isSidebarOpen}
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium truncate text-slate-700 dark:text-slate-300 group-hover:text-[#b91c1c] dark:group-hover:text-slate-100">{s.query_text}</p>
											<p class="text-[10px] text-slate-400">{new Date(s.updated_at).toLocaleDateString()}</p>
										</div>
									{/if}
								</button>
							{/each}
						{/if}
					</div>
				</div>
			</nav>

			<!-- User Profile -->
			<div class="p-4 border-t border-slate-200 dark:border-white/5 flex-shrink-0">
				{#if user}
					<div class={`flex items-center rounded-xl bg-slate-50 dark:bg-[#121212] border border-slate-100 dark:border-white/5 transition-all duration-300 ${isSidebarOpen ? 'p-2 gap-3' : 'p-2 justify-center'}`}>
						<div class="w-8 h-8 rounded-full bg-[#b91c1c] flex-shrink-0 flex items-center justify-center text-white">
							<User size={18} />
						</div>
						{#if isSidebarOpen}
							<div class="flex-1 min-w-0">
								<p class="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">
									{user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
								</p>
							</div>
							<button 
								class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
								on:click={handleLogout}
								title="Sign Out"
							>
								<LogOut size={18} />
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 flex flex-col bg-slate-50 dark:bg-black relative transition-colors duration-200 min-w-0">
		<!-- Header -->
	<header class="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/80 backdrop-blur-md z-10 transition-colors duration-200">
		<div class="flex items-center gap-3 min-w-0">
			<button 
				class="lg:pointer-events-none"
				on:click={toggleMobileSidebar}
			>
				<img src="/logoicon.png" alt="Food Discovery Logo" class="w-10 h-10 object-cover flex-shrink-0 rounded-full border border-slate-200 dark:border-white/10" />
			</button>
			<h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">Food Assistant</h2>
		</div>
			<div class="flex items-center gap-3">
				<button 
					on:click={toggleTheme}
					class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
					title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
				>
					{#if isDarkMode}
						<Sun size={20} />
					{:else}
						<Moon size={20} />
					{/if}
				</button>
				<button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
					<Bell size={20} />
				</button>
				<button 
					class="px-4 py-2.5 bg-[#b91c1c] hover:bg-[#b91c1c]/90 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#b91c1c]/20 active:scale-95"
					on:click={() => switchMode(mode)}
				>
					<Plus size={18} />
					<span class="hidden sm:inline">New Discovery</span>
					<span class="sm:hidden">New</span>
				</button>
			</div>
		</header>

		<!-- Chat Area -->
		<div class="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar bg-white dark:bg-[#080808]" bind:this={threadEl}>
			{#if messages.length === 0}
				<!-- Welcome State -->
				<div class="flex items-center justify-center h-full text-slate-400">
					<p class="text-sm">Start a conversation...</p>
				</div>
			{:else}
				<!-- Chat Messages -->
				{#each messages as msg}
					{#if msg.role === 'user'}
						<div class="flex items-start justify-end gap-4">
							<div class="flex flex-col items-end gap-2 max-w-2xl">
								<div class="bg-[#b91c1c] text-white p-4 rounded-2xl rounded-tr-none shadow-md shadow-[#b91c1c]/20">
									<p class="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
								</div>
								<span class="text-[10px] font-medium text-slate-400 uppercase tracking-widest mr-1">You</span>
							</div>
						</div>
					{:else}
						<div class="flex items-start gap-4 max-w-4xl">
							<div class="w-10 h-10 rounded-full bg-[#b91c1c] flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-[#b91c1c]/30">
								<Bot size={20} />
							</div>
							<div class="flex flex-col gap-4 flex-1 min-w-0">
									{#if !Array.isArray(msg.payload_json?.results) || msg.payload_json?.results.length === 0}
									<div class="bg-slate-50 dark:bg-[#121212] p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-white/5">
										<p class="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">{msg.content}</p>
									</div>
								{/if}
								
								<!-- Results Rendering -->
								{#if Array.isArray(msg.payload_json?.results)}
									{@const aType = answerType(msg.payload_json)}
									<div class="space-y-3">
										{#if aType === 'restaurant_story'}
											<!-- Restaurant Story Mode -->
											<div class="bg-slate-50 dark:bg-[#121212] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
												<div class="p-4 flex gap-5">
													<div class="flex-1 min-w-0">
														<div class="flex items-center gap-2 mb-2">
															<span class="px-2 py-0.5 rounded-full bg-[#b91c1c]/10 text-[#b91c1c] text-[10px] font-bold uppercase tracking-wide">Featured</span>
															<h3 class="text-lg font-bold truncate text-slate-900 dark:text-white">{String(msg.payload_json?.restaurant_name ?? '')}</h3>
														</div>
														<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
															Selected based on your preferences. {dealSuggestions(msg.payload_json).length > 0 ? 'Check out these recommended combinations:' : ''}
														</p>
														
														{#if dealSuggestions(msg.payload_json).length > 0}
															<div class="mt-4 grid gap-3">
																{#each dealSuggestions(msg.payload_json) as d}
																	<div class="p-3 rounded-xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/5 hover:border-[#b91c1c]/30 transition-colors">
																		<div class="flex justify-between items-start mb-1">
																			<p class="font-semibold text-sm text-slate-900 dark:text-slate-100">{d.title}</p>
																			<span class="text-xs font-bold text-[#b91c1c]">{d.total_pkr} PKR</span>
																		</div>
																		<p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{d.summary}</p>
																	</div>
																{/each}
															</div>
														{/if}
													</div>
													<div class="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
														<img
															class="w-full h-full object-cover"
															src={String(msg.payload_json?.restaurant_image_url ?? '')}
															alt="Restaurant"
															on:error={fallbackImage}
														/>
													</div>
												</div>
											</div>
										{:else}
											<!-- Menu List Mode -->
											{#each msg.payload_json.results as raw}
												{@const item = toResult(raw)}
												<div class="bg-slate-50 dark:bg-[#121212] rounded-xl border border-slate-100 dark:border-white/5 p-4 shadow-sm hover:shadow-md transition-shadow">
													<div class="flex gap-4">
														<div class="flex-1 min-w-0">
															<div class="flex justify-between items-start mb-1">
																<h4 class="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.item_name}</h4>
																<span class="text-sm font-bold text-[#b91c1c] whitespace-nowrap">{Math.round(item.price)} PKR</span>
															</div>
															<div class="flex items-center gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
																<span>{item.restaurant_name}</span>
																<span>•</span>
																<span class="flex items-center gap-0.5 text-amber-500 font-medium">
																	<Star size={12} fill="currentColor" />
																	{item.rating.toFixed(1)}
																</span>
															</div>
														</div>
														<div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
															<img
																class="w-full h-full object-cover"
																src={item.image_url || ''}
																alt={item.item_name}
																on:error={fallbackImage}
															/>
														</div>
													</div>
												</div>
											{/each}
										{/if}
									</div>
								{/if}
								
								<span class="text-[10px] font-medium text-slate-400 uppercase tracking-widest ml-1">Assistant</span>
							</div>
						</div>
					{/if}
				{/each}

				<!-- Follow-up area if session active -->
				{#if sessionId}
					<div class="flex flex-col gap-3 mt-4 ml-14 max-w-4xl">
						{#if hasMore}
							<button 
								class="self-start px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#333] border border-slate-200 dark:border-white/5 transition-colors"
								on:click={handleMore}
								disabled={isSubmitting}
							>
								Show Next 5 Options
							</button>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Input Area -->
		<div class="p-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 transition-colors duration-200">
			<div class="max-w-4xl mx-auto space-y-4">
				<div class="flex gap-1 p-1 bg-slate-100 dark:bg-[#121212] rounded-xl border border-slate-200 dark:border-white/5 lg:w-fit overflow-x-auto hide-scrollbar">
					{#each tabs as tab}
						<button 
							on:click={() => switchMode(tab)}
							class={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all flex-shrink-0 ${mode === tab ? 'bg-slate-50 dark:bg-[#222] shadow-md text-[#b91c1c] dark:text-[#b91c1c]' : 'text-black dark:text-white hover:text-slate-600 dark:hover:text-slate-300'}`}
						>
							{#if tab === 'prompt'}
								<MessageSquare size={18} />
							{:else}
								<Wallet size={18} />
							{/if}
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					{/each}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-12 gap-4">
					<!-- Main Input -->
					<div class="{mode === 'budget' ? 'md:col-span-7' : 'md:col-span-10'} relative flex items-center">
						<div class="absolute left-4 pointer-events-none text-black dark:text-white opacity-60">
							<Search size={18} />
						</div>
						{#if sessionId}
							<input 
								class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none text-sm transition-all placeholder:text-black/60 dark:placeholder:text-white/60 text-black dark:text-white" 
								placeholder="Ask a follow-up question..." 
								type="text"
								bind:value={followupInput}
								on:keydown={(e) => e.key === 'Enter' && handleFollowup()}
							/>
						{:else}
							{#if mode === 'prompt'}
								<input 
									class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none text-sm transition-all placeholder:text-black/60 dark:placeholder:text-white/60 text-black dark:text-white" 
									placeholder="Ask anything..." 
									type="text"
									bind:value={promptInput}
									on:keydown={(e) => e.key === 'Enter' && handleStart()}
								/>
							{:else}
								<input 
									class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none text-sm transition-all placeholder:text-black/60 dark:placeholder:text-white/60 text-black dark:text-white" 
									placeholder="What would you like to eat?" 
									type="text"
									bind:value={foodInput}
									on:keydown={(e) => e.key === 'Enter' && handleStart()}
								/>
							{/if}
						{/if}
					</div>

					<!-- Budget Input (Only in Budget Mode and not in active session) -->
					{#if mode === 'budget' && !sessionId}
						<div class="md:col-span-3 relative flex items-center">
							<div class="absolute left-4 pointer-events-none text-black dark:text-white opacity-60">
								<Wallet size={18} />
							</div>
							<input 
								class="w-full bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent outline-none text-sm transition-all placeholder:text-black/60 dark:placeholder:text-white/60 text-black dark:text-white" 
								placeholder="Budget" 
								type="text"
								bind:value={budgetInput}
								on:keydown={(e) => e.key === 'Enter' && handleStart()}
							/>
						</div>
					{/if}

					<!-- Start/Send Button -->
					<div class="md:col-span-2">
						{#if sessionId}
							<button 
								class="w-full py-4 bg-[#b91c1c] hover:bg-[#b91c1c]/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#b91c1c]/20 transition-all active:scale-95 disabled:opacity-50"
								on:click={handleFollowup}
								disabled={isSubmitting}
							>
								Send
							</button>
						{:else}
							<button 
								class="w-full py-4 bg-[#b91c1c] hover:bg-[#b91c1c]/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#b91c1c]/20 transition-all active:scale-95 disabled:opacity-50"
								on:click={handleStart}
								disabled={isSubmitting}
							>
								Go
							</button>
						{/if}
					</div>
				</div>
				
				{#if error}
					<div class="px-2 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						{error}
					</div>
				{/if}

				<div class="flex flex-col sm:flex-row items-center justify-between px-2 gap-2">
					<p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
						Prices and recommendations are subject to change.
					</p>
					<div class="flex items-center gap-4">
						<p class="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
						</p>
						<button class="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white hover:text-[#b91c1c] transition-colors" on:click={fetchBrowserLocation}>
							<MapPin size={14} />
							{usingDefaultLocation ? 'Use current location' : 'Location updated'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Mobile Sidebar Overlay -->
	{#if isMobileSidebarOpen}
		<div 
			class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
			on:click={toggleMobileSidebar}
		>
			<div 
				class="w-full h-full bg-slate-50 dark:bg-[#0a0a0a] flex flex-col"
				on:click|stopPropagation
			>
				<!-- Mobile Sidebar Header -->
				<div class="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-[#b91c1c]/10 flex items-center justify-center text-[#b91c1c]">
							<History size={20} />
						</div>
						<h2 class="text-lg font-bold">Food Journal</h2>
					</div>
					<button 
						on:click={toggleMobileSidebar}
						class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
					>
						<X size={24} />
					</button>
				</div>

				<!-- Mobile Sidebar Content -->
				<div class="flex-1 overflow-y-auto p-6">
					<p class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-4">Past Discovery</p>
					<div class="space-y-3">
						{#if filteredSessions.length === 0}
							<div class="py-4 text-sm text-slate-500">No history yet.</div>
						{:else}
							{#each filteredSessions as s}
								<button 
									class="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 hover:border-[#b91c1c]/30 transition-all text-left"
									on:click={() => openSession(s.id)}
								>
									<div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-black flex items-center justify-center text-slate-500">
										<History size={20} />
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-bold truncate text-slate-900 dark:text-slate-100">{s.query_text}</p>
										<p class="text-[10px] text-slate-500 mt-0.5">{new Date(s.updated_at).toLocaleDateString()}</p>
									</div>
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Mobile User Profile -->
				{#if user}
					<div class="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-black/50">
						<div class="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5">
							<div class="w-10 h-10 rounded-full bg-[#b91c1c] flex items-center justify-center text-white">
								<User size={20} />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-bold truncate">
									{user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}
								</p>
							</div>
							<button 
								on:click={handleLogout}
								class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-red-500"
							>
								<LogOut size={20} />
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) { font-family: 'Inter', sans-serif; }
	.custom-scrollbar::-webkit-scrollbar { width: 4px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
	
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
		font-variant-ligatures: none;
		overflow: hidden;
		width: 1em;
		height: 1em;
	}
	.hide-scrollbar::-webkit-scrollbar { display: none; }
	.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>