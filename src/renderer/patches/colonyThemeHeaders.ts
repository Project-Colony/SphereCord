/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Insert family section headers into Equicord's Themes tab so the bundled Colony
// themes read like the Colony launcher (grouped by family). Equicord's tab is a flat
// card grid (.vc-settings-theme-grid) with no section concept, and its module loads
// during Equicord's own init (a load-time patch can't touch it), so we do it in the DOM.
// Cards are named "<Family> · <Variant>" (or just "<Family>"), so we group by that.

const FAMILIES = [
    "Stellar Blade",
    "Catppuccin",
    "Gruvbox",
    "Everblush",
    "Kanagawa",
    "Nord",
    "Dracula",
    "Solarized",
    "Tokyo Night",
    "Rosé Pine",
    "One Dark",
    "Monokai Pro",
    "Ayu",
    "Everforest",
    "Material",
    "Flexoki",
    "Nightfox",
    "Sonokai",
    "Oxocarbon",
    "Night Owl",
    "Iceberg",
    "Horizon",
    "Melange",
    "Synthwave '84",
    "Modus"
].sort((a, b) => b.length - a.length); // longest first so prefixes don't shadow

const HEADER_CLASS = "colony-theme-family-header";

function familyOf(card: Element) {
    const text = (card.textContent ?? "").trimStart();
    return FAMILIES.find(f => text.startsWith(f)) ?? null;
}

function syncHeaders(grid: Element) {
    grid.querySelectorAll(`.${HEADER_CLASS}`).forEach(h => h.remove());

    let last: string | null = null;
    for (const card of Array.from(grid.children)) {
        const family = familyOf(card);
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
    }
}

const observer = new MutationObserver(() => {
    const grid = document.querySelector(".vc-settings-theme-grid");
    if (!grid) return;
    // Re-entrancy guard: our own inserts mutate the grid, so pause while syncing.
    observer.disconnect();
    try {
        syncHeaders(grid);
    } finally {
        observer.observe(document.body, { childList: true, subtree: true });
    }
});

if (document.body) observer.observe(document.body, { childList: true, subtree: true });
else
    window.addEventListener("DOMContentLoaded", () =>
        observer.observe(document.body, { childList: true, subtree: true })
    );
