# Design System

## Design source

The UI design is based on Google Stitch outputs.

All pages and components should follow the visual direction from Google Stitch. Do not redesign the interface from scratch. Use the Stitch design as the main visual reference.

If a Stitch screen exists for a page, follow that screen first. If a page does not have a Stitch design yet, create it using the same style, spacing, colors, and layout patterns as the existing Stitch screens.

## General style

- Clean, modern, and simple dashboard UI.
- Light theme by default.
- Professional AI productivity app style.
- Minimal but polished interface.
- Avoid overly colorful or complex designs.
- Use consistent spacing, border radius, shadows, and typography.
- Prioritize readability and usability.

## Tech rules

- Use React + TypeScript.
- Use Tailwind CSS for styling.
- Do not use shadcn/ui.
- Do not create `components.json`.
- Do not use inline CSS unless necessary.
- Do not use external UI component libraries unless explicitly requested.

## Layout rules

### Auth layout

Used for:

- Login page
- Register page

Rules:

- Center the form on the screen.
- Use a simple card-style form.
- Keep the layout clean and focused.
- Include clear input labels and error messages.

### Dashboard layout

Used for:

- Dashboard page
- Documents page
- Chat page
- Subscription page

Rules:

- Use a sidebar layout.
- Sidebar should contain main navigation.
- Main content should have a clean header/top area.
- Content should be displayed using cards, sections, tables, or panels.
- Keep enough whitespace between sections.
- Layout must be responsive.

## Color rules

Use the colors from the Google Stitch design as the primary reference.

If exact color values are not available, use this default direction:

- Primary color: blue
- Background: light gray or slate
- Surface/card: white
- Text primary: dark gray or near black
- Text secondary: gray
- Border: light gray
- Success: green
- Warning: yellow or amber
- Danger: red

Avoid random colors. Every color should feel consistent with the Stitch design.

## Typography rules

- Use clear and readable text.
- Page titles should be large and bold.
- Section titles should be medium and semibold.
- Body text should be readable and not too small.
- Secondary text should use lighter color.
- Avoid too many font sizes.

## Spacing rules

- Use consistent Tailwind spacing.
- Prefer spacing values like `p-4`, `p-6`, `gap-4`, `gap-6`, `space-y-4`, `space-y-6`.
- Do not make components too cramped.
- Do not make cards too large without purpose.
- Keep page content visually balanced.

## Border and shadow rules

- Use rounded corners consistently.
- Cards, inputs, buttons, and modals should use similar border radius.
- Use soft shadows only when needed.
- Avoid heavy shadows.
- Borders should be subtle.

## Component rules

### Button

Buttons should be consistent across the app.

Variants:

- Primary button
- Secondary button
- Danger button
- Ghost button

Rules:

- Primary actions use the primary color.
- Danger actions use red.
- Buttons should have clear hover and disabled states.
- Button text should be short and clear.

### Input

Used for:

- Login form
- Register form
- Search box
- Chat input
- Rename document form

Rules:

- Inputs should have clear labels or placeholders.
- Inputs should have focus states.
- Show validation error messages when needed.

### Card

Used for:

- Dashboard statistics
- Storage usage
- Recent documents
- Subscription plans
- Empty states

Rules:

- Cards should have consistent padding.
- Cards should use white or light surface background.
- Cards should have subtle border or shadow.

### Sidebar

Used in dashboard layout.

Rules:

- Show main navigation items.
- Highlight active page.
- Keep icon and text alignment consistent.
- Sidebar should collapse or adapt on smaller screens if needed.

### Navbar / Topbar

Used inside dashboard pages.

Rules:

- Show page title or current section.
- Can include user info, search, or quick actions.
- Keep it simple and clean.

### Table

Used for document lists.

Rules:

- Use clean rows and readable spacing.
- Show file name, type, size, created date, favorite status, and actions.
- Use empty state when there is no data.
- Use loading state while fetching data.

### Modal

Used for:

- Delete confirmation
- Rename document
- Upload progress if needed

Rules:

- Keep modal content short.
- Use clear cancel and confirm actions.
- Danger confirmation should use red action button.

### Badge

Used for:

- File type
- Subscription plan
- Upload status
- Document status

Rules:

- Badges should be small and readable.
- Use consistent colors based on meaning.

### Empty state

Used when:

- No documents
- No chat history
- No search result

Rules:

- Show a short message.
- Optionally show a simple action button.

### Loading state

Used when:

- Fetching documents
- Uploading files
- Waiting for AI response

Rules:

- Use simple loading indicator.
- Avoid blocking the entire page unless necessary.

### Error state

Used when:

- API request fails
- Login fails
- Upload fails
- Chat request fails

Rules:

- Show clear and friendly error messages.
- Do not expose technical backend errors directly to the user.

## Page-specific design rules

### Login page

- Follow the Stitch login design.
- Use centered card layout.
- Include email and password fields.
- Include login button.
- Include link to register page.

### Register page

- Follow the same visual style as login page.
- Include full name, email, password, and confirm password fields.
- Include register button.
- Include link to login page.

### Dashboard page

- Follow the Stitch dashboard design.
- Show storage usage.
- Show total documents.
- Show recent documents.
- Show quick actions.

### Documents page

- Follow the Stitch documents design.
- Include upload button.
- Include search input.
- Include document list/table.
- Include favorite, rename, and delete actions.
- Include empty state when there are no documents.

### Chat page

- Follow the Stitch chat design.
- Use a clean chat layout.
- Show user messages and AI messages clearly.
- Include document context selector if needed.
- Include chat input at the bottom.
- Show loading state while AI is responding.

### Subscription page

- Follow the Stitch subscription design.
- Show Free, Plus, and Pro plans.
- Show storage limits:
  - Free: 2GB
  - Plus: 5GB
  - Pro: 10GB

- Highlight the current plan if available.

## Responsive rules

- The UI must work on desktop and mobile.
- Sidebar layout can become a mobile menu on small screens.
- Tables can become cards on small screens if needed.
- Forms should remain readable on mobile.
- Avoid horizontal overflow.

## Accessibility rules

- Use semantic HTML when possible.
- Buttons must be real `<button>` elements.
- Inputs must have labels or accessible names.
- Use readable contrast.
- Do not rely only on color to show important information.

## Implementation notes

- Reuse components instead of duplicating UI code.
- Keep components small and readable.
- Do not hardcode demo content inside reusable components.
- Static mock data is allowed only when backend API is not ready.
- When backend API is ready, replace mock data with real fetch service calls.

## Component rules

### Create reusable components for:

- Button
- Input
- Card
- Sidebar
- Topbar
- Table
- Modal
- Badge
- Loading state
- Empty state
- Error message
