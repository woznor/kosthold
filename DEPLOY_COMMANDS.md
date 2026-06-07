# Deploy Commands

## Firebase Hosting
```powershell
npm run firebase:login
npm run firebase:deploy
```

See [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) for Auth, Firestore, and data import setup.
See [`GITHUB_ACTIONS_SETUP.md`](./GITHUB_ACTIONS_SETUP.md) for automatic deploys from `main`.

## 1) Push code to `main`
```powershell
git checkout main
git add -A
git commit -m "Update app"
git push origin main
```

## 2) Build and deploy site to `gh-pages` (from `dist`)
```powershell
npm install
npm run build

git branch -D gh-pages
git subtree split --prefix dist -b gh-pages
git push -f origin gh-pages:gh-pages
git branch -D gh-pages
```

## 3) If `gh-pages` delete/split errors happen
```powershell
git push -f origin --delete gh-pages
git branch -D gh-pages
npm run build
git subtree split --prefix dist -b gh-pages
git push -f origin gh-pages:gh-pages
git branch -D gh-pages
```
