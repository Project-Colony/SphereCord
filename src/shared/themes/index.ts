/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { COLONY_THEMES } from "./colony";
import { STELLAR_THEMES } from "./stellar";

export type { BundledTheme, ThemeSwatch } from "./types";

/**
 * Every theme SphereCord ships, in gallery order: its own character sets first,
 * then Project Colony's palette set in the launcher's own order.
 */
export const BUNDLED_THEMES = [...STELLAR_THEMES, ...COLONY_THEMES];

/** Filenames of bundled themes — used to tell ours apart from user-installed ones. */
export const BUNDLED_THEME_FILES = new Set(BUNDLED_THEMES.map(t => t.file));
