# Dashboard Stitch Reference

## Purpose

This file explains how to use the Google Stitch Dashboard design in the React + TypeScript + Tailwind frontend.

The Dashboard screen is based on the Stitch files in this folder:

- `code.html`: raw HTML/Tailwind UI exported from Google Stitch.
- `DESIGN.md`: design tokens, colors, typography, spacing, and component style rules exported from Google Stitch.

## Main rule

Use the Stitch Dashboard design as the main visual reference.

Do not redesign this page from scratch. Convert the Stitch UI into clean React components using TypeScript and Tailwind CSS.

## Page name

Dashboard Page

## Route

Suggested route:

```txt
/dashboard
```

## Design summary

The Dashboard uses a clean file-management layout with:

- Left sidebar navigation
- Upload File button
- New Folder button
- Storage usage card
- Top search bar
- Notification/user actions
- Suggested file cards
- File/folder list
- Responsive layout for desktop and mobile

## Visual style

Follow the style from `DESIGN.md`:

- Design system name: Lumen UI
- Primary color: orange
- Background: warm light gray
- Surface/card: white or light warm gray
- Font: Inter
- Mono font: JetBrains Mono
- Rounded cards and buttons
- Soft shadow
- Clean spacing based on 8px unit

## Components to create

Convert the Stitch Dashboard into these React components:

```txt
src/pages/DashboardPage.tsx
src/layouts/DashboardLayout.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Topbar.tsx
src/components/dashboard/StorageUsageCard.tsx
src/components/dashboard/SuggestedFileCard.tsx
src/components/dashboard/SuggestedFilesSection.tsx
src/components/dashboard/FileList.tsx
src/components/dashboard/FileListItem.tsx
src/components/common/Button.tsx
src/components/common/SearchInput.tsx
src/components/common/Badge.tsx
```

## Layout structure

The final React page should be structured like this:

````txt
DashboardPage
└── DashboardLayout
    ├── Sidebar
    │   ├── Brand
    │   ├── Upload File button
    │   ├── New Folder button
    │   ├── Navigation links
    │   └── StorageUsageCard
    └── Main content
        ├── Topbar
        │   ├── SearchInput
        │   ├── Notification button
        │   page should be structured like this:

```txt
DashboardPage
└── DashboardLayout
    ├── Sidebar
    │   ├── Brand
    │   ├── Upload File button
    │   ├── New Folder button
    │   ├── Navigation links
    │   └── StorageUsageCard
    └── Main content
        ├── ├── Upgrade button
        │   └── User avatar
        ├── Page header
        ├── SuggestedFilesSection
        └── FileList
````

## Sidebar navigation

Use these navigation items from the Stitch design:

- My Files
- Smart Search
- Community
- Shared
- Starred
- Trash
- AI Assistant
- Settings

For the current project, these can be mapped later to actual routes.

## Data rules

The current Stitch design uses static demo data.

When converting to React:

- Do not hardcode demo data directly inside reusable components.
- Put temporary mock data inside the page or a separate mock file.
- Replace mock data with real fetch API calls when the backend is ready.

Suggested mock data file:

```txt
src/features/dashboard/dashboard.mock.ts
```

## API integration later

When the backend is ready, replace mock data with real API calls.

Possible future APIs:

- `GET /api/documents/recent`
- `GET /api/documents/suggested`
- `GET /api/storage/usage`

Use the shared fetch wrapper from:

```txt
src/services/apiClient.ts
```

Do not use Axios.

## Important conversion rules

- Use React + TypeScript.
- Use Tailwind CSS.
- Do not use shadcn/ui.
- Do not create `components.json`.
- Do not use Axios.
- Use native fetch API only.
- Keep the UI close to the Stitch design.
- Keep components small and reusable.
- Remove unnecessary CDN scripts from `code.html`.
- Do not use `<script src="https://cdn.tailwindcss.com">` in the React app.
- Do not keep the full HTML document structure from Stitch.
- Convert only the useful UI parts into React components.

## Things to keep from Stitch

Keep the following design ideas:

- Orange primary color
- Warm gray background
- Left sidebar layout
- Rounded buttons and cards
- Search bar in topbar
- Suggested files card grid
- File list/table section
- Storage usage indicator
- Soft hover effects
- Clean spacing

## Things to change

When converting to React:

- Replace static HTML with React components.
- Replace repeated file card markup with mapped data.
- Replace repeated file list rows with mapped data.
- Replace demo image URLs if needed.
- Use local icons or an icon library only if already approved.
- Use real user/document data later from API.

## Acceptance criteria

The Dashboard page is done when:

- The page visually matches the Stitch Dashboard design.
- The layout works on desktop.
- The layout is responsive on smaller screens.
- Components are reusable and not copy-pasted everywhere.
- Mock data is separated from reusable components.
- No shadcn/ui is used.
- No Axios is used.
- No unnecessary Stitch CDN scripts remain.
