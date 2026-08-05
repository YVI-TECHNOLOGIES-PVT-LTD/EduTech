# ADR 0005: Expo SDK 51 with React Native for Mobile Application

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

EduTrack requires cross-platform mobile access for Students, Parents, and Teachers across iOS and Android native platforms.

## Decision

Use Expo SDK 51 with React Native 0.74, Expo Router v3, and NativeWind (`@edutrack/mobile`).

## Consequences

- Unified codebase targeting iOS, Android, and mobile web.
- File-based navigation hierarchy matching web application routes.
- Encrypted local storage using Expo SecureStore.
