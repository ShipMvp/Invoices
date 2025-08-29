# ShipMVP React Template

This is the **frontend starter template** for projects built with **[ShipMVP](https://github.com/your-org/shipmvp)**.
It is designed to be cloned or pulled via the `shipmvp` CLI and then extended with **feature modules** (Invoice, Billing, etc.).


## Tech Stack

* ⚡ **React 18** + **TypeScript**
* ⚡ **Vite** (fast dev server + build)
* ⚡ **React Router v6**
* ⚡ **TailwindCSS** (preconfigured, optional)
* ⚡ **Module Registry** → auto-discovers modules from `src/modules/**`
* ⚡ Simple **API client** (`src/api.ts`) wired to `VITE_API_BASE_URL`


## Project Structure

```
shipmvp-react/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
├─ .env.example          # env variables (copy to .env.local)
└─ src/
   ├─ main.tsx           # entrypoint, auto-loads modules
   ├─ app.tsx            # base layout + navigation
   ├─ styles.css         # minimal base styles (Tailwind-ready)
   ├─ api.ts             # fetch wrapper
   ├─ module-registry.ts # central registry for modules
   └─ modules/
      └─ invoice/        # sample feature module
         ├─ module.tsx   # registers module with nav + routes
         └─ pages/
            ├─ InvoiceList.tsx
            └─ InvoiceDetail.tsx
```


## Getting Started

### 1. Install dependencies

```bash
pnpm install   # or npm install / yarn install
```

### 2. Configure API base URL

Copy `.env.example` → `.env.local` and set:

```
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Run dev server

```bash
pnpm dev
```

➡ App runs at **[http://localhost:5173](http://localhost:5173)**


## Adding a New Module

Every module lives under `src/modules/<name>` and must export a `module.tsx` that calls `register()`.

**Example: `src/modules/billing/module.tsx`**

```tsx
import { lazy } from "react";
import { register } from "../../module-registry";

const List = lazy(() => import("./pages/List"));
const Detail = lazy(() => import("./pages/Detail"));

register({
  id: "billing",
  nav: [{ label: "Billing", to: "/billing" }],
  routes: [
    { path: "/billing", element: <List /> },
    { path: "/billing/:id", element: <Detail /> }
  ]
});
```

### Minimal page: `src/modules/billing/pages/List.tsx`

```tsx
export default function BillingList() {
  return <div>Billing module works 🎉</div>;
}
```


## API Calls

Use the helper in `src/api.ts`:

```ts
import { api } from "../api";

async function loadInvoices() {
  const invoices = await api.get<any[]>("/api/invoice");
  console.log(invoices);
}
```


## Production Build

```bash
pnpm build
pnpm preview
```

➡ Serves the built app at [http://localhost:4173](http://localhost:4173)


✅ This template stays **lightweight** and lets you grow features via **modules**.
👉 Use `shipmvp module add <Name> --fe` to scaffold new ones automatically.
# ShipMVP — React frontend

Updated README that reflects this repository's actual layout, scripts, and quick start instructions.

This repository is a Vite + React + TypeScript frontend scaffold used by ShipMVP projects. It includes a component library (shadcn-style UI pieces), pages for invoices, billing, authentication, and shared utilities.

## Tech stack

- React 18 + TypeScript
- Vite (dev server & build)
- React Router (v6)
- TailwindCSS (configuration included)
- @tanstack/react-query for data fetching
- Radix UI primitives and shadcn-style components in `src/components/ui`

---

## Quick checklist (what I'll cover)

- [x] Update README to match repo layout and scripts
- [x] Add clear dev/build commands and environment notes
- [x] Surface important source folders and where to find API client code

---

## Project layout (important files/folders)

Top-level:

```
package.json
vite.config.ts
index.html
tsconfig*.json
tailwind.config.ts
public/               # static assets
src/
  ├─ main.tsx         # app entry
  ├─ App.tsx          # top-level layout + routing
  ├─ App.css, index.css
  ├─ components/      # app UI + reusable shadcn-style components
  │   ├─ AppHeader.tsx
  │   ├─ Sidebar.tsx
  │   └─ ui/           # small UI primitives (accordion, button, form, etc.)
  ├─ lib/             # utils, config, api client
  │   ├─ api/          # api client & services (auth-service.ts, invoice-service.ts)
  │   └─ config.ts
  ├─ hooks/           # custom hooks (use-mobile.tsx, use-toast.ts)
  └─ pages/           # top-level pages (Invoices, Billing, Login, Settings, etc.)
```

Notes:
- API helpers live under `src/lib/api` (see `client.ts`, `schema.ts`, service files).
- UI primitives and app components are in `src/components/ui` and `src/components`.

---

## Scripts (from `package.json`)

- Install: pnpm install (or npm/yarn)
- Dev (hosted): pnpm dev  # runs vite with --host 0.0.0.0
- Build: pnpm build
- Preview production build: pnpm preview
- Lint: pnpm lint
- Format: pnpm format
- Generate API types: pnpm run generate-api (reads VITE_API_URL / fallback)

The project also contains a `postinstall` hook that attempts to run the API generator (safe-fails).

---

## Environment

Copy the example env to a local file and edit values as needed:

```
cp .env.example .env.local
# or on Windows PowerShell
Copy-Item .env.example .env.local
```

Minimum useful variables:

- VITE_API_BASE_URL or VITE_API_URL — base URL for API calls (used by the generator and runtime client)

Example:

```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Run locally (PowerShell)

Install dependencies and run the dev server:

```powershell
# install
pnpm install

# run dev server (exposes on 0.0.0.0)
pnpm dev
```

Open http://localhost:5173 (or the printed URL) in your browser.

Build for production:

```powershell
pnpm build
pnpm preview
```

---

## Notes for contributors

- Features are organized in `src/pages` and shared UI in `src/components`. Add new pages and corresponding routes in `App.tsx` or follow existing patterns.
- Services that call the backend are in `src/lib/api` (see `client.ts` and `invoice-service.ts`).
- If you update the backend OpenAPI URL, regenerate types with `pnpm run generate-api`.

---

## Small troubleshooting

- If hot reload or dependency errors occur, remove node_modules and lockfile then reinstall:

```powershell
rm -r node_modules
rm pnpm-lock.yaml  # or bun.lockb / package-lock.json depending on package manager
pnpm install
```

On Windows you may use Remove-Item instead of rm.

---

If you want, I can also:

- add a short `CONTRIBUTING.md` with branch/PR rules
- add a one-command `Makefile` or npm script to run the common setup

Requirements coverage: All items in the quick checklist above are Done.
