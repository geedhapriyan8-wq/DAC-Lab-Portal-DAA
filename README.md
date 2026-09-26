# DAC Lab Portal

Lab portal for two programmes: **DSA** and the **Data Analytics Academy (DAA)**. Students pick a
programme when they register and only see that programme's labs. Accounts, progress, badges and
quiz grading are handled by a small API on Vercel with a Neon Postgres database.

| Folder | What's in it |
| --- | --- |
| `public/` | The website (everything Vercel serves) |
| `api/` | API routes (Vercel Functions) |
| `lib/` | Server code shared by the routes, including the quiz answer key |
| `tests/` | API tests (`npm test`) |
| `tools/` | Maintainer scripts; see [tools/README.md](tools/README.md) |

## Deploying on Vercel

1. **Import the repo.** In Vercel choose *Add New → Project*, pick this GitHub repo and click
   *Deploy*. No build settings are needed; `vercel.json` tells Vercel to serve `public/`.
2. **Add the database.** Open the project, go to *Storage → Create Database → Neon*, and connect
   it to the project. This adds the `DATABASE_URL` setting automatically. The tables are created
   on the first request.
3. **Add two environment variables** under *Settings → Environment Variables*:
   - `SESSION_SECRET`: a long random string (at least 32 characters). It signs login cookies and
     proof hashes. Changing it signs everyone out.
   - `ADMIN_USER_IDS`: the User IDs allowed to use the admin page, separated by commas, for example
     `alice,bob`. The accounts must be registered through the normal sign-up page.
4. **Redeploy** (*Deployments → ⋯ → Redeploy*) so the new settings take effect.

## Admin page

Admins see an **Admin** link in their dashboard sidebar (or open `/admin.html`). From there they can:

- see every student's progress, badges and last activity
- move a student between DSA and DAA (progress in the old programme is kept)
- reset a password: the student gets a temporary password and must choose a new one at sign-in
- delete an account and all its progress

## Security notes

- Passwords are hashed with scrypt; sessions are signed, HTTP-only cookies that last 7 days.
- After 10 wrong passwords an account is locked for 15 minutes.
- Quizzes are graded on the server. The answers never reach the browser, and the correct options
  are only shown after a student passes.
- A student can only submit labs from their own programme.

## Local development

```bash
npm install
npm run dev
```

The site runs at http://localhost:5173 with a local database in `.dev-db/` (the User ID `admin`
is an admin locally). Run the API tests with `npm test`.
