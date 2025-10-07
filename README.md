## Quiz Backend (Express + MongoDB)

Backend lives in `backend/`.

1. Create a MongoDB Atlas cluster and get the connection string.
2. Copy `.env.example` to `.env` and fill values:

```
MONGO_URI=...
MONGO_DB=gfgquiz
CORS_ORIGIN=http://localhost:5173,https://dev0302.github.io
PORT=8080
```

3. Install and run locally:

```
cd backend
npm i
npm run dev
```

4. Seed teams once (create `scripts/seedTeams.js` to insert your teams):

```
npm run seed
```

5. Deploy (Render/Railway): set env vars from `.env`. Start command: `npm start`.

## Frontend API Config

Create `.env` in project root:

```
VITE_API_BASE_URL=https://<your-backend-domain>
```

Then `npm run dev` and open `/quiz`.

Dev here, 22 Aug,2025 -> vite + react setup with tailwind installed.

npm installed : react-router-dom