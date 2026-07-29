/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { STATIC_DIR } from "shared/paths";

import { VENCORD_THEMES_DIR } from "./constants";

// Each bundled theme set: the static/ folder it ships in, and the pattern its generated
// files match. The pattern requires the order number the generators emit
// (colony-07-…, sb-02-…) so sweeping stale files can't eat a user theme that merely
// starts with the same word.
const THEME_SETS = [
    { dir: "colonyThemes", generated: /^colony-\d+-.*\.css$/i, label: "Colony" },
    { dir: "sbThemes", generated: /^sb-\d+-.*\.css$/i, label: "Stellar Blade" }
] as const;

// Auto-install the bundled themes into the Vencord themes directory on every launch,
// keeping them current. They then show up in Discord's Themes tab, ready to enable.
// Generated — see scripts/generateColonyThemes.mts and scripts/generateStellarThemes.mts.
export function installColonyThemes() {
    for (const set of THEME_SETS) {
        const src = join(STATIC_DIR, set.dir);
        if (!existsSync(src)) continue;

        try {
            mkdirSync(VENCORD_THEMES_DIR, { recursive: true });

            // Copy only what actually differs. Rewriting all 57 files on every launch cost
            // ~7 ms of the synchronous pre-window path and, worse, fired ~114 inotify events
            // into the themes watcher while Discord was still booting.
            // Compare CONTENT, not mtime: copyFileSync doesn't preserve it, and in a packaged
            // build the source lives in app.asar, whose entry mtimes are synthesised per
            // archive open — an mtime check would copy everything every time.
            const shipped = new Set<string>();
            for (const file of readdirSync(src)) {
                if (!file.endsWith(".css")) continue;
                shipped.add(file);

                const dest = join(VENCORD_THEMES_DIR, file);
                const incoming = readFileSync(join(src, file));
                if (existsSync(dest) && incoming.equals(readFileSync(dest))) continue;

                copyFileSync(join(src, file), dest);
            }

            // Sweep themes this set generated in a previous version but no longer ships,
            // so renames and removals leave no stale duplicates behind.
            for (const file of readdirSync(VENCORD_THEMES_DIR)) {
                if (set.generated.test(file) && !shipped.has(file)) {
                    rmSync(join(VENCORD_THEMES_DIR, file), { force: true });
                }
            }
        } catch (e) {
            console.error(`Failed to install ${set.label} themes:`, e);
        }
    }
}
