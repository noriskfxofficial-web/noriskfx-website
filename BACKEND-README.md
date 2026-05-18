# No Risk FX Backend — Netlify Functions

The old `server.js` JSON-file backend has been replaced by a Netlify Function:

```text
netlify/functions/api.js
```

Routes:

```text
GET  /api/health
POST /api/auth/login
GET  /api/site-config
GET  /api/public/weekly-events
GET  /api/admin/state
PUT  /api/admin/state
PUT  /api/admin/site-config
GET  /api/admin/export
POST /api/admin/import
```

Storage:

```text
Netlify Blobs store: noriskfx-admin
Blob key: database.json
```

Admin login comes from environment variables. Change them before launch.
