import { derived, writable } from 'svelte/store';
import { login, clearTokens, getAccessToken, getAccessTokenPayload } from '$lib/api/client';
import { getRolesFromPayload } from '$lib/auth/jwt';

type AuthState = {
	username: string | null;
	roles: string[];
};

const authState = writable<AuthState>({
	username: null,
	roles: [],
});

const isAuthenticated = derived(authState, () => !!getAccessToken());

function getRolesFromToken(): string[] {
	const payload = getAccessTokenPayload();
	return getRolesFromPayload(payload);
}

async function loginWithPassword(username: string, password: string) {
	await login(username, password);
	const roles = getRolesFromToken();
	authState.set({ username, roles });
}

function logout() {
	clearTokens();
	authState.set({ username: null, roles: [] });
}

function initAuthFromStorage() {
	const token = getAccessToken();
	if (!token) {
		authState.set({ username: null, roles: [] });
		return;
	}

	// Try to get username from payload if not in store
	const payload = getAccessTokenPayload();
	const username = payload?.username as string | undefined;

	const roles = getRolesFromToken();
	authState.update((current) => {
		return {
			username: current.username || username || 'User', // Fallback to 'User' if no username found
			roles,
		};
	});
}

export { authState, isAuthenticated, loginWithPassword, logout, initAuthFromStorage, getRolesFromToken };
