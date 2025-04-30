# PresentX

## Install

Run
```
npm install
```

## Setup prerequisites
Create ./packages/server/.env file and fill in your details,
```
ASTRA_DB_TOKEN='AstraCS:...'
ASTRA_DB_API_ENDPOINT='https://db-uuid-db-region.apps.astra.datastax.com'
ASTRA_DB_NAMESPACE='default_keyspace'
CLIENT_URL='http://localhost:3000'
JWT_SECRET='YouSeecret!'
```

## Run

### Start backend
Run 
```
npm run dev:server
```

### Start frontend
```
npm run dev:app -- --clean
```

Navigate to http://localhost:3000 and start enjoying the app!

---
