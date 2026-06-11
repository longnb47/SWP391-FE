# AGENTS.md

## Project overview

This is the frontend of an AI Study Hub system.
Users can register, login, upload documents, manage documents, chat with AI using RAG, and view subscription/storage usage.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Native Fetch API
- Do not use shadcn/ui
- Do not use Axios unless explicitly requested

## Setup commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Folder structure rules

- Pages go in `src/pages`
- Reusable components go in `src/components`
- Feature-specific code goes in `src/features`
- API calls go in `src/services`
- Shared TypeScript types go in `src/types`
- Helper functions go in `src/lib`
- Static images/icons go in `src/assets`

## Coding rules

- Use TypeScript.
- Use functional components.
- Use Tailwind CSS for styling.
- Do not use inline CSS unless necessary.
- Do not install shadcn/ui.
- Do not create `components.json`.
- Do not use Axios. Use native `fetch`.
- Do not hardcode backend URLs. Use `import.meta.env.VITE_API_BASE_URL`.
- Do not invent API fields. Follow `docs/API_CONTRACT.md`.

## UI rules

- Clean dashboard style.
- Responsive layout.
- Simple and readable UI.
- Use consistent buttons, inputs, cards, modals, sidebar, navbar, and tables.

## API rules

- All API calls must be placed in `src/services`.
- Use a shared `apiClient.ts` wrapper around fetch.
- Handle loading, success, and error states.
- If an API contract is missing, add TODO instead of guessing.

## Safety rules

- Do not delete existing files without explaining why.
- Do not modify backend code.
- Before large changes, explain the plan first.
