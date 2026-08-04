# EduTrack Mobile ERP — Theme System Architecture Guide

## Overview
The EduTrack Mobile ERP Theme Architecture delivers a multi-tenant, runtime-swappable design token engine supporting **Light Mode**, **Dark Mode**, and **Device System Preference**.

## System Flow
```text
Zustand Theme Store (useThemeStore) 
        ↓ Persisted via AsyncStorage (@edutrack_theme_mode)
useTheme() Hook
        ↓ Combines System Appearance + Active School Brand Config
ThemeProvider Context Injection
        ↓ Automatically updates StatusBar + Navigation Container
UI Components (ScreenWrapper, Card, Button, Input)
```

## Core Abstraction Layers
1. **Palettes**: `lightPalette` & `darkPalette` ([src/theme/palettes/](file:///c:/Users/DELL/OneDrive/Desktop/School_Management_System/mobile-app/src/theme/palettes/))
2. **Feature Semantics**: `colors.feature.finance`, `colors.feature.admission`, etc.
3. **Status Semantics**: `colors.status.paid`, `colors.status.absent`, `colors.status.pending`.
4. **Dynamic White-Label Brand Engine**: `createSchoolTheme(brandConfig, isDark)` in `src/theme/utils/themeUtils.ts`.
