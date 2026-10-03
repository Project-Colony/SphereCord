// Run with `bun scripts/generateTrayIcons.mts` (requires rsvg-convert).
// Keep the launcher artwork intact; only the status badge changes.
import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const staticDir = join(import.meta.dirname, "..", "static");
const icon = join(staticDir, "icon.png");
const image = readFileSync(icon).toString("base64");

for (const name of ["tray", "idle"]) {
    copyFileSync(icon, join(staticDir, "tray", `${name}.png`));
}

const badges = {
    trayUnread: { color: "#ED4245", glyph: "" },
    speaking: {
        color: "#3BA55C",
        glyph: '<path d="M386 402v32m32-52v72m32-52v32"/>'
    },
    muted: {
        color: "#ED4245",
        glyph: '<rect x="404" y="374" width="28" height="54" rx="14"/><path d="M388 408v10a30 30 0 0 0 60 0v-10m-30 40v16m-16 0h32M378 378l80 80"/>'
    },
    deafened: {
        color: "#ED4245",
        glyph: '<path d="M382 430v-20a36 36 0 0 1 72 0v20"/><rect x="382" y="416" width="16" height="30" rx="6"/><rect x="438" y="416" width="16" height="30" rx="6"/><path d="M378 378l80 80"/>'
    }
};

for (const [name, { color, glyph }] of Object.entries(badges)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
        <image href="data:image/png;base64,${image}" width="512" height="512"/>
        <circle cx="418" cy="418" r="80" fill="${color}" stroke="#1C1636" stroke-width="12"/>
        <g fill="none" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
    </svg>`;
    execFileSync("rsvg-convert", ["--output", join(staticDir, "tray", `${name}.png`)], { input: svg });
}
