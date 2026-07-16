/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, useState } from "@equicord/types/webpack/common";
import { COLONY_ACCENTS, getColonyAccent, onColonyAccentChange, setColonyAccent } from "renderer/patches/colonyAccent";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";

export const ColonyAccentPicker: SettingsComponent = () => {
    const [current, setCurrent] = useState(getColonyAccent());

    // Keep the swatches in sync when the accent is changed via the Ctrl+Shift+A switcher.
    useEffect(() => onColonyAccentChange(setCurrent), []);

    return (
        <SimpleErrorBoundary>
            <div>
                <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--text-muted)", marginBottom: 12 }}>
                    Recolor Discord's brand, link and button colors with your Colony accent. Open the quick switcher
                    anywhere with <strong>Ctrl+Shift+A</strong>.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {COLONY_ACCENTS.map(a => {
                        const selected = a.key === current;
                        return (
                            <button
                                key={a.key}
                                type="button"
                                title={a.label}
                                aria-label={a.label}
                                onClick={() => setColonyAccent(a.key)}
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    background: a.hex ?? "var(--background-modifier-accent)",
                                    backgroundImage: a.hex
                                        ? undefined
                                        : "repeating-conic-gradient(rgba(128,128,128,.35) 0% 25%, transparent 0% 50%)",
                                    backgroundSize: a.hex ? undefined : "12px 12px",
                                    border: selected ? "2px solid var(--text-normal)" : "2px solid transparent",
                                    boxShadow: selected ? "0 0 0 2px var(--background-primary)" : "none",
                                    color: "var(--text-muted)",
                                    fontWeight: 800,
                                    fontSize: 13,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "transform .1s ease, border-color .1s ease"
                                }}
                            >
                                {a.hex ? "" : "A"}
                            </button>
                        );
                    })}
                </div>
            </div>
        </SimpleErrorBoundary>
    );
};
