import { decodeJwt, getRolesFromPayload } from '$lib/auth/jwt';
import type { Cookies } from '@sveltejs/kit';

export type User = {
	username: string;
	roles: string[];
};

export function getUserFromCookies(cookies: Cookies): User | null {
	const token = cookies.get('access_token');
	if (!token) return null;

	const payload = decodeJwt(token);
	if (!payload) return null;

	const username = payload.username as string | undefined;
	const roles = getRolesFromPayload(payload);

	return {
		username: username || 'User',
		roles
	};
}
