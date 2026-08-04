# Folder Structure

```text
mobile-app/
├── app/                  # Expo Router file-based routing
│   ├── (auth)/           # Authentication & Workspace screens
│   ├── (tabs)/           # Dashboard, Profile, Settings tabs
│   ├── (common)/         # Shared utility screens (Error, Offline, Maintenance)
│   └── (admission)/      # Module routing shells
├── src/
│   ├── core/             # Decoupled core business services (API, Auth, Tenant, Network, Storage, Permissions)
│   ├── components/ui/    # Atomic UI design system (atoms, molecules, organisms, templates)
│   ├── features/         # 21 enterprise module folders
│   ├── theme/            # Theme tokens, palettes, typography, spacing, elevation
│   ├── config/           # App, env, feature flag configs
│   ├── providers/        # Provider composability tree
│   ├── hooks/            # Standard React Hooks
│   ├── services/         # Domain background services
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper utilities
├── tests/                # Unit, integration, mock test setup
└── docs/                 # Architectural documentation
```
