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
// designed into a usable UI. No game art ships here.
//
// Design language (per user direction): DUOTONE. Each character = her surfaces + her ink.
// The character's signature colors go on TEXT and ACCENT — the things you actually read —
// while backgrounds stay in her "material" (carbon, black, ceramic…). That's what makes a
// theme read as the character instead of "dark Discord with tinted links".
//  - Lily: black / soft-black surfaces, ALL text in amber gold (2 colors, no brown)
//  - Tachy: carbon-navy surfaces, amber text, orange-glow accent (her 3 suit tones)
//  - EVE: deep-green blacks, white text (her suit), vivid emerald accent (her glow)
//  - Kaya: khaki sidebar + dark-lavender chat, lavender text (coat + hair, both visible)
//  - Enya: LIGHT theme — white ceramic surfaces, near-black text, ice-blue sheen accent

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
        blurb: "white-grey suit, green ink (light theme)",
        colors: {
            // her Planet Diving Suit: white/grey ceramic surfaces, the green of her
            // legs as the ink — light theme, ALL text in green (duotone like Lily)
            bg_sidebar: "#d3d7d3",
            bg_primary: "#eceeec",
            bg_card: "#ffffff",
            bg_card_hover: "#e2e6e2",
            bg_card_pressed: "#d7dcd7",
            bg_modal_section: "#e7eae7",
            bg_input: "#e0e4e0",
            bg_selected: "#d9e4da",
            border_subtle: "#c0c8c1",
            text_primary: "#1a6b3b",
            text_secondary: "#2b7d4a",
            text_muted: "#4e8a63",
            text_dim: "#6fa082",
            accent_blue: "#21a04d",
            success: "#2f9e5c",
            warning: "#c8861e",
            error: "#d5493c"
        }
    },
    {
        key: "tachy",
        name: "Tachy",
        blurb: "carbon black, amber text, orange glow",
        colors: {
            // her three suit tones, all visible: carbon -> surfaces, amber -> text,
            // orange glow -> accent; the teal glints on her suit -> success
            bg_sidebar: "#0a0b10",
            bg_primary: "#10121a",
            bg_card: "#171a24",
            bg_card_hover: "#1e2230",
            bg_card_pressed: "#252a3a",
            bg_modal_section: "#141720",
            bg_input: "#191c28",
            bg_selected: "#202536",
            border_subtle: "#2b3040",
            text_primary: "#f2bc4e",
            text_secondary: "#d9a133",
            text_muted: "#a58136",
            text_dim: "#75612f",
            accent_blue: "#ff7c1e",
            success: "#3fbfa8",
            warning: "#eaa72c",
            error: "#f0503c"
        }
    },
    {
        key: "lily",
        name: "Lily",
        blurb: "amber ink on black",
        colors: {
            // strict duotone: neutral blacks (no brown), ALL text in amber gold
            bg_sidebar: "#0a0909",
            bg_primary: "#111010",
            bg_card: "#191817",
            bg_card_hover: "#201e1c",
            bg_card_pressed: "#262421",
            bg_modal_section: "#151413",
            bg_input: "#1a1918",
            bg_selected: "#232120",
            border_subtle: "#2e2b26",
            text_primary: "#f6c832",
            text_secondary: "#d4a92c",
            text_muted: "#a5842a",
            text_dim: "#7a6526",
            accent_blue: "#ffd23e",
            success: "#5fb55a",
            warning: "#e08a2a",
            error: "#e0503c"
        }
    },
    {
        key: "enya",
        name: "Enya",
        blurb: "white ceramic, ice-blue sheen (light theme)",
        colors: {
            // her armour is white ceramic — only a light theme can say that
            bg_sidebar: "#d5dae1",
            bg_primary: "#eef0f3",
            bg_card: "#ffffff",
            bg_card_hover: "#e4e8ee",
            bg_card_pressed: "#d9dfe7",
            bg_modal_section: "#e9ecf0",
            bg_input: "#e2e6ec",
            bg_selected: "#dce3ec",
            border_subtle: "#c2cad4",
            text_primary: "#171c23",
            text_secondary: "#3f4a58",
            text_muted: "#66727f",
            text_dim: "#8d97a3",
            accent_blue: "#3e90c9",
            success: "#2f9e5c",
            warning: "#c8861e",
            error: "#d5493c"
        }
    },
    {
        key: "kaya",
        name: "Kaya",
        blurb: "lavender ink on deep violet",
        colors: {
            // duotone like Lily: one material, one ink. Deep violet-black surfaces,
            // ALL text in her hair's lavender; the khaki coat retreats to a small
            // role (success) — big khaki + lavender slabs side by side clashed.
            bg_sidebar: "#14111b",
            bg_primary: "#1a1622",
            bg_card: "#221d2e",
            bg_card_hover: "#292338",
            bg_card_pressed: "#302a42",
            bg_modal_section: "#1e1928",
            bg_input: "#241f31",
            bg_selected: "#2c2540",
            border_subtle: "#382f4c",
            text_primary: "#d9c8f0",
            text_secondary: "#b49ae0",
            text_muted: "#8d7bae",
            text_dim: "#6b5c88",
            accent_blue: "#cfa8ff",
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
