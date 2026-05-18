# Deployment

This is the Netlify-ready v17 package.

## Recommended production path

Use Git deploy or Netlify CLI. This lets Netlify install dependencies and bundle `netlify/functions/api.js`.

### Git deploy

1. Unzip this folder.
2. Push it to GitHub.
3. Netlify > Add new site > Import from Git.
4. Use:
   - Build command: `npm run build`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
5. Add environment variables:
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `JWT_EXPIRES_SECONDS`
   - `BLOB_STORE`
6. Deploy.

### CLI deploy

```bash
npm install
npx netlify deploy --prod
```

## After deploy

Open:

```text
/api/health
/admin
```

If `/api/health` returns JSON, the backend is live.
