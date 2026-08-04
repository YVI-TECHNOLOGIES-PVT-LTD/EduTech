# EduTrack Mobile App Architecture

## Overview
EduTrack Mobile is an enterprise-grade School Management System ERP built with React Native and Expo Router.

## Architectural Principles
1. **Clean Architecture**: Strong separation of concerns between Core, Features, UI Design System, and State layers.
2. **Multi-Tenant Foundation**: Every API request automatically attaches `X-Tenant-ID`, `Workspace-ID`, `School-ID`, and `Academic-Year-ID`.
3. **Decoupled Core (`src/core/`)**: Modules do not access Axios or storage directly; they consume domain core services.
4. **Fine-Grained RBAC & ABAC**: Permission Engine checks feature abilities per action, supporting 17 user roles.
5. **Atomic UI Design System**: Standardized components structured into Atoms, Molecules, Organisms, and Templates.
6. **Feature-Based Modularity**: 21 feature module shells designed for seamless independent scaling.

## Data Flow
```
Screen (App Route) -> Feature Hook / Service -> Core API Client -> Axios Interceptors -> Backend ERP
```
