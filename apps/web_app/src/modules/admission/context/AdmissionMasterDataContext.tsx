import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useMasterData } from './MasterDataContext';
import { useAdmissionAccess } from '../hooks/useAdmissionAccess';
import { MASTER_DATA_STALE_TIME, MASTER_DATA_GC_TIME } from '../../../constants/query';
import {
    MasterDataService,
    TransportRouteMaster,
    FeeStructureMaster,
    OfferTemplateMaster,
    CounselorMaster
} from '../services/MasterDataService';

export interface AdmissionMasterDataContextType {
    transportRoutes: TransportRouteMaster[];
    feeStructures: FeeStructureMaster[];
    offerTemplates: OfferTemplateMaster[];
    counselors: CounselorMaster[];
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
}

const AdmissionMasterDataContext = createContext<AdmissionMasterDataContextType | undefined>(undefined);

export function AdmissionMasterDataProvider({ children }: { children: React.ReactNode }) {
    const { activeSchoolId } = useMasterData();
    const { canViewCRM } = useAdmissionAccess();

    const isEnabled = !!canViewCRM && !!activeSchoolId;

    // 1. Counselors query
    const counselorsQuery = useQuery({
        queryKey: ['master', 'crm', 'counselors', activeSchoolId],
        queryFn: () => MasterDataService.getCounselors(activeSchoolId),
        enabled: isEnabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    // 2. Offer Templates query
    const offerTemplatesQuery = useQuery({
        queryKey: ['master', 'crm', 'offer-templates', activeSchoolId],
        queryFn: () => MasterDataService.getOfferTemplates(),
        enabled: isEnabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    // 3. Fee Structures query
    const feeStructuresQuery = useQuery({
        queryKey: ['master', 'crm', 'fee-structures', activeSchoolId],
        queryFn: () => MasterDataService.getFeeStructures(),
        enabled: isEnabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    // 4. Transport Routes query
    const transportRoutesQuery = useQuery({
        queryKey: ['master', 'crm', 'transport-routes', activeSchoolId],
        queryFn: () => MasterDataService.getTransportRoutes(),
        enabled: isEnabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const isLoading =
        counselorsQuery.isLoading ||
        offerTemplatesQuery.isLoading ||
        feeStructuresQuery.isLoading ||
        transportRoutesQuery.isLoading;

    const isError =
        counselorsQuery.isError ||
        offerTemplatesQuery.isError ||
        feeStructuresQuery.isError ||
        transportRoutesQuery.isError;

    const refetch = () => {
        void counselorsQuery.refetch();
        void offerTemplatesQuery.refetch();
        void feeStructuresQuery.refetch();
        void transportRoutesQuery.refetch();
    };

    const value = useMemo<AdmissionMasterDataContextType>(() => ({
        transportRoutes: transportRoutesQuery.data || [],
        feeStructures: feeStructuresQuery.data || [],
        offerTemplates: offerTemplatesQuery.data || [],
        counselors: counselorsQuery.data || [],
        isLoading,
        isError,
        refetch
    }), [
        transportRoutesQuery.data,
        feeStructuresQuery.data,
        offerTemplatesQuery.data,
        counselorsQuery.data,
        isLoading,
        isError
    ]);

    return (
        <AdmissionMasterDataContext.Provider value={value}>
            {children}
        </AdmissionMasterDataContext.Provider>
    );
}

export function useAdmissionMasterData() {
    const context = useContext(AdmissionMasterDataContext);
    if (!context) {
        throw new Error('useAdmissionMasterData must be used inside AdmissionMasterDataProvider');
    }
    return context;
}
