# SphereCord [<img src="/static/icon.png" width="225" align="right" alt="SphereCord">](https://github.com/Project-Colony/SphereCord)

[![Equicord](https://img.shields.io/badge/Equicord-grey?style=flat)](https://github.com/Equicord/Equicord)
[![Tests](https://github.com/Project-Colony/SphereCord/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Project-Colony/SphereCord/actions/workflows/test.yml)
[![Discord](https://img.shields.io/discord/1173279886065029291.svg?color=768AD4&label=Discord&logo=discord&logoColor=white)](https://equicord.org/discord)

SphereCord is a fork of [Vesktop](https://github.com/Vencord/Vesktop).

You can join our [discord server](https://equicord.org/discord) for commits, changes, chat or even support.<br></br>

**Main features**:
- Equicord preinstalled
- Much more lightweight and faster than the official Discord app
- Linux Screenshare with sound & wayland
- Much better privacy, since Discord has no access to your system

**Extra included changes**

- Tray Customization with voice detection and notification badges
- Command-line flags to toggle microphone and deafen status (Linux)
- Custom Arguments from [this PR](https://github.com/Project-Colony/SphereCord/pull/46)
- arRPC-bun with debug logging support https://github.com/Creationsss/arrpc-bun

**Not fully Supported**:
- Global Keybinds (Windows/macOS - use command-line flags on Linux instead)

## SphereCord Arguments
> [!NOTE]
> These flags are inherited from Equibop/Vesktop. See the persistent-flags section below to apply them.

### Quick reference

| Flag                            | Description                             |
|---------------------------------|-----------------------------------------|
| `--ozone-platform=wayland`      | Force native Wayland                    |
| `--ozone-platform=x11`          | Force XWayland                          |
| `--no-sandbox`                  | Disable Chromium sandbox (use with caution) |
| `--force_high_performance_gpu`  | Prefer discrete GPU                     |
| `--start-minimized`             | Launch minimized to tray                |
| `--toggle-mic`                  | Toggle mic (bind to shortcuts)          |
| `--toggle-deafen`               | Toggle deafen (bind to shortcuts)       |
| `--toggle-vad`                  | Toggle Voice Activity Detection (Voice Activity <-> Push To Talk) |

### Persistent flags

Add flags to `${XDG_CONFIG_HOME}/spherecord-flags.conf` — one per line, lines starting with `#` are comments.

## Installing
Grab a build from the [Releases](https://github.com/Project-Colony/SphereCord/releases) page, or build from source (see below).

> [!NOTE]
> SphereCord does not yet publish to distribution channels (AUR, Flathub, Nix, etc.). If you set those up, add them here.

## Building from Source

You need to have the following dependencies installed:
- [Git](https://git-scm.com/downloads)
- [Bun](https://bun.sh)

Packaging will create builds in the dist/ folder

```sh
git clone https://github.com/Project-Colony/SphereCord
cd SphereCord

# Install Dependencies
bun install

# Either run it without packaging
bun start

# Or package (will build packages for your OS)
bun package

# Or only build the Linux Pacman package
bun package --linux pacman

# Or package to a directory only
bun package:dir
```

## Building LibVesktop from Source

This is a small C++ helper library SphereCord uses on Linux to emit D-Bus events. By default, prebuilt binaries for x64 and arm64 are used.

If you want to build it from source:
1. Install build dependencies:
    - Debian/Ubuntu: `apt install build-essential python3 curl pkg-config libglib2.0-dev`
    - Fedora: `dnf install @c-development @development-tools python3 curl pkgconf-pkg-config glib2-devel`
2. Run `bun buildLibVesktop`
3. From now on, building SphereCord will use your own build
