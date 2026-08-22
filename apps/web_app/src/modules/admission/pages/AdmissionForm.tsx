import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { admissionApi } from '../admission.api';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../lib/api-client';
import {
  ArrowLeft,
  Save,
  Send,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Building,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { MasterDataService } from '../services/MasterDataService';
import { ApplicationFeedbackModal } from '../components/ApplicationFeedbackModal';
import { isValidPhoneNumber, isValidEmail } from '@edutrack/validation';
import { PhoneInput } from '@/components/ui/phone-input';

export const AdmissionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('draft');
  const [submitted, setSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const location = useLocation();
  const isPublicRoute = location.pathname.includes('/admissions/apply');
  const treatAsGuest = !isAuthenticated || (isPublicRoute && !user?.roles?.includes('PARENT'));

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'validation';
    title: string;
    message: string;
    details?: string;
    applicationNumber?: string;
    invalidCount?: number;
  }>({
    isOpen: false,
    type: 'validation',
    title: '',
    message: '',
  });

  // Dynamic Metadata Lists State
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [academicYearsList, setAcademicYearsList] = useState<any[]>([]);
  const [gradesList, setGradesList] = useState<any[]>([]);

  // Static Relationships Lookup
  const relationships = MasterDataService.getRelationships();

  // Canonical Form State
  const [formData, setFormData] = useState<any>({
    school_id: '',
    academic_year_id: '',
    academic_year_grade_id: '',
    grade_id: '',
    grade_applied_for: '',
    curriculum_preference: 'CBSE',

    student_first_name: '',
    student_last_name: '',
    date_of_birth: '',
    gender: 'male',
    scholarship_interest: false,
    remarks: '',

    parent_first_name: '',
    parent_last_name: '',
    contact_relationship: 'father',
    contact_phone: '',
    contact_email: '',
    parent_password: '',
  });

  const [regData, setRegData] = useState({
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Load active schools metadata
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await apiClient.get('/schools');
        setSchoolsList(res.data || []);
        if (res.data && res.data.length > 0 && !formData.school_id) {
          setFormData((prev: any) => ({ ...prev, school_id: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load schools metadata:', err);
      }
    };
    fetchSchools();
  }, []);

  // 2. Fetch dependent academic years & deduplicated grades when selected school_id or academic_year_id changes
  useEffect(() => {
    if (!formData.school_id) return;
    const fetchSchoolDependentData = async () => {
      try {
        // Fetch public academic years for selected school
        const yearsRes = await apiClient.get('/public/academic-years', {
          params: { school_id: formData.school_id },
        });
        setAcademicYearsList(yearsRes.data || []);

        const activeYear = yearsRes.data?.find((y: any) => y.is_active) || yearsRes.data?.[0];
        const targetYearId = activeYear?.id || '';

        if (targetYearId && !formData.academic_year_id) {
          setFormData((prev: any) => ({ ...prev, academic_year_id: targetYearId }));
        }

        // Fetch public classes/grades scoped to academic_year_id (returns deduplicated academic_year_grades)
        const effectiveYearId = targetYearId || formData.academic_year_id;
        const gradesRes = await apiClient.get('/public/classes', {
          params: {
            school_id: formData.school_id,
            academic_year_id: effectiveYearId,
          },
        });

        const loadedGrades: any[] = gradesRes.data || [];
        const seenAyg = new Set<string>();
        const deduplicatedGrades: any[] = [];
        for (const g of loadedGrades) {
          const aygId = g.academic_year_grade_id || g.id || g.grade_id;
          const gradeKey = `${g.grade_name || g.name}_${g.board || ''}`;
          if (aygId && !seenAyg.has(aygId) && !seenAyg.has(gradeKey)) {
            seenAyg.add(aygId);
            seenAyg.add(gradeKey);
            deduplicatedGrades.push(g);
          }
        }

        setGradesList(deduplicatedGrades);

        if (deduplicatedGrades.length > 0 && !formData.academic_year_grade_id) {
          const first = deduplicatedGrades[0];
          setFormData((prev: any) => ({
            ...prev,
            academic_year_grade_id: first.academic_year_grade_id || first.id,
            grade_id: first.grade_id || first.id,
            grade_applied_for: first.grade_name || first.name,
            curriculum_preference: first.board || 'CBSE',
          }));
        }
      } catch (err) {
        console.error('Failed to load school dependent public metadata:', err);
      }
    };
    fetchSchoolDependentData();
  }, [formData.school_id, formData.academic_year_id]);

  // 3. Load existing application details if editing in CRM
  useEffect(() => {
    if (authLoading) return;
    if (!id || !user) return;

    const loadApplication = async () => {
      setLoading(true);
      try {
        const { data } = await admissionApi.getCrmApplication(id);
        const mapped = data?.application ?? data;
        const enquiry = data?.enquiry ?? {};

        const sName = enquiry.student_name || '';
        const sParts = sName.split(' ');
        const sFirst = enquiry.student_first_name || sParts[0] || '';
        const sLast = enquiry.student_last_name || sParts.slice(1).join(' ') || '';

        const pName = enquiry.parent_name || '';
        const pParts = pName.split(' ');
        const pFirst = enquiry.parent_first_name || pParts[0] || '';
        const pLast = enquiry.parent_last_name || pParts.slice(1).join(' ') || '';

        setStatus((mapped?.status ?? 'draft').toLowerCase());
        setFormData({
          school_id: mapped.school_id ?? user?.school_id ?? '',
          academic_year_id: mapped.academic_year_id ?? '',
          academic_year_grade_id: enquiry.academic_year_grade_id ?? '',
          grade_id: mapped.grade_id ?? '',
          grade_applied_for: enquiry.grade_applied_for ?? '',
          curriculum_preference: enquiry.curriculum_preference ?? 'CBSE',

          student_first_name: sFirst,
          student_last_name: sLast,
          date_of_birth: enquiry.dob ? enquiry.dob.split('T')[0] : '',
          gender: (enquiry.gender || 'male').toLowerCase(),
          scholarship_interest: Boolean(enquiry.scholarship_interest),
          remarks: enquiry.remarks ?? '',

          parent_first_name: pFirst,
          parent_last_name: pLast,
          contact_relationship: (enquiry.contact_relationship || 'father').toLowerCase(),
          contact_phone: enquiry.contact_phone || enquiry.parent_phone || '',
          contact_email: enquiry.contact_email || enquiry.parent_email || '',
          parent_password: '',
        });
      } catch (err) {
        console.error('Failed to load application details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadApplication();
  }, [id, user, authLoading]);

  const isReadOnly = !['draft', 'DRAFT', 'in_progress', 'IN_PROGRESS'].includes(status);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    if (isReadOnly) return;
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleGradeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isReadOnly) return;
    const selectedAygId = e.target.value;
    const matched = gradesList.find((g) => (g.academic_year_grade_id || g.id) === selectedAygId);
    setFormData((prev: any) => ({
      ...prev,
      academic_year_grade_id: selectedAygId,
      grade_id: matched?.grade_id || selectedAygId,
      grade_applied_for: matched?.grade_name || matched?.name || '',
      curriculum_preference: matched?.board || 'CBSE',
    }));
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'parent_password') {
      setFormData((prev: any) => ({ ...prev, parent_password: value }));
    } else if (name === 'confirmPassword') {
      setRegData({ confirmPassword: value });
    }
    if (errors[name] || errors.parent_password) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.parent_password;
        delete updated.confirmPassword;
        return updated;
      });
    }
  };

  const handleSave = async (submitNow = false) => {
    if (isReadOnly || loading) return;

    // Front-end Validation
    const newErrors: Record<string, string> = {};
    if (!formData.student_first_name.trim())
      newErrors.student_first_name = 'Student first name is required.';
    if (!formData.parent_first_name.trim())
      newErrors.parent_first_name = 'Parent first name is required.';
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'Phone number is required.';
    } else if (!isValidPhoneNumber(formData.contact_phone)) {
      newErrors.contact_phone = 'Enter a valid phone number.';
    }
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required.';
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Email address is required.';
    } else if (!isValidEmail(formData.contact_email)) {
      newErrors.contact_email = 'Enter a valid email address.';
    }

    if (treatAsGuest) {
      if (!formData.parent_password || formData.parent_password.length < 6) {
        newErrors.parent_password = 'Password must be at least 6 characters.';
      }
      if (formData.parent_password !== regData.confirmPassword) {
        newErrors.parent_password = 'Passwords must match for account registration.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      const elem = document.querySelector(`[name="${firstKey}"]`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setFeedbackModal({
        isOpen: true,
        type: 'validation',
        title: 'Please Complete Required Fields',
        message: 'Some mandatory fields require your attention before submission.',
        invalidCount: Object.keys(newErrors).length,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (treatAsGuest) {
        // Public Guest Application Submission — Canonical DTO Contract
        const canonicalPayload = {
          school_id: formData.school_id,
          academic_year_id: formData.academic_year_id,
          academic_year_grade_id: formData.academic_year_grade_id,
          grade_id: formData.grade_id,
          student_first_name: formData.student_first_name.trim(),
          student_last_name: formData.student_last_name.trim() || undefined,
          date_of_birth: formData.date_of_birth,
          gender: (formData.gender || 'male').toLowerCase(),
          parent_first_name: formData.parent_first_name.trim(),
          parent_last_name: formData.parent_last_name.trim() || undefined,
          contact_phone: formData.contact_phone.trim(),
          contact_email: formData.contact_email.trim().toLowerCase(),
          contact_relationship: (formData.contact_relationship || 'father').toLowerCase(),
          parent_password: formData.parent_password,
          curriculum_preference: formData.curriculum_preference || 'CBSE',
          scholarship_interest: Boolean(formData.scholarship_interest),
          remarks: formData.remarks?.trim() || undefined,
        };

        console.log('[ADMISSION] Submitting public application', {
          school_id: canonicalPayload.school_id,
          academic_year_id: canonicalPayload.academic_year_id,
          academic_year_grade_id: canonicalPayload.academic_year_grade_id,
          grade_id: canonicalPayload.grade_id,
        });
        const res = await admissionApi.publicApply(canonicalPayload);
        const resultData = res.data?.application_number
          ? res.data
          : res.data?.data || res.data || {};
        const appNum =
          resultData?.application_number || resultData?.applicationNumber || 'APP-2026-00001';

        setSubmittedResult(resultData);
        setSubmitted(true);
        setFeedbackModal({
          isOpen: true,
          type: 'success',
          title: 'Application Submitted Successfully!',
          message: 'Your admission application has been logged into the portal.',
          applicationNumber: appNum,
        });
      } else {
        // Authenticated Parent/Staff Submission
        const isParent = user?.roles?.includes('PARENT');
        if (!id && isParent) {
          const canonicalPayload = {
            school_id: formData.school_id,
            academic_year_id: formData.academic_year_id,
            academic_year_grade_id: formData.academic_year_grade_id,
            grade_id: formData.grade_id,
            student_first_name: formData.student_first_name.trim(),
            student_last_name: formData.student_last_name.trim() || undefined,
            date_of_birth: formData.date_of_birth,
            gender: (formData.gender || 'male').toLowerCase(),
            parent_first_name: formData.parent_first_name.trim(),
            parent_last_name: formData.parent_last_name.trim() || undefined,
            contact_phone: formData.contact_phone.trim(),
            contact_email: formData.contact_email.trim().toLowerCase(),
            contact_relationship: (formData.contact_relationship || 'father').toLowerCase(),
            curriculum_preference: formData.curriculum_preference || 'CBSE',
            scholarship_interest: Boolean(formData.scholarship_interest),
            remarks: formData.remarks?.trim() || undefined,
          };
          await admissionApi.parentApply(canonicalPayload);
          navigate('/app/admissions/my');
          return;
        }

        let applicationId = id;
        if (!applicationId) {
          const createRes = await admissionApi.createCrmApplication({
            grade: formData.grade_applied_for,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
            student_name: `${formData.student_first_name} ${formData.student_last_name}`.trim(),
            academic_year_id: formData.academic_year_id,
          });
          applicationId = createRes.data?.id ?? createRes.data?.application?.id;
        }

        if (submitNow && applicationId) {
          await admissionApi.submitCrmApplication(applicationId);
        }

        navigate('/app/workspace');
      }
    } catch (err: any) {
      console.error('[ADMISSION] Submission failed:', err);

      let errorTitle = 'Application Not Submitted';
      let errorMessage = 'Something went wrong while submitting the application. Please try again.';
      let errorDetails: string | undefined = undefined;

      if (err?.code === 'ERR_NETWORK') {
        errorTitle = 'Connection Error';
        errorMessage =
          'Unable to connect to the server. Please check your connection and try again.';
      } else if (err?.code === 'ECONNABORTED') {
        errorTitle = 'Request Timeout';
        errorMessage = 'The request timed out. Please try again.';
      } else if (err?.response) {
        const status = err.response.status;
        const backendMsg =
          err.response.data?.message || err.response.data?.error || err.response.data?.details;

        if (status === 409) {
          errorTitle = 'Application Not Submitted';
          errorMessage =
            typeof backendMsg === 'string'
              ? backendMsg
              : 'Admissions have closed for this academic year.';
          errorDetails = 'Please contact the school office for further assistance.';
        } else if (status === 400) {
          errorTitle = 'Invalid Application Information';
          errorMessage =
            typeof backendMsg === 'string'
              ? backendMsg
              : 'Please check the information entered and try again.';
        } else if (status === 401) {
          errorTitle = 'Session Expired';
          errorMessage = 'Your session has expired. Please sign in again.';
        } else if (status === 403) {
          errorTitle = 'Permission Denied';
          errorMessage =
            typeof backendMsg === 'string'
              ? backendMsg
              : 'Online applications are currently disabled for this academic year.';
        } else if (status === 404) {
          errorTitle = 'Resource Not Found';
          errorMessage = 'The requested school or academic year resource could not be found.';
        } else if (status === 422) {
          errorTitle = 'Validation Error';
          errorMessage =
            typeof backendMsg === 'string' ? backendMsg : 'Invalid application details provided.';
        } else if (status >= 500) {
          errorTitle = 'Server Exception';
          errorMessage =
            'Something went wrong while processing your application on the server. Please try again.';
        }
      }

      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: errorTitle,
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-6 border border-blue-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900">Application Submitted!</h1>
            <p className="text-gray-600">
              Your application has been logged into the admissions portal.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-100 space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-blue-200">
              <span className="text-xs font-bold uppercase text-gray-500">Application Number</span>
              <span className="text-lg font-black text-blue-700 tracking-wide">
                {submittedResult?.application_number ||
                  submittedResult?.applicationNumber ||
                  'APP-2026-PENDING'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Applicant Student</span>
              <span className="font-bold text-gray-900">
                {formData.student_first_name} {formData.student_last_name}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Parent Email</span>
              <span className="font-bold text-gray-900">{formData.contact_email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 font-extrabold rounded-full text-xs uppercase">
                Submitted
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105"
            >
              Log In to Parent Portal
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-all duration-300 hover:gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium">Back</span>
        </button>

        {/* Read-Only Alert */}
        {isReadOnly && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-amber-100">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-900">Application Locked</p>
              <p className="text-sm text-amber-700">
                This application is{' '}
                <strong className="uppercase">{status.replace('_', ' ')}</strong>. No further edits
                can be made.
              </p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500">
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-10 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-7 h-7" />
                </div>
                Public Admission Application
              </h1>
              <p className="text-blue-100 text-base md:text-lg font-medium">
                Apply for student admission under the certified Stage-1 EduTrack platform.
              </p>
            </div>
          </div>

          {/* Form Layout Container */}
          <div className="p-8 sm:p-12 space-y-10">
            {/* Section 1: School & Academic Selection */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">1. School & Academic Selection</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    School *
                  </label>
                  <select
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleChange}
                    disabled={isReadOnly || !!id}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                    required
                  >
                    {schoolsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Academic Year *
                  </label>
                  <select
                    name="academic_year_id"
                    value={formData.academic_year_id}
                    onChange={handleChange}
                    disabled={isReadOnly || !!id}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                    required
                  >
                    {academicYearsList.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Applying Grade *
                  </label>
                  <select
                    name="academic_year_grade_id"
                    value={formData.academic_year_grade_id}
                    onChange={handleGradeSelect}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                    required
                  >
                    {gradesList.map((g) => (
                      <option
                        key={g.academic_year_grade_id || g.id}
                        value={g.academic_year_grade_id || g.id}
                      >
                        {g.grade_name || g.name} {g.board ? `(${g.board})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Curriculum / Board (Derived)
                  </label>
                  <input
                    type="text"
                    name="curriculum_preference"
                    value={formData.curriculum_preference}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-semibold outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Student Information & Admission Preferences */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-green-100">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  2. Student Details & Preferences
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Student First Name *
                  </label>
                  <input
                    type="text"
                    name="student_first_name"
                    value={formData.student_first_name}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    aria-invalid={!!errors.student_first_name}
                    aria-describedby={
                      errors.student_first_name ? 'student_first_name-error' : undefined
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.student_first_name ? 'border-red-500 bg-red-50/20' : 'border-gray-200'}`}
                    placeholder="First name"
                    required
                  />
                  {errors.student_first_name && (
                    <p id="student_first_name-error" className="text-xs text-red-600 font-medium">
                      {errors.student_first_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Student Last Name
                  </label>
                  <input
                    type="text"
                    name="student_last_name"
                    value={formData.student_last_name}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                    placeholder="Last name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    aria-invalid={!!errors.date_of_birth}
                    aria-describedby={errors.date_of_birth ? 'date_of_birth-error' : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.date_of_birth ? 'border-red-500 bg-red-50/20' : 'border-gray-200'}`}
                    required
                  />
                  {errors.date_of_birth && (
                    <p id="date_of_birth-error" className="text-xs text-red-600 font-medium">
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2 flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="scholarship_interest"
                    name="scholarship_interest"
                    checked={Boolean(formData.scholarship_interest)}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="scholarship_interest"
                    className="text-sm font-bold text-gray-800 cursor-pointer"
                  >
                    Interested in Merit / Need-Based Financial Scholarship Assistance
                  </label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Remarks / Special Notes
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                    placeholder="Any additional notes or requests"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Parent / Guardian Information & Account Credentials */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">3. Parent / Guardian Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Parent First Name *
                  </label>
                  <input
                    type="text"
                    name="parent_first_name"
                    value={formData.parent_first_name}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    aria-invalid={!!errors.parent_first_name}
                    aria-describedby={
                      errors.parent_first_name ? 'parent_first_name-error' : undefined
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.parent_first_name ? 'border-red-500 bg-red-50/20' : 'border-gray-200'}`}
                    placeholder="First name"
                    required
                  />
                  {errors.parent_first_name && (
                    <p id="parent_first_name-error" className="text-xs text-red-600 font-medium">
                      {errors.parent_first_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Parent Last Name
                  </label>
                  <input
                    type="text"
                    name="parent_last_name"
                    value={formData.parent_last_name}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                    placeholder="Last name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Relationship *
                  </label>
                  <select
                    name="contact_relationship"
                    value={formData.contact_relationship}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Phone Number *
                  </label>
                  <PhoneInput
                    value={formData.contact_phone}
                    onChange={(val) =>
                      setFormData((prev: any) => ({ ...prev, contact_phone: val }))
                    }
                    disabled={isReadOnly}
                    aria-invalid={!!errors.contact_phone}
                  />
                  {errors.contact_phone && (
                    <p id="contact_phone-error" className="text-xs text-red-600 font-medium">
                      {errors.contact_phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    aria-invalid={!!errors.contact_email}
                    aria-describedby={errors.contact_email ? 'contact_email-error' : undefined}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.contact_email ? 'border-red-500 bg-red-50/20' : 'border-gray-200'}`}
                    placeholder="e.g. parent@example.com"
                    required
                  />
                  {errors.contact_email && (
                    <p id="contact_email-error" className="text-xs text-red-600 font-medium">
                      {errors.contact_email}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Account Password Registration Section (Only for Guest applicants) */}
            {treatAsGuest && !id && (
              <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-100 shadow-inner space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">4. Account Registration</h2>
                </div>

                <div className="p-4 bg-blue-100/50 border border-blue-200 rounded-xl text-sm text-blue-800 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span>Create a parent portal password to track your application status.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase block">
                      Choose Password *
                    </label>
                    <input
                      type="password"
                      name="parent_password"
                      value={formData.parent_password}
                      onChange={handleRegChange}
                      aria-invalid={!!errors.parent_password}
                      aria-describedby={
                        errors.parent_password ? 'parent_password-error' : undefined
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.parent_password ? 'border-red-500 bg-red-50/20' : 'border-blue-200'}`}
                      placeholder="Enter password (min 6 chars)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900 uppercase block">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={regData.confirmPassword}
                      onChange={handleRegChange}
                      aria-invalid={!!errors.parent_password}
                      aria-describedby={
                        errors.parent_password ? 'parent_password-error' : undefined
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.parent_password ? 'border-red-500 bg-red-50/20' : 'border-blue-200'}`}
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>
                {errors.parent_password && (
                  <p id="parent_password-error" className="text-xs text-red-600 font-medium">
                    {errors.parent_password}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Action Footer */}
          {!isReadOnly && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-8 flex flex-col sm:flex-row justify-end gap-4 border-t-2 border-gray-100">
              {isAuthenticated && !isPublicRoute && (
                <button
                  onClick={() => handleSave(false)}
                  disabled={loading}
                  className="group px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border-2 border-gray-200 font-bold transition-all duration-300 hover:border-gray-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Save Draft
                </button>
              )}
              <button
                onClick={() => handleSave(true)}
                disabled={loading}
                className="group px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    {treatAsGuest ? 'Apply for Admission' : 'Submit Application'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Feedback Modal */}
      <ApplicationFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        details={feedbackModal.details}
        applicationNumber={feedbackModal.applicationNumber}
        invalidCount={feedbackModal.invalidCount}
      />
    </div>
  );
};
