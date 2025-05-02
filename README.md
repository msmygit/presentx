# PresentX

![Intro](./asserts/Introducing_PresentX.mp4)

## Install

Run
```
npm install
```

## Setup prerequisites
Create or Edit `./packages/server/.env` file and fill in [the details](https://docs.datastax.com/en/astra-db-serverless/get-started/quickstart.html#create-a-database-and-store-your-credentials) in the below format:

<details>
<summary>Expand/Collapse</summary>

```
ASTRA_DB_TOKEN='AstraCS:...'
ASTRA_DB_API_ENDPOINT='https://<db-uuid>-<db-region>.apps.astra.datastax.com'
ASTRA_DB_KEYSPACE='default_keyspace'
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
- Register a new user as a *Presenter*
- Login with existing user credentials
- Create a new presentation with multiple page types (multiple choice, polls, scales, ranking, open-ended, etc.)
- Join a presentation as an *Audience* with an access code
---
