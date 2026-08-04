import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { MASTER_DATA_STALE_TIME, MASTER_DATA_GC_TIME } from '../../../constants/query';
import {
    MasterDataService,
    SchoolMaster,
    AcademicYearMaster,
    GradeMaster
} from '../services/MasterDataService';

export interface MasterDataContextType {
    schools: SchoolMaster[];
    academicYears: AcademicYearMaster[];
    grades: GradeMaster[];
    transportRoutes: any[]; // Kept for type compatibility
    feeStructures: any[];   // Kept for type compatibility
    offerTemplates: any[];  // Kept for type compatibility
    counselors: any[];      // Kept for type compatibility

    activeSchoolId: string;
    activeAcademicYearId: string;
    activeSchool: SchoolMaster | null;
    activeAcademicYear: AcademicYearMaster | null;

    changeSchool: (id: string) => void;
    changeAcademicYear: (id: string) => void;

    isLoading: boolean;
    isError: boolean;
    refetch: () => void;

    // Static master arrays
    boards: string[];
    quotas: string[];
    categories: string[];
    admissionSources: string[];
    bloodGroups: string[];
    religions: string[];
    occupations: string[];
    relationships: string[];
    countries: string[];
    states: string[];
    cities: string[];
    hostelRoomTypes: string[];
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();

    const [activeSchoolId, setActiveSchoolId] = useState<string>('');
    const [activeAcademicYearId, setActiveAcademicYearId] = useState<string>('');

    // Update active school ID from user session when authenticated
    useEffect(() => {
        if (isAuthenticated && user?.school_id) {
            setActiveSchoolId(user.school_id);
        }
    }, [isAuthenticated, user]);

    // Consolidated Public Config Query (combining schools, academic years, grades)
    const configQuery = useQuery({
        queryKey: ['master', 'public', 'config', activeSchoolId],
        queryFn: () => MasterDataService.getPublicConfig(activeSchoolId),
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const schools = configQuery.data?.schools || [];
    const academicYears = useMemo(() => {
        if (configQuery.data?.academicYear) {
            return [configQuery.data.academicYear];
        }
        return configQuery.data?.academicYears || [];
    }, [configQuery.data]);
    
    // Map class objects from backend config cleanly to GradeMaster structure
    const grades = useMemo(() => {
        return configQuery.data?.grades?.map((g: any) => ({
            id: g.id,
            name: g.grade_name,
            school_id: g.school_id || activeSchoolId,
            academic_year_id: activeAcademicYearId
        })) || [];
    }, [configQuery.data?.grades, activeSchoolId, activeAcademicYearId]);

    // Automatically resolve the active academic year for the school
    useEffect(() => {
        if (academicYears && academicYears.length > 0) {
            const activeYr = academicYears.find((y: any) => y.is_active);
            if (activeYr) {
                setActiveAcademicYearId(activeYr.id);
            } else {
                setActiveAcademicYearId(academicYears[0].id);
            }
        } else {
            setActiveAcademicYearId('');
        }
    }, [academicYears]);

    // Derive active school object
    const activeSchool = useMemo(() => {
        return schools.find((s: any) => s.id === activeSchoolId) || null;
    }, [schools, activeSchoolId]);

    // Derive active academic year object
    const activeAcademicYear = useMemo(() => {
        return academicYears.find((y: any) => y.id === activeAcademicYearId) || null;
    }, [academicYears, activeAcademicYearId]);

    const changeSchool = (id: string) => {
        setActiveSchoolId(id);
        setActiveAcademicYearId(''); // reset and let effect resolve
    };

    const changeAcademicYear = (id: string) => {
        setActiveAcademicYearId(id);
    };

    const refetch = () => {
        void configQuery.refetch();
    };

    const contextValue: MasterDataContextType = {
        schools,
        academicYears,
        grades,
        transportRoutes: [],
        feeStructures: [],
        offerTemplates: [],
        counselors: [],

        activeSchoolId,
        activeAcademicYearId,
        activeSchool,
        activeAcademicYear,

        changeSchool,
        changeAcademicYear,

        isLoading: configQuery.isLoading,
        isError: configQuery.isError,
        refetch,

        // Static standard lookups
        boards: MasterDataService.getBoards(),
        quotas: MasterDataService.getQuotas(),
        categories: MasterDataService.getCategories(),
        admissionSources: MasterDataService.getAdmissionSources(),
        bloodGroups: MasterDataService.getBloodGroups(),
        religions: MasterDataService.getReligions(),
        occupations: MasterDataService.getOccupations(),
        relationships: MasterDataService.getRelationships(),
        countries: MasterDataService.getCountries(),
        states: MasterDataService.getStates(),
        cities: MasterDataService.getCities(),
        hostelRoomTypes: MasterDataService.getHostelRoomTypes(),
    };

    return (
        <MasterDataContext.Provider value={contextValue}>
            {children}
        </MasterDataContext.Provider>
    );
}

export function useMasterData() {
    const context = useContext(MasterDataContext);
    if (!context) {
        throw new Error('useMasterData must be used inside MasterDataProvider');
    }
    return context;
}
