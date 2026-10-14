# Azure GPX API

This service belongs to the I Ride Mallorca repository and runs on the existing Azure App Service named `iridemallorca`.

## Required App Service settings

Set these values in **Azure Portal → iridemallorca → Settings → Environment variables**:

- `DATABASE_URL`: PostgreSQL connection string for `iridemallorcadb`
- `AZURE_STORAGE_CONNECTION_STRING`: connection string for `iridemallorcastorage`
- `GPX_CONTAINER`: `gpx`
- `CORS_ORIGINS`: `https://www.iridemallorca.com`
- `PG_SSL`: `true`

The API creates the `gpx` Blob container and the PostgreSQL `tracks` table on its first successful start.

## GitHub deployment

The workflow `.github/workflows/deploy-azure-api.yml` deploys this directory after a push to `main`.
Create the repository secret `AZURE_WEBAPP_PUBLISH_PROFILE` from **Azure Portal → iridemallorca → Overview → Download publish profile**.

## Frontend setting

In Netlify set:

```
VITE_API_URL=https://iridemallorca-d6e5h4f5bvdah4hs.westeurope-01.azurewebsites.net
```

Then trigger a production deploy. The Track Share and Partner Finder GPX upload, list, preview metadata and download links will use the Azure API.
