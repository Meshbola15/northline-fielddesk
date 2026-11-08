# FieldDesk

Field service management demo for **Northline Maintenance** — schedule jobs, assign technicians, and complete work from a shared office + technician workspace.

Interactive demo with fictional data. No backend or API keys.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm run build      # typecheck + production build
npm run typecheck
npm run lint
npm run test
npm run preview    # serve the production build
```

## Demo architecture

- **Vite + React + TypeScript + Tailwind CSS + React Router**
- Shared in-memory/localStorage store (`src/store/`) for jobs, customers, technicians, settings, and activity
- Job photos in **IndexedDB** (`src/lib/photos.ts`) — not base64 in localStorage
- **Reset demo** in Settings restores seed data relative to today and clears photos
- Demo role switcher (office ↔ technician) is a convenience control, not authentication

## Portfolio walkthrough (core workflow)

1. Stay on **Office · Dispatch**. Open **Jobs → Create job**, save a new job (optionally unassigned).
2. Open the job (or Schedule → Unassigned) and **Assign / reschedule** a technician with a start time. Overlaps are blocked with a clear conflict message.
3. Use the demo role switcher → **Tech · Alex Rivera** (or the assignee). Confirm the job on **Today** / **Jobs**.
4. Open the job → **Start travel** → **Start work** (labour timer starts and persists across navigation/refresh).
5. Complete the checklist, add notes, capture sign-off (or Customer unavailable).
6. **Complete job**.
7. Switch back to **Office · Dispatch** — Overview, job detail, and Reports reflect the completion.
8. Refresh the browser — the completed job and timer totals remain (local persistence).

Look for the seeded job titled **DEMO: Complete this AC warm-air call** for a ready-made walkthrough.

## Key paths

| Area | Path |
| --- | --- |
| App entry | `src/main.tsx`, `src/App.tsx` |
| Models | `src/types.ts` |
| Seed data | `src/data/seed.ts` |
| Store / actions | `src/store/store.ts` |
| Schedule conflicts | `src/lib/schedule.ts` |
| Completion rules | `src/lib/completion.ts` |
| Office UI | `src/pages/office/` |
| Technician UI | `src/pages/tech/` |
| Schedule board | `src/pages/office/SchedulePage.tsx` |

## Notes

- Photos fail visibly if IndexedDB storage is unavailable or limits are hit.
- Signatures are labelled as demo acknowledgements, not legal verification.
- Availability on Team is demo state only — no live GPS/tracking.
