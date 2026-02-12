# GocchillcuaBeu (ophim-web)

Web xem phim: React + Vite (frontend), Express (backend), API OPhim. Theme hồng, cá nhân hóa.

## Chạy development

```bash
npm install
npm run dev:all   # backend :5000, frontend Vite (mở http://localhost:5173)
```

## Build production

```bash
npm run build
# Server tự phục vụ dist/ khi chạy npm run server
```

Biến môi trường: xem `server/.env.example` (PORT, OPHIM_BASE_URL, IMAGE_BASE_URL).

## Chạy bằng Docker

```bash
docker compose up -d
# Mở http://localhost:5000
```

## Deploy lên server

Xem **[DEPLOY.md](./DEPLOY.md)** — hướng dẫn chi tiết: Docker, VPS thủ công, Railway/Render, Nginx + domain.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
