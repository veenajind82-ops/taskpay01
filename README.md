# TaskPay Dashboard

Build a complete dark-themed responsive web app named 'TaskPay' integrated with Supabase for authentication and database operations.



1. AUTHENTICATION & LOGIN FLOW:

- Create Sign In and Create Account tabs.

- Replace email login with a 10-digit Mobile Phone Number input (+91 prefix) and Password field.

- In Create Account, include Username and optional Invitation Code fields.

- On successful signup/login, save/fetch user profile in Supabase 'profiles' table.



2. TOP BAR & INVITATION CARD:

- Show top header with App Name 'PayMSGPro', Wallet Balance badge (₹0.00), and User Profile icon.

- Add an Invitation Code box at the top right showing the user's referral code with a 'Copy' button (Default code: DB1339D2).



3. MAIN DASHBOARD HOME PAGE:

- Create summary stats cards:

  * WALLET BALANCE (Default: ₹0.00)

  * EARNED TODAY (Default: ₹0.00)

  * TOTAL SMS SENT (Default: 0)

  * ACTIVE WHATSAPP (Default: 0)

- Add quick action navigation cards linking to 'SMS Tasks' and 'WhatsApp Tasks'.



4. NAVIGATION BAR:

- Include a fixed bottom navigation bar (mobile-friendly) with icons and text:

  * Dashboard

  * SMS Tasks

  * WhatsApp

  * Wallet

  * Admin

  * Sign Out



Ensure clean dark UI matching dark navy background (#0f172a), green primary accents, responsive layouts, and connected Supabase state management.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://taskpay01.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa06e86d-fbb5-4890-bd7f-08056870ccdd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
