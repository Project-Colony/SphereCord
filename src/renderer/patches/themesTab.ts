/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Enhancements to Equicord's own Themes tab, so the bundled sets read like the
// Colony launcher without building a competing UI (the native tab already owns
// search, filters, toggles, upload and online themes):
//   1. family section headers  — its grid is flat, with no section concept
//   2. a colour strip per card — it shows names only, never the actual palette
//
// The tab's module loads during Equicord's own init, so a load-time webpack patch
// can't reach it; we work in the DOM instead. Cards are titled "<Family> · <Variant>"
// (or just "<Family>"), which is what we match against the generated manifest.

import { BUNDLED_THEMES } from "shared/themes";

// Longest name first so "Modus" never shadows "Modus · Operandi".
const BY_NAME = [...BUNDLED_THEMES].sort((a, b) => b.name.length - a.name.length);

const HEADER_CLASS = "colony-theme-family-header";
const SWATCH_CLASS = "colony-theme-swatch";

function themeOf(card: Element) {
    const text = (card.textContent ?? "").trimStart();
    return BY_NAME.find(t => text.startsWith(t.name)) ?? null;
}

/** A thin strip of the theme's real colours, prepended to its card. */
function addSwatch(card: Element, theme: (typeof BUNDLED_THEMES)[number]) {
    if (card.querySelector(`.${SWATCH_CLASS}`)) return; // already decorated

    const strip = document.createElement("div");
    strip.className = SWATCH_CLASS;
    strip.style.cssText = "display:flex;height:6px;border-radius:3px;overflow:hidden;margin-bottom:8px;";

    const { sidebar, bg, card: surface, accent } = theme.swatch;
    for (const [color, grow] of [
        [sidebar, 1],
        [bg, 2],
        [surface, 1],
        [accent, 1]
    ] as const) {
        const seg = document.createElement("div");
        seg.style.cssText = `flex:${grow};background:${color};`;
        strip.appendChild(seg);
    }

    card.insertBefore(strip, card.firstChild);
}

function syncGrid(grid: Element) {
    grid.querySelectorAll(`.${HEADER_CLASS}`).forEach(h => h.remove());

    let last: string | null = null;
    for (const card of Array.from(grid.children)) {
        const theme = themeOf(card);
        const family = theme?.family ?? null;

        if (family && family !== last) {
            const header = document.createElement("div");
            header.className = HEADER_CLASS;
            header.textContent = family;
            header.style.cssText =
                "grid-column:1/-1;margin:16px 4px 2px;font-size:14px;font-weight:600;" +
                "color:var(--header-primary);border-bottom:1px solid var(--background-modifier-accent);padding-bottom:4px;";
            grid.insertBefore(header, card);
        }
        last = family;

        if (theme) addSwatch(card, theme);
    }
}

const observer = new MutationObserver(() => {
    const grid = document.querySelector(".vc-settings-theme-grid");
    if (!grid) return;
    // Re-entrancy guard: our own inserts mutate the grid, so pause while syncing.
    observer.disconnect();
    try {
        syncGrid(grid);
    } finally {
        observer.observe(document.body, { childList: true, subtree: true });
    }
});

if (document.body) observer.observe(document.body, { childList: true, subtree: true });
else
    window.addEventListener("DOMContentLoaded", () =>
        observer.observe(document.body, { childList: true, subtree: true })
    );
