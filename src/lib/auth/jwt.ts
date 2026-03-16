export function decodeJwt(token: string): Record<string, unknown> | null {
	if (!token) return null;

	const parts = token.split('.');
	if (parts.length !== 3) return null;

	try {
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		// atob is available in modern browsers and Node.js (v16+)
		const decoded = atob(base64);
		const json = JSON.parse(decoded);
		if (json && typeof json === 'object') {
			return json as Record<string, unknown>;
		}
		return null;
	} catch {
		return null;
	}
}

export function getRolesFromPayload(payload: Record<string, unknown> | null): string[] {
	if (!payload) return [];

	const maybeRoles = (payload.roles ?? payload.role ?? null) as unknown;
	if (Array.isArray(maybeRoles) && maybeRoles.every((r) => typeof r === 'string')) {
		return maybeRoles as string[];
	}

	if (typeof maybeRoles === 'string') {
		return [maybeRoles];
	}

	return [];
}
