# Construction Quote App

React/Vite construction quoting, CRM, scheduling, contractor, and analysis app.

## Web

```sh
npm run dev
npm run build
npm run lint
```

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
