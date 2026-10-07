# Deploying GyanKendra

Three services, in this order: **GitHub** → **Render** (API) → **Vercel**
(client). The order matters, because each step needs a URL from the one before.

Total time: about 20 minutes. All three have free tiers.

---

## Before you start

Make sure your secrets are not about to be committed. From the project root:

```bash
git status --porcelain | grep -E "\.env$" || echo "clean: no .env files staged"
```

That must print `clean`. `server/.env` and `client/.env` hold your Mongo URI,
JWT secret and Gemini key, and are already listed in `.gitignore`.

---

## Step 1 — Push to GitHub

**1.1** Create an empty repository at <https://github.com/new>.
Name it `gyankendra`. **Do not** tick "Add a README", "Add .gitignore" or
"Choose a license" — the repo must be empty or the first push will be rejected.

**1.2** Copy the HTTPS URL it shows you. It looks like
`https://github.com/<your-username>/gyankendra.git`.

**1.3** In a terminal, from the project root:

```bash
git remote add origin https://github.com/<your-username>/gyankendra.git
git branch -M main
git push -u origin main
```

If GitHub asks for a password, it wants a **personal access token**, not your
account password. Create one at
<https://github.com/settings/tokens> → *Generate new token (classic)* → tick
the **repo** scope → copy it and paste it as the password.

**1.4** Refresh the repository page. You should see `client/`, `server/`,
`README.md` and `DEPLOYMENT.md`, and **no `.env` files**. If you see a `.env`,
stop and tell me before going further.

---

## Step 2 — Open MongoDB Atlas to the internet

Render connects from a machine whose address you cannot predict, so Atlas has
to accept connections from anywhere.

**2.1** Go to <https://cloud.mongodb.com> → your cluster → **Network Access**
in the left sidebar.

**2.2** **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) →
Confirm.

> On a paid tier you would restrict this to Render's outbound addresses. On the
> free tier, `0.0.0.0/0` is the normal approach — your database is still
> protected by its username and password.

---

## Step 3 — Deploy the API to Render

**3.1** Sign in at <https://render.com> with your GitHub account.

**3.2** **New** → **Web Service** → connect your `gyankendra` repository.

**3.3** Fill in the form:

| Field | Value |
|---|---|
| Name | `gyankendra-api` |
| Region | whichever is closest to you |
| Branch | `main` |
| **Root Directory** | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

> **Root Directory `server` is the one people miss.** Without it Render builds
> the repository root and cannot find the server.

**3.4** Scroll to **Environment Variables** and add these. Copy the values from
your local `server/.env` — open it with `cat server/.env`.

| Key | Value |
|---|---|
| `MONGODB_URI` | your Atlas connection string |
| `JWT_SECRET_KEY` | your secret (see the note below) |
| `GEMINI_API_KEY` | your Gemini key |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `http://localhost:5173` — a placeholder, corrected in step 5 |

Do **not** set `PORT`. Render provides it.

> **Change your JWT secret before going live.** The current one is 8
> characters, which is short enough to brute-force — and anyone who guesses it
> can forge a token for any account. Generate a proper one with
> `openssl rand -hex 32` and use that value here.

**3.5** **Create Web Service** and wait for the build. When it finishes the log
should end with:

```
Connected to MongoDB (kb)
GyanKendra server listening on port 10000
```

**3.6** Copy the service URL from the top of the page — something like
`https://gyankendra-api.onrender.com`. Check it works:

```bash
curl https://gyankendra-api.onrender.com/api
```

You should get `{"message":"GyanKendra API running"}`.

---

## Step 4 — Deploy the client to Vercel

**4.1** Sign in at <https://vercel.com> with GitHub.

**4.2** **Add New** → **Project** → import your `gyankendra` repository.

**4.3** Configure:

| Field | Value |
|---|---|
| Framework Preset | Vite |
| **Root Directory** | `client` — click *Edit* and pick the folder |
| Build Command | `npm run build` (the default) |
| Output Directory | `dist` (the default) |

**4.4** Expand **Environment Variables** and add one:

| Key | Value |
|---|---|
| `VITE_API_URL` | your Render URL, e.g. `https://gyankendra-api.onrender.com` |

No trailing slash. The client appends `/api` itself.

**4.5** **Deploy**. When it finishes, copy the URL — something like
`https://gyankendra.vercel.app`.

---

## Step 5 — Let the API trust the client (CORS)

Right now the API rejects the browser's requests, because it only allows
`localhost`. Fix that:

**5.1** Render → your service → **Environment** → edit `CLIENT_URL`.

**5.2** Set it to your exact Vercel URL:

```
https://gyankendra.vercel.app
```

No trailing slash, and `https` not `http`. It must match exactly — this is the
single most common cause of "it worked locally but not deployed".

**5.3** Save. Render redeploys automatically (about a minute).

---

## Step 6 — Check it end to end

Open your Vercel URL and:

1. The landing page loads with its counters.
2. **Sign up** for an account → you land on the board.
3. **Create a topic** → it appears, and the stat tiles update.
4. Reload the page → the topic is still there (it is in Atlas, not the browser).
5. **Transcripts** → paste a YouTube link → **Generate .txt** downloads a file.
6. **Generate Notes** → a PDF downloads.

If any step fails, see the next section.

---

## When something does not work

**The page loads but nothing saves, and the browser console shows a CORS
error.** `CLIENT_URL` on Render does not match your Vercel URL exactly. Check
for a trailing slash or `http` vs `https`.

**Every API call returns a network error.** `VITE_API_URL` on Vercel is wrong
or missing. Note that Vite bakes environment variables in **at build time** —
after changing it you must redeploy, not just restart.

**The first request after a while takes 50 seconds.** Render's free tier spins
services down after 15 minutes of inactivity, and the next request wakes it.
This is normal; the paid tier removes it.

**Render's log says `querySrv ECONNREFUSED`.** Atlas is refusing the
connection — recheck Network Access in step 2.

**Render's log says the server exited immediately.** A required environment
variable is missing; the log names it.

**Notes say "not configured".** `GEMINI_API_KEY` is missing on Render. The rest
of the app works without it.

**Transcripts fail on Render but work locally.** Expected, and worth knowing
before you demo it: YouTube treats datacenter addresses far more harshly than
home connections, so caption requests from Render may be blocked where yours
are not. The rest of the app is unaffected.

---

## After the first deploy

Both services watch your GitHub repository, so from then on:

```bash
git add .
git commit -m "describe your change"
git push
```

Render and Vercel each rebuild on their own. Nothing else to do.
