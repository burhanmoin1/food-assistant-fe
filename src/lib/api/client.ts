import { decodeJwt } from '$lib/auth/jwt';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiOptions = {
	method?: HttpMethod;
	headers?: Record<string, string>;
	body?: any;
	useAuth?: boolean;
};

const isBrowser = typeof window !== 'undefined';

function getCookie(name: string): string | null {
	if (!isBrowser) return null;
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
	if (match) return match[2];
	return null;
}

function setCookie(name: string, value: string, days = 7) {
	if (!isBrowser) return;
	const d = new Date();
	d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
	document.cookie = `${name}=${value};path=/;SameSite=Lax;max-age=${60 * 60 * 24 * days}`;
}

function removeCookie(name: string) {
	if (!isBrowser) return;
	document.cookie = `${name}=;path=/;max-age=0`;
}

function getAccessToken(): string | null {
	return getCookie(ACCESS_TOKEN_KEY);
}

function getAccessTokenPayload(): Record<string, unknown> | null {
	const token = getAccessToken();
	return decodeJwt(token || '');
}

function getRefreshToken(): string | null {
	return getCookie(REFRESH_TOKEN_KEY);
}

function setTokens(access: string, refresh: string) {
	setCookie(ACCESS_TOKEN_KEY, access);
	setCookie(REFRESH_TOKEN_KEY, refresh);
}

function clearTokens() {
	removeCookie(ACCESS_TOKEN_KEY);
	removeCookie(REFRESH_TOKEN_KEY);
}

async function apiFetch(path: string, options: ApiOptions = {}) {
	const url = path.startsWith('/api') ? path : `/api${path}`;

	const init: RequestInit = {
		method: options.method ?? 'GET',
		headers: {
			'Content-Type': 'application/json',
			...(options.headers ?? {}),
		},
	};

	if (options.body !== undefined) {
		init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
	}

	const response = await fetch(url, init);
	return response;
}

async function refreshAccessToken() {
	const refresh = getRefreshToken();
	if (!refresh) {
		clearTokens();
		return null;
	}

	const response = await fetch('/api/auth/token/refresh/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ refresh }),
	});

	if (!response.ok) {
		clearTokens();
		return null;
	}

	const data = await response.json();
	if (!data.access) {
		clearTokens();
		return null;
	}

	setTokens(data.access, refresh);
	return data.access as string;
}

async function apiFetchWithAuth(path: string, options: ApiOptions = {}) {
	let access = getAccessToken();
	if (!access) {
		throw new Error('No access token');
	}

	const baseHeaders = options.headers ?? {};

	const firstResponse = await apiFetch(path, {
		...options,
		headers: {
			...baseHeaders,
			Authorization: `Bearer ${access}`,
		},
	});

	if (firstResponse.status !== 401) {
		return firstResponse;
	}

	access = await refreshAccessToken();
	if (!access) {
		throw new Error('Session expired');
	}

	const secondResponse = await apiFetch(path, {
		...options,
		headers: {
			...baseHeaders,
			Authorization: `Bearer ${access}`,
		},
	});

	return secondResponse;
}

async function login(username: string, password: string) {
	const response = await fetch('/api/auth/token/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username, password }),
	});

	if (!response.ok) {
		throw new Error('Invalid credentials');
	}

	const data = await response.json();
	setTokens(data.access, data.refresh);
	return data;
}

export {
	apiFetch,
	apiFetchWithAuth,
	login,
	getAccessToken,
	getAccessTokenPayload,
	getRefreshToken,
	clearTokens,
	setTokens,
};
