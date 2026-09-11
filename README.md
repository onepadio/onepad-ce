# OnePad

<div align="center">

**Chromebook simplicity on the computers you already own.**

A free, open-source **shared OS UI** — Spaces, app grid, and dock — that runs on macOS, Windows, and Linux without wiping your OS. Same home screen later as a thin Ubuntu kiosk (USB or install-to-disk).

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/onepadio/onepad-ce)
[![Version](https://img.shields.io/badge/version-beta-orange.svg)](https://github.com/onepadio/onepad-ce/releases)

[Website](https://onepad.io) • [Roadmap](./ROADMAP.md) • [Community](https://discord.gg/onepad)

</div>

---

## What is OnePad?

Mac and Windows are full operating systems. Most people only need a home screen and a handful of apps. OnePad is that home screen: a ChromeOS-class desktop (wallpaper, Spaces, app grid, dock) on top of the OS you already have.

**We are not a new OS** (no kernel). **We are not a productivity browser** competing with Arc. We are a thin shell whose UI *is* the product.

| Surface | What you do | Who it is for |
| --- | --- | --- |
| **App** on Mac / Windows / Linux | Install CE; keep your OS, printers, MDM, Office | Anyone who cannot wipe the machine |
| **OnePad image** (planned) | Boot USB or install to disk; OnePad *is* the session | Cheap PCs, labs, “I would have bought a Chromebook” |

Unlike [ChromeOS Flex](https://chromeos.google/products/chromeos-flex/), you do **not** have to wipe the disk to try the simple desktop. Install the app and keep Windows or macOS. The Ubuntu kiosk image is optional for labs and machines that should boot only OnePad.

**Built for:**
- People who find Mac and Windows too much OS
- Students, families, shop and office staff who live in web apps
- Privacy-conscious users who want local-first data
- Anyone who wants Chromebook simplicity without Google’s account or new hardware

---

## Why this exists

- Traditional OSes bury the apps people actually use under Settings, Finder, and window chaos
- Work already lives in SaaS and the browser — the rest of the OS is leftover complexity
- ChromeOS Flex solves simplicity by replacing the OS; many people cannot or will not do that

OnePad keeps the host OS and puts a simple home screen on top of it.

---

## Features (Community Edition)

- **Spaces** — Separate work, school, and personal into distinct desktops
- **App grid & LaunchPad** — Curated SaaS catalog; pin and rearrange apps
- **Embedded apps** — Web tools open in-place, not as another browser window
- **Local-first** — Layout and data stay on your device (IndexedDB)
- **Password manager** — Local vault; Safari import
- **Themes & backgrounds** — Make the shell feel like *your* desktop
- **Search** — Find apps and Spaces quickly
- **Session persistence** — Pick up where you left off

Coming (see [ROADMAP.md](./ROADMAP.md)): multi-device sync (Plus), Ubuntu kiosk ISO, remote/metered apps, curated publish path for small web apps.

---

## Open core

This repo is **Community Edition (AGPLv3)**. The local home screen stays free.

| Free forever (CE) | Paid / proprietary (later) |
| --- | --- |
| Spaces, grid, dock, themes | Multi-device sync of the same desktop |
| Local app catalog, pin/reorder | Accounts, encrypted backup |
| Local webviews, password manager | Remote app execution (metered) |
| Sideload any URL as an app | Fleet / kiosk admin, SSO |
| `.deb` / AppImage; Ubuntu kiosk image (same binary) | Commercial license for AGPL-averse orgs |

---

## Installation

### Download

**macOS:**
```bash
# Intel
curl -L https://onepad.io/download/mac-x64 -o OnePad.dmg

# Apple Silicon
curl -L https://onepad.io/download/mac-arm64 -o OnePad.dmg
```

**Windows:**
```powershell
curl -L https://onepad.io/download/windows -o OnePad-Setup.exe
```

**Linux:**
```bash
# Debian/Ubuntu
curl -L https://onepad.io/download/linux-deb -o onepad.deb
sudo dpkg -i onepad.deb

# AppImage
curl -L https://onepad.io/download/linux-appimage -o OnePad.AppImage
chmod +x OnePad.AppImage
./OnePad.AppImage
```

Or download from [onepad.io](https://onepad.io) / [GitHub Releases](https://github.com/onepadio/onepad-ce/releases).

---

## Development

### Prerequisites

- Node.js 18+ and npm 7+
- Git
- Platform build tools (Xcode CLT / VS Build Tools / `build-essential`)

### Setup

```bash
git clone https://github.com/onepadio/onepad-ce.git
cd onepad-ce
npm install
npm start
```

### Scripts

```bash
npm start              # Development
npm run build          # Production build
npm run package        # Package current platform
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux (.deb / AppImage)
npm run dev:kiosk      # Kiosk mode (fullscreen shell)
npm run lint
npm run test
```

### Layout

```
onepad-ce/
├── src/
│   ├── main/           # Electron main process
│   └── renderer/       # React UI (Spaces, grid, webviews)
├── assets/
├── release/            # Build output
├── ROADMAP.md
└── package.json
```

---

## How we compare

| | OnePad | ChromeOS Flex | Arc / Station / Wavebox |
| --- | --- | --- | --- |
| Simple home screen | Yes | Yes | Browser / multi-app shell |
| Keep existing OS | **Yes (app)** | No — installs over the disk | Yes |
| Optional bootable image | Planned (Ubuntu kiosk) | Yes (the product) | No |
| Open source | AGPLv3 | No | No |
| Local-first / no Google account | Yes | Google account | Varies |
| Platforms | Mac, Windows, Linux | x86_64 PCs | Varies |

---

## Roadmap

Product direction, open core, Ubuntu kiosk stack, and phased plan: **[ROADMAP.md](./ROADMAP.md)**.

Short version: earn the home screen → sync the same desktop across devices → optional remote apps → curated publish for indie web apps → fleet/lab images. No kernel fork, no coin, no “we are building an OS.”

---

## Contributing

Issues and PRs welcome.

1. Fork → feature branch → PR
2. Match existing TypeScript / React style
3. Keep the CE home screen free; paid features belong in proprietary cloud services, not behind AGPL paywalls

See [CONTRIBUTING.md](./CONTRIBUTING.md) when present. Use clear commit messages and keep changes focused.

---

## License

**GNU Affero General Public License v3.0 (AGPL-3.0-or-later).**

```
Copyright (C) 2026 Sigma Technologies Ltd
```

See [LICENSE](./LICENSE).

AGPL keeps CE free, blocks silent proprietary forks of the shell, and supports dual licensing. **Commercial licensing:** [contact@onepad.io](mailto:contact@onepad.io).

---

## Community

- Website: [onepad.io](https://onepad.io)
- Discord: [discord.gg/onepad](https://discord.gg/onepad)
- GitHub: [onepadio/onepad-ce](https://github.com/onepadio/onepad-ce)
- Email: [contact@onepad.io](mailto:contact@onepad.io)

Support: star the repo, file issues, try it as your home screen for a week and tell us whether you still Alt-Tab to Chrome.

---

## Acknowledgments

Built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), [Redux Toolkit](https://redux-toolkit.js.org/), [Dexie.js](https://dexie.org/), and the open-source community.

---

**Sigma Technologies Ltd** · [onepad.io](https://onepad.io) · [contact@onepad.io](mailto:contact@onepad.io)
