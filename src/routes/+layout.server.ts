import type { LayoutServerLoad } from './$types';
import { getUserFromCookies } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const user = getUserFromCookies(cookies);
	return {
		user
	};
};
