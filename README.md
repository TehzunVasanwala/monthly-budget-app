# Monthly Budget App

A mobile-friendly budget tracker with month history, savings dashboard, SMS import, and Android app preparation.

## Features

- Track expenses month by month
- Set both monthly budget and monthly income
- Add notes to expenses
- Tag transactions by bank account, debit card, credit card, UPI, wallet, or cash
- Paste bank SMS alerts and import parsed transactions
- Review selected-month totals, savings, and daily average
- See last month performance and total savings across months
- Export your data as CSV
- Works offline after first load
- Can be installed on mobile as a PWA

## Run locally

Use VS Code Live Server or any static server to open the app locally.

## Android app setup

This project now includes:

- [package.json](C:\Users\Bacancy\Desktop\Montly Budget\package.json)
- [capacitor.config.json](C:\Users\Bacancy\Desktop\Montly Budget\capacitor.config.json)

To create the real Android app, install these first on your Windows system:

1. Node.js
2. Java JDK
3. Android Studio

Then run in the project folder:

```powershell
npm install
npx cap add android
npx cap sync android
npx cap open android
```

## Important about automatic SMS reading

The GitHub Pages version cannot read your phone SMS inbox.

For true automatic bank SMS reading, the Android app will need:

1. native Android SMS permission
2. SMS inbox reading logic
3. parser rules for your bank/card messages
4. review and approval before saving entries

## Put it online

This is a static app, so you can host it easily on:

- Netlify Drop
- GitHub Pages
- Vercel

Important: if you host it online now, the app opens from anywhere, but each browser keeps its own local data. To sync the same data across all devices, the next upgrade would be cloud storage such as Firebase.
