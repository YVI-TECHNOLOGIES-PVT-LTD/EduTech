# Frontend Environment Variables (`docs/frontend/ENVIRONMENT_VARIABLES.md`)

**Generated Date:** August 5, 2026  
**Target Application:** `@edutrack/web` (`apps/web_app`)

---

## Variable Reference Table

| Variable Name            | Required | Default Value               | Purpose / Description                            | Security Level |
| :----------------------- | :------: | :-------------------------- | :----------------------------------------------- | :------------: |
| `VITE_API_URL`           |   Yes    | `http://localhost:3000/api` | Base HTTP REST API endpoint for backend services |    `PUBLIC`    |
| `VITE_APP_TITLE`         |    No    | `EduTrack ERP`              | HTML page title and header branding string       |    `PUBLIC`    |
| `VITE_SUPABASE_URL`      |   Yes    | -                           | Supabase project API gateway URL                 |    `PUBLIC`    |
| `VITE_SUPABASE_ANON_KEY` |   Yes    | -                           | Supabase anonymous client API key                |    `PUBLIC`    |
