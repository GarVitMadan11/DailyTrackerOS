# Assets

This directory contains image assets for the Expo app.

## Required Files

Before building for production, add the following files:

| File | Size | Description |
|------|------|-------------|
| `icon.png` | 1024×1024 | App icon |
| `splash.png` | 1284×2778 | Splash/loading screen |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `favicon.png` | 196×196 | Web favicon |
| `notification-icon.png` | 96×96 | Android notification icon (white on transparent) |

## Development

During local development (`npm start`), Expo uses placeholder icons if the files above are missing.  
You can use the [Expo icon generator](https://docs.expo.dev/develop/user-interface/splash-screen/) to create correctly-sized assets from a single source image.
