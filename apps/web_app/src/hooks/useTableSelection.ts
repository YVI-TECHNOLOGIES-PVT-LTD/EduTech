import { useState, useMemo, useCallback } from 'react';

export interface UseTableSelectionOptions<T> {
  data?: T[] | null;
  getId?: (item: T) => string | number;
}

export function useTableSelection<T>(
  optionsOrData?: UseTableSelectionOptions<T> | T[] | null,
  idExtractorOrKey?: ((item: T) => string | number) | keyof T
) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Defensive normalization of data input (handles undefined, null, object, or array)
  const safeData: T[] = useMemo(() => {
    if (!optionsOrData) return [];
    if (Array.isArray(optionsOrData)) {
      return optionsOrData;
    }
    if (typeof optionsOrData === 'object') {
      const dataField = (optionsOrData as any)?.data;
      if (Array.isArray(dataField)) {
        return dataField;
      }
    }
    return [];
  }, [optionsOrData]);

  const getId: (item: T) => string | number = useMemo(() => {
    if (typeof idExtractorOrKey === 'function') {
      return idExtractorOrKey;
    }
    if (
      typeof idExtractorOrKey === 'string' ||
      typeof idExtractorOrKey === 'number' ||
      typeof idExtractorOrKey === 'symbol'
    ) {
      return (item: T) => (item as any)?.[idExtractorOrKey] ?? '';
    }
    if (
      optionsOrData &&
      typeof (optionsOrData as UseTableSelectionOptions<T>)?.getId === 'function'
    ) {
      return (optionsOrData as UseTableSelectionOptions<T>).getId!;
    }
    return (item: any) =>
      item?.id ||
      item?.document_id ||
      item?.lead_id ||
      item?.application_id ||
      '';
  }, [idExtractorOrKey, optionsOrData]);

  const currentIds = useMemo(() => {
    if (!Array.isArray(safeData) || safeData.length === 0) return [];
    return safeData
      .map(getId)
      .filter((id) => id !== undefined && id !== null && id !== '');
  }, [safeData, getId]);

  const isAllSelected = useMemo(() => {
    if (currentIds.length === 0) return false;
    return currentIds.every((id) => selectedIds.has(id));
  }, [currentIds, selectedIds]);

  const isSomeSelected = useMemo(() => {
    if (currentIds.length === 0) return false;
    const selectedCount = currentIds.filter((id) => selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < currentIds.length;
  }, [currentIds, selectedIds]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        currentIds.length > 0 && currentIds.every((id) => next.has(id));
      if (allSelected) {
        currentIds.forEach((id) => next.delete(id));
      } else {
        currentIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [currentIds]);

  const toggleRow = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(id),
    [selectedIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleRow,
    isSelected,
    clearSelection,
  };
}
