# Publishing Dobbelen to the App Store and Play Store

Everything the *web app* needs is already in place. The native wrapper is the one thing still
to do. This folder holds the native store files ready to drop in, plus the answers the store
forms ask for.

## 1. Fill in `src/config/appInfo.js`

Replace every value marked `CHANGE ME` (developer name, support email, website). The Settings
screen, Privacy Policy, Terms and Support page all read from that file. Have a lawyer or a
generator double-check the legal texts in `src/i18n/legal.js` — they are a solid starting point
for an app that collects nothing, not legal advice.

## 2. Host the web build so the public URLs exist

Both stores require a **Privacy Policy URL**, and Google needs it inside the app too. The app
serves the pages itself:

| Page | URL |
| --- | --- |
| Privacy Policy | `https://<your site>/#privacy` |
| Terms of Service | `https://<your site>/#terms` |
| Support | `https://<your site>/#support` |

Deploy `npm run build` (`dist/`) to any static host (Netlify, Vercel, GitHub Pages…).

## 3. Add the native wrapper (Capacitor)

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init Dobbelen com.dobbelen.app --web-dir dist
npm run build
npx cap add ios
npx cap add android
```

Generate the icons and launch screens from `resources/`:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate
```

`resources/` contains `icon.png` (1024×1024, no transparency — Apple rejects alpha),
`icon-foreground.png` + `icon-background.png` (Android adaptive icon), and `splash.png` /
`splash-dark.png` (2732×2732).

Then copy in the native config:

- **iOS**: copy `store/ios/PrivacyInfo.xcprivacy` to `ios/App/App/` (add it to the Xcode target),
  and add the keys from `store/ios/Info.plist.additions.xml` to `ios/App/App/Info.plist`.
  That includes `ITSAppUsesNonExemptEncryption = false`.
- **Android**: add the `VIBRATE` permission from `store/android/AndroidManifest.additions.xml`.

The app uses **no permissions that need an explanation** (no camera, location, notifications,
etc.), so there are no `NS…UsageDescription` strings to write. If you add such a feature later,
add its description first, or Apple rejects the build.

After each web change: `npm run build && npx cap sync`.

## 4. Store listing answers

### Age rating
The logo shows beer glasses, and the Terms mention drinking responsibly.
- **Apple**: "Alcohol, Tobacco, or Drug Use or References" → *Infrequent/Mild* (results in 12+).
  No gambling (no real money), no user-generated content, no web access.
- **Google (IARC questionnaire)**: reference to alcohol → answer honestly; no gambling, no purchases.

### Privacy answers
- **App Store → App Privacy**: **Data Not Collected**. No tracking.
- **Play Console → Data safety**: no data collected, no data shared; no encryption in transit needed
  (the app makes no network requests). Privacy policy URL as above.
- **Export compliance (Apple)**: standard encryption only → "No" to non-exempt encryption.

### Listing text

**Name**: Dobbelen

English
- Subtitle (30 chars): `Dice bluffing game for friends`
- Description: Dobbelen is a dice bluffing game for friends. Roll in secret, claim a number that
  beats the last one — bluffing is allowed — and pass the phone. Believe it, or check it and find
  out who was lying. Includes Doorschuiven and Blind for extra chaos. One phone, no account, no
  ads, works offline. In English and Dutch.
- Keywords: `dice,bluff,party,friends,game,pass and play,dobbelen,liar`

Nederlands
- Ondertitel: `Bluf-dobbelspel voor vrienden`
- Beschrijving: Dobbelen is een bluf-dobbelspel voor vrienden. Gooi in het geheim, zeg een getal dat
  hoger is dan het vorige — bluffen mag — en geef de telefoon door. Geloof het, of check het en
  ontdek wie er loog. Met Doorschuiven en Blind voor extra chaos. Eén telefoon, geen account,
  geen advertenties, werkt offline. In het Engels en Nederlands.
- Trefwoorden: `dobbelen,bluffen,dobbelspel,vrienden,feest,kroegspel,drankspel,pass and play`

### Screenshots
Take them from the running app at phone size: iPhone 6.9" (1320×2868) and 6.5" (1284×2778),
plus Play Store phone screenshots (min 320px, 16:9 to 9:16). Suggested screens: setup, roll,
claim, judge, reveal, settings.

## 5. Accounts and fees

- Apple Developer Program: US$99 / year — <https://developer.apple.com/programs/>
- Google Play Console: US$25 one-time — <https://play.google.com/console>
