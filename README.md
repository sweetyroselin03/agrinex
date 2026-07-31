# 🌾 AgriNex Enterprise AI Application

![AgriNex Build & Test Pipeline](https://github.com/sweetyroselin03/agrinex/actions/workflows/agrinex-ci.yml/badge.svg)
![Backend Pytest Suite](https://img.shields.io/badge/Backend%20Coverage->80%25-brightgreen.svg)
![Web Vitest Suite](https://img.shields.io/badge/Web%20Tests-154%20Passed-emerald.svg)
![Mobile Vitest Suite](https://img.shields.io/badge/Mobile%20Tests-72%20Passed-blue.svg)
![Python Version](https://img.shields.io/badge/Python-3.10%20%7C%203.11-blue.svg)
![Node Version](https://img.shields.io/badge/Node.js-v20-green.svg)

> **AgriNex** is a unified Smart Agriculture ecosystem connecting farmers with AI-driven crop disease scanner tools, direct expert consultations, community social feeds, commodity mandi price trends, real-time localized weather updates, and peer messaging.

---

## 🏛️ Project Architecture & Tech Stack

- **Backend**: FastAPI (Python 3.11), PyTorch (CNN Leaf Disease Classifier - MobileNetV3), Async SQLAlchemy, PostgreSQL / SQLite, Pydantic V2, Uvicorn.
- **Web Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Zustand, Playwright E2E, Vitest.
- **Mobile Frontend**: Expo SDK 54, React Native, NativeWind, Expo Camera/ImagePicker, Lucide Icons, Vitest.
- **CI/CD Pipeline**: GitHub Actions, Semgrep SAST, Gitleaks, Trivy, Pytest Coverage, Playwright, GitHub Pages Dashboard Deployment.

---

## 🧪 Comprehensive Automated Testing Pipeline

AgriNex enforces strict quality controls across every pull request and push:

### 1. ⚙️ Backend Test Suite (`pytest`)
- **Authentication & JWT**: Verifies user signup, token generation, password hashing, and token invalidation.
- **OTP & Password Recovery**: Validates email OTP verification flow.
- **Social & Community**: User search, post creation, likes, comments, and follower graph.
- **Direct Messaging**: Conversation creation, message dispatch, read receipts, pin/mute/archive features.
- **AI Scanner & AgriGPT**: Validates CNN leaf image diagnosis and LLM advisory engine.
- **Coverage Requirement**: Enforces $>80\%$ test coverage on core backend modules.

### 2. 🌐 Web Test Suite (`Vitest` & `Playwright`)
- **Unit & Component Testing**: 154 component unit tests for UI widgets, forms, and Zustand state.
- **Playwright E2E Journeys**: 15 automated browser scenarios testing registration, login, scanner photo uploads, community interactions, and mobile drawer responsiveness.

### 3. 📱 Mobile Test Suite (`Vitest` & Expo Build Verification)
- **Expo Build Check**: Runs `npx expo prebuild` to verify native Android configuration.
- **Mobile Unit & Integration**: 72 tests covering authentication stores, keyboard handling, camera/gallery permissions, and chat feeds.

### 4. 🔒 Security & SAST Audit
- **Semgrep SAST**: OWASP Top 10 and secret leakage analysis.
- **Gitleaks**: Scans commit history for unencrypted secrets and tokens.
- **Trivy Filesystem Scan**: Evaluates third-party dependency vulnerabilities.

---

## 🚀 Running Tests Locally

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v --cov=app --cov-report=html
```

### Web Unit & Component Tests
```bash
cd frontend
npm test
```

### Web Playwright E2E Tests
```bash
cd frontend
npx playwright test
```

### Mobile Unit & Integration Tests
```bash
cd mobile
npm test
```
