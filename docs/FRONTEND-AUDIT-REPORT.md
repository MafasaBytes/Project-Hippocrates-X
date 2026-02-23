# Project Hippocrates X — Frontend Audit Report

**Audit date:** February 23, 2026  
**Scope:** Medical AI frontend (React 19 + TypeScript + Mantine, Vite)  
**Reference:** `project-mission.md` (Phase 1–3 deliverables, WCAG, clinical safety)

---

## Executive Summary

The frontend is structured clearly with a consistent stack (React, Mantine, React Query) and several Phase 1 items already started (theme clinical colors, focus ring, some ARIA, ConfidenceBadge contrast). **Critical gaps** remain for a medical-grade app: no global error boundary, no retry UX for failed requests, underused loading/empty states, missing accessibility (labels, headings, keyboard, focus trap), and no clinical safeguards (e.g. confirmation for “End Consultation”, pending-changes indicator). The following sections detail findings and recommended improvements.

---

## 1. Accessibility (WCAG 2.1 AA)

### 1.1 What’s in place
- Theme: clinical color palette, focus ring (`focusRing`, `focusRingRadius`), orange for low confidence (better contrast than yellow).
- Some ARIA: `role="main"`, `role="search"`, `aria-label` on search, nav, Begin Consultation, InputPanel, AnalysisPanel, TranscriptionPanel; `aria-live`/`aria-atomic` on analysis results and transcription; `aria-current="page"` on nav.
- Modal: focus moved to first input when Begin Consultation opens; Escape closes.
- ConfidenceBadge: `aria-label` with confidence level.

### 1.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **No skip link** | App shell | Add “Skip to main content” link at top of page for keyboard/screen reader users. |
| **Page title is generic** | `index.html` | Set `<title>` per route (e.g. “Dashboard – Hippocrates X”, “Consultation – Hippocrates X”) for orientation. |
| **Heading hierarchy** | Multiple pages | Use a single `<h1>` per page (e.g. “Dashboard”, “Consultations”) and ensure order (h1 → h2 → h3). Several pages use `Title order={2}` without a clear h1. |
| **Tables not announced** | RecentConsultations, ConsultationsPage, PatientsPage, PatientDetailPage | Add `<caption>` or `aria-label` to tables; ensure header cells use `scope="col"` where appropriate. |
| **Interactive table rows** | All consultation/patient tables | Rows are clickable but not keyboard-activatable. Add `tabIndex={0}`, `onKeyDown` (Enter/Space to activate), and `role="button"` or use a link/button in the row. |
| **Form labels** | PatientForm, GlobalSearch | PatientForm inputs lack `aria-label` or associated `id`/`htmlFor`; GlobalSearch SegmentedControl and search input need clear labels for screen readers. |
| **Empty state semantics** | EmptyState component | Prefer a live region or heading so “no data” is announced; avoid relying only on dimmed text. |
| **ErrorBoundary fallback** | ErrorBoundary.tsx | Add `role="alert"` and `aria-live="assertive"` on the fallback UI so it’s announced immediately. |
| **Focus trap in modals** | BeginConsultationModal, PatientForm | Trap focus inside modal (e.g. Mantine’s focus trap or manual handling) and return focus to trigger on close. |
| **InputPanel focus bug** | InputPanel.tsx | `fileInputRef` is never attached to any element; the effect that “focuses text area” does nothing. Either attach ref to the Textarea or remove the effect. |

---

## 2. Error Handling & Resilience

### 2.1 What’s in place
- API client: interceptors, timeout 30s, user-facing notifications for non-GET/network errors, structured reject with `retryable`, `sanitizeInput`, `validateFile`, `getRetryDelay`.
- ErrorBoundary component exists with “Try Again” and message.
- AnalysisPanel and InputPanel show mutation loading and some error feedback (e.g. Dropzone error when mutation fails).

### 2.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **ErrorBoundary not used** | App.tsx, main.tsx | Wrap the app (or at least `<App />` / route tree) in `<ErrorBoundary>` so React render errors don’t white-screen. |
| **No retry UI** | All API usage | API returns `retryable`; no “Retry” button or automatic retry with backoff in UI. Add retry in notifications or in query/mutation error state (e.g. use `useQuery`’s `retry`/`retryDelay` and expose “Retry” in error states). |
| **Query loading/error not surfaced** | DashboardPage, ConsultationsPage, PatientDetailPage | Dashboard and Consultations don’t show loading skeleton or error state for list queries. Use `isLoading`/`isError` and existing `LoadingSkeleton`/`LoadingConsultationList` and a clear error message + retry. |
| **LoadingSkeleton / EmptyState unused** | app/src | `LoadingCard`, `LoadingTable`, `LoadingStatsGrid`, `LoadingConsultationList` and `EmptyState` are never imported. Use them on Dashboard, Consultations, Patients, and PatientDetail for consistency. |
| **AnalysisPanel onError** | AnalysisPanel.tsx | `onError` only sets `isProcessingRef.current = false`; user gets no notification. Show a notification or inline error with retry. |
| **Network status** | — | No online/offline indicator. Add a small banner or icon when offline and, if desired, disable critical actions or queue them. |
| **Consultation not found** | ConsultationActivePage | “Consultation not found” is plain text with no action. Add “Back to list” link and optionally use EmptyState. |

---

## 3. Security (Frontend)

### 3.1 What’s in place
- Auth token from `localStorage`, sent via interceptor; cleared on 401/403.
- `sanitizeInput` and `validateFile` in client; file size limit 50MB, allowed MIME types defined.
- No PII in interceptor `console.error` (only url, method, status).

### 3.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **Token storage** | client.ts | Prefer httpOnly cookies for tokens in production; if keeping localStorage, document risk and ensure HTTPS and CSP. |
| **CSP / security headers** | index.html, server | Add Content-Security-Policy (and other security headers) via server or build; ensure no inline scripts if CSP is strict. |
| **PatientForm / text inputs** | PatientForm, notes fields | Ensure all user-submitted text sent to API is sanitized (or that backend always sanitizes); use `sanitizeInput` for free-text fields if not already applied before submit. |
| **Hardcoded doctor_id** | BeginConsultationModal.tsx | Replace with current user from auth context/session so no one can impersonate. |

---

## 4. Clinical Workflow Safety

### 4.1 What’s in place
- ConfidenceBadge with clear bands (high/moderate/low/uncertain).
- Consultation type and elapsed time visible in workspace.
- “End Consultation” with “Auto-generate summary” switch.

### 4.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **End Consultation not confirmed** | ConsultationWorkspace.tsx | Add confirmation modal (“End this consultation? Summary will be generated.”) to avoid accidental closure. |
| **No “pending changes” indicator** | ConsultationWorkspace, InputPanel | If user has unsent text or in-flight uploads, show a warning before ending or navigating away (e.g. “You have unsaved input”). |
| **No emergency pause for AI** | AnalysisPanel | Mission doc calls for “emergency pause for AI analysis”. Add a visible “Pause analysis” or “Stop processing” for long-running analysis if the backend supports it. |
| **Transcription “Listening” not accessible** | TranscriptionPanel | “Listening...” uses an icon; ensure status is announced (e.g. `aria-live` with “Listening” text). |
| **Pre-consultation notes not sent** | BeginConsultationModal | `notes` state is never sent to `consultationsApi.create`. Either add to API payload or remove the field until supported. |

---

## 5. Information Architecture & UX

### 5.1 What’s in place
- Clear top-level nav (Dashboard, Consultations, Patients, Search) and “Begin Consultation” CTA.
- Breadcrumbs on Consultation and Patient detail.
- Dashboard: stats grid, recent consultations, anomaly feed placeholder.
- Consultation workspace: inputs, analysis, and (for phone) transcription in a logical layout.

### 5.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **No patient context in workspace** | ConsultationWorkspace | Mission: “Patient context overlay in consultation workspace”. Show current patient name/ID (and link to patient) in the active consultation view. |
| **Search submit on Enter only in one place** | GlobalSearch | Search runs on button click; Enter in TextInput triggers search via `onKeyDown` — ensure label/hint mentions “Press Enter to search”. |
| **No result count or feedback before results** | GlobalSearch | Consider “Searching…” and then “X results” or “No results” with suggestion to broaden query. |
| **Consultation list density** | RecentConsultations, ConsultationsPage | For large lists, add pagination or virtual scroll; mission mentions “Pagination on list views”. |
| **Patients list** | PatientsPage | Same: pagination or “Load more” when patient list grows. |
| **Anomaly feed empty state** | AnomalyFeed, DashboardPage | “No anomalies detected” is good; consider a short explanation (e.g. “Flagged cases will appear here”) for first-time users. |
| **Date of birth validation** | PatientForm | DOB is free text (YYYY-MM-DD placeholder). Add validation/date picker and clear error messages. |

---

## 6. Performance

### 6.1 What’s in place
- React Query with `retry: 1`, `refetchOnWindowFocus: false`.
- Consultation detail refetches every 5s when active.

### 6.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **No route-based code splitting** | App.tsx | All pages are in the main bundle. Use `React.lazy` + `Suspense` for route components to improve initial load. |
| **Large lists** | Consultations, Patients, Search results | No pagination; `consultationsApi.list({ limit: 100 })` can be heavy. Add limit/offset or cursor and paginated UI. |
| **No image optimization** | InputPanel / future image viewer | When displaying uploaded images, use lazy loading and appropriate sizing. |
| **Refetch interval** | ConsultationActivePage | 5s refetch is good for live feel; consider pausing when tab is hidden (e.g. `refetchInterval: document.visibilityState === 'visible' ? 5000 : false`). |

---

## 7. Mobile & Responsive

### 7.1 What’s in place
- Mantine grid and breakpoints (`base`, `md`); AppShell navbar collapse on `sm` with burger menu.
- Consultation workspace columns stack on small screens.

### 7.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **Touch targets** | Buttons, nav, table rows | Mission: “48px minimum touch targets”. Audit icon-only or small controls (e.g. Flush, Stop in TranscriptionPanel, table rows) and ensure min height/width and padding. |
| **Header search on small screens** | AppShell | Search input (w={320}) may overflow or be cramped; consider collapsing to icon that opens a drawer or full-width search on small viewports. |
| **Tables on narrow screens** | All tables | Consider card layout or horizontal scroll with sticky first column for readability on phones. |
| **Modal on mobile** | BeginConsultationModal, PatientForm | Ensure modals are full-screen or well-sized on small screens and that focus trap and scroll work. |

---

## 8. Code Quality & Maintainability

### 8.1 What’s in place
- TypeScript and shared types in `types/api.ts`.
- Reusable components: ErrorBoundary, LoadingSkeleton variants, EmptyState, ConfidenceBadge.
- Custom hooks: usePatientLookup, useTranscription.
- Centralized API client and route modules.

### 8.2 Gaps and recommendations

| Issue | Location | Recommendation |
|-------|----------|-----------------|
| **Reusable components unused** | LoadingSkeleton, EmptyState | Use them consistently so loading and empty states are uniform and maintainable. |
| **Duplicate status color maps** | RecentConsultations, ConsultationsPage, PatientDetailPage | Extract `STATUS_COLOR` (and consultation type labels) to a shared constant or util. |
| **activeSidebarItem state** | AppShell | `activeSidebarItem` is set on click but nav active state is derived from `location.pathname`; the state is redundant and can be removed. |
| **WebSocket URL** | useTranscription.ts | Uses `window.location.host` and `/api/transcribe`; ensure Vite proxy forwards WebSocket upgrades for `/api` (or use a dedicated `/ws` path if backend supports it). |
| **Pre-consultation notes** | BeginConsultationModal | `notes` are never persisted; remove or implement. |
| **Tests** | app/ | No frontend tests present. Add unit tests for hooks and critical components, and E2E for consultation flow as per mission. |

---

## 9. Alignment With project-mission.md

| Phase 1 item | Status | Note |
|---------------|--------|------|
| aria-label on interactive elements | Partial | Present in several places; forms and tables need more. |
| Focus management for modals | Partial | BeginConsultation focuses first input; no full trap. |
| Contrast (yellow → orange) | Done | ConfidenceBadge uses orange. |
| aria-live for dynamic content | Done | Analysis results and transcription. |
| Keyboard navigation | Partial | Tables and some controls not fully keyboard-accessible. |
| Visible focus indicators | Done | Theme focus ring. |
| Heading hierarchy | Missing | Needs single h1 per page and consistent order. |
| Global ErrorBoundary | Missing | Component exists but not mounted. |
| Retry for failed requests | Missing | No retry UI. |
| User-actionable error messages | Partial | Notifications exist; list/query errors not always shown. |
| Network status indicator | Missing | — |
| ErrorState / LoadingSkeleton | Partial | Built but not used on main pages. |
| Transcription confidence indicators | Partial | ConfidenceBadge in analysis; transcription panel could show confidence if API provides it. |
| Review/certification workflow | Missing | — |
| Emergency pause for AI | Missing | — |
| Session lock / pending changes | Missing | — |

---

## 10. Priority Summary

**P0 (Critical for medical UX and compliance)**  
1. Wrap app in `ErrorBoundary`.  
2. Add confirmation before “End Consultation”.  
3. Fix InputPanel focus ref (attach to Textarea or remove).  
4. Use loading and error states (and retry) for Dashboard and Consultations list queries.  
5. Ensure one logical `<h1>` per page and improve table accessibility (labels, keyboard).

**P1 (High)**  
6. Use `LoadingSkeleton` and `EmptyState` on list/detail pages.  
7. Add retry UI for failed API calls.  
8. Patient context in consultation workspace.  
9. Focus trap and return-focus in modals.  
10. Replace hardcoded `doctor_id` with authenticated user.

**P2 (Medium)**  
11. Pagination or virtual scroll for consultations and patients.  
12. Route-based code splitting.  
13. Date validation and better DOB UX in PatientForm.  
14. Send or remove pre-consultation notes in Begin Consultation flow.  
15. Extract shared constants (status colors, labels).

---

*This report is based on a static and structural review of the frontend codebase. Automated a11y (e.g. axe-core) and manual testing with screen readers and keyboard are recommended to validate and extend these findings.*
