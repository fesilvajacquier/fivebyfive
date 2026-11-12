# Five by Five

A tiny 5×5 strength training log (workouts A/B: squat, bench, row / squat, overhead press, deadlift) that runs entirely in the browser.

- Data is stored in IndexedDB on the device. Export/import a JSON backup from **Settings** (on phones, "Share to Drive…" sends it to Google Drive).
- Installable PWA, works offline.
- Progression: +2.5 kg (deadlift +5 kg) after a session where every set hits 5 reps; after 3 failed sessions at the same weight, deload 10%.

```sh
npm install
npm run dev
npm test
```

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.
