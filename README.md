# PresentX

![Intro](./asserts/Introducing_PresentX.mp4)

## Install

Run
```
npm install
```

## Setup prerequisites
Create or Edit `./packages/server/.env` file and fill in your details with the below

<details>
<summary>Expand/Collapse</summary>

```
ASTRA_DB_TOKEN='AstraCS:...'
ASTRA_DB_API_ENDPOINT='https://db-uuid-db-region.apps.astra.datastax.com'
ASTRA_DB_NAMESPACE='default_keyspace'
CLIENT_URL='http://localhost:3000'
JWT_SECRET='YouSeecret!'
```
</details>

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

## Features
- Register a new user as a Presenter
- Login with existing user credentials
- Join a presentation as an Audience with an access code
---
