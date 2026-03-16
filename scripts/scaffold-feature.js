import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toKebabCase(name) {
	return name
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase();
}

function toPascalCase(name) {
	return name
		.replace(/[_\-\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
		.replace(/^\w/, (c) => c.toUpperCase());
}

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function writeFileIfMissing(filePath, contents) {
	if (fs.existsSync(filePath)) {
		return;
	}
	fs.writeFileSync(filePath, contents, { encoding: 'utf8' });
}

function main() {
	const rawName = process.argv[2];

	if (!rawName) {
		console.error('Usage: node scripts/scaffold-feature.js <feature-name>');
		process.exit(1);
	}

	const featureSlug = toKebabCase(rawName);
	const featureName = featureSlug.replace(/-/g, '');
	const FeaturePascal = toPascalCase(featureSlug);

	const projectRoot = path.resolve(__dirname, '..');
	const featuresRoot = path.join(projectRoot, 'src', 'lib', 'features');
	const featureRoot = path.join(featuresRoot, featureSlug);
	const uiRoot = path.join(featureRoot, 'ui');
	const routesRoot = path.join(projectRoot, 'src', 'routes', featureSlug);

	ensureDir(featuresRoot);
	ensureDir(featureRoot);
	ensureDir(uiRoot);
	ensureDir(routesRoot);

	const typesPath = path.join(featureRoot, 'types.ts');
	const apiPath = path.join(featureRoot, 'api.ts');
	const storePath = path.join(featureRoot, 'store.ts');
	const indexPath = path.join(featureRoot, 'index.ts');
	const pagePath = path.join(routesRoot, '+page.svelte');

	const typeName = `${FeaturePascal}Item`;

	writeFileIfMissing(
		typesPath,
		`export type ${typeName} = {\n\tid: string;\n};\n`
	);

	writeFileIfMissing(
		apiPath,
		`import { apiFetchWithAuth } from '$lib/api/client';\n\n` +
			`export async function fetch${FeaturePascal}List() {\n` +
			`\tconst response = await apiFetchWithAuth('/${featureSlug}/');\n` +
			`\tif (!response.ok) {\n` +
			`\t\tthrow new Error('Failed to load ${featureSlug}');\n` +
			`\t}\n` +
			`\treturn response.json();\n` +
			`}\n`
	);

	writeFileIfMissing(
		storePath,
		`import { writable } from 'svelte/store';\n` +
			`import type { ${typeName} } from './types';\n` +
			`import { fetch${FeaturePascal}List } from './api';\n\n` +
			`const items = writable<${typeName}[]>([]);\n` +
			`const isLoading = writable(false);\n` +
			`const error = writable<string | null>(null);\n\n` +
			`async function load${FeaturePascal}List() {\n` +
			`\tisLoading.set(true);\n` +
			`\terror.set(null);\n` +
			`\ttry {\n` +
			`\t\tconst data = await fetch${FeaturePascal}List();\n` +
			`\t\titems.set(data);\n` +
			`\t} catch (err) {\n` +
			`\t\terror.set('Failed to load ${featureSlug}');\n` +
			`\t} finally {\n` +
			`\t\tisLoading.set(false);\n` +
			`\t}\n` +
			`}\n\n` +
			`export { items, isLoading, error, load${FeaturePascal}List };\n`
	);

	writeFileIfMissing(
		indexPath,
		`export * from './types';\n` +
			`export * from './api';\n` +
			`export * from './store';\n`
	);

	writeFileIfMissing(
		pagePath,
		`<script lang="ts">\n` +
			`\timport { onMount } from 'svelte';\n` +
			`\timport { items, isLoading, error, load${FeaturePascal}List } from '$lib/features/${featureSlug}';\n` +
			`</script>\n\n` +
			`<main class="min-h-screen bg-slate-950 text-slate-50">\n` +
			`\t<div class="max-w-3xl mx-auto py-10 space-y-6">\n` +
			`\t\t<h1 class="text-3xl font-bold">${FeaturePascal}</h1>\n` +
			`\t\t<button\n` +
			`\t\t\tclass="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-sm font-medium"\n` +
			`\t\t\ton:click={() => load${FeaturePascal}List()}\n` +
			`\t\t>\n` +
			`\t\t\tReload\n` +
			`\t\t</button>\n` +
			`\t\t{#if $isLoading}\n` +
			`\t\t\t<p class="text-sm text-slate-300">Loading</p>\n` +
			`\t\t{:else if $error}\n` +
			`\t\t\t<p class="text-sm text-red-400">{$error}</p>\n` +
			`\t\t{:else}\n` +
			`\t\t\t<ul class="space-y-2">\n` +
			`\t\t\t\t{#each $items as item}\n` +
			`\t\t\t\t\t<li class="border border-slate-800 rounded px-3 py-2 text-sm">\n` +
			`\t\t\t\t\t\t<span>{item.id}</span>\n` +
			`\t\t\t\t\t</li>\n` +
			`\t\t\t\t{/each}\n` +
			`\t\t\t</ul>\n` +
			`\t\t{/if}\n` +
			`\t</div>\n` +
			`</main>\n\n` +
			`<svelte:window on:load={() => load${FeaturePascal}List()} />\n`
	);
}

main();

