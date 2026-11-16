import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/stores/auth.store';
import { DraftStorage } from '../../../src/storage/draft-storage';
import { useTheme } from '../../../src/theme';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../../src/components/common/ParentPortalHeader';
import { Button } from '../../../src/components/ui/atoms/Button';

// Wizard schemas and hooks
import {
  studentDetailsSchema,
  parentDetailsSchema,
  academicsSchema,
  declarationSchema,
  StudentDetailsFormData,
  ParentDetailsFormData,
  AcademicsFormData,
  DeclarationFormData,
  FullWizardState,
} from '../../../src/features/admission/schemas/wizard.schemas';
import {
  useAdmissionConfig,
  useAcademicYears,
  useClasses,
} from '../../../src/features/admission/hooks/useAdmissionMetadata';
import { useDocumentTypes } from '../../../src/features/admission/hooks/useDocumentTypes';
import { useSubmitApplication } from '../../../src/features/admission/hooks/useSubmitApplication';

// Wizard Step Components
import { WizardProgressBar } from '../../../src/features/admission/components/wizard/WizardProgressBar';
import { WizardStep1Guidelines } from '../../../src/features/admission/components/wizard/WizardStep1Guidelines';
import { WizardStep2Student } from '../../../src/features/admission/components/wizard/WizardStep2Student';
import { WizardStep3Parent } from '../../../src/features/admission/components/wizard/WizardStep3Parent';
import { WizardStep4Academics } from '../../../src/features/admission/components/wizard/WizardStep4Academics';
import { WizardStep5Documents } from '../../../src/features/admission/components/wizard/WizardStep5Documents';
import { WizardStep6Fee } from '../../../src/features/admission/components/wizard/WizardStep6Fee';
import { WizardStep7Review } from '../../../src/features/admission/components/wizard/WizardStep7Review';
import { WizardStep8Confirmation } from '../../../src/features/admission/components/wizard/WizardStep8Confirmation';

const DRAFT_KEY = 'new_wizard_draft';

export default function AdmissionWizardScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || 'anonymous_parent';

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [instructionsAccepted, setInstructionsAccepted] = useState<boolean>(false);
  const [attachedDocs, setAttachedDocs] = useState<
    Record<string, { uri: string; name: string; type: string; size?: number }>
  >({});
  const [submissionProgress, setSubmissionProgress] = useState<string | null>(null);
  const [submittedAppInfo, setSubmittedAppInfo] = useState<{
    applicationNumber: string;
    studentName: string;
    gradeApplied: string;
  } | null>(null);

  // Metadata Queries
  const { data: configData } = useAdmissionConfig();
  const { data: academicYears = [] } = useAcademicYears();
  const { data: classesList = [] } = useClasses();
  const { data: documentTypes = [] } = useDocumentTypes();

  // Form Controllers
  const studentForm = useForm<StudentDetailsFormData>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      student_first_name: '',
      student_last_name: '',
      date_of_birth: '',
      gender: 'male',
      nationality: 'Indian',
    },
  });

  const parentForm = useForm<ParentDetailsFormData>({
    resolver: zodResolver(parentDetailsSchema),
    defaultValues: {
      parent_name: user?.full_name || user?.fullName || '',
      parent_email: user?.email || '',
      parent_phone: user?.phone || (user as any)?.phoneNumber || '',
      contact_relationship: 'father',
      parent_occupation: '',
    },
  });

  const academicsForm = useForm<AcademicsFormData>({
    resolver: zodResolver(academicsSchema),
    defaultValues: {
      grade_applied_for: 'Grade 1',
      curriculum_preference: 'CBSE',
      previous_school_name: '',
      previous_grade: '',
    },
  });

  const declarationForm = useForm<DeclarationFormData>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      payment_mode: 'upi',
      declaration_accepted: false,
    },
  });

  // Hydrate Draft on Mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await DraftStorage.getDraft<FullWizardState>(userId, DRAFT_KEY);
      if (draft) {
        if (draft.currentStep && draft.currentStep < 8) setCurrentStep(draft.currentStep);
        if (draft.instructionsAccepted) setInstructionsAccepted(draft.instructionsAccepted);
        if (draft.student) studentForm.reset(draft.student);
        if (draft.parent) parentForm.reset(draft.parent);
        if (draft.academics) academicsForm.reset(draft.academics);
        if (draft.documents) setAttachedDocs(draft.documents);
        if (draft.declaration) declarationForm.reset(draft.declaration);
      }
    };
    loadDraft();
  }, [userId]);

  // Save Draft Helper
  const saveDraft = async () => {
    const fullState: FullWizardState = {
      currentStep,
      instructionsAccepted,
      student: studentForm.getValues(),
      parent: parentForm.getValues(),
      academics: academicsForm.getValues(),
      documents: attachedDocs,
      declaration: declarationForm.getValues(),
    };
    await DraftStorage.saveDraft(userId, fullState, DRAFT_KEY);
  };

  // Submit Mutation
  const { mutate: submitApplication, isPending: isSubmitting } = useSubmitApplication();

  // Step Validation & Navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      if (!instructionsAccepted) {
        Alert.alert('Guidelines Required', 'Please accept the guidelines in Step 1 to proceed.');
        return;
      }
      await saveDraft();
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const isValid = await studentForm.trigger();
      if (!isValid) return;
      await saveDraft();
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      const isValid = await parentForm.trigger();
      if (!isValid) return;
      await saveDraft();
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      const isValid = await academicsForm.trigger();
      if (!isValid) return;
      await saveDraft();
      setCurrentStep(5);
      return;
    }

    if (currentStep === 5) {
      // Step 5 documents are optional or verified based on requirements
      await saveDraft();
      setCurrentStep(6);
      return;
    }

    if (currentStep === 6) {
      await saveDraft();
      setCurrentStep(7);
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    const isDeclarationValid = await declarationForm.trigger();
    if (!isDeclarationValid) {
      Alert.alert(
        'Declaration Required',
        'Please review and accept the declaration to submit your application.',
      );
      return;
    }

    const isStudentValid = await studentForm.trigger();
    const isParentValid = await parentForm.trigger();
    const isAcademicsValid = await academicsForm.trigger();

    if (!isStudentValid || !isParentValid || !isAcademicsValid) {
      Alert.alert('Incomplete Form', 'Please review previous steps and correct required fields.');
      return;
    }

    const fullState: FullWizardState = {
      currentStep: 7,
      instructionsAccepted,
      student: studentForm.getValues(),
      parent: parentForm.getValues(),
      academics: academicsForm.getValues(),
      documents: attachedDocs,
      declaration: declarationForm.getValues(),
    };

    submitApplication(
      {
        wizardState: fullState,
        onProgressUpdate: (msg) => setSubmissionProgress(msg),
      },
      {
        onSuccess: (data) => {
          setSubmissionProgress(null);
          const appNumber =
            data.application_number ||
            `APP-${(data.application_id || (data as any).id).slice(0, 8).toUpperCase()}`;
          const studentName = `${fullState.student.student_first_name} ${fullState.student.student_last_name}`;

          setSubmittedAppInfo({
            applicationNumber: appNumber,
            studentName,
            gradeApplied: fullState.academics.grade_applied_for,
          });
          setCurrentStep(8);
        },
        onError: (err) => {
          setSubmissionProgress(null);
          Alert.alert(
            'Submission Failed',
            err.message || 'An error occurred during application submission.',
          );
        },
      },
    );
  };

  const handleExit = () => {
    if (currentStep === 8) {
      router.replace('/(parent)' as any);
      return;
    }

    Alert.alert(
      'Exit Application Wizard?',
      'Your draft has been saved locally. You can resume this application anytime.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Save & Exit',
          onPress: async () => {
            await saveDraft();
            router.replace('/(parent)' as any);
          },
        },
      ],
    );
  };

  const bottomActionPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Top Header */}
      <ParentPortalHeader
        title="Admission Wizard"
        subtitle="Parent Online Application"
        showBack={true}
        onBack={handleExit}
        rightAction={
          currentStep < 8 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                await saveDraft();
                Alert.alert('Draft Saved', 'Your application draft has been saved locally.');
              }}
              style={[
                styles.saveDraftButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(81, 70, 229, 0.2)'
                    : DESIGN_TOKENS.colors.primaryLight,
                  borderColor: isDark ? 'rgba(81, 70, 229, 0.4)' : '#C7D2FE',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save draft"
            >
              <Feather name="save" size={13} color={DESIGN_TOKENS.colors.primary} />
              <Text style={styles.saveDraftButtonText}>Save Draft</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Progress Bar */}
      {currentStep < 8 && <WizardProgressBar currentStep={currentStep} totalSteps={8} />}

      {/* Main Content Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: currentStep < 8 ? bottomActionPadding + 84 : 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Submission In-Flight Modal / Overlay */}
          {isSubmitting && (
            <View
              style={[
                styles.submittingOverlay,
                {
                  backgroundColor: isDark
                    ? 'rgba(81, 70, 229, 0.25)'
                    : DESIGN_TOKENS.colors.primaryLight,
                  borderColor: isDark ? 'rgba(81, 70, 229, 0.4)' : '#C7D2FE',
                },
              ]}
            >
              <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.primary} />
              <Text style={[styles.submittingTitle, { color: isDark ? '#E0E7FF' : '#312E81' }]}>
                {submissionProgress || 'Submitting admission application...'}
              </Text>
              <Text style={[styles.submittingSubtitle, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
                Please do not close or navigate away from the app
              </Text>
            </View>
          )}

          {/* Step 1: Guidelines */}
          {currentStep === 1 && (
            <WizardStep1Guidelines
              accepted={instructionsAccepted}
              onToggleAccept={setInstructionsAccepted}
            />
          )}

          {/* Step 2: Student Details */}
          {currentStep === 2 && (
            <WizardStep2Student
              control={studentForm.control}
              errors={studentForm.formState.errors}
            />
          )}

          {/* Step 3: Parent Details */}
          {currentStep === 3 && (
            <WizardStep3Parent control={parentForm.control} errors={parentForm.formState.errors} />
          )}

          {/* Step 4: Academics */}
          {currentStep === 4 && (
            <WizardStep4Academics
              control={academicsForm.control}
              errors={academicsForm.formState.errors}
              availableGrades={classesList}
            />
          )}

          {/* Step 5: Documents */}
          {currentStep === 5 && (
            <WizardStep5Documents
              documentTypes={documentTypes}
              attachedFiles={attachedDocs}
              onAttachFile={(id, file) => setAttachedDocs((prev) => ({ ...prev, [id]: file }))}
              onRemoveFile={(id) =>
                setAttachedDocs((prev) => {
                  const copy = { ...prev };
                  delete copy[id];
                  return copy;
                })
              }
            />
          )}

          {/* Step 6: Fee Statement */}
          {currentStep === 6 && (
            <WizardStep6Fee
              paymentMode={declarationForm.watch('payment_mode')}
              onSelectPaymentMode={(mode) => declarationForm.setValue('payment_mode', mode)}
            />
          )}

          {/* Step 7: Review & Declaration */}
          {currentStep === 7 && (
            <WizardStep7Review
              wizardState={{
                currentStep,
                instructionsAccepted,
                student: studentForm.getValues(),
                parent: parentForm.getValues(),
                academics: academicsForm.getValues(),
                documents: attachedDocs,
                declaration: declarationForm.getValues(),
              }}
              onJumpToStep={(step) => setCurrentStep(step)}
              declarationAccepted={declarationForm.watch('declaration_accepted')}
              onToggleDeclaration={(val) => declarationForm.setValue('declaration_accepted', val)}
              declarationError={declarationForm.formState.errors.declaration_accepted?.message}
            />
          )}

          {/* Step 8: Confirmation */}
          {currentStep === 8 && submittedAppInfo && (
            <WizardStep8Confirmation
              applicationNumber={submittedAppInfo.applicationNumber}
              studentName={submittedAppInfo.studentName}
              gradeApplied={submittedAppInfo.gradeApplied}
              onGoToDashboard={() => router.replace('/(parent)' as any)}
              onGoToApplications={() => router.replace('/(parent)/applications' as any)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Step Controls */}
      {currentStep < 8 && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDark ? '#0F172A' : DESIGN_TOKENS.colors.surface,
              borderTopColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.border,
              paddingBottom: bottomActionPadding,
            },
          ]}
        >
          {currentStep > 1 && (
            <Button
              title="Previous"
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onPress={handleBack}
              style={{ flex: 1 }}
            />
          )}

          {currentStep < 7 ? (
            <Button
              title="Continue"
              variant="primary"
              size="md"
              onPress={handleNext}
              style={{ flex: currentStep === 1 ? 1 : 2 }}
            />
          ) : (
            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit Application'}
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleFinalSubmit}
              style={{ flex: 2 }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: DESIGN_TOKENS.radius.input,
    borderWidth: 1,
  },
  saveDraftButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    marginLeft: 6,
  },
  submittingOverlay: {
    padding: 24,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submittingTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  submittingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
});
