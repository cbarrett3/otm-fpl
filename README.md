# FPL Draft Wizard

Monorepo root with web app in `web/`.

- Local dev: `cd web && npm ci && npm run dev`
- Production build: `cd web && npm run build && npm start -p 3000`

Deploy notes (Vercel):
- Set Root Directory to `web/` or use `vercel.json` provided
- Install Command: `cd web && npm ci`
- Build Command: `cd web && npm run build`
- Output: `.next`
