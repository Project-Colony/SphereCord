/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** The few colors the Themes gallery needs to draw a card's live preview. */
export interface ThemeSwatch {
    bg: string;
    sidebar: string;
    card: string;
    text: string;
    accent: string;
}

/**
 * One bundled theme, as emitted by the generators into shared/themes/*.ts.
 * `file` is the on-disk filename, which is exactly what goes into Vencord's
 * `enabledThemes` array.
 */
export interface BundledTheme {
    file: string;
    name: string;
    family: string;
    variant: string;
    /** true when the theme's background is dark — drives the light/dark chip. */
    dark: boolean;
    swatch: ThemeSwatch;
}
