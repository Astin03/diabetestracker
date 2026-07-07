<div align="center">

# 🩺 Diabetes Tracker

**A modern, full-stack diabetes management platform — track glucose, medications, and daily health with clarity.**

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

*Inspired by modern CGM reader UIs — FreeStyle Libre & Dexcom style*

[Features](#-features) · [Quick Start](#-quick-start) · [API](#-api-overview) · [Credits](#-credits)

</div>

---

## ✨ Features

| Module | What it does |
|--------|--------------|
| 📊 **Glucose Tracking** | Pre/post meal readings, random tests, tags, auto-categorization (low / normal / high) |
| 📖 **Logbook** | Daily, weekly & monthly views, timeline, TIR, estimated A1C, interactive charts |
| 💊 **Medications** | Flexible schedules, daily checklist, taken / missed / pending status |
| 📅 **Calendar** | Glucose, meds & appointments in one unified day view |
| 🏠 **Dashboard** | Summary widgets, weekly chart, alerts & streak tracking |
| 📤 **Export** | CSV, PDF reports, JSON backup & restore |
| 📱 **PWA** | Installable app with offline-friendly caching |

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  Frontend   Vue 3 · Vite · Tailwind CSS 4 · Pinia      │
│             ApexCharts · Vue Router · PWA               │
├─────────────────────────────────────────────────────────┤
│  Backend    Node.js · Express.js · JWT Auth             │
├─────────────────────────────────────────────────────────┤
│  Database   MySQL 8+                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **MySQL** 8+

### 1. Clone & install

```bash
git clone https://github.com/Astin03/diabetestracker.git
cd diabetestracker

npm run install:all
```

### 2. Database setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm run migrate
```

### 3. Run development servers

**Backend** (port `5000`):

```bash
cd backend
npm run dev
```

**Frontend** (port `5173`, proxies `/api` to backend):

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📦 Production Build

```bash
cd frontend && npm run build
cd ../backend && npm start
```

Express serves the built frontend from `frontend/dist` for single-origin deployment.

---

## 🌐 Deploy on cPanel

1. Create a **MySQL database** and user in cPanel.
2. Upload the project or deploy via Git.
3. In **Setup Node.js App**:
   - Application root: `backend`
   - Startup file: `src/index.js`
   - Environment variables from `backend/.env.example`
4. Run migration once via SSH:
   ```bash
   cd backend && npm install && npm run migrate
   ```
5. Build frontend:
   ```bash
   cd frontend && npm install && npm run build
   ```
6. Set `CORS_ORIGIN` to your domain (e.g. `https://yourdomain.com`).

---

## 🔌 API Overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register a new account |
| `POST` | `/api/auth/login` | Login & receive JWT |
| `GET` | `/api/dashboard` | Dashboard summary data |
| `GET` / `POST` | `/api/glucose` | List / create glucose logs |
| `GET` | `/api/glucose/summary` | Stats & chart data |
| `GET` / `POST` | `/api/medications` | Medications CRUD |
| `GET` | `/api/medications/checklist/today` | Today's medication checklist |
| `POST` | `/api/medications/checklist/:id/taken` | Mark dose as taken |
| `GET` | `/api/calendar/:date` | Day detail view |
| `GET` | `/api/export/csv` | CSV download |
| `GET` | `/api/export/backup` | JSON backup |

> All protected routes require: `Authorization: Bearer <token>`

### Default glucose thresholds

| Level | Range |
|-------|-------|
| 🔴 Low (hypoglycemia) | below 70 mg/dL |
| 🟢 Normal | 70 – 180 mg/dL |
| 🟠 High (hyperglycemia) | above 180 mg/dL |

*Thresholds are configurable per user.*

---

## 📁 Project Structure

```
diabetestracker/
├── backend/          # Express API, migrations, services
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── migrations/
├── frontend/         # Vue 3 SPA
│   └── src/
│       ├── views/
│       ├── components/
│       └── layouts/
└── package.json      # Root scripts (install:all, dev, build)
```

---

## 🙏 Credits

<table>
  <tr>
    <td align="center">
      <strong>Author & Maintainer</strong><br/>
      <a href="https://github.com/Astin03">Astin03</a>
    </td>
    <td align="center">
      <strong>Repository</strong><br/>
      <a href="https://github.com/Astin03/diabetestracker">diabetestracker</a>
    </td>
    <td align="center">
      <strong>UI Inspiration</strong><br/>
      FreeStyle Libre · Dexcom CGM readers
    </td>
  </tr>
</table>

Built with ❤️ for people managing diabetes day to day.

> *This project was designed and developed with AI-assisted tooling to accelerate architecture, UI polish, and documentation.*

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if you find it useful!**

</div>
