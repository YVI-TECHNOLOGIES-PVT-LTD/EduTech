# EduTrack Component Guidelines

## Component Standards
- **Single Responsibility**: Each UI component performs a single presentational function.
- **Typed Props**: Props must be fully typed using TypeScript interfaces or types from `@edutrack/types`.
- **Shared UI Adoption**: Reusable UI primitives (buttons, cards, badges, dialogs) MUST be imported from `@edutrack/ui`.
- **Accessibility**: Include ARIA labels, semantic HTML tags, and keyboard focus states.
- **No Direct API Calls**: Presentational components consume data via props or custom hooks, never calling API endpoints directly.
