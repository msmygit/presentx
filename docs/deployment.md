# PresentX Deployment Guide

This document describes how to deploy PresentX to different environments using GitHub Actions.

## Environment Configuration

PresentX uses environment variables for configuration in both the app and server components. This allows for easy deployment to different environments (development, staging, production) with appropriate configuration values.

### App Configuration Variables

The frontend app uses the following environment variables:

- `VITE_API_BASE_URL` - Base URL for the API server (e.g., `https://api.presentx.example.com`)
- `VITE_APP_BASE_URL` - Base URL for the app itself (e.g., `https://presentx.example.com`)

### Server Configuration Variables

The backend server uses the following environment variables:

- `PORT` - Port on which the server runs (defaults to 8080)
- `CLIENT_URL` - The URL of the client application (defaults to `http://localhost:3000` for local development)
- `NODE_ENV` - Environment name (e.g., development, production)
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRES_IN` - JWT token expiration time (e.g., "1h")
- `ASTRA_DB_API_ENDPOINT` - DataStax Astra DB API endpoint (e.g., `https://<db-uuid>-<db-region>.apps.astra.datastax.com`)
- `ASTRA_DB_TOKEN` - DataStax Astra DB token (the one starting with `AstraCS:`)
- `ASTRA_DB_KEYSPACE` - DataStax Astra DB keypace (defaults to `default_keyspace`)

## GitHub Actions Workflow

### Setting up GitHub Actions for Multi-Environment Deployment

1. Create GitHub Secrets for each environment:

   Go to your GitHub repository → Settings → Secrets and Variables → Actions → New Repository Secret

   Add the following secrets for each environment (dev, staging, prod):

   ```
   DEV_API_URL
   DEV_APP_URL
   STAGING_API_URL
   STAGING_APP_URL
   PROD_API_URL
   PROD_APP_URL
   ```

   Also add database and authentication secrets:

   ```
   DEV_ASTRA_DB_API_ENDPOINT
   DEV_ASTRA_DB_TOKEN
   STAGING_ASTRA_DB_API_ENDPOINT
   STAGING_ASTRA_DB_TOKEN
   PROD_ASTRA_DB_API_ENDPOINT
   PROD_ASTRA_DB_TOKEN
   JWT_SECRET
   ```

2. Create a GitHub Actions workflow file:

   Create a file at `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy PresentX

on:
  push:
    branches:
      - main
      - staging
      - development
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'development'
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  determine-env:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
    steps:
      - id: set-env
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [ "${{ github.ref }}" == "refs/heads/staging" ]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
          fi
  
  build-and-deploy:
    needs: determine-env
    runs-on: ubuntu-latest
    environment: ${{ needs.determine-env.outputs.environment }}
    
    env:
      NODE_ENV: ${{ needs.determine-env.outputs.environment }}
      # App environment variables based on the environment
      VITE_API_BASE_URL: ${{ needs.determine-env.outputs.environment == 'production' && secrets.PROD_API_URL || needs.determine-env.outputs.environment == 'staging' && secrets.STAGING_API_URL || secrets.DEV_API_URL }}
      VITE_APP_BASE_URL: ${{ needs.determine-env.outputs.environment == 'production' && secrets.PROD_APP_URL || needs.determine-env.outputs.environment == 'staging' && secrets.STAGING_APP_URL || secrets.DEV_APP_URL }}
      
      # Server environment variables based on the environment
      PORT: 8080
      CLIENT_URL: ${{ needs.determine-env.outputs.environment == 'production' && secrets.PROD_APP_URL || needs.determine-env.outputs.environment == 'staging' && secrets.STAGING_APP_URL || secrets.DEV_APP_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
      JWT_EXPIRES_IN: "1h"
      ASTRA_DB_API_ENDPOINT: ${{ needs.determine-env.outputs.environment == 'production' && secrets.PROD_ASTRA_DB_API_ENDPOINT || needs.determine-env.outputs.environment == 'staging' && secrets.STAGING_ASTRA_DB_API_ENDPOINT || secrets.DEV_ASTRA_DB_API_ENDPOINT }}
      ASTRA_DB_TOKEN: ${{ needs.determine-env.outputs.environment == 'production' && secrets.PROD_ASTRA_DB_TOKEN || needs.determine-env.outputs.environment == 'staging' && secrets.STAGING_ASTRA_DB_TOKEN || secrets.DEV_ASTRA_DB_TOKEN }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build app
        run: npm run build
      
      # Add your deployment steps here
      # For example, deploy to AWS S3, Vercel, Netlify, etc.
```

## Local Development

For local development:

1. Copy `.env.example` to `.env` in both the app and server directories
2. Update the variables in each `.env` file as needed
3. Run the development servers:

   ```
   # In one terminal
   cd packages/server
   npm run dev
   
   # In another terminal
   cd packages/app
   npm run dev
   ```

## Containerizing the Application

For containerized deployment, a `Dockerfile` is provided for both the app and server. You can build and run the containers as follows:

```bash
# Build and run the server
docker build -t presentx-server ./packages/server
docker run -p 8080:8080 --env-file ./packages/server/.env presentx-server

# Build and run the app
docker build -t presentx-app ./packages/app
docker run -p 3000:80 --env-file ./packages/app/.env presentx-app
```

For production deployment, consider using Docker Compose or Kubernetes to manage the containers.