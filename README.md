# Convex Credit Engine

A professional structured credit analytics platform for the Indian market, modeling PTCs (Pass Through Certificates), ABS (Asset-Backed Securities), and MBS (Mortgage-Backed Securities) cash flow waterfalls.

## 🚀 Overview

The Convex Credit Engine provides high-fidelity financial modeling for structured debt instruments. It allows analysts to:
- **Model Asset Pools**: Simulate principal and interest payments for large credit portfolios.
- **Configure Tranche Structures**: Define senior, mezzanine, and equity tranches with specific seniority and coupon rates.
- **Simulate Scenarios**: Stress-test deals with varied CPR (Prepayment), CDR (Default), and Severity assumptions.
- **Visualize Cash Flows**: High-performance interactive charts for pool performance and tranche-level waterfall distributions.
- **AI-Powered Insights**: Integrated Gemini AI analyst to audit deal structures and suggest optimizations.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [Google Gemini GenAI](https://ai.google.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## 📦 Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/convexica/convex-credit-engine.git
   cd convex-credit-engine
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and add your Gemini API Key.
   ```bash
   cp .env.example .env.local
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is optimized for deployment on **Vercel** or **Netlify**.

### Deploy to Vercel
1. Connect your GitHub repository to Vercel.
2. Ensure the Build Command is `npm run build` and Output Directory is `dist`.
3. Add `VITE_GEMINI_API_KEY` to Environment Variables in the Vercel dashboard.

### Deploy to Netlify
1. Connect your repository to Netlify.
2. Use Build settings: `npm run build`, Directory: `dist`.
3. Add environment variables in Site settings > Environment variables.

## ⚖️ License

Private - (c) Convexica Analytics

---
*Maintained by [Convexica](https://convexica.com)*
