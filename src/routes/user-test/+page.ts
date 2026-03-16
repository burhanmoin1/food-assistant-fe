import type { PageLoad } from './$types';
import { requireClientAuth } from '$lib/auth/guards';

export const ssr = false;

export const load: PageLoad = () => {
	requireClientAuth();
	return {};
};
