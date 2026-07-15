/*
 * Vesktop, a desktop app aiming to give you a snappier Discord Experience
 * Copyright (c) 2025 Vendicated and Vesktop contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Rename the "Equicord Settings" section header in Discord's settings sidebar to
// "SphereCord Settings".
//
// A load-time Vencord patch can't do this: Equicord builds that section during its
// own init (our renderer already reads the loaded Settings plugin in index.ts), so
// the module has run before our patches register and the patch never applies.
// Instead we rename it at the DOM level whenever the header text appears. The
// Equicord mod, its auto-updates, and the "Equicord" tab label are all left untouched.

const FROM = "Equicord Settings";
const TO = "SphereCord Settings";

function renameIn(root: Node) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        if (node.nodeValue === FROM) node.nodeValue = TO;
    }
}

function start() {
    renameIn(document.body);
    new MutationObserver(records => {
        for (const record of records) {
            for (const added of record.addedNodes) {
                if (added.nodeType === Node.TEXT_NODE) {
                    if (added.nodeValue === FROM) added.nodeValue = TO;
                } else if (added.nodeType === Node.ELEMENT_NODE && (added as Element).textContent?.includes(FROM)) {
                    renameIn(added);
                }
            }
        }
    }).observe(document.body, { childList: true, subtree: true });
}

if (document.body) start();
else window.addEventListener("DOMContentLoaded", start);
