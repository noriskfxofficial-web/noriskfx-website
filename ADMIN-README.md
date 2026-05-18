# Admin Dashboard

Open `/admin` after deploy.

Default test login:

```text
Username: admin
Password / code: NFX-2026
```

Change `ADMIN_PASSWORD` and `JWT_SECRET` in Netlify environment variables before public launch.

What you can edit:

- Website hero copy
- Glassy statistics
- TradingView ticker symbols
- Weekly economic calendar events
- Leads
- Content drafts
- Partner notes
- Compliance checklist
- JSON import/export backup

When `/api/health` works, edits are saved to Netlify Blobs and visible to all visitors after refresh.
