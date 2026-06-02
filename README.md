# OnePad Community Edition

<div align="center">

**Your Chromebook Experience, Anywhere**

A powerful, open-source desktop workspace manager that brings the simplicity of Chrome OS to Windows, Mac, and Linux.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/sigma-tech/onepad-ce)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-orange.svg)](https://github.com/sigma-tech/onepad-ce/releases)

[Website](https://onepad.io) • [Documentation](https://docs.onepad.io) • [Community](https://discord.gg/onepad) • 

</div>

---

## ✨ What is OnePad?

OnePad transforms any computer into a powerful, organized workspace manager. Think of it as bringing the **Chromebook experience** to your existing hardware—without buying new devices or switching operating systems.

**Perfect for:**
- 🏢 **Remote workers** managing multiple client contexts
- 💻 **Developers** juggling different projects and environments
- 🎓 **Students** organizing academic resources
- 🚀 **Entrepreneurs** managing multiple ventures
- 🔒 **Privacy-conscious users** seeking alternatives to Google's ecosystem

---

## 🚀 Key Features

### 🗂️ **Multi-Workspace Organization**
Separate your work, personal, and side projects into distinct workspaces. Each workspace maintains its own apps, tabs, and sessions.

### 📱 **Application Launcher**
Beautiful LaunchPad interface for quick access to all your web applications. Search, organize into categories, and customize your workspace.

### ⭐ **Favorites & Pinning**
Pin important apps to keep them always visible. Mark favorites for quick access across all workspaces.

### 🎨 **Drag & Drop Customization**
Reorder your apps with intuitive drag-and-drop. Your layout persists across sessions.

### 🏪 **Built-in App Store**
Discover productivity tools through our curated app store. Browse by category, read reviews, and add apps with one click.

### 🔐 **Privacy-First**
Local-first architecture with optional cloud sync. Your data stays on your device unless you choose otherwise.

### 🌐 **Browser Integration**
Embedded web views for seamless app usage. Manage tabs, sessions, and authentication all in one place.

### 🎯 **Custom Icons**
Upload custom icons or fetch from URLs. Make your workspace truly yours.

### 🔍 **Smart Search**
Quickly find any app or workspace with intelligent search.

### 🌙 **Dark Mode**
Beautiful themes for day and night work sessions.

---

## 📥 Installation

### Download Pre-built Binaries

**macOS:**
```bash
# Intel Macs
curl -L https://onepad.io/download/mac-x64 -o OnePad.dmg

# Apple Silicon (M1/M2/M3)
curl -L https://onepad.io/download/mac-arm64 -o OnePad.dmg
```

**Windows:**
```powershell
# Download installer
curl -L https://onepad.io/download/windows -o OnePad-Setup.exe
```

**Linux:**
```bash
# Debian/Ubuntu (.deb)
curl -L https://onepad.io/download/linux-deb -o onepad.deb
sudo dpkg -i onepad.deb

# AppImage (universal)
curl -L https://onepad.io/download/linux-appimage -o OnePad.AppImage
chmod +x OnePad.AppImage
./OnePad.AppImage
```

### Package Managers

**macOS (Homebrew):**
```bash
brew install --cask onepad
```

**Windows (Chocolatey):**
```powershell
choco install onepad
```

**Linux (Snap):**
```bash
snap install onepad
```

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and npm 7+
- **Git**
- Platform-specific build tools:
  - **macOS:** Xcode Command Line Tools
  - **Windows:** Visual Studio Build Tools
  - **Linux:** build-essential

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/sigma-tech/onepad-ce.git
cd onepad-ce

# Install dependencies
npm install

# Start development server
npm start
```

### Available Scripts

```bash
npm start              # Start in development mode
npm run dev            # Alias for start
npm run build          # Build for production
npm run package        # Package for current platform
npm run package:mac    # Package for macOS
npm run package:win    # Package for Windows
npm run package:linux  # Package for Linux
npm run lint           # Run ESLint
npm run test           # Run tests
```

### Project Structure

```
onepad-ce/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   ├── mainWindow.ts  # Window management
│   │   └── ...
│   └── renderer/          # React frontend
│       ├── components/    # UI components
│       ├── store/         # Redux state management
│       ├── services/      # Business logic
│       ├── repository/    # Data access layer (IndexedDB)
│       └── index.tsx      # Renderer entry point
├── assets/               # Icons, images, etc.
├── release/              # Build output
├── package.json
└── electron.vite.config.ts
```

---

## 🤝 Contributing

We love contributions! OnePad Community Edition is open source and welcomes improvements from the community.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** and commit: `git commit -m 'Add amazing feature'`
4. **Push to your fork:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style (ESLint config)
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful and constructive in discussions

### Development Guidelines

- Use **TypeScript** for type safety
- Follow **functional component** patterns in React
- Keep components small and reusable
- Use **Redux Toolkit** for state management
- Write **clean, self-documenting code**

**See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.**

---

## 🏗️ Architecture

**Frontend:**
- Electron 33+
- React 18 with TypeScript
- Redux Toolkit for state management
- Dexie for IndexedDB (local database)
- TailwindCSS + Bootstrap for styling

**Backend (Local):**
- IndexedDB for data persistence
- Electron Store for user preferences
- Local-first architecture


---

## 🆚 OnePad vs Alternatives

| Feature | OnePad | Chromebook | Station | Wavebox |
|---------|--------|------------|---------|---------|
| **Cross-platform** | ✅ Win/Mac/Linux | ❌ Chrome OS only | ✅ | ✅ |
| **Offline-first** | ✅ Full functionality | ⚠️ Limited | ✅ | ✅ |
| **Open source** | ✅ AGPLv3 | ❌ | ❌ | ❌ |
| **Privacy-focused** | ✅ Local-first | ❌ Google tracking | ⚠️ | ⚠️ |
| **Multiple workspaces** | ✅ | ✅ Virtual desks | ✅ | ✅ |
| **Custom icons** | ✅ | ❌ | ⚠️ | ⚠️ |
| **App marketplace** | 🔜 Coming | ❌ | ❌ | ❌ |
| **Price** | Free (open source) | $200-1000 hardware | $6-10/mo | $10-20/mo |

---

## 📜 License

OnePad Community Edition is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

```
Copyright (C) 2026 Sigma Technologies Ltd

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.
```

**See [LICENSE](./LICENSE) for the complete license text.**

### Why AGPLv3?

We chose AGPLv3 to:
- ✅ Keep the community edition free and open source
- ✅ Prevent competitors from creating proprietary forks
- ✅ Ensure cloud service providers share their improvements
- ✅ Support a sustainable dual-licensing business model

**Commercial licensing** is available for organizations that cannot comply with AGPLv3. Contact us at [contact@onepad.io](mailto:contact@onepad.io).

---

## 🌟 Support the Project

### Ways to Help

- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/sigma-tech/onepad-ce/issues)
- 💡 **Suggest features** in [Discussions](https://github.com/sigma-tech/onepad-ce/discussions)
- 🔧 **Contribute code** through Pull Requests
- 📖 **Improve documentation**
- 💬 **Help others** in the community
- 🎨 **Share your workspace** designs
- 📣 **Spread the word** on social media

### Sponsorship

Support ongoing development:
- **GitHub Sponsors:** [github.com/sponsors/sigma-tech](https://github.com/sponsors/sigma-tech)
- **Open Collective:** [opencollective.com/onepad](https://opencollective.com/onepad)

---

## 🌐 Community

Join our growing community:

- **Website:** [onepad.io](https://onepad.io)
- **Discord:** [discord.gg/onepad](https://discord.gg/onepad)
- **Twitter:** [@onepad_io](https://twitter.com/onepad_io)
- **GitHub Discussions:** [github.com/sigma-tech/onepad-ce/discussions](https://github.com/sigma-tech/onepad-ce/discussions)
- **Email:** [contact@onepad.io](mailto:contact@onepad.io)

---

## 🙏 Acknowledgments

OnePad Community Edition is built with these amazing open source projects:

- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://react.dev/) - UI framework
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS

Special thanks to our contributors and the open source community!

---

## 📞 Contact

**Sigma Technologies Ltd**
- Email: [contact@onepad.io](mailto:contact@onepad.io)
- Website: [onepad.io](https://onepad.io)
- GitHub: [@sigma-tech](https://github.com/sigma-tech)

---

<div align="center">

**Made with ❤️ by Sigma Technologies Ltd and the OnePad Community**

[⬆ back to top](#onepad-community-edition)

</div>
