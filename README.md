
# SHIVA SHAKTHI Jewellers - Gold Assistant

A premium Next.js application for jewelry calculation, order management, and live rate tracking.

## Deployment Guide

### 1. GitHub Preparation
1. Create a new repository on GitHub.
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### 2. Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. In the **Environment Variables** section, add the keys from `.env.example`:
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Important**: Under Project Settings > Functions, set the "Function Timeout" to at least **60 seconds** to accommodate large report generations.

### 3. Firebase Setup
Ensure your Firestore Security Rules are deployed. The rules are located in `firestore.rules`. Ensure `raghuvarama66@gmail.com` or `komaravellirakesh4@gmail.com` are the users you log in with to gain admin access.

## Features
- **Live Rates**: Real-time 24K Gold and Silver pricing.
- **Advanced Calculator**: Handles exchange, making charges, and KDM.
- **Invoicing**: High-resolution PDF generation and thermal printer support.
- **Admin Dashboard**: Full history, search highlighting, and pending notes.
- **Multi-lingual**: Support for English, Hindi, and Telugu.
