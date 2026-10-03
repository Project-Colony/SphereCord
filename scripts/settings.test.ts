import { mock, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("legacy settings keep the effective titlebar and explicit preferences", async () => {
    const dataDir = mkdtempSync(join(tmpdir(), "spherecord-settings-"));
    const settingsFile = join(dataDir, "settings.json");
    const vencordFile = join(dataDir, "vencord.json");
    try {
        writeFileSync(settingsFile, JSON.stringify({
            customTitleBar: false,
            blockTelemetry: false,
            hardwareAcceleration: false,
            tray: false,
            arRPC: true,
            webRTCIPHandlingPolicy: "disable_non_proxied_udp"
        }));
        writeFileSync(vencordFile, JSON.stringify({ frameless: true }));
        mock.module("../src/main/constants", () => ({
            DATA_DIR: dataDir,
            VENCORD_SETTINGS_FILE: vencordFile
        }));

        const { Settings, State } = await import("../src/main/settings");
        assert.equal(Settings.store.nativeTitleBar, false);
        assert.equal(Settings.store.blockTelemetry, false);
        assert.equal(Settings.store.hardwareAcceleration, false);
        assert.equal(Settings.store.tray, false);
        assert.equal(Settings.store.arRPC, true);
        assert.equal(Settings.store.webRTCIPHandlingPolicy, "disable_non_proxied_udp");
        assert.equal(Settings.store.minimizeToTray, true);
        assert.equal(Settings.store.appBadge, true);
        assert.deepEqual(State.plain, {});

        Settings.store.staticTitle = true;
        const saved = JSON.parse(readFileSync(settingsFile, "utf8"));
        assert.equal(saved.nativeTitleBar, false);
        assert.equal(saved.blockTelemetry, false);
        assert.equal("customTitleBar" in saved, false);
    } finally {
        rmSync(dataDir, { recursive: true, force: true });
    }
});
