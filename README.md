# 🧠 GyanKendra

> **A personal knowledge board for people who keep learning.**

Topics live as push-pin sticky notes you can star, sort into collections, fill with links and Markdown notes, and revise on a spaced-repetition schedule — plus a built-in tool that turns any YouTube lecture into a transcript or AI-written study notes.

Built on **MongoDB, Express, React and Node** with MVC on the server and JWT authentication. Every account sees only its own data.

---

## 📑 Table of contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [File structure](#file-structure)
- [Tech stack](#tech-stack)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Running and testing](#running-and-testing)
- [API reference](#api-reference)
- [How the pieces work](#how-the-pieces-work)
- [Deployment](#deployment)

---

# ✨ Capabilities

## 📌 The board

- **Sticky-note topics** — pastel cards with push pins, favourite stars, a per-card menu (edit, duplicate, change status, delete), in grid or list view.
- **Six themes**, four statuses (To Learn, Learning, Completed, Needs Revision) and **user-defined categories** — the six built-ins are defaults, and you can name your own from the topic form.
- **Collections** — custom groupings; renaming one follows through to every topic that uses it, deleting one unlabels them without deleting anything.
- **Global search** — `⌘K` / `Ctrl+K` across titles, descriptions, notes and tags.
- **Light and dark mode**, remembered per browser.

## 📝 The topic workspace

- **Resources** with automatic link-type detection — paste a LeetCode, YouTube, GitHub, docs or PDF link and the type is inferred from the host.
- **Markdown notes editor** with a formatting toolbar, write/preview tabs and debounced autosave.
- **Inline checklist** with per-item add, tick and delete.

## 🔁 Revision

- **Spaced repetition** computed on the server: a new topic resurfaces in 2 days, then 3 → 7 → 14 → 30 → 60 as you mark it reviewed.
- **Revision tracker** listing everything due today or flagged for revision.

## 🎥 Transcripts and AI notes

- **Transcript generator** — paste a YouTube link, get the captions as a `.txt` (with optional timestamps) saved to your machine.
- **Structured notes** — the same transcript summarised by **Gemini Flash** into a summary, key points, sections, terms and takeaways, typeset as a **PDF**.
- **History** of the videos you processed. The transcript and notes text are never stored; only the video id, title and a few counts.

## 🌐 Elsewhere

- **Quick notes drawer** — a scratchpad for fleeting thoughts, with one-click *Convert to Topic*.
- **Analytics** — completion rate, weekly learning velocity, activity feed.
- **Landing page** with the transcript tool usable right there, and live counters.

---

# 🏗️ Architecture

```text
┌──────────────────────┐         ┌───────────────────────────────┐
│  React (Vite)        │  HTTPS  │  Express (MVC)               │
│                      │ ──────► │                               │
│  • Landing           │  JWT in │  routes → controllers → models│
│  • Board + workspace │  Bearer │         ↑                     │
│  • Transcript studio │  header │    middleware                 │
└──────────────────────┘         │    (auth, rate limit, errors) │
                                 └───────┬───────────┬───────────┘
                                         │           │
                                 ┌───────▼─────┐  ┌──▼──────────────┐
                                 │  MongoDB    │  │ External        │
                                 │  (Mongoose) │  │ • YouTube       │
                                 │             │  │ • Gemini Flash  │
                                 └─────────────┘  └─────────────────┘
```

### 🔄 Request path

A request enters a router, which applies `authenticateToken` (and a rate limiter where relevant), then hands off to a controller. Controllers hold the logic and talk to Mongoose models. Anything thrown lands in one central error handler that converts it to `{ message }`.

### 💾 Where state lives

All persistent data is in MongoDB. The browser keeps only the JWT and the dark-mode preference in `localStorage`. The board's React state is a cache of what the API returned, updated optimistically and rolled back on failure.

### 🚫 What is deliberately not stored

Transcript text and generated notes are streamed to the browser and forgotten — only metadata is kept as history.

---

# 📁 File structure

```text
gyankendra/
├── package.json                 root: runs both apps with concurrently
├── README.md
│
├── server/                      Express API, MVC
│   ├── server.js                entry point: connect to Mongo, then listen
│   ├── app.js                   the Express app (exported so tests mount it)
│   ├── .env.example             copy to .env and fill in
│   │
│   ├── config/
│   │   └── db.js                single Mongoose connection, DNS workaround,
│   │                            connection retry
│   ├── models/                  schemas + anything intrinsic to the data
│   │   ├── User.js              password hashing lives here, not in a controller
│   │   ├── Topic.js             topics with embedded resources + checklist
│   │   ├── QuickNote.js
│   │   ├── Collection.js
│   │   ├── Activity.js
│   │   └── Transcript.js        history only — never the transcript text
│   │
│   ├── controllers/             one per resource; all logic lives here
│   │   ├── authController.js
│   │   ├── topicController.js
│   │   ├── resourceController.js    resources + checklist (embedded docs)
│   │   ├── quickNoteController.js
│   │   ├── collectionController.js
│   │   ├── activityController.js
│   │   ├── statsController.js       public landing-page counters
│   │   └── transcriptController.js  transcripts + AI notes
│   │
│   ├── routes/                  one router per resource
│   │   ├── main.router.js       mounts all of the below under /api
│   │   ├── auth.router.js       rate limited by IP
│   │   ├── topic.router.js
│   │   ├── quickNote.router.js
│   │   ├── collection.router.js
│   │   ├── activity.router.js
│   │   ├── stats.router.js      the only public router
│   │   └── transcript.router.js rate limited per user and globally
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    verifies the bearer token → req.user
│   │   ├── rateLimit.js         sliding-window limiter
│   │   └── errorHandler.js      one place that renders errors as JSON
│   │
│   ├── utils/
│   │   ├── errors.js            ApiError + asyncHandler
│   │   ├── revision.js          the spaced-repetition schedule
│   │   ├── youtube.js           link parsing, oEmbed metadata, captions
│   │   ├── gemini.js            the notes pipeline + model fallback chain
│   │   ├── pdf.js               typesets the notes as a PDF
│   │   └── seed.js              demo data
│   │
│   └── tests/
│       └── api.test.js          25 integration + unit tests
│
└── client/                      React + Vite
    ├── index.html
    ├── vite.config.js           dev proxy to the API
    ├── tailwind.config.js
    ├── vercel.json              SPA rewrite so client routes resolve
    │
    └── src/
        ├── main.jsx
        ├── App.jsx              providers + routes
        ├── index.css
        │
        ├── api/
        │   ├── client.js        axios instance, token handling, 401 recovery
        │   └── endpoints.js     every URL the app calls, in one place
        │
        ├── context/
        │   ├── AuthContext.jsx  session
        │   ├── ThemeContext.jsx dark mode
        │   └── ToastContext.jsx notifications
        │
        ├── hooks/
        │   ├── useBoardData.js  all board reads/writes + optimistic updates
        │   └── useCountUp.js    the landing-page counters
        │
        ├── pages/
        │   ├── Landing.jsx      public home page
        │   ├── AuthPage.jsx     login and signup
        │   └── Board.jsx        the app shell and its views
        │
        ├── components/
        │   ├── StickyTopicCard.jsx      a topic as a sticky note
        │   ├── CompactTopicRow.jsx      the list-view row
        │   ├── TopicDetailWorkspace.jsx resources, checklist, notes editor
        │   ├── TopicFormModal.jsx       create/edit, incl. new categories
        │   ├── AddResourceModal.jsx     with link-type preview
        │   ├── QuickNotesDrawer.jsx
        │   ├── GlobalSearchPalette.jsx  ⌘K
        │   ├── AnalyticsDashboard.jsx
        │   ├── TranscriptStudio.jsx     the Transcripts tab
        │   ├── HomeTranscriptTool.jsx   the same tool on the landing page
        │   ├── StatsBand.jsx            animated counters
        │   ├── decor.jsx                underlines, arrows, sparkles, blobs
        │   ├── ToolArtwork.jsx           hero illustrations
        │   ├── BoardArtwork.jsx
        │   ├── ProtectedRoute.jsx
        │   └── EmptyState.jsx
        │
        ├── constants/index.js    themes, categories, statuses
        └── utils/
            ├── format.jsx        relative time, resource icons
            └── markdown.jsx      the small Markdown renderer
```

---

# 🧰 Tech stack

| Layer | Choice |
|:---|:---|
| **Database** | MongoDB Atlas, Mongoose schemas |
| **Server** | Node.js, Express, MVC |
| **Auth** | JWT bearer tokens, bcrypt hashing |
| **AI** | Google Gemini Flash (structured output) |
| **PDF** | pdfkit |
| **Captions** | youtube-transcript + YouTube oEmbed |
| **Client** | React 18, Vite, React Router, Axios |
| **Styling** | Tailwind CSS, lucide-react |
| **Dev** | concurrently, node:test |

---

# 🚀 Local setup

```bash
npm run install:all
```

Then copy the server template and fill it in:

```bash
cp server/.env.example server/.env
```

---

# 🔐 Environment variables

## `server/.env`

| Variable | Required | What it is |
|:---|:---:|:---|
| `MONGODB_URI` | **yes** | Atlas connection string |
| `JWT_SECRET_KEY` | **yes** | long random string — `openssl rand -hex 32` |
| `PORT` | no | defaults to 5000 |
| `CLIENT_URL` | no | CORS allow-list; must match the deployed client exactly |
| `JWT_EXPIRES_IN` | no | defaults to `7d` |
| `GEMINI_API_KEY` | no | enables AI notes; without it the feature hides itself |
| `GEMINI_MODEL` | no | defaults to `gemini-3-flash-preview` |
| `GEMINI_FALLBACK_MODELS` | no | tried in order if the primary is retired or overloaded |
| `GEMINI_ATTEMPT_TIMEOUT_MS` | no | per attempt, defaults to 75000 |
| `DNS_SERVERS` | no | public resolvers for Atlas SRV lookups; `system` to opt out |
| `TRANSCRIPT_PER_MINUTE` / `TRANSCRIPT_PER_HOUR` | no | 6 / 60 per user |
| `NOTES_PER_MINUTE` / `NOTES_PER_HOUR` | no | 3 / 20 per user |
| `NOTES_GLOBAL_PER_HOUR` | no | 120 server-wide — the cap that bounds your Gemini bill |
| `AUTH_ATTEMPTS_PER_15MIN` | no | 20 per IP |
| `STATS_BASELINE_*` | no | starting offsets for the landing-page counters; set to 0 for real numbers only |

## `client/.env`

| Variable | When |
|:---|:---|
| `VITE_PROXY_TARGET` | development only, if the API is not on port 5000 |
| `VITE_API_URL` | production only, when client and API are on different domains |

> [!NOTE]
> **macOS:** port 5000 is taken by the AirPlay Receiver. Either turn it off in System Settings → General → AirDrop & Handoff, or set `PORT=5055` in `server/.env` and `VITE_PROXY_TARGET=http://localhost:5055` in `client/.env`.

---

# 🧪 Running and testing

```bash
npm run dev      # both apps together
npm run seed     # demo account: demo@gyankendra.dev / knowboard123
npm test         # 25 tests
npm run build    # production client build
```

In development Vite proxies `/api` to the server, so there is no CORS to configure locally.

The test suite runs against `TEST_MONGODB_URI` (default `mongodb://127.0.0.1:27017/knowboard_test`), which is dropped at the start of each run and is separate from your real data.

---

# 🔌 API reference

All routes are under `/api`. Everything except signup, login and `/stats` requires an `Authorization: Bearer <token>` header.

## 🔑 Auth

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/auth/signup` | Create an account, returns a token |
| `POST` | `/auth/login` | Sign in, returns a token |
| `GET` | `/auth/me` | The current account |
| `PUT` | `/auth/me` | Update name, email or password |

## 📚 Topics

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/topics` | List, with `search`, `category`, `status`, `favorite`, `collection`, `tag`, `sort` |
| `POST` | `/topics` | Create |
| `GET` | `/topics/due` | Due for revision |
| `GET` | `/topics/stats` | Counts and weekly velocity |
| `GET` | `/topics/categories` | Built-in categories plus the user's own |
| `GET` | `/topics/:id` | One topic |
| `PUT` | `/topics/:id` | Update |
| `DELETE` | `/topics/:id` | Delete |
| `PATCH` | `/topics/:id/notes` | Debounced autosave |
| `PATCH` | `/topics/:id/review` | Mark reviewed, advance the schedule |
| `POST` | `/topics/:id/duplicate` | Copy, resetting review history |

## 🔗 Resources and checklist

| Method | Endpoint |
|:---|:---|
| `POST / PUT / DELETE` | `/topics/:id/resources[/:resourceId]` |
| `POST / PATCH / DELETE` | `/topics/:id/checklist[/:itemId]` |

## 🎥 Transcripts

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/transcripts` | History |
| `POST` | `/transcripts` | Captions as text |
| `POST` | `/transcripts/notes` | AI notes as a PDF |
| `GET` | `/transcripts/capabilities` | Whether notes are configured |
| `DELETE` | `/transcripts/:id` | Remove a history entry |

## 🗂️ Quick notes, collections, activity, public stats

| Method | Endpoint |
|:---|:---|
| `GET / POST / DELETE` | `/quick-notes[/:id]`, plus `/quick-notes/:id/convert` |
| `GET / POST / PUT / DELETE` | `/collections[/:id]` |
| `GET` | `/activities` |
| `GET` | `/stats` (public) |

---

# ⚙️ How the pieces work

## 🔒 Account isolation

The user id comes from the verified JWT and nothing else — never from a body, a URL or an imported file. Every query carries it as part of the filter rather than checking ownership afterwards:

```js
Topic.findOne({ _id: req.params.id, userId: req.user.id })
```

Resources and checklist items are embedded in their topic, so the filter matches the topic id, the user id *and* the embedded id together.

Changing an id in a URL returns 404, never someone else's data.

Topic updates also pass through an allow-list of writable fields, so a request cannot set `userId`, `reviewCount` or `nextReviewAt` even if it includes them.

---

## 🔁 Spaced repetition

Lives only in `server/utils/revision.js`, so the client cannot pick its own dates:

```text
new topic        ->  2 days
review 1         ->  3 days
review 2         ->  7 days
review 3         ->  14 days
review 4         ->  30 days
review 5 onwards ->  60 days
```

---

## 🎬 Transcripts

Captions are requested in **English first**, falling back to whatever the video has — without that, a multi-language video returns whichever track YouTube lists first, which is frequently not the spoken language.

This is scraping rather than an official API, so it can break if YouTube changes things, and it works far better from a residential IP than a datacenter one.

---

## 🤖 AI notes

The transcript goes to Gemini Flash with a **response schema**, so the result is structured JSON rather than prose to be parsed.

Single-pass for anything under `GEMINI_SINGLE_PASS_CHARS` (120k) because Flash sees the whole talk at once; longer recordings fall back to map-reduce — notes per chunk in parallel, then one merge pass over those notes rather than the raw text.

Google retires and overloads these models constantly, so `GEMINI_MODEL` has a fallback chain behind it.

A 404, a 503 **or a timeout** moves to the next model rather than failing the request, and the response reports which one answered.

The notes are typeset as a PDF with pdfkit from the structured object — real headings, bullets and page numbers, not printed markup.

pdfkit's built-in fonts are Latin-1, so non-Latin characters in a title are normalised rather than throwing.

---

# 🛡️ Rate limiting

A sliding window held in memory, which suits a single server process: counts reset on restart and are not shared across instances.

Move the store to Mongo or Redis before running more than one instance.

| Route | Limit | Keyed by |
|:---|:---:|:---|
| `POST /transcripts` | 6/min, 60/hour | user |
| `POST /transcripts/notes` | 3/min, 20/hour | user |
| `POST /transcripts/notes` | 120/hour | **server-wide** |
| `POST /auth/login`, `/auth/signup` | 20 per 15 min | IP |

Refused requests answer `429` with `Retry-After`; every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining` (the tightest of the limiters).

---

# ☁️ Deployment

The backend goes to **Render**, the frontend to **Vercel**, and the database is **MongoDB Atlas**. Step-by-step instructions are in [DEPLOYMENT.md](DEPLOYMENT.md).

## The short version

### 1. Push to GitHub

Push to GitHub.

### 2. Render

→ Web Service → root directory `server`  
→ Add the environment variables  
→ Deploy  
→ Copy the URL

### 3. Vercel

→ Project → root directory `client`  
→ Set `VITE_API_URL` to the Render URL  
→ Deploy  
→ Copy the URL

### 4. Back on Render

Set `CLIENT_URL` to the Vercel URL so CORS allows it.

### 5. In Atlas

Allow access from anywhere (`0.0.0.0/0`) so Render can connect.

---

## 👨‍💻 Contributed by

**[Soumyadeep De](https://www.linkedin.com/in/soumyadeep-de-217597324/)**
