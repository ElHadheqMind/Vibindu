# Vibindu

<p align="center">
  <img src="logo.png" alt="Vibindu Logo" width="200"/>
</p>

**Vibindu** is a modern, web-based GRAFCET/SFC editor with AI-powered assistance for designing industrial automation sequences. Built for engineers, students, and automation professionals.

## ✨ Features

- 🎨 **Visual GRAFCET Editor** - Intuitive drag-and-drop interface for creating GRAFCET diagrams
- 🤖 **AI Agents** - Intelligent assistance for diagram generation and optimization
- ⚡ **Real-time Compilation** - Instant validation and SFC code generation
- 📝 **GRAFSCRIPT Language** - Text-based programming for rapid diagram prototyping
- 🔀 **Full SFC Support** - AND/OR divergences, action qualifiers (N, S, R, D, L, P), transitions
- 💾 **Cloud Storage** - User-scoped project persistence with Flydrive
- 🎯 **IEC 61131-3 Compliant** - Industry-standard SFC action types and structures

## 🏗️ Architecture

```
vibindu/
├── grafcet-editor/     # React + TypeScript frontend
├── grafcet-backend/    # AdonisJS backend API
├── grafcet-agents/     # Python AI agents
└── documentation/      # User guides and references
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker (optional)

### Development Setup

**Windows:**
```bash
./setup.bat
./start-dev.bat
```

**Linux/Mac:**
```bash
./setup.sh
./start-dev.sh
```

### Using Docker

```bash
docker-compose up
```

## 📚 Documentation

- [User Interface Overview](documentation/ui-overview.md)
- [Action Qualifiers Guide](documentation/action-qualifiers.md)
- [Transition Editor](documentation/transition-editor.md)
- [GRAFSCRIPT Language](documentation/grafscript/GRAFSCRIPT.md)
- [Compiler Validation Rules](documentation/compiler-rules.md)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Vite, Zustand |
| Backend | AdonisJS, Prisma, SQLite |
| AI Agents | Python, LangChain |
| Storage | Flydrive (Local/S3) |

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

Contact the maintainers for contribution guidelines.

---

<p align="center">
  Made with ❤️ by the Vibindu Team
</p>

