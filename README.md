# No Risk FX v17 — Netlify Ready

This package is prepared for Netlify with:

- Static No Risk FX website
- `/admin` dashboard
- Netlify Functions API under `/api/*`
- Netlify Blobs persistence for website edits, admin leads, content, weekly calendar, partners, and compliance checklist
- TradingView ticker tape embed
- Tradays weekly calendar source button + editable weekly event table

## Important deploy note
For the backend/admin saving to work, deploy this folder through Netlify Git deploy or Netlify CLI so Netlify can install dependencies and bundle `netlify/functions/api.js`.

Drag-and-drop is fine for static pages, but Netlify Functions are safest through Git/CLI deploy.

## Netlify environment variables
Set these in Netlify > Site configuration > Environment variables:

```text
ADMIN_USER=admin
ADMIN_PASSWORD=change-this-password
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_SECONDS=28800
BLOB_STORE=noriskfx-admin
```

Default test login before changing env vars:

```text
Username: admin
Password / code: NFX-2026
```

## Test after deploy

- Website: `/`
- Admin: `/admin`
- API health: `/api/health`

If `/api/health` returns JSON, the backend is running.
