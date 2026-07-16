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

const COLONY_RAW = "https://raw.githubusercontent.com/Project-Colony/colony/main";
const THEME_RS_URL = `${COLONY_RAW}/src/ui/theme.rs`;
const I18N_URL = `${COLONY_RAW}/src/i18n.rs`;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "static", "colonyThemes");

// Discord CSS variable  <-  Colony palette field. One rule for all 52 palettes; tweak here.
const CSS_MAP: Record<string, string> = {
    // Legacy background variables (older components / pre-visual-refresh)
    "--background-primary": "bg_primary",
    "--background-secondary": "bg_sidebar",
    "--background-secondary-alt": "bg_card",
    "--background-tertiary": "bg_sidebar",
    "--background-floating": "bg_card",
    "--background-nested-floating": "bg_card",
    "--deprecated-card-bg": "bg_card",
    // Visual-refresh base surfaces (lowest = deepest/darkest layer)
    "--background-base-lowest": "bg_sidebar",
    "--background-base-lower": "bg_sidebar",
    "--background-base-low": "bg_primary",
    "--app-frame-background": "bg_sidebar",
    "--chat-background": "bg_primary",
    "--chat-background-default": "bg_primary",
    "--home-background": "bg_primary",
    // Visual-refresh raised surfaces (cards, popouts, modals)
    "--background-surface-high": "bg_card",
    "--background-surface-higher": "bg_card_hover",
    "--background-surface-highest": "bg_card_pressed",
    "--bg-surface-raised": "bg_card",
    "--card-background-default": "bg_card",
    "--modal-background": "bg_modal_section",
    "--modal-footer-background": "bg_modal_section",
    // Inputs
    "--channeltextarea-background": "bg_input",
    "--input-background": "bg_input",
    "--background-code": "bg_input",
    // State modifiers (hover / selected / active overlays)
    "--background-mod-subtle": "bg_card_hover",
    "--background-mod-normal": "bg_card_hover",
    "--background-mod-muted": "bg_selected",
    "--background-mod-strong": "bg_card_pressed",
    "--background-modifier-hover": "bg_card_hover",
    "--background-modifier-selected": "bg_selected",
    "--background-modifier-active": "bg_card_pressed",
    "--background-modifier-accent": "border_subtle",
    // Text
    "--text-primary": "text_primary",
    "--text-secondary": "text_secondary",
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
    "--control-brand-foreground": "accent_blue",
    "--text-brand": "accent_blue",
    // Status
    "--status-positive": "success",
    "--status-warning": "warning",
    "--status-danger": "error",
    "--text-positive": "success",
    "--text-warning": "warning",
    "--text-danger": "error",
    "--info-danger-foreground": "error"
};

function kebab(constName: string) {
    return constName.toLowerCase().replace(/_/g, "-");
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Colony's launcher order + (family, variant) -> palette, straight from theme.rs's match.
function parseMatch(src: string) {
    const re = /\("([a-z0-9_]+)",\s*"([a-z0-9_]+)"\)\s*=>\s*ThemePalette::([A-Z0-9_]+)/g;
    const entries: { family: string; variant: string; palette: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) entries.push({ family: m[1], variant: m[2], palette: m[3] });
    return entries;
}

// Colony's display labels (settings_theme_*). First value per key wins = the French locale.
function parseI18n(src: string) {
    const map = new Map<string, string>();
    const re = /"(settings_theme_[a-z0-9_]*)"\.into\(\),\s*"([^"]+)"\.into\(\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) if (!map.has(m[1])) map.set(m[1], m[2]);
    return map;
}

function familyLabel(family: string, i18n: Map<string, string>) {
    return i18n.get(`settings_theme_${family}`) ?? cap(family);
}

function variantLabel(family: string, variant: string, i18n: Map<string, string>) {
    return (
        i18n.get(`settings_theme_${family}_${variant}`) ??
        (variant === "light"
            ? i18n.get("settings_theme_light")
            : variant === "dark"
              ? i18n.get("settings_theme_dark_mode")
              : undefined) ??
        cap(variant)
    );
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

function buildCss(display: string, colors: Record<string, string>) {
    const vars = Object.entries(CSS_MAP)
        .map(([cssVar, field]) => (colors[field] ? `    ${cssVar}: ${colors[field]} !important;` : null))
        .filter(Boolean)
        .join("\n");
    // Discord sets its variables under theme classes (.theme-dark ...) which outrank
    // a bare :root, so we target those too and use !important to reliably win.
    return `/**
 * @name ${display}
 * @description ${display} — from Project Colony's palette set, ported to Discord. Auto-generated.
 * @author Project Colony
 * @version 1.0.0
 */

:root,
.theme-light,
.theme-dark,
.theme-darker,
.theme-midnight,
.visual-refresh.theme-light,
.visual-refresh.theme-dark,
.visual-refresh .theme-light,
.visual-refresh .theme-dark {
${vars}
}
`;
}

const fetchText = (url: string) =>
    fetch(url).then(r => {
        if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
        return r.text();
    });

const [themeSrc, i18nSrc] = await Promise.all([fetchText(THEME_RS_URL), fetchText(I18N_URL)]);

const paletteColors = new Map(parsePalettes(themeSrc).map(p => [p.name, p.colors]));
const entries = parseMatch(themeSrc); // families/variants in Colony's launcher order
const i18n = parseI18n(i18nSrc);
if (!entries.length) throw new Error("No theme entries parsed — did theme.rs's match block change?");

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
// Walk Colony's launcher order. The order index goes into the FILENAME (Equicord keeps
// file order for unpinned themes); the @name is "Family · Variant" with Colony's labels.
let index = 0;
for (const { family, variant, palette } of entries) {
    const colors = paletteColors.get(palette);
    if (!colors) {
        console.warn(`Skipping ${palette}: no matching palette in theme.rs`);
        continue;
    }
    const fam = familyLabel(family, i18n);
    const vari = variantLabel(family, variant, i18n);
    const display = fam === vari ? fam : `${fam} · ${vari}`;
    const order = String(++index).padStart(2, "0");
    await writeFile(join(OUT_DIR, `colony-${order}-${kebab(palette)}.css`), buildCss(display, colors), "utf-8");
}

const written = (await readdir(OUT_DIR)).filter(f => f.endsWith(".css"));
console.log(`Generated ${written.length} Colony themes into static/colonyThemes/`);
