/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app, protocol } from "electron";

import { handleVesktopAssetsProtocol } from "./userAssets";
import { handleVesktopStaticProtocol } from "./vesktopStatic";

// Must run before the app 'ready' event. Without this, `equibop:` is a
// non-standard scheme with a null origin, so ES module scripts served from it
// (e.g. the updater window's <script type="module">) are blocked by CORS —
// "Cross origin requests are only supported for … http, https". Marking it
// standard + corsEnabled gives it a real origin (equibop://static), making
// those scripts same-origin so they load. Runs at import (before ready).
protocol.registerSchemesAsPrivileged([
    {
        scheme: "equibop",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true
        }
    }
]);

app.whenReady().then(() => {
    protocol.handle("equibop", async req => {
        const url = new URL(req.url);

        switch (url.hostname) {
            case "assets":
                return handleVesktopAssetsProtocol(url.pathname, req);
            case "static":
                return handleVesktopStaticProtocol(url.pathname, req);
            default:
                return new Response(null, { status: 404 });
        }
    });
});
