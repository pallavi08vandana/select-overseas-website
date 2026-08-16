# Select Overseas Client-Ready Website + Firebase Lead Management

This package merges the actual Select Overseas public website with the Firebase lead-management/admin system.

## What was merged

- The richer public website from `select-overseas-website`
- Firebase Firestore lead submission
- Firebase Email/Password management login
- Admin role check using `users/{uid}`
- Management dashboard with search/filter
- Lead status updates
- Assigned-to, follow-up date and management notes
- Official Select Overseas logo asset
- Product-specific enquiry forms for:
  - Germany Opportunity Card
  - Germany EU Blue Card
  - Ireland Critical Skills Employment Permit
  - Netherlands Highly Skilled Migrant
  - New Zealand Employment Pathway
  - European Employment Pathway

## Firebase configuration

The included `js/firebase-config.js` is already configured for the Firebase web app shown in the provided screenshots.

Do NOT add Firebase service-account private keys to this project.

## Firebase Console requirements

You have already created:

1. Firebase Web App
2. Cloud Firestore
3. Email/Password Authentication
4. Management user
5. Firestore `users/{management-uid}` document with:
   - role = admin
   - active = true

Publish the included `firestore.rules` in:
Firebase Console -> Firestore -> Rules

## Run locally

Use VS Code + Live Server. Do not open the HTML using `file://`.

1. Open this folder in VS Code.
2. Install Live Server.
3. Right-click `index.html`.
4. Select "Open with Live Server".

Public site:
http://127.0.0.1:5500/

Management:
http://127.0.0.1:5500/admin/login.html

## First test

1. Open the public website.
2. Open a product's "Check Eligibility" form.
3. Submit a test lead.
4. Firebase Console -> Firestore -> Data.
5. You should see a `leads` collection automatically created.
6. Open `/admin/login.html`.
7. Sign in using the management account.
8. Confirm the test lead appears in the dashboard.
9. Open the lead and update status/notes/follow-up.

## Important CV note

The current form records whether a CV was selected and its filename, but it does NOT upload the CV file to Firebase Storage.

For production CV uploads, add Firebase Storage with strict file type/size rules or use a trusted backend.

## Lead security

Public visitors can create valid leads but cannot read, update or delete leads.

Only an authenticated user whose Firestore `users/{uid}` document has:
- role = admin
- active = true

can read/update/delete leads.

## Production next steps

- Firebase Storage for CVs
- Employee accounts and role-based access
- Lead assignment to employees
- Follow-up reminders
- Lead activity history
- CSV/Excel export
- Duplicate lead detection
- Email/WhatsApp notifications
- Custom-domain hosting
