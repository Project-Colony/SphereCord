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

import { buildThemeCss } from "./utils/themeCss.mjs";

const COLONY_RAW = "https://raw.githubusercontent.com/Project-Colony/colony/main";
const THEME_RS_URL = `${COLONY_RAW}/src/ui/theme.rs`;
const I18N_URL = `${COLONY_RAW}/src/i18n.rs`;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "static", "colonyThemes");

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

// Colony's display labels (settings_theme_*). Colony ships fr first then en in i18n.rs;
// SphereCord's UI is English, so we keep the LAST value per key = the English locale.
function parseI18n(src: string) {
    const map = new Map<string, string>();
    const re = /"(settings_theme_[a-z0-9_]*)"\.into\(\),\s*"([^"]+)"\.into\(\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) map.set(m[1], m[2]);
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
    // Stellar Blade lives in Colony too now, but SphereCord ships it separately
    // (static/sbThemes via generateStellarThemes.mts) — skip to avoid duplicates.
    if (family === "stellar_blade") continue;
    const colors = paletteColors.get(palette);
    if (!colors) {
        console.warn(`Skipping ${palette}: no matching palette in theme.rs`);
        continue;
    }
    const fam = familyLabel(family, i18n);
    const vari = variantLabel(family, variant, i18n);
    const display = fam === vari ? fam : `${fam} · ${vari}`;
    const order = String(++index).padStart(2, "0");
    const css = buildThemeCss(
        {
            name: display,
            description: `${display} — from Project Colony's palette set, ported to Discord. Auto-generated.`,
            author: "Project Colony"
        },
        colors
    );
    await writeFile(join(OUT_DIR, `colony-${order}-${kebab(palette)}.css`), css, "utf-8");
}

const written = (await readdir(OUT_DIR)).filter(f => f.endsWith(".css"));
console.log(`Generated ${written.length} Colony themes into static/colonyThemes/`);
