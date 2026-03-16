import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { getAccessToken } from '$lib/api/client';
import { getRolesFromToken } from '$lib/stores/auth';

export function requireClientAuth() {
	if (browser && !getAccessToken()) {
		throw redirect(303, '/');
	}
}

export function requireRole(role: string) {
	requireClientAuth();
	const roles = getRolesFromToken();
	if (!roles.includes(role)) {
		throw redirect(303, '/');
	}
}

export function requireAnyRole(allowedRoles: string[]) {
	requireClientAuth();
	const roles = getRolesFromToken();
	if (!roles.some((role) => allowedRoles.includes(role))) {
		throw redirect(303, '/');
	}
}
