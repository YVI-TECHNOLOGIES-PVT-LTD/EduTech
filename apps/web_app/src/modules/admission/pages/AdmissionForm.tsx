import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { admissionApi } from '../admission.api';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../lib/api-client';
import { ArrowLeft, Save, Send, User, Phone, Clock, AlertCircle, CheckCircle, Building, MapPin, ShieldAlert, Award } from 'lucide-react';
import { MasterDataService } from '../services/MasterDataService';

export const AdmissionForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('draft');
    const [submitted, setSubmitted] = useState(false);
    const location = useLocation();
    const isPublicRoute = location.pathname.includes('/admissions/apply');
    const treatAsGuest = !isAuthenticated || (isPublicRoute && !user?.roles?.includes('PARENT'));

    // Dynamic Lists State
    const [schoolsList, setSchoolsList] = useState<any[]>([]);
    const [academicYearsList, setAcademicYearsList] = useState<any[]>([]);
    const [gradesList, setGradesList] = useState<any[]>([]);
    const [transportRoutesList, setTransportRoutesList] = useState<any[]>([]);
    const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);

    // Static Lookups from MasterDataService
    const boards = MasterDataService.getBoards();
    const quotas = MasterDataService.getQuotas();
    const categories = MasterDataService.getCategories();
    const bloodGroups = MasterDataService.getBloodGroups();
    const religions = MasterDataService.getReligions();
    const occupations = MasterDataService.getOccupations();
    const relationships = MasterDataService.getRelationships();
    const countries = MasterDataService.getCountries();
    const states = MasterDataService.getStates();
    const cities = MasterDataService.getCities();
    const hostelRoomTypes = MasterDataService.getHostelRoomTypes();

    const [formData, setFormData] = useState<any>({
        school_id: '',
        academic_year_id: '',
        grade_applied_for: '',
        board: 'CBSE',
        quota: 'Regular',
        fee_structure_id: '',
        
        student_name: '',
        date_of_birth: '',
        gender: 'Male',
        parent_name: '',
        relationship: 'Father',
        occupation: 'Salaried',
        phone: '',
        email: '',
        
        religion: 'Hindu',
        category: 'General',
        blood_group: 'A+',
        country: 'India',
        state: 'Telangana',
        city: 'Hyderabad',
        previous_school: '',
        last_grade_completed: '',
        address: '',
        
        transport_route_id: '',
        hostel_room_type: 'Single (Non-AC)',
        parent_password: ''
    });

    const [regData, setRegData] = useState({
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // 1. Initial Load of Schools
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

    // 2. Fetch Dependent Metadata when selected school_id changes
    useEffect(() => {
        if (!formData.school_id) return;
        const fetchSchoolDependentData = async () => {
            try {
                // Fetch public academic years
                const yearsRes = await apiClient.get('/public/academic-years', { params: { school_id: formData.school_id } });
                setAcademicYearsList(yearsRes.data || []);
                const activeYear = yearsRes.data?.find((y: any) => y.is_active);
                if (activeYear && !formData.academic_year_id) {
                    setFormData((prev: any) => ({ ...prev, academic_year_id: activeYear.id }));
                } else if (yearsRes.data?.length > 0 && !formData.academic_year_id) {
                    setFormData((prev: any) => ({ ...prev, academic_year_id: yearsRes.data[0].id }));
                }

                // Fetch public classes/grades
                const gradesRes = await apiClient.get('/public/classes', { params: { school_id: formData.school_id } });
                setGradesList(gradesRes.data || []);
                if (gradesRes.data?.length > 0 && !formData.grade_applied_for) {
                    setFormData((prev: any) => ({ ...prev, grade_applied_for: gradesRes.data[0].name }));
                }

                // Fetch public transport routes
                const transportRes = await apiClient.get('/public/transport-routes', { params: { school_id: formData.school_id } });
                setTransportRoutesList(transportRes.data || []);
                if (transportRes.data?.length > 0 && !formData.transport_route_id) {
                    setFormData((prev: any) => ({ ...prev, transport_route_id: transportRes.data[0].id }));
                }

                // Fetch public fee structures
                const feesRes = await apiClient.get('/public/fee-structures', { params: { school_id: formData.school_id } });
                setFeeStructuresList(feesRes.data || []);
                if (feesRes.data?.length > 0 && !formData.fee_structure_id) {
                    setFormData((prev: any) => ({ ...prev, fee_structure_id: feesRes.data[0].id }));
                }
            } catch (err) {
                console.error('Failed to load school dependent public metadata:', err);
            }
        };
        fetchSchoolDependentData();
    }, [formData.school_id]);

    // 3. Load Existing CRM Application details if editing (for authenticated staff/parents)
    useEffect(() => {
        if (authLoading) return;
        if (!id || !user) return;

        const loadApplication = async () => {
            setLoading(true);
            try {
                const { data } = await admissionApi.getCrmApplication(id);
                const mapped = data?.application ?? data;
                const enquiry = data?.enquiry ?? {};
                const profile = data?.profile ?? {};
                const parents = data?.parents ?? {};
                const education = data?.previous_education ?? {};
                const remarksObj = enquiry.remarks ? JSON.parse(enquiry.remarks) : {};

                setStatus((mapped?.status ?? 'draft').toLowerCase());
                setFormData({
                    school_id: mapped.school_id ?? user?.school_id ?? '',
                    academic_year_id: mapped.academic_year_id ?? '',
                    grade_applied_for: enquiry.grade_applied_for ?? '',
                    board: remarksObj.board ?? 'CBSE',
                    quota: remarksObj.quota ?? 'Regular',
                    fee_structure_id: remarksObj.fee_structure_id ?? '',
                    
                    student_name: enquiry.student_name ?? '',
                    date_of_birth: profile.date_of_birth ?? enquiry.date_of_birth ?? '',
                    gender: profile.gender ?? enquiry.gender ?? 'Male',
                    parent_name: enquiry.parent_name ?? (parents.father_name || parents.mother_name || ''),
                    relationship: remarksObj.relationship ?? 'Father',
                    occupation: remarksObj.occupation ?? 'Salaried',
                    phone: enquiry.parent_phone ?? (parents.father_phone || parents.mother_phone || ''),
                    email: enquiry.parent_email ?? (parents.father_email || parents.mother_email || ''),
                    
                    religion: remarksObj.religion ?? 'Hindu',
                    category: remarksObj.category ?? 'General',
                    blood_group: remarksObj.blood_group ?? 'A+',
                    country: remarksObj.country ?? 'India',
                    state: remarksObj.state ?? 'Telangana',
                    city: remarksObj.city ?? 'Hyderabad',
                    previous_school: education.school_name ?? enquiry.current_school ?? '',
                    last_grade_completed: education.last_class ?? '',
                    address: enquiry.address ?? '',
                    
                    transport_route_id: remarksObj.transport_route_id ?? '',
                    hostel_room_type: remarksObj.hostel_room_type ?? 'Single (Non-AC)',
                    parent_password: ''
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (isReadOnly) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === 'confirmPassword') {
            setRegData({ confirmPassword: e.target.value });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSave = async (isSubmit = false) => {
        if (isReadOnly) return;

        // Front-end Validation
        const newErrors: Record<string, string> = {};
        if (formData.student_name.trim().length < 2) newErrors.student_name = 'Required (min 2 chars)';
        if (formData.parent_name.trim().length < 2) newErrors.parent_name = 'Required (min 2 chars)';
        if (!/^\+?[0-9]{10,15}$/.test(formData.phone.trim())) newErrors.phone = 'Invalid phone number';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';

        if (treatAsGuest) {
            if (!formData.parent_password || formData.parent_password !== regData.confirmPassword) {
                newErrors.parent_password = 'Passwords must match for account registration';
            }
        }

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            alert('Please fix the errors before submitting the application.');
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            if (treatAsGuest) {
                // Public Guest Application Submission
                const payload = {
                    ...formData,
                    parent_email: formData.email.trim(),
                    parent_name: formData.parent_name.trim(),
                    parent_phone: formData.phone.trim(),
                };
                console.log('[ADMISSION] Calling publicApply...', payload);
                await admissionApi.publicApply(payload);
                setSubmitted(true);
            } else {
                // Logged-in parent/staff application
                const isParent = user?.roles?.includes('PARENT');
                if (!id && isParent) {
                    const payload = {
                        ...formData,
                        parent_email: formData.email.trim(),
                        parent_name: formData.parent_name.trim(),
                        parent_phone: formData.phone.trim(),
                    };
                    await admissionApi.parentApply(payload);
                    navigate('/app/admissions/my');
                    return;
                }

                let applicationId = id;
                if (!applicationId) {
                    const createRes = await admissionApi.createCrmApplication({
                        lead_id: formData.lead_id,
                        grade: formData.grade_applied_for,
                        date_of_birth: formData.date_of_birth,
                        gender: formData.gender,
                        student_name: formData.student_name,
                        academic_year_id: formData.academic_year_id,
                    });
                    applicationId = createRes.data?.id ?? createRes.data?.application?.id;
                }

                if (isSubmit && applicationId) {
                    await admissionApi.submitCrmApplication(applicationId, {
                        change_reason: 'Application submitted via portal',
                    });
                }
                navigate('/app/admissions/my');
            }
        } catch (err: any) {
            console.error('[ADMISSION] Application submit error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Failed to submit application';
            alert(errMsg);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-blue-100 p-10 text-center transform animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200 animate-bounce">
                        <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Application Received!
                    </h2>
                    <div className="space-y-4 text-gray-600 mb-10">
                        <p className="text-lg font-semibold text-green-600">✅ Successfully Submitted</p>
                        <p className="leading-relaxed font-medium">Our admissions team will review your application. An active lead is automatically converted in the Inquiry Desk.</p>
                        <p className="font-medium text-blue-600 bg-blue-50 py-2 px-4 rounded-lg">
                            Log in using your registered parent email to track progress
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                    >
                        Go to Login Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
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
                    <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-amber-100 animate-in slide-in-from-top duration-500">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900">Application Locked</p>
                            <p className="text-sm text-amber-700">
                                This application is <strong className="uppercase">{status.replace('_', ' ')}</strong>. No further edits can be made.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Form Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 hover:shadow-3xl">
                    
                    {/* Header Banner */}
                    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-10 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
                        <div className="relative z-10">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2 flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <User className="w-7 h-7" />
                                </div>
                                {id ? 'Edit' : 'New'} Admissions Application
                            </h1>
                            <p className="text-blue-100 text-lg font-medium">Capture comprehensive student details mapped directly to the CRM Workspace.</p>
                        </div>
                    </div>

                    {/* Form Layout Container */}
                    <div className="p-8 sm:p-12 space-y-10">
                        
                        {/* Section 1: Institution & Academic Details */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Building className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">1. Institution & Academic Details</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">School *</label>
                                    <select
                                        name="school_id"
                                        value={formData.school_id}
                                        onChange={handleChange}
                                        disabled={isReadOnly || !!id}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                        required
                                    >
                                        {schoolsList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Academic Year *</label>
                                    <select
                                        name="academic_year_id"
                                        value={formData.academic_year_id}
                                        onChange={handleChange}
                                        disabled={isReadOnly || !!id}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                        required
                                    >
                                        {academicYearsList.map(y => (
                                            <option key={y.id} value={y.id}>{y.year_label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Applying Grade *</label>
                                    <select
                                        name="grade_applied_for"
                                        value={formData.grade_applied_for}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                        required
                                    >
                                        {gradesList.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Board *</label>
                                    <select
                                        name="board"
                                        value={formData.board}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {boards.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Quota *</label>
                                    <select
                                        name="quota"
                                        value={formData.quota}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {quotas.map(q => (
                                            <option key={q} value={q}>{q}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Fee Category / Structure *</label>
                                    <select
                                        name="fee_structure_id"
                                        value={formData.fee_structure_id}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {feeStructuresList.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} {f.amount ? `(₹${f.amount})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Candidate & Parent Information */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-green-100">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">2. Candidate & Parent Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Student Name *</label>
                                    <input
                                        type="text"
                                        name="student_name"
                                        value={formData.student_name}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.student_name ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="Enter student's full name"
                                        required
                                    />
                                    {errors.student_name && <p className="text-xs text-red-500">{errors.student_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Date of Birth *</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.date_of_birth ? 'border-red-500' : 'border-gray-200'}`}
                                        required
                                    />
                                    {errors.date_of_birth && <p className="text-xs text-red-500">{errors.date_of_birth}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Gender *</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Parent / Guardian Name *</label>
                                    <input
                                        type="text"
                                        name="parent_name"
                                        value={formData.parent_name}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.parent_name ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="Enter parent's full name"
                                        required
                                    />
                                    {errors.parent_name && <p className="text-xs text-red-500">{errors.parent_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Relationship *</label>
                                    <select
                                        name="relationship"
                                        value={formData.relationship}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {relationships.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Parent Occupation</label>
                                    <select
                                        name="occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {occupations.map(o => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="e.g. +919876543210"
                                        required
                                    />
                                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                                        placeholder="e.g. parent@example.com"
                                        required
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Demographics & Contact */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">3. Demographics & Contact</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Religion</label>
                                    <select
                                        name="religion"
                                        value={formData.religion}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {religions.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Blood Group</label>
                                    <select
                                        name="blood_group"
                                        value={formData.blood_group}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {bloodGroups.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Country</label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {countries.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">State</label>
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {states.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">City</label>
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        {cities.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Current / Previous School</label>
                                    <input
                                        type="text"
                                        name="previous_school"
                                        value={formData.previous_school}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                        placeholder="Last school attended"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Last Grade Completed</label>
                                    <input
                                        type="text"
                                        name="last_grade_completed"
                                        value={formData.last_grade_completed}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                        placeholder="e.g. Class 5"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-3">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Full Contact Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                        placeholder="Enter permanent residential address details"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Logistics Preferences */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-amber-100">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">4. Logistics Preferences</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Transport Route Preference</label>
                                    <select
                                        name="transport_route_id"
                                        value={formData.transport_route_id}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        <option value="">None (Self Transport)</option>
                                        {transportRoutesList.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Hostel Room Type Preference</label>
                                    <select
                                        name="hostel_room_type"
                                        value={formData.hostel_room_type}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
                                    >
                                        <option value="None">None (Day Scholar)</option>
                                        {hostelRoomTypes.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section 5: Account Password (Only for guest applicants) */}
                        {treatAsGuest && !id && (
                            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-100 shadow-inner space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">5. Account Registration</h2>
                                </div>

                                <div className="p-4 bg-blue-100/50 border border-blue-200 rounded-xl text-sm text-blue-800 font-medium flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                    <span>Create a parent portal account password. You will use this password alongside your primary email to track the application workflow.</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-900 uppercase block">Choose Password *</label>
                                        <input
                                            type="password"
                                            name="parent_password"
                                            value={formData.parent_password}
                                            onChange={handleRegChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.parent_password ? 'border-red-500' : 'border-blue-200'}`}
                                            placeholder="Enter secure password"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-900 uppercase block">Confirm Password *</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={regData.confirmPassword}
                                            onChange={handleRegChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500 ${errors.parent_password ? 'border-red-500' : 'border-blue-200'}`}
                                            placeholder="Confirm secure password"
                                            required
                                        />
                                    </div>
                                </div>
                                {errors.parent_password && <p className="text-xs text-red-500">{errors.parent_password}</p>}
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
        </div>
    );
};
