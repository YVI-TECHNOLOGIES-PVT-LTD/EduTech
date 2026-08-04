# EduTrack Frontend Performance Guide

## Performance Budget & Optimization Practices
1. **Route-Level Code Splitting**: All major feature pages are split into separate JavaScript chunks loaded dynamically on demand.
2. **Suspense Loading Skeletons**: Avoid blank screens during dynamic bundle fetches using `PageSkeleton`.
3. **Optimized Package Imports**: Eliminate deep internal package imports; consume `@edutrack/*` root exports to enable tree-shaking.
4. **TanStack Query Caching**: Centralized `staleTime: 5 * 60 * 1000` prevents unnecessary background API refetches on tab focus.
