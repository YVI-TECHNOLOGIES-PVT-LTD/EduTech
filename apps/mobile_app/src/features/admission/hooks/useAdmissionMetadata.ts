import { useQuery } from '@tanstack/react-query';
import { metadataApi } from '../../../api/metadata.api';
import { QUERY_KEYS } from '../../../api/query-keys';

export function useAdmissionConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.metadata.config,
    queryFn: () => metadataApi.getAdmissionConfig(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: QUERY_KEYS.metadata.academicYears,
    queryFn: () => metadataApi.getAcademicYears(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useClasses() {
  return useQuery({
    queryKey: QUERY_KEYS.metadata.classes,
    queryFn: () => metadataApi.getClasses(),
    staleTime: 1000 * 60 * 10,
  });
}
