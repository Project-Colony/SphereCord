/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Generates Discord (Vencord) CSS themes from Stellar Blade character palettes.
// Run with:  bun run scripts/generateStellarThemes.mts
// Output: static/sbThemes/sb-<NN>-<character>.css (committed; SphereCord auto-installs them).
//
// FAN-MADE / UNOFFICIAL. Shift Up publishes no official color codes, so each palette is
// *derived* from the character's on-screen design (hair, suit, signature glow) and then
// designed into a usable dark UI: the character's colors set the identity, but the depth
// ramp and contrast are ours. Colors themselves aren't copyrightable; no game art ships here.
//
// Design rules held across the set:
//  - neutrals are TINTED toward each character's world (never pure grey) — that's what reads
//  - accent_blue is the one color a fan names first for that character; all 5 stay distinct
//  - text_primary clears 4.5:1 on bg_primary (all are ~13:1+ here)

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildThemeCss } from "./utils/themeCss.mjs";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "static", "sbThemes");

interface Character {
    key: string;
    name: string;
    blurb: string;
    colors: Record<string, string>;
}

const CHARACTERS: Character[] = [
    {
        key: "eve",
        name: "EVE",
        blurb: "emerald glow over a white suit",
        colors: {
            bg_sidebar: "#090e0b",
            bg_primary: "#0e1410",
            bg_card: "#151d18",
            bg_card_hover: "#1c261f",
            bg_card_pressed: "#232e26",
            bg_modal_section: "#121a15",
            bg_input: "#17201a",
            bg_selected: "#1f2b23",
            border_subtle: "#27352c",
            text_primary: "#e9ede9",
            text_secondary: "#b3c0b6",
            text_muted: "#7f8c84",
            text_dim: "#5c6961",
            accent_blue: "#2fbe4c",
            success: "#46d46a",
            warning: "#e0a83a",
            error: "#e4553f"
        }
    },
    {
        key: "tachy",
        name: "Tachy",
        blurb: "carbon black, amber panel, orange glow",
        colors: {
            // Her three tones, split by role: carbon -> surfaces, orange glow -> accent,
            // amber panel -> warning/secondary, the teal glints on her suit -> success.
            bg_sidebar: "#0a0b11",
            bg_primary: "#12131b",
            bg_card: "#191b25",
            bg_card_hover: "#20222e",
            bg_card_pressed: "#272a37",
            bg_modal_section: "#161822",
            bg_input: "#1a1c26",
            bg_selected: "#232634",
            border_subtle: "#2c2f3c",
            text_primary: "#ecedf2",
            text_secondary: "#b8bcc8",
            text_muted: "#868b99",
            text_dim: "#626775",
            accent_blue: "#ff7c1e",
            success: "#3fbfa8",
            warning: "#eaa72c",
            error: "#f0503c"
        }
    },
    {
        key: "lily",
        name: "Lily",
        blurb: "black rig with gold trim",
        colors: {
            bg_sidebar: "#0c0b09",
            bg_primary: "#141210",
            bg_card: "#1c1915",
            bg_card_hover: "#241f1a",
            bg_card_pressed: "#2b251e",
            bg_modal_section: "#191612",
            bg_input: "#1d1a15",
            bg_selected: "#262019",
            border_subtle: "#332c23",
            text_primary: "#f0ede6",
            text_secondary: "#c0b8aa",
            text_muted: "#8e8578",
            text_dim: "#6a6255",
            accent_blue: "#efc02a",
            success: "#5fb55a",
            warning: "#e08a2a",
            error: "#e0503c"
        }
    },
    {
        key: "enya",
        name: "Enya",
        blurb: "white ceramic armour, ice-blue sheen",
        colors: {
            // Her armour is near-white; a white accent would be indistinguishable from body
            // text, so the accent takes the cool sheen of the ceramic instead.
            bg_sidebar: "#0d0f13",
            bg_primary: "#14161a",
            bg_card: "#1c1f25",
            bg_card_hover: "#23272e",
            bg_card_pressed: "#2a2f37",
            bg_modal_section: "#181b21",
            bg_input: "#1b1f25",
            bg_selected: "#252a32",
            border_subtle: "#313742",
            text_primary: "#edf1f5",
            text_secondary: "#b6bec8",
            text_muted: "#858e9a",
            text_dim: "#616a76",
            accent_blue: "#a3cde8",
            success: "#6fc28e",
            warning: "#dfb35c",
            error: "#e2707a"
        }
    },
    {
        key: "kaya",
        name: "Kaya",
        blurb: "lavender hair over a khaki coat",
        colors: {
            bg_sidebar: "#0f0d14",
            bg_primary: "#16131c",
            bg_card: "#1e1926",
            bg_card_hover: "#251f2f",
            bg_card_pressed: "#2c2537",
            bg_modal_section: "#1a1522",
            bg_input: "#1f1a28",
            bg_selected: "#292233",
            border_subtle: "#342c40",
            text_primary: "#ede8f2",
            text_secondary: "#bdb3c8",
            text_muted: "#8b8298",
            text_dim: "#675e73",
            accent_blue: "#bfa3dc",
            // her khaki field coat, kept as the positive state
            success: "#8a9455",
            warning: "#d9a441",
            error: "#e06a6a"
        }
    }
];

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

let index = 0;
for (const c of CHARACTERS) {
    const order = String(++index).padStart(2, "0");
    const css = buildThemeCss(
        {
            name: `Stellar Blade · ${c.name}`,
            description: `${c.name} — ${c.blurb}. Derived from her Stellar Blade design; fan-made, unofficial.`,
            author: "SphereCord"
        },
        c.colors
    );
    await writeFile(join(OUT_DIR, `sb-${order}-${c.key}.css`), css, "utf-8");
}

const written = (await readdir(OUT_DIR)).filter(f => f.endsWith(".css"));
console.log(`Generated ${written.length} Stellar Blade themes into static/sbThemes/`);
