/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Generates Discord (Vencord) CSS themes from Project Colony's Rust palette set.
// Source of truth: Project-Colony/colony `src/ui/theme.rs` (each `pub const NAME: Self`
// is a full ThemePalette of `field: hex(0xRRGGBB)` colors). Run with:
//   bun run scripts/generateColonyThemes.mts
// Output: static/colonyThemes/colony-<name>.css (committed; SphereCord auto-installs them).

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THEME_RS_URL = "https://raw.githubusercontent.com/Project-Colony/colony/main/src/ui/theme.rs";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "static", "colonyThemes");

// Discord CSS variable  <-  Colony palette field. One rule for all 52 palettes; tweak here.
const CSS_MAP: Record<string, string> = {
    // Surfaces (server list darkest -> chat)
    "--background-tertiary": "bg_sidebar",
    "--background-secondary": "bg_sidebar",
    "--background-secondary-alt": "bg_card",
    "--background-primary": "bg_primary",
    "--background-floating": "bg_card",
    "--background-nested-floating": "bg_card",
    "--background-modifier-hover": "bg_card_hover",
    "--background-modifier-selected": "bg_selected",
    "--background-modifier-active": "bg_card_pressed",
    "--background-modifier-accent": "border_subtle",
    "--channeltextarea-background": "bg_input",
    "--input-background": "bg_input",
    "--modal-background": "bg_modal_section",
    "--deprecated-card-bg": "bg_card",
    // Text
    "--text-normal": "text_primary",
    "--text-default": "text_primary",
    "--text-muted": "text_muted",
    "--header-primary": "text_primary",
    "--header-secondary": "text_secondary",
    "--channels-default": "text_muted",
    "--interactive-normal": "text_secondary",
    "--interactive-hover": "text_primary",
    "--interactive-active": "text_primary",
    "--interactive-muted": "text_dim",
    "--text-link": "accent_blue",
    // Accent / brand
    "--brand-experiment": "accent_blue",
    "--brand-500": "accent_blue",
    "--brand-560": "accent_blue",
    "--brand-360": "accent_blue",
    // Status
    "--status-positive": "success",
    "--status-warning": "warning",
    "--status-danger": "error",
    "--text-positive": "success",
    "--text-warning": "warning",
    "--text-danger": "error",
    "--info-danger-foreground": "error"
};

function titleCase(constName: string) {
    return constName
        .toLowerCase()
        .split("_")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function kebab(constName: string) {
    return constName.toLowerCase().replace(/_/g, "-");
}

function parsePalettes(src: string) {
    const palettes: { name: string; colors: Record<string, string> }[] = [];
    const blockRe = /pub const ([A-Z0-9_]+):\s*Self\s*=\s*Self\s*\{([\s\S]*?)\};/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(src))) {
        const [, name, body] = m;
        const colors: Record<string, string> = {};
        const fieldRe = /(\w+):\s*hex\(0x([0-9a-fA-F]{6})\)/g;
        let f: RegExpExecArray | null;
        while ((f = fieldRe.exec(body))) colors[f[1]] = "#" + f[2].toLowerCase();
        if (Object.keys(colors).length) palettes.push({ name, colors });
    }
    return palettes;
}

function buildCss(name: string, colors: Record<string, string>) {
    const display = `Colony · ${titleCase(name)}`;
    const vars = Object.entries(CSS_MAP)
        .map(([cssVar, field]) => (colors[field] ? `    ${cssVar}: ${colors[field]};` : null))
        .filter(Boolean)
        .join("\n");
    return `/**
 * @name ${display}
 * @description ${titleCase(name)} palette from Project Colony, ported to Discord. Auto-generated.
 * @author Project Colony
 * @version 1.0.0
 */

:root {
${vars}
}
`;
}

const src = await fetch(THEME_RS_URL).then(r => {
    if (!r.ok) throw new Error(`Failed to fetch theme.rs: ${r.status}`);
    return r.text();
});

const palettes = parsePalettes(src);
if (!palettes.length) throw new Error("No palettes parsed — did theme.rs format change?");

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
for (const p of palettes) {
    await writeFile(join(OUT_DIR, `colony-${kebab(p.name)}.css`), buildCss(p.name, p.colors), "utf-8");
}

const written = (await readdir(OUT_DIR)).filter(f => f.endsWith(".css"));
console.log(`Generated ${written.length} Colony themes into static/colonyThemes/`);
