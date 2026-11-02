import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, parse } from "path";

const OUTPUT_DIR = join(import.meta.dir, "..", "..", "static/dist");
const ARRPC_DIR = join(import.meta.dir, "..", "..", "node_modules/arrpc-bun");
const ARRPC_ENTRY = join(ARRPC_DIR, "src/index.ts");

interface CompileTarget {
	platform: string;
	arch: string;
	target: string;
	output: string;
}

const TARGETS: CompileTarget[] = [
	{
		platform: "linux",
		arch: "x64",
		target: "bun-linux-x64-baseline",
		output: "arrpc-linux-x64"
	},
	{
		platform: "linux",
		arch: "arm64",
		target: "bun-linux-arm64",
		output: "arrpc-linux-arm64"
	},
	{
		platform: "darwin",
		arch: "x64",

		target: "bun-darwin-x64",
		output: "arrpc-darwin-x64"
	},
	{
		platform: "darwin",
		arch: "arm64",
		target: "bun-darwin-arm64",
		output: "arrpc-darwin-arm64"
	},
	{
		platform: "windows",
		arch: "x64",
		target: "bun-windows-x64-baseline",
		output: "arrpc-windows-x64.exe"
	}
];

if (!existsSync(ARRPC_DIR)) {
	console.error("Error: arrpc-bun not found in node_modules");
	console.error("Run 'bun install' first");
	process.exit(1);
}

if (!existsSync(ARRPC_ENTRY)) {
	console.error(`Error: arrpc-bun entry point not found at ${ARRPC_ENTRY}`);
	process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

// `bun --compile` inlines detectable.json into every binary as a JS object literal, so
// each field is paid for in the arRPC child's memory. arrpc-bun only reads these four
// fields of a database entry; the rest (icon hashes, themes, overlay flags, SKUs) is
// pure payload. Runs before compiling, and is idempotent, so a rebuild without a fresh
// `updateArrpcDB` stays correct.
const KEPT_DB_FIELDS = ["id", "name", "executables", "aliases"];
// The keys Discord ships today, checked against arrpc-bun's source below. A key Discord adds
// later is stripped too but only warned about: a common name such as "type" or "flags" would
// match unrelated reads in arrpc-bun and fail every install.
const KNOWN_DEAD_FIELDS = [
	"content_classification",
	"cover_image_hash",
	"hook",
	"icon_hash",
	"linked_applications",
	"overlay",
	"overlay_compatibility_hook",
	"overlay_methods",
	"overlay_warn",
	"themes",
	"third_party_skus"
];
const DETECTABLE_DB = join(ARRPC_DIR, "detectable.json");

/**
 * Fail loudly if a future arrpc-bun release starts reading one of the fields we strip:
 * an entry-count assertion can't catch that, and silently shipping a DB missing data the
 * runtime now needs would break game detection with no error. Reads of the same names on
 * user-supplied `customEntry` objects don't touch the database and are fine.
 */
function assertDbFieldsUnused(stripped: string[]) {
	const srcDir = join(ARRPC_DIR, "src");
	if (!existsSync(srcDir)) return;

	for (const rel of readdirSync(srcDir, { recursive: true, encoding: "utf8" })) {
		if (!/\.(ts|tsx|js|mjs|cjs)$/.test(rel)) continue;
		const full = join(srcDir, rel);
		if (!statSync(full).isFile()) continue;

		const source = readFileSync(full, "utf8");
		for (const field of stripped) {
			// shortcut: misses destructuring and bracket access, add them if arrpc-bun starts using either
			if (new RegExp(`(?<!customEntry)\\.${field}\\b`).test(source)) {
				throw new Error(
					`compileArrpc: arrpc-bun now reads "${field}" (src/${rel}).\n` +
						"Add it to KEPT_DB_FIELDS, pruning it would break game detection."
				);
			}
		}
	}
}

function pruneDetectableDb() {
	if (!existsSync(DETECTABLE_DB)) return;

	const before = statSync(DETECTABLE_DB).size;
	const entries = JSON.parse(readFileSync(DETECTABLE_DB, "utf8"));
	if (!Array.isArray(entries)) return;

	const stripped = [...new Set(entries.flatMap(Object.keys))].filter(k => !KEPT_DB_FIELDS.includes(k));
	if (!stripped.length) return;
	assertDbFieldsUnused(stripped.filter(k => KNOWN_DEAD_FIELDS.includes(k)));
	const unknown = stripped.filter(k => !KNOWN_DEAD_FIELDS.includes(k));
	if (unknown.length) console.warn(`compileArrpc: stripped new detectable.json keys unchecked: ${unknown.join(", ")}`);

	for (const entry of entries) {
		for (const field of stripped) delete entry[field];
	}

	writeFileSync(DETECTABLE_DB, JSON.stringify(entries));
	const after = statSync(DETECTABLE_DB).size;
	console.log(
		`Pruned ${stripped.join(", ")} from detectable.json ` +
			`(${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB)\n`
	);
}

pruneDetectableDb();

const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const currentPlatform = process.platform === "win32" ? "windows" : process.platform;
const currentArch = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : process.arch;

let targetsToCompile = TARGETS;
if (isCI) {
	targetsToCompile = TARGETS.filter(t => t.platform === currentPlatform);
	console.log(`Running in CI on ${currentPlatform}, compiling only for current platform...`);
} else if (currentPlatform === "darwin") {
	targetsToCompile = TARGETS.filter(t => t.platform === currentPlatform);
	console.log(`Compiling arRPC binaries for macOS universal build: x64 and arm64`);
} else {
	targetsToCompile = TARGETS.filter(t => t.platform === currentPlatform && t.arch === currentArch);
	console.log(`Compiling arRPC binary for current machine: ${currentPlatform}-${currentArch}`);
}

console.log(`Source: ${ARRPC_ENTRY}`);
console.log(`Output: ${OUTPUT_DIR}\n`);

const compiledTargets: string[] = [];
const failedTargets: string[] = [];

for (const target of targetsToCompile) {
	const outputPath = join(OUTPUT_DIR, target.output);

	console.log(`Compiling ${target.platform}-${target.arch}...`);
	console.log(`  Target: ${target.target}`);
	console.log(`  Output: ${outputPath}`);

	try {
		const cmd = `bun build ${ARRPC_ENTRY} --compile --target=${target.target} --outfile=${outputPath}`;
		const env = { ...process.env };
		// see https://github.com/oven-sh/bun/issues/28327.
		if (currentPlatform === "windows") {
			env.BUN_INSTALL = join(parse(ARRPC_DIR).root, ".bun-compile");
		}
		// see https://github.com/oven-sh/bun/issues/29120.
		if (target.platform === "darwin") {
			env.BUN_NO_CODESIGN_MACHO_BINARY = "1";
		}
		execSync(cmd, {
			stdio: "inherit",
			cwd: ARRPC_DIR,
			env
		});

		console.log(`Compiled ${target.output}\n`);
		compiledTargets.push(target.output);
	} catch (err) {
		console.error(`Failed to compile ${target.output}`);
		console.error(err);
		failedTargets.push(target.output);

		if (isCI) {
			console.error(`Compilation failed in CI for ${target.output}`);
			process.exit(1);
		} else {
			console.warn(`Skipping ${target.output}, continuing with other targets...\n`);
		}
	}
}

if (compiledTargets.length === 0) {
	console.error("No binaries were compiled successfully!");
	process.exit(1);
}

if (failedTargets.length > 0 && !isCI) {
	console.warn(`\nWarning: ${failedTargets.length} target(s) failed to compile:`);
	failedTargets.forEach(t => console.warn(`  - ${t}`));
	console.warn("Continuing with successfully compiled binaries...\n");
}

console.log(`\n Successfully compiled ${compiledTargets.length} arRPC ${compiledTargets.length === 1 ? "binary" : "binaries"}!`);
