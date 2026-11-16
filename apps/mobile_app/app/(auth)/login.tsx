import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../../src/constants/routes';
import { useLogin } from '../../src/features/auth';
import { useAuthStore } from '../../src/stores/auth.store';
import { loginSchema, LoginFormData } from '../../src/features/auth/schemas/auth.schemas';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ verifiedEmail?: string; verified?: string }>();
  const { isDark } = useTheme();

  const [isSecure, setIsSecure] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const { isAuthenticated, isHydrating } = useAuthStore();

  if (!isHydrating && isAuthenticated) {
    return <Redirect href={ROUTES.PARENT.DASHBOARD as any} />;
  }

  const { mutate: login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: params.verifiedEmail || '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login({
      email: data.email.trim(),
      password: data.password,
    });
  };

  const errorMessage = error instanceof Error ? error.message : null;

  // Safe area insets with sensible Android fallbacks
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 16,
  );
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.screen,
        {
          backgroundColor: isDark ? '#062829' : '#063F40',
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 20,
            paddingBottom: bottomInset + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.cardContainer}>
          {/* Institutional Card Container */}
          <View
            style={[
              styles.authCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            {/* 1. EduTrack Institutional Logo */}
            <View style={styles.logoRow}>
              <Image
                source={require('../../src/assets/images/EduTrack_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* 2. Welcome Back Title */}
            <View style={styles.titleSection}>
              <Text style={[styles.titleText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                Welcome back
              </Text>
            </View>

            {/* Verification Success Notice */}
            {params.verified === 'true' && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.successBannerText}>
                  Registration verified successfully! Please sign in with your credentials.
                </Text>
              </View>
            )}

            {/* API Error Alert Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* 3. Email Address Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                Email Address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: errors.email ? '#EF4444' : isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={17}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="parent@example.com"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      style={[styles.textInput, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={styles.fieldErrorText}>{errors.email.message}</Text>}
            </View>

            {/* 4. Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                  Password
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD as any)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text
                    style={[styles.forgotPasswordText, { color: isDark ? '#E7B76A' : '#063F40' }]}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: errors.password ? '#EF4444' : isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={17}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={isSecure}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      style={[styles.textInput, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setIsSecure(!isSecure)}
                      accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
                      activeOpacity={0.7}
                      style={styles.visibilityButton}
                    >
                      <Feather
                        name={isSecure ? 'eye' : 'eye-off'}
                        size={17}
                        color={isDark ? '#94A3B8' : '#64748B'}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.fieldErrorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* 5. Remember This Device Toggle */}
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberMeRow}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: rememberMe ? (isDark ? '#E7B76A' : '#063F40') : 'transparent',
                    borderColor: rememberMe
                      ? isDark
                        ? '#E7B76A'
                        : '#063F40'
                      : isDark
                        ? '#475569'
                        : '#CBD5E1',
                  },
                ]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={13} color={isDark ? '#063F40' : '#FFFFFF'} />
                )}
              </View>
              <Text style={[styles.rememberMeLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Remember this device for 30 days
              </Text>
            </TouchableOpacity>

            {/* 6. Sign In Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              style={[
                styles.signInButton,
                {
                  backgroundColor: isDark ? '#E7B76A' : '#063F40',
                  opacity: isPending ? 0.75 : 1,
                },
              ]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              {isPending ? (
                <ActivityIndicator color={isDark ? '#063F40' : '#FFFFFF'} size="small" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text
                    style={[styles.signInButtonText, { color: isDark ? '#063F40' : '#FFFFFF' }]}
                  >
                    Sign In
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={isDark ? '#063F40' : '#FFFFFF'}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* 7. Footer: Don't have a parent account? Create Account */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Don&apos;t have a parent account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.REGISTER as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.createAccountText, { color: isDark ? '#E7B76A' : '#063F40' }]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Developer Quick-Fill helpers for staging/local verification */}
            {__DEV__ && (
              <View style={styles.devSection}>
                <TouchableOpacity
                  onPress={() => {
                    setValue('email', 'sathish1@gmail.com', { shouldValidate: true });
                    setValue('password', 'Password@123', { shouldValidate: true });
                  }}
                  style={styles.devButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.devButtonText}>
                    ⚡ Quick Fill: Sathish Naik (Child: Hari Babu)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setValue('email', 'syn.parent.tanmay.bhardwaj.54@synthetic.edutrack.internal', {
                      shouldValidate: true,
                    });
                    setValue('password', 'Password@123', { shouldValidate: true });
                  }}
                  style={[styles.devButton, { marginTop: 6 }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.devButtonText}>
                    ⚡ Quick Fill: Tanmay Bhardwaj (Enrolled 2 Children)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    ...DESIGN_TOKENS.shadows.floating,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 68,
    height: 68,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '800',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  visibilityButton: {
    padding: 6,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rememberMeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  signInButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  createAccountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  devSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  devButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  devButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
});
