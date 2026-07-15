/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { STATIC_DIR } from "shared/paths";

import { VENCORD_THEMES_DIR } from "./constants";

// Auto-install the bundled Colony themes into the Vencord themes directory on every
// launch, keeping them current. They then show up in Discord's Themes tab, ready to
// enable. Generated from Project Colony's palette set — see scripts/generateColonyThemes.mts.
export function installColonyThemes() {
    const src = join(STATIC_DIR, "colonyThemes");
    if (!existsSync(src)) return;

    try {
        mkdirSync(VENCORD_THEMES_DIR, { recursive: true });
        for (const file of readdirSync(src)) {
            if (file.endsWith(".css")) copyFileSync(join(src, file), join(VENCORD_THEMES_DIR, file));
        }
    } catch (e) {
        console.error("Failed to install Colony themes:", e);
    }
}
