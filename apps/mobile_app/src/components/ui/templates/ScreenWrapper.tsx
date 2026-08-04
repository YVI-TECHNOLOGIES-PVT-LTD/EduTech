import React from 'react';
import { View, ScrollView, ViewProps, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ScreenWrapperProps extends ViewProps {
  scrollable?: boolean;
  padded?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  scrollable = true,
  padded = true,
  children,
  className = '',
  style,
  ...props
}) => {
  const content = (
    <View className={`flex-1 ${padded ? 'px-5 py-3' : ''} ${className}`} style={style} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
      <StatusBar barStyle="default" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
