# OnePad

<div align="center">

**Conquer Tab Chaos. Amplify Productivity.**

The free, open-source productivity browser that transforms overwhelming tabs and 30,000+ SaaS tools into organized, efficient workspaces.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/sigma-tech/onepad-ce)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-orange.svg)](https://github.com/sigma-tech/onepad-ce/releases)

[Website](https://onepad.io) • [Documentation](https://docs.onepad.io) • [Community](https://discord.gg/onepad) • 

</div>

---

## ✨ What is OnePad?

OnePad is a productivity browser built to solve the modern digital chaos problem. With **30,000+ SaaS tools** and **193 billion active websites**, traditional browsers create overwhelming tab chaos that kills productivity. OnePad transforms this chaos into organized **Spaces** (workspaces), giving you instant access to all your tools without the anxiety and time loss.

**Perfect for:**
- 🏢 **Remote & hybrid workers** drowning in SaaS tools and browser tabs
- 💻 **Developers** juggling multiple projects with countless web apps
- 🎓 **Students** managing research, courses, and online resources
- 🚀 **Entrepreneurs** running multiple businesses with different tool stacks
- 📊 **Professionals** who value time, organization, and mental clarity
- 🔒 **Privacy-conscious users** who want local-first data control

---

## 🎯 The Problem We Solve

Modern work and remote/hybrid environments have created a productivity crisis:

- ⏰ **Time Loss** - Hours wasted every week hunting through tabs and switching between tools
- 🧠 **Mental Overload** - Anxiety and stress from managing thousands of SaaS tools across dozens of tabs  
- 🌪️ **Disorganized Chaos** - Multiple browser windows, lost bookmarks, and context switching that kills focus
- 📉 **Productivity Drain** - More time spent organizing than actually working

**The stats are staggering:**
- 30,080+ SaaS companies (and growing daily)
- 193 billion active websites to manage
- 28% of the world population now works remotely
- Traditional browsers weren't built for this level of complexity

**OnePad is the solution.** Purpose-built for the modern productivity challenge.

---

## 🚀 Key Features

### 🎯 **Organize with Spaces**
Transform tab chaos into organized workspaces. Separate work, personal projects, and hobbies into distinct Spaces that keep everything in its place. No more hunting through dozens of tabs.

### 🏪 **One-Click App Access via App Store**
Browse our curated app store and add SaaS tools instantly. No more hunting through bookmarks or endless tabs to find what you need. Your most-used tools are always one click away.

### ⚡ **Streamlined Workflows**
Beautiful LaunchPad interface puts all your apps at your fingertips. Search, organize by category, and access everything instantly. Focus on work, not tab management.

### 📌 **Quick Access to Favorites**
Pin your most-used apps for instant access. Reduce time searching and get back to being productive. Your workflow, optimized.

### 🎨 **Custom Organization**
Drag-and-drop to arrange apps your way. Your personalized layout saves automatically, so you always know where to find things. Make OnePad truly yours.

### 🔐 **Privacy-First Design**
Your data stays on your device. Local-first architecture means you control your information without sacrificing productivity. No cloud tracking or data collection.

### 🌐 **All Apps in One Place**
Stop switching between browser windows. Manage all your SaaS tools, tabs, and sessions in one unified interface. Embedded web views for seamless app usage.

### 🔍 **Intelligent Search**
Find any app or workspace instantly with smart search. Stop wasting time clicking through tabs. Get to what you need in seconds.

### 🎯 **Persistent Sessions**
Your workspaces remember your layout and sessions. Pick up exactly where you left off, every time. No more setup time when you restart.

### 🌙 **Beautiful Themes**
Dark mode and custom themes for comfortable all-day productivity. Your eyes will thank you.

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

| Feature | OnePad | Arc Browser | Station | Wavebox | Regular Browser |
|---------|--------|-------------|---------|---------|-----------------|
| **Purpose-built for productivity** | ✅ | ⚠️ Partial | ✅ | ✅ | ❌ |
| **Organized Spaces/Workspaces** | ✅ | ⚠️ Profiles | ✅ | ✅ | ❌ Tab chaos |
| **Built-in App Store** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cross-platform** | ✅ Win/Mac/Linux | ⚠️ Mac only | ✅ | ✅ | ✅ |
| **Open source** | ✅ AGPLv3 | ❌ | ❌ | ❌ | ⚠️ Varies |
| **Privacy-focused** | ✅ Local-first | ⚠️ | ⚠️ | ⚠️ | ⚠️ Varies |
| **Offline-first** | ✅ Full functionality | ✅ | ✅ | ✅ | ✅ |
| **Custom organization** | ✅ Drag & drop | ⚠️ Limited | ⚠️ | ⚠️ | ❌ |
| **Price** | **Free** (open source) | Free | $6-10/mo | $10-20/mo | Free |

**Why OnePad?** The only free, open-source productivity browser that solves tab chaos with organized Spaces and a built-in app store.

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

Help us fight tab chaos and improve productivity for everyone.

### Ways to Help

- ⭐ **Star this repository** - Show your support and help others discover OnePad
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/sigma-tech/onepad-ce/issues)
- 💡 **Suggest features** that would boost your productivity in [Discussions](https://github.com/sigma-tech/onepad-ce/discussions)
- 🔧 **Contribute code** through Pull Requests
- 📖 **Improve documentation** - Help others get started faster
- 💬 **Help others** in the community forums
- 🎨 **Share your workspace** designs and productivity tips
- 📣 **Spread the word** - Help remote workers escape tab chaos

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

*Stop wasting time in tab chaos. Start being productive with OnePad.*

[⬆ back to top](#onepad)

</div>
