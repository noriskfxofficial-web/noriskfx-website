# Deploy No Risk FX v17 on Netlify

## Best method: Git deploy

1. Unzip this folder.
2. Upload/push the folder to a GitHub repository.
3. Netlify > Add new site > Import from Git.
4. Build command: `npm run build`
5. Publish directory: `.`
6. Functions directory: `netlify/functions`
7. Add environment variables:
   - `ADMIN_USER=admin`
   - `ADMIN_PASSWORD=your-strong-password`
   - `JWT_SECRET=long-random-secret`
   - `JWT_EXPIRES_SECONDS=28800`
   - `BLOB_STORE=noriskfx-admin`
8. Deploy.
9. Visit `/api/health`; if it returns JSON, the backend is live.
10. Visit `/admin` and login.

## CLI method

```bash
npm install
npx netlify deploy --prod
```

## Notes

- The admin saves website copy, stats, ticker symbols, leads, content, calendar events, partners, and compliance checklist to Netlify Blobs.
- The weekly news section no longer uses a broken MQL5 iframe. It shows an editable weekly event table and links to Tradays as the source.
- TradingView ticker is embedded with the official TradingView ticker-tape script.
