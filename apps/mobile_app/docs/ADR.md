# Architectural Decision Records (ADR)

## ADR 001: Adoption of Expo Router v3
- **Context**: File-based router matching Next.js app directory style.
- **Decision**: Adopt Expo Router for nested navigation layout groups `(auth)`, `(tabs)`, `(common)`.

## ADR 002: Multi-Tenant Architecture
- **Context**: EduTrack supports multi-school networks.
- **Decision**: Embed Tenant context into core storage and headers (`X-Tenant-ID`, `Workspace-ID`, `School-ID`, `Academic-Year-ID`).
