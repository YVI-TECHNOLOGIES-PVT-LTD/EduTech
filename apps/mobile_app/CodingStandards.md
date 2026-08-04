# Enterprise Coding Standards

1. **Strict TypeScript**: Never use `any`. Define interfaces/types in `src/types/` or module `types/`.
2. **Path Aliases**: Always use `@/*` for imports from `src/` and `@app/*` for imports from `app/`.
3. **No Business Logic in UI**: Components only render UI and call hooks/services. Business logic belongs in `services/`, `hooks/`, or `core/`.
4. **Theme Design Tokens**: Never hardcode hex color strings inline. Use NativeWind utility classes or `useTheme()` tokens.
5. **Component Standards**: Every UI component must accept `accessibilityLabel`, support Dark Mode, and provide `isLoading` / `disabled` states where appropriate.
