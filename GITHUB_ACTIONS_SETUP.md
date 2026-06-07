# GitHub Actions Firebase Deploy

The workflow in `.github/workflows/deploy.yml` deploys Firebase Hosting whenever `main` is pushed.

## Required GitHub Secret

Add this repository secret:

- `FIREBASE_SERVICE_ACCOUNT_KOSTHOLD_4FDD3`

Value: a Firebase service-account JSON for project `kosthold-4fdd3`.

Do not use the service-account key that was pasted into chat. Revoke that key first, then generate a new one.

## Required GitHub Variables

Add these repository variables from your Firebase web app config:

- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Required GitHub Secret For Web Config

Add this repository secret:

- `VITE_FIREBASE_API_KEY`

The Firebase web API key is not the same kind of secret as a service-account key, but storing it as a GitHub secret keeps the workflow output cleaner.

## Where To Add These

GitHub repo -> Settings -> Secrets and variables -> Actions.

Use:

- `Secrets` for `FIREBASE_SERVICE_ACCOUNT_KOSTHOLD_4FDD3` and `VITE_FIREBASE_API_KEY`
- `Variables` for the other `VITE_FIREBASE_*` values

After these are set, every push to `main` runs:

```bash
npm ci
npm run build
Firebase Hosting deploy to live
```
