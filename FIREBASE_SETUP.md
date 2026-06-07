# Firebase Setup

Project id: `kosthold-4fdd3`

## Console Setup

1. Create a web app in Firebase Console.
2. Enable Authentication provider:
   - Authentication -> Sign-in method -> Email/Password
   - Enable regular email/password sign-in.
3. Add authorized domains:
   - `localhost`
   - `kosthold-4fdd3.web.app`
   - `kosthold-4fdd3.firebaseapp.com`
4. Create Cloud Firestore in production mode.
## Bootstrap First Admin

Create a Firebase service-account key, then run:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
$env:FIREBASE_PROJECT_ID="kosthold-4fdd3"
npm run bootstrap:admin -- your@email.com
```

To also set or update the password:

```powershell
$env:ADMIN_PASSWORD="your-password"
npm run bootstrap:admin -- your@email.com
```

This creates or updates:

- Firebase Auth user for the email
- `allowlist/{your-lowercase-email}`
- `users/{auth-uid}` with `role: "admin"`

Manual Firestore shape, if needed:

```json
{
  "email": "your@email.com"
}
```

```json
{
  "role": "admin"
}
```

After that, the Admin tab can manage the allowlist.

## Local Env

Create `.env.local` from `.env.example` and fill in the Firebase web app config:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=kosthold-4fdd3
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_BASE_PATH=/
```

## Deploy

```bash
npm run firebase:login
npm run firebase:deploy
```

## Import Current Data

Create a Firebase service-account key, then run:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
$env:FIREBASE_PROJECT_ID="kosthold-4fdd3"
npm run import:firestore
```

This imports:

- `public/meals.json` into `meals/{id}`
- `public/ingredient-matching.json` into `appData/ingredientMatching`

The large `public/matvaretabellen.json` file remains static for now.
