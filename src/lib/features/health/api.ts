export async function pingHealth() {
	const res = await fetch('/api/health/');
	const data = await res.json();
	return data.status as string;
}

