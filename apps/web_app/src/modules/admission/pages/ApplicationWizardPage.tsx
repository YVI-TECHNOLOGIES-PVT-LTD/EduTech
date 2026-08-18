import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { apiClient } from '../../../lib/api-client';
import { ParentWizardSidebar } from '../components/parent/ParentWizardSidebar';
import { ParentInstructionsStep } from './parent/ParentInstructionsStep';
import { ParentStudentDetailsStep } from './parent/ParentStudentDetailsStep';
import { ParentDetailsStep } from './parent/ParentDetailsStep';
import { ParentAcademicsStep } from './parent/ParentAcademicsStep';
import { ParentDocumentsStep } from './parent/ParentDocumentsStep';
import { ParentFeePaymentStep } from './parent/ParentFeePaymentStep';
import { ParentReviewSubmitStep } from './parent/ParentReviewSubmitStep';
import { ParentConfirmationStep } from './parent/ParentConfirmationStep';
import { admissionApi } from '../admission.api';
import { PageContainer, PageHeader, PageErrorState } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';

const DRAFT_KEY_PREFIX = 'edutrack_parent_app_draft_';

const isUuid = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function ApplicationWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appIdParam = searchParams.get('app_id');
  const stepParam = searchParams.get('step');
  const initialStep = stepParam ? parseInt(stepParam, 10) : 1;

  const { user } = useAuthStore();
  const userId = user?.id || user?.user_id || 'anonymous';

  const [currentStep, setCurrentStep] = useState(
    initialStep >= 1 && initialStep <= 8 ? initialStep : 1,
  );
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    const s = searchParams.get('step');
    if (s) {
      const parsed = parseInt(s, 10);
      if (parsed >= 1 && parsed <= 8) {
        setCurrentStep(parsed);
      }
    }
  }, [searchParams]);

  // Metadata dropdown state
  const [schools, setSchools] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    school_id: '',
    academic_year_id: '',
    academic_year_grade_id: '',
    grade_id: '',
    grade_applied_for: 'Grade 1',
    curriculum_preference: 'CBSE',
    student_first_name: '',
    student_last_name: '',
    date_of_birth: '',
    gender: 'male',
    nationality: 'Indian',
    parent_name: user?.full_name || user?.name || '',
    parent_email: user?.email || '',
    parent_phone: user?.phone || '',
    parent_occupation: '',
    contact_relationship: 'father',
    previous_school_name: '',
    previous_school_address: '',
    previous_school_board: '',
    previous_grade: '',
    previous_school_year: '',
    payment_mode: 'ONLINE',
    declaration_accepted: false,
  });

  // Uploaded Documents state
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { file_name: string; file_size: string }>
  >({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  // Final Submitted Application State (Screen 08)
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  // Load Metadata on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMeta(true);
      try {
        let loadedSchools: any[] = [];
        try {
          const configRes = await apiClient.get('/public/admission/config');
          if (configRes.data?.schools && configRes.data.schools.length > 0) {
            loadedSchools = configRes.data.schools;
          }
        } catch (e) {
          // fallback
        }

        if (loadedSchools.length === 0) {
          try {
            const schoolsRes = await apiClient.get('/v1/schools');
            if (Array.isArray(schoolsRes.data) && schoolsRes.data.length > 0) {
              loadedSchools = schoolsRes.data;
            }
          } catch (e) {
            // fallback
          }
        }

        if (loadedSchools.length > 0) {
          setSchools(loadedSchools);
          const initialSchoolId = loadedSchools[0].id;
          setFormData((prev: any) => ({
            ...prev,
            school_id: prev.school_id || initialSchoolId,
          }));
        }
      } catch (err) {
        console.warn('Could not load public admission config', err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Academic Years when school_id changes
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const targetSchoolId =
          formData.school_id && formData.school_id !== 'school-main'
            ? formData.school_id
            : schools.length > 0
              ? schools[0].id
              : undefined;

        let res: any;
        if (targetSchoolId) {
          res = await apiClient.get('/public/academic-years', {
            params: { school_id: targetSchoolId },
          });
        } else {
          // Fallback to public current academic year endpoint
          const singleRes = await apiClient.get('/public/academic-year');
          if (singleRes.data) {
            res = {
              data: [
                { id: singleRes.data.id, year_label: singleRes.data.year_label, is_active: true },
              ],
            };
          }
        }

        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setAcademicYears(res.data);
          const activeYear = res.data.find((y: any) => y.is_active) || res.data[0];
          setFormData((prev: any) => ({
            ...prev,
            academic_year_id: prev.academic_year_id || activeYear.id,
          }));
        }
      } catch (err) {
        console.error('Failed to load academic years', err);
      }
    };
    fetchYears();
  }, [formData.school_id, schools]);

  // Fetch Classes when academic_year_id changes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const params: any = {};
        if (formData.school_id && formData.school_id !== 'school-main') {
          params.school_id = formData.school_id;
        }
        if (formData.academic_year_id && formData.academic_year_id !== 'ay-2026') {
          params.academic_year_id = formData.academic_year_id;
        }
        const res = await apiClient.get('/public/classes', { params });
        if (Array.isArray(res.data)) {
          setClasses(res.data);
          if (res.data.length > 0 && !formData.grade_applied_for) {
            setFormData((prev: any) => ({
              ...prev,
              academic_year_grade_id:
                prev.academic_year_grade_id || res.data[0].academic_year_grade_id || res.data[0].id,
              grade_id: prev.grade_id || res.data[0].grade_id || res.data[0].id,
              grade_applied_for:
                prev.grade_applied_for || res.data[0].name || res.data[0].grade_name,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    fetchClasses();
  }, [formData.school_id, formData.academic_year_id]);

  // Safe Restore Draft on Mount
  useEffect(() => {
    const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData && typeof parsed.formData === 'object') {
          setFormData((prev: any) => {
            const merged = { ...prev };
            Object.keys(parsed.formData).forEach((key) => {
              const val = parsed.formData[key];
              if (val !== undefined && val !== null && val !== '') {
                merged[key] = val;
              }
            });
            return merged;
          });
        }
        if (parsed.uploadedDocs) setUploadedDocs(parsed.uploadedDocs);
        if (parsed.instructionsAccepted) setInstructionsAccepted(parsed.instructionsAccepted);
      } catch (e) {
        console.warn('Could not parse saved application draft', e);
      }
    }
  }, [userId]);

  // Save Draft to LocalStorage
  const handleSaveDraft = () => {
    const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        formData,
        uploadedDocs,
        currentStep,
        instructionsAccepted,
        savedAt: new Date().toISOString(),
      }),
    );
  };

  const handleNext = () => {
    handleSaveDraft();
    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // File Upload Handler - retains actual File objects in state for real upload
  const handleFileUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum allowed limit of 10MB.');
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
    setUploadedDocs((prev) => ({
      ...prev,
      [docType]: { file_name: file.name, file_size: `${sizeMb} MB` },
    }));
  };

  const handleRemoveDoc = (docType: string) => {
    setSelectedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
    setUploadedDocs((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
  };

  // Final Application Submission (Screen 07 -> Screen 08)
  const [submissionProgress, setSubmissionProgress] = useState<string | null>(null);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  const handleSubmitApplication = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionProgress('Validating application data...');

    // DYNAMIC MANDATORY DOCUMENT VALIDATION:
    try {
      const dtRes = await admissionApi.getDocumentTypes(
        createdAppId
          ? { application_id: createdAppId }
          : isUuid(formData.school_id)
            ? { org_id: formData.school_id }
            : undefined,
      );
      const mandatoryDocTypes = Array.isArray(dtRes.data)
        ? dtRes.data.filter((dt: any) => dt.is_mandatory)
        : [];

      const missingFileDocs: string[] = [];
      for (const mDoc of mandatoryDocTypes) {
        const hasFile =
          selectedFiles[mDoc.document_type_id] ||
          selectedFiles[mDoc.document_name] ||
          selectedFiles[mDoc.document_name.toLowerCase().replace(/[^a-z0-9]/g, '_')];

        if (!hasFile) {
          missingFileDocs.push(mDoc.document_name);
        }
      }

      if (missingFileDocs.length > 0) {
        setSubmitError(
          `File binary missing for required document(s): ${missingFileDocs.join(', ')}. Please return to Step 5 and re-select the file(s) before submitting.`,
        );
        setIsSubmitting(false);
        setSubmissionProgress(null);
        return;
      }
    } catch (e) {
      console.warn('Could not fetch mandatory document types for validation', e);
    }

    try {
      let targetAppId = createdAppId;
      let appData: any = null;

      // Step 1: Create Application record if not already created
      if (!targetAppId) {
        setSubmissionProgress('Creating application record...');

        const payload = {
          school_id: isUuid(formData.school_id) ? formData.school_id : undefined,
          org_id: isUuid(formData.school_id) ? formData.school_id : undefined,
          academic_year_id: isUuid(formData.academic_year_id)
            ? formData.academic_year_id
            : undefined,
          academic_year_grade_id: isUuid(formData.academic_year_grade_id)
            ? formData.academic_year_grade_id
            : undefined,
          grade_id: isUuid(formData.grade_id) ? formData.grade_id : undefined,
          grade_applied_for: formData.grade_applied_for,
          grade: formData.grade_applied_for || formData.grade_id || 'Grade 1',
          curriculum_preference: formData.curriculum_preference,
          student_first_name: (formData.student_first_name || '').trim(),
          student_last_name: (formData.student_last_name || '').trim(),
          student_name:
            `${formData.student_first_name || ''} ${formData.student_last_name || ''}`.trim(),
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          nationality: (formData.nationality || 'Indian').trim(),
          parent_name: (formData.parent_name || '').trim(),
          parent_email: (formData.parent_email || '').trim(),
          parent_phone: (formData.parent_phone || '').trim(),
          contact_relationship: formData.contact_relationship,
          previous_school_name:
            (formData.previous_school_name || formData.previous_school || '').trim() || undefined,
          previous_school_address: (formData.previous_school_address || '').trim() || undefined,
          previous_school_board: formData.previous_school_board || undefined,
          previous_grade: (formData.previous_grade || '').trim() || undefined,
          previous_school_year: (formData.previous_school_year || '').trim() || undefined,
          status: 'submitted',
        };

        const res = await apiClient.post('/v1/applications', payload);
        appData = res.data;
        targetAppId =
          appData.application_id ||
          appData.id ||
          appData.application?.application_id ||
          appData.application?.id;

        if (!targetAppId) {
          throw new Error('Failed to resolve created application ID from server response.');
        }

        setCreatedAppId(targetAppId);
      }

      // Step 2: Binary Document Uploads to Supabase Storage
      const fileEntries = Object.entries(selectedFiles);
      const failedDocs: string[] = [];
      const totalDocs = fileEntries.length;

      for (let i = 0; i < totalDocs; i++) {
        const [docTypeId, fileObj] = fileEntries[i];
        setSubmissionProgress(`Uploading documents (${i + 1} of ${totalDocs})...`);

        try {
          const formDataBody = new FormData();
          formDataBody.append('file', fileObj);
          if (isUuid(docTypeId)) {
            formDataBody.append('document_type_id', docTypeId);
          }
          formDataBody.append('document_code', docTypeId);
          formDataBody.append('document_type', docTypeId);

          await apiClient.post(`/v1/applications/${targetAppId}/documents`, formDataBody, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr: any) {
          console.error(`Document upload failed for ${docTypeId}:`, uploadErr);
          failedDocs.push(docTypeId);
        }
      }

      // STRICT TRANSACTION INVARIANT: IF ANY DOCUMENT UPLOAD FAILED, BLOCK SUCCESS NAVIGATION
      if (failedDocs.length > 0) {
        setSubmitError(
          `Application record created (${targetAppId.substring(0, 8)}...), but document upload failed for ${failedDocs.length} document(s). Please click "Retry Document Upload" to complete submission.`,
        );
        setIsSubmitting(false);
        setSubmissionProgress(null);
        return; // BLOCK SUCCESS NAVIGATION
      }

      // Clear draft ONLY upon complete successful submission
      const draftKey = `${DRAFT_KEY_PREFIX}${userId}`;
      localStorage.removeItem(draftKey);

      const serverAppNo =
        appData?.application_number ||
        appData?.application?.application_number ||
        appData?.data?.application_number ||
        targetAppId;

      setSubmittedApp({
        id: targetAppId,
        application_number: serverAppNo,
        status: appData?.status || 'submitted',
        created_at: new Date().toISOString(),
        student_name:
          `${formData.student_first_name || ''} ${formData.student_last_name || ''}`.trim(),
        grade_applied_for: formData.grade_applied_for,
      });

      setCurrentStep(8);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Application Submission Error:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit application. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress(null);
    }
  };

  return (
    <PageContainer variant="default">
      {currentStep < 8 && (
        <PageHeader
          title="Admission Application Wizard"
          description="Complete the official online enrollment application for your child."
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase text-indigo-600 border-indigo-200"
            >
              Parent Self-Service Portal
            </Badge>
          }
        />
      )}

      {currentStep === 8 && submittedApp ? (
        /* Screen 08 Confirmation */
        <ParentConfirmationStep submittedApp={submittedApp} />
      ) : (
        <div className="space-y-6 w-full">
          {/* Top Horizontal Progress Stepper Card */}
          <ParentWizardSidebar
            currentStep={currentStep}
            onStepClick={(stepId) => setCurrentStep(stepId)}
            isReadOnly={isReadOnly}
            appNumber={submittedApp?.application_number || 'APP-2026-00368'}
          />

          {/* Full-Width Form Step Content Workspace */}
          <div className="w-full">
            {currentStep === 1 && (
              <ParentInstructionsStep
                onNext={handleNext}
                accepted={instructionsAccepted}
                setAccepted={setInstructionsAccepted}
              />
            )}

            {currentStep === 2 && (
              <ParentStudentDetailsStep
                formData={formData}
                setFormData={setFormData}
                onNext={handleNext}
                onBack={handleBack}
                isReadOnly={isReadOnly}
              />
            )}

            {currentStep === 3 && (
              <ParentDetailsStep
                formData={formData}
                setFormData={setFormData}
                onNext={handleNext}
                onBack={handleBack}
                isReadOnly={isReadOnly}
              />
            )}

            {currentStep === 4 && (
              <ParentAcademicsStep
                formData={formData}
                setFormData={setFormData}
                classes={classes}
                schools={schools}
                academicYears={academicYears}
                onNext={handleNext}
                onBack={handleBack}
                isReadOnly={isReadOnly}
              />
            )}

            {currentStep === 5 && (
              <ParentDocumentsStep
                applicationId={createdAppId || undefined}
                orgId={isUuid(formData.school_id) ? formData.school_id : undefined}
                schoolId={isUuid(formData.school_id) ? formData.school_id : undefined}
                uploadedDocs={uploadedDocs}
                selectedFiles={selectedFiles}
                onFileUpload={handleFileUpload}
                onRemoveDoc={handleRemoveDoc}
                onNext={handleNext}
                onBack={handleBack}
                isReadOnly={isReadOnly}
              />
            )}

            {currentStep === 6 && (
              <ParentFeePaymentStep
                formData={formData}
                setFormData={setFormData}
                onNext={handleNext}
                onBack={handleBack}
                isReadOnly={isReadOnly}
              />
            )}

            {currentStep === 7 && (
              <ParentReviewSubmitStep
                formData={formData}
                setFormData={setFormData}
                uploadedDocs={uploadedDocs}
                onJumpToStep={(stepId) => setCurrentStep(stepId)}
                onSubmit={handleSubmitApplication}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ApplicationWizardPage;
