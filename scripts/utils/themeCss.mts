/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Shared Discord-CSS mapping used by every bundled theme generator
// (generateColonyThemes.mts, generateStellarThemes.mts). One palette shape in,
// one Discord theme out — tweak the variable coverage here and every generated
// theme picks it up.

/** Discord CSS variable  <-  palette field. */
export const CSS_MAP: Record<string, string> = {
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

export interface ThemeMeta {
    name: string;
    description: string;
    author: string;
    version?: string;
}

/**
 * Build a Discord (Vencord) theme stylesheet from a palette.
 *
 * Discord sets its variables under theme classes (.theme-dark ...) which outrank
 * a bare :root, so we target those too and use !important to reliably win.
 */
export function buildThemeCss(meta: ThemeMeta, colors: Record<string, string>): string {
    const vars = Object.entries(CSS_MAP)
        .map(([cssVar, field]) => (colors[field] ? `    ${cssVar}: ${colors[field]} !important;` : null))
        .filter(Boolean)
        .join("\n");

    return `/**
 * @name ${meta.name}
 * @description ${meta.description}
 * @author ${meta.author}
 * @version ${meta.version ?? "1.0.0"}
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
