# EduTrack Mobile ERP — Component Usage & Migration Guide

## Rules for Component Authoring
1. **Zero Hardcoded Hex Codes**: Never write `#ffffff`, `#000000`, or `#3b82f6` directly in component JSX.
2. **Use Theme Hook**: Always import `useTheme()` from `@/theme`.
3. **Use Feature Abstraction**: Access feature colors via `colors.feature.finance.primary` or `colors.feature.admission.primary`.

## Example Compliant Component
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';

export function FinanceCard() {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ backgroundColor: colors.feature.finance.surface, padding: spacing.md, borderRadius: radius.lg }}>
      <Text style={{ color: colors.feature.finance.primary }}>Fee Collection</Text>
    </View>
  );
}
```
