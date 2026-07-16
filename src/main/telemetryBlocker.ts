/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { session } from "electron";

import { Settings } from "./settings";

// Telemetry & crash-reporting firewall. Cancels Discord's science / metrics /
// tracking beacons and Sentry crash reports at the network layer, before they
// leave the process. A main-process block is authoritative and update-proof —
// unlike a renderer-level blocker that Equicord re-fetches on update — and it
// also catches natively-issued beacons.
//
// The webRequest filter is scoped to Discord's API traffic + Sentry only (so the
// rest of the network stack is never touched); the regex below then cancels just
// the analytics endpoints and lets every other API request pass through.
// Verified live: the filter fires on real discord.com/api/v9 requests.
const API_FILTER = ["*://discord.com/api/*", "*://*.discord.com/api/*", "*://sentry.io/*", "*://*.sentry.io/*"];

// Analytics endpoints to cancel; every other API request passes through untouched.
// Word-boundary-ish so "tracking"/"soundtrack" etc. don't false-positive.
const TELEMETRY_RE = /\/(science|metrics|track)(?:\/|$|\?)|sentry|error-reporting/i;

let registered = false;
let loggedFirstBlock = false;

export function registerTelemetryBlocker() {
    if (registered) return;
    registered = true;

    session.defaultSession.webRequest.onBeforeRequest({ urls: API_FILTER }, (details, callback) => {
        // Read the toggle live so enabling/disabling needs no restart. Default on.
        const cancel = Settings.store.blockTelemetry !== false && TELEMETRY_RE.test(details.url);
        if (cancel && !loggedFirstBlock) {
            loggedFirstBlock = true;
            console.log("[Privacy] Telemetry firewall blocked:", details.url);
        }
        callback({ cancel });
    });
}
