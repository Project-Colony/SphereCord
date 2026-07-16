/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Colony Accent — brings Project Colony's 8-way user accent into Discord.
// The 52 Colony themes each pin their own accent (accent_blue), so Discord's
// blurple brand color otherwise ignores the accent hue the user picked in the
// Colony launcher. This patch overrides Discord's --brand-* / link / button
// brand variables to a chosen accent, generating a full shade ramp so hovers
// and pressed states stay coherent. It ships in the shell (survives Equicord
// updates), persists the choice, and offers a keyboard switcher (Ctrl+Shift+A)
// plus a picker in the SphereCord Settings tab.
//
// Accent hexes mirror Project-Colony/colony src/ui/theme.rs accent_key_to_color().

import { localStorage } from "../utils";

export interface ColonyAccent {
    key: string;
    label: string;
    hex: string | null; // null = "auto" (use the active theme's own accent)
}

export const COLONY_ACCENTS: ColonyAccent[] = [
    { key: "auto", label: "Auto", hex: null },
    { key: "red", label: "Red", hex: "#e05555" },
    { key: "orange", label: "Orange", hex: "#e0855a" },
    { key: "yellow", label: "Yellow", hex: "#c8a832" },
    { key: "green", label: "Green", hex: "#55b87a" },
    { key: "blue", label: "Blue", hex: "#6b8bd6" },
    { key: "indigo", label: "Indigo", hex: "#7b6bd6" },
    { key: "violet", label: "Violet", hex: "#b06bd6" },
    { key: "amber", label: "Amber", hex: "#d4a030" }
];

const STORAGE_KEY = "SphereCord_colonyAccent";
const STYLE_ID = "spherecord-colony-accent";

const listeners = new Set<(key: string) => void>();

/** Subscribe to accent changes (e.g. so the Settings picker reflects the hotkey). Returns an unsubscribe. */
export function onColonyAccentChange(cb: (key: string) => void): () => void {
    listeners.add(cb);
    return () => {
        listeners.delete(cb);
    };
}

export function getColonyAccent(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) || "auto";
    } catch {
        return "auto";
    }
}

function accentByKey(key: string): ColonyAccent {
    return COLONY_ACCENTS.find(a => a.key === key) ?? COLONY_ACCENTS[0];
}

// ---- color helpers ----
const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

function toRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => clampByte(x).toString(16).padStart(2, "0")).join("");
}

/** amount > 0 lightens toward white, amount < 0 darkens toward black; |amount| in 0..1 */
function shade(hex: string, amount: number): string {
    const [r, g, b] = toRgb(hex);
    if (amount >= 0) return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
    const k = 1 + amount;
    return toHex(r * k, g * k, b * k);
}

function buildCss(hex: string): string {
    // Discord's brand ramp: lower numbers lighter, 500 is the base, higher darker.
    const ramp: Record<number, number> = {
        260: 0.42,
        300: 0.34,
        345: 0.24,
        360: 0.18,
        400: 0.12,
        430: 0.06,
        460: 0.03,
        500: 0,
        530: -0.05,
        560: -0.1,
        600: -0.16,
        630: -0.2,
        660: -0.24
    };
    const decls: string[] = [];
    for (const step of Object.keys(ramp)) {
        const c = shade(hex, ramp[Number(step)]);
        decls.push(`--brand-${step}:${c}`);
        decls.push(`--brand-experiment-${step}:${c}`);
    }
    decls.push(`--brand-experiment:${hex}`);
    decls.push(`--control-brand-foreground:${hex}`);
    decls.push(`--control-brand-foreground-new:${hex}`);
    decls.push(`--text-brand:${shade(hex, 0.14)}`);
    decls.push(`--text-link:${shade(hex, 0.18)}`);
    decls.push(`--button-filled-brand-background:${hex}`);
    decls.push(`--button-filled-brand-background-hover:${shade(hex, -0.08)}`);
    decls.push(`--button-filled-brand-background-active:${shade(hex, -0.14)}`);
    decls.push(`--button-filled-brand-text:#ffffff`);
    decls.push(`--button-outline-brand-border:${hex}`);
    decls.push(`--button-outline-brand-text:${shade(hex, 0.14)}`);

    const body = decls.map(d => "  " + d + " !important;").join("\n");
    const sel =
        ":root,.theme-light,.theme-dark,.theme-darker,.theme-midnight," +
        ".visual-refresh.theme-light,.visual-refresh.theme-dark";
    return `${sel}{\n${body}\n}`;
}

function styleEl(): HTMLStyleElement {
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
    }
    // Always (re)append so our override stays last and wins over theme styles.
    (document.head || document.documentElement).appendChild(el);
    return el;
}

/** Apply an accent to the DOM without persisting — used for live preview. */
export function previewColonyAccent(key: string): void {
    const accent = accentByKey(key);
    styleEl().textContent = accent.hex ? buildCss(accent.hex) : "";
}

/** Apply, persist, and notify listeners. */
export function setColonyAccent(key: string): void {
    previewColonyAccent(key);
    try {
        localStorage.setItem(STORAGE_KEY, key);
    } catch {
        /* localStorage unavailable — apply is still live for this session */
    }
    for (const cb of listeners) {
        try {
            cb(key);
        } catch {
            /* ignore listener errors */
        }
    }
}

// ---------------------------------------------------------------------------
// Keyboard switcher overlay (Ctrl+Shift+A)
// ---------------------------------------------------------------------------

let overlay: HTMLElement | null = null;

function closeSwitcher() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener("keydown", onOverlayKey, true);
}

function commit(key: string) {
    setColonyAccent(key);
    closeSwitcher();
}

function onOverlayKey(e: KeyboardEvent) {
    if (!overlay) return;
    const swatches = Array.from(overlay.querySelectorAll<HTMLElement>(".sc-accent-swatch"));
    let idx = swatches.findIndex(s => s.classList.contains("active"));
    if (idx < 0) idx = 0;

    const cols = 3;
    const move = (next: number) => {
        e.preventDefault();
        const clamped = (next + swatches.length) % swatches.length;
        swatches[idx]?.classList.remove("active");
        swatches[clamped]?.classList.add("active");
        swatches[clamped]?.focus();
        previewColonyAccent(swatches[clamped].dataset.key || "auto");
    };

    switch (e.key) {
        case "Escape":
            e.preventDefault();
            previewColonyAccent(overlay.dataset.saved || "auto");
            closeSwitcher();
            break;
        case "Enter":
        case " ":
            e.preventDefault();
            commit(swatches[idx]?.dataset.key || "auto");
            break;
        case "ArrowRight":
            move(idx + 1);
            break;
        case "ArrowLeft":
            move(idx - 1);
            break;
        case "ArrowDown":
            move(idx + cols);
            break;
        case "ArrowUp":
            move(idx - cols);
            break;
    }
}

function openSwitcher() {
    if (overlay) {
        closeSwitcher();
        return;
    }
    const saved = getColonyAccent();

    overlay = document.createElement("div");
    overlay.className = "sc-accent-overlay";
    overlay.dataset.saved = saved;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Colony accent switcher");

    const panel = document.createElement("div");
    panel.className = "sc-accent-panel";

    const title = document.createElement("div");
    title.className = "sc-accent-title";
    title.textContent = "Colony accent";
    const hint = document.createElement("div");
    hint.className = "sc-accent-hint";
    hint.textContent = "Arrow keys to preview · Enter to apply · Esc to cancel";

    const grid = document.createElement("div");
    grid.className = "sc-accent-grid";

    for (const a of COLONY_ACCENTS) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sc-accent-swatch" + (a.key === saved ? " active" : "");
        b.dataset.key = a.key;
        b.title = a.label;
        b.setAttribute("aria-label", a.label);
        b.style.setProperty("--sw", a.hex || "transparent");
        if (!a.hex) b.classList.add("sc-accent-auto");
        b.textContent = a.hex ? "" : "A";

        const cap = document.createElement("span");
        cap.className = "sc-accent-cap";
        cap.textContent = a.label;

        const cell = document.createElement("div");
        cell.className = "sc-accent-cell";
        cell.appendChild(b);
        cell.appendChild(cap);
        grid.appendChild(cell);

        b.addEventListener("mouseenter", () => previewColonyAccent(a.key));
        b.addEventListener("focus", () => previewColonyAccent(a.key));
        b.addEventListener("click", () => commit(a.key));
    }

    grid.addEventListener("mouseleave", () => {
        const active = grid.querySelector<HTMLElement>(".sc-accent-swatch.active");
        previewColonyAccent(active?.dataset.key || saved);
    });

    panel.appendChild(title);
    panel.appendChild(grid);
    panel.appendChild(hint);
    overlay.appendChild(panel);

    overlay.addEventListener("mousedown", e => {
        if (e.target === overlay) {
            previewColonyAccent(saved);
            closeSwitcher();
        }
    });

    (document.body || document.documentElement).appendChild(overlay);
    overlay.querySelector<HTMLElement>(".sc-accent-swatch.active")?.focus();
    document.addEventListener("keydown", onOverlayKey, true);
}

function injectOverlayStyles() {
    if (document.getElementById("sc-accent-overlay-styles")) return;
    const s = document.createElement("style");
    s.id = "sc-accent-overlay-styles";
    s.textContent = `
.sc-accent-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.55);backdrop-filter:blur(3px);animation:sc-accent-fade .12s ease}
@keyframes sc-accent-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.sc-accent-overlay{animation:none}}
.sc-accent-panel{background:var(--background-base-low,var(--background-secondary,#2b2d31));
  border:1px solid var(--border-subtle,var(--background-modifier-accent,rgba(255,255,255,.08)));
  border-radius:16px;padding:22px 24px;box-shadow:0 16px 50px rgba(0,0,0,.5);min-width:340px}
.sc-accent-title{font-size:18px;font-weight:700;color:var(--header-primary,var(--text-normal,#fff));margin-bottom:16px}
.sc-accent-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.sc-accent-cell{display:flex;flex-direction:column;align-items:center;gap:6px}
.sc-accent-swatch{width:52px;height:52px;border-radius:14px;background:var(--sw);cursor:pointer;
  border:2px solid transparent;outline:none;transition:transform .1s ease,border-color .1s ease;
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;
  color:var(--text-muted,#b5bac1)}
.sc-accent-swatch.sc-accent-auto{background:repeating-conic-gradient(var(--background-modifier-accent,#4443) 0% 25%,transparent 0% 50%) 50%/14px 14px}
.sc-accent-swatch:hover{transform:translateY(-2px)}
.sc-accent-swatch.active{border-color:var(--white-500,#fff);transform:translateY(-2px);
  box-shadow:0 0 0 3px var(--background-base-low,rgba(0,0,0,.35))}
.sc-accent-cap{font-size:11px;color:var(--text-muted,#b5bac1);font-weight:600}
.sc-accent-hint{margin-top:16px;font-size:11px;color:var(--text-muted,#b5bac1);text-align:center;opacity:.8}`;
    (document.head || document.documentElement).appendChild(s);
}

function onHotkey(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && (e.code === "KeyA" || e.key.toLowerCase() === "a")) {
        e.preventDefault();
        injectOverlayStyles();
        openSwitcher();
    }
}

function init() {
    previewColonyAccent(getColonyAccent());
    injectOverlayStyles();
    document.addEventListener("keydown", onHotkey, true);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
