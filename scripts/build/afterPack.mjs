import { cpSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

import { addAssetsCar } from "./addAssetsCar.mjs";

// Platform/arch combinations arRPC genuinely cannot be built for, so a missing binary
// there is expected rather than a packaging mistake. Bun has no windows-arm64 compile
// target (see TARGETS in scripts/build/compileArrpc.mts), so those builds ship without
// Rich Presence — Windows on ARM runs the x64 build under emulation anyway.
const ARRPC_UNSUPPORTED = new Set(["win32-arm64"]);

async function copyArRPCBinaries(context) {
    const { electronPlatformName, arch, appOutDir } = context;

    // map electron-builder arch enum to string
    // 0 = ia32, 1 = x64, 2 = armv7l, 3 = arm64
    const archMap = { 0: "ia32", 1: "x64", 2: "armv7l", 3: "arm64" };
    const archString = typeof arch === "number" ? archMap[arch] : arch;

    if (archString === "universal" || archString === undefined) {
        console.log("Skipping arRPC copy for universal build (already merged from x64/arm64)");
        return;
    }

    const resourcesDir = join(appOutDir, electronPlatformName === "darwin" ? `${context.packager.appInfo.productFilename}.app/Contents/Resources` : "resources");
    const arrpcDestDir = join(resourcesDir, "arrpc");

    mkdirSync(arrpcDestDir, { recursive: true });

    const arrpcSourceDir = join(process.cwd(), "static", "dist");
    const platformName = electronPlatformName === "win32" ? "windows" : electronPlatformName;

    let binaryName = `arrpc-${platformName}-${archString}`;
    if (electronPlatformName === "win32") binaryName += ".exe";

    const binarySourcePath = join(arrpcSourceDir, binaryName);
    if (existsSync(binarySourcePath)) {
        const destBinaryName = electronPlatformName === "win32" ? "arrpc.exe" : "arrpc";
        const binaryDestPath = join(arrpcDestDir, destBinaryName);
        console.log(`Copying arRPC binary: ${binaryName} -> ${destBinaryName}...`);
        cpSync(binarySourcePath, binaryDestPath);
    } else if (ARRPC_UNSUPPORTED.has(`${electronPlatformName}-${archString}`)) {
        console.warn(`arRPC has no ${electronPlatformName}-${archString} build — packaging without Rich Presence.`);
    } else {
        // resources/arrpc is the ONLY shipped copy — the one inside app.asar is excluded
        // from build.files, and arrpc/index.ts refuses to spawn anything under .asar anyway.
        // So a missing binary here means shipping an app whose Rich Presence silently never
        // starts; fail the build instead of warning into a log nobody reads.
        throw new Error(
            `arRPC binary not found: ${binarySourcePath}\n` +
                "Run 'bun compileArrpc' to build the arRPC binaries before packaging."
        );
    }
}

export default async function afterPack(context) {
    await copyArRPCBinaries(context);
    await addAssetsCar(context);
}
