import { apiFetchWithAuth } from '$lib/api/client';

export type ChatMode = 'budget' | 'quality' | 'prompt';

export type ScopeResolveResponse = {
	scope_id: number;
	reused: boolean;
	restaurant_count: number;
};

export type ChatResultItem = {
	restaurant_id: string;
	restaurant_name: string;
	city: string;
	rating: number;
	vendor_code: string;
	item_id: string;
	item_name: string;
	category: string;
	description: string;
	image_url: string;
	price: number;
	tags: string[];
	llm_reason: string;
	score: number;
};

export type ChatSessionStartResponse = {
	session_id: string;
	has_more: boolean;
	results: ChatResultItem[];
	assistant_text: string;
	answer_payload: Record<string, unknown>;
};

export type ChatSessionMoreResponse = {
	session_id: string;
	has_more: boolean;
	results: ChatResultItem[];
	assistant_text: string;
	answer_payload: Record<string, unknown>;
};

export type ChatSessionMessageResponse = {
	session_id: string;
	assistant_text: string;
	referenced_results: ChatResultItem[];
	answer_payload: Record<string, unknown>;
};

export type ChatMessage = {
	id: number;
	role: 'user' | 'assistant' | 'system';
	content: string;
	payload_json: Record<string, unknown>;
	created_at: string;
};

export type ChatSessionReadResponse = {
	id: string;
	user_id: number;
	mode: ChatMode;
	scope_id: number;
	query_text: string;
	parsed_json: Record<string, unknown>;
	candidate_ids_json: string[];
	offset: number;
	status: string;
	created_at: string;
	updated_at: string;
	messages: ChatMessage[];
};

export async function resolveScope(payload: { lat: number; lng: number; ip_address?: string }) {
	const res = await apiFetchWithAuth('/chat/scope/resolve', {
		method: 'POST',
		body: payload
	});
	if (!res.ok) {
		throw new Error('Failed to resolve location scope');
	}
	return (await res.json()) as ScopeResolveResponse;
}

export async function startSession(payload: {
	mode: ChatMode;
	query: string;
	scope_id: number;
	budget_pkr?: number;
}) {
	const res = await apiFetchWithAuth('/chat/session/start', {
		method: 'POST',
		body: payload
	});
	if (!res.ok) {
		throw new Error('Failed to start chat session');
	}
	return (await res.json()) as ChatSessionStartResponse;
}

export async function getMore(sessionId: string, count = 5) {
	const res = await apiFetchWithAuth(`/chat/session/${sessionId}/more`, {
		method: 'POST',
		body: { count }
	});
	if (!res.ok) {
		throw new Error('Failed to load more results');
	}
	return (await res.json()) as ChatSessionMoreResponse;
}

export async function sendMessage(sessionId: string, text: string) {
	const res = await apiFetchWithAuth(`/chat/session/${sessionId}/message`, {
		method: 'POST',
		body: { text }
	});
	if (!res.ok) {
		throw new Error('Failed to send chat message');
	}
	return (await res.json()) as ChatSessionMessageResponse;
}

export async function readSession(sessionId: string) {
	const res = await apiFetchWithAuth(`/chat/session/${sessionId}`, { method: 'GET' });
	if (!res.ok) {
		throw new Error('Failed to load chat session');
	}
	return (await res.json()) as ChatSessionReadResponse;
}

export async function listSessions() {
	const res = await apiFetchWithAuth('/chat/sessions', { method: 'GET' });
	if (!res.ok) {
		throw new Error('Failed to list chat sessions');
	}
	return (await res.json()) as Array<{
		id: string;
		mode: ChatMode;
		query_text: string;
		offset: number;
		status: string;
		created_at: string;
		updated_at: string;
	}>;
}
