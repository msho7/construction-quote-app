# Construction Quote App

React/Vite construction quoting, CRM, scheduling, contractor, and analysis app.

## Web

```sh
npm run dev
npm run build
npm run lint
```

## MongoDB

Create `.env.local` from `.env.example`, then set your private MongoDB Atlas URI. For MongoDB Atlas, use the connection string from **Database > Connect > Drivers** and replace `USERNAME`, `PASSWORD`, and `CLUSTER`.

```sh
copy .env.example .env.local
npm run db:ping
```

Keep `.env.local` private. It is ignored by git.

Required setting:

```sh
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
```

Optional settings:

```sh
MONGODB_DB=construction_quote_app
PORT=3001
HOST=127.0.0.1
CLIENT_ORIGIN=http://localhost:5173
```

To use the in-app Server page, run the API server and Vite app in two terminals:

```sh
npm run server
npm run dev
```

Saved app data is stored in MongoDB in the `app_state` collection. The app keeps localStorage updated as a fallback cache, but quotes, price list, room templates, customers, contractors, and settings sync through the API server when `npm run server` is running.

## Mobile

The app is wrapped with Capacitor for iOS and Android.

```sh
npm run mobile:sync
```

Open the native projects:

```sh
npm run mobile:ios
npm run mobile:android
```

Useful direct commands:

```sh
npx cap sync
npx cap open ios
npx cap open android
```

Before Android builds, install a JDK and Android Studio. Before iOS release builds, open the iOS project in Xcode and set your signing team/bundle settings.
