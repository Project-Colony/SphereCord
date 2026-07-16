/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join } from "path";
import { STATIC_DIR } from "shared/paths";

import { VENCORD_THEMES_DIR } from "./constants";

// Each bundled theme set: the static/ folder it ships in, and the filename prefix its
// generated files use (also what we sweep so renames/removals leave no stale duplicates).
const THEME_SETS = [
    { dir: "colonyThemes", prefix: "colony-", label: "Colony" },
    { dir: "sbThemes", prefix: "sb-", label: "Stellar Blade" }
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
            // Remove previously-installed themes from this set first so renames/removals
            // (e.g. the order-prefixed filenames) never leave stale duplicates behind.
            const stale = new RegExp(`^${set.prefix}.*\\.css$`, "i");
            for (const file of readdirSync(VENCORD_THEMES_DIR)) {
                if (stale.test(file)) rmSync(join(VENCORD_THEMES_DIR, file), { force: true });
            }
            for (const file of readdirSync(src)) {
                if (file.endsWith(".css")) copyFileSync(join(src, file), join(VENCORD_THEMES_DIR, file));
            }
        } catch (e) {
            console.error(`Failed to install ${set.label} themes:`, e);
        }
    }
}
