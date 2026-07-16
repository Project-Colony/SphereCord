/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, useState } from "@equicord/types/webpack/common";
import {
    COLONY_ACCENTS,
    getColonyAccent,
    isColonyAccentEnabled,
    onColonyAccentChange,
    setColonyAccent,
    setColonyAccentEnabled
} from "renderer/patches/colonyAccent";

import { SimpleErrorBoundary } from "../SimpleErrorBoundary";
import { SettingsComponent } from "./Settings";
import { VesktopSettingsSwitch } from "./VesktopSettingsSwitch";

export const ColonyAccentPicker: SettingsComponent = () => {
    const [enabled, setEnabled] = useState(isColonyAccentEnabled());
    const [current, setCurrent] = useState(getColonyAccent());

    // Reflect changes made via the Ctrl+Shift+A switcher or elsewhere.
    useEffect(
        () =>
            onColonyAccentChange(state => {
                setEnabled(state.enabled);
                setCurrent(state.accent);
            }),
        []
    );

    return (
        <SimpleErrorBoundary>
            <VesktopSettingsSwitch
                title="Colony Accent"
                description="Recolor Discord's brand, link and button colors with a Colony accent. Quick switcher anywhere: Ctrl+Shift+A."
                value={enabled}
                onChange={setColonyAccentEnabled}
            />
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 4,
                    opacity: enabled ? 1 : 0.4,
                    pointerEvents: enabled ? "auto" : "none",
                    transition: "opacity .12s ease"
                }}
            >
                {COLONY_ACCENTS.map(a => {
                    const selected = a.key === current;
                    return (
                        <button
                            key={a.key}
                            type="button"
                            title={a.label}
                            aria-label={a.label}
                            aria-pressed={selected}
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
        </SimpleErrorBoundary>
    );
};
