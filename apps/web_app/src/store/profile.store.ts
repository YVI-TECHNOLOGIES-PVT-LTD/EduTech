import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnrichedUser } from '../types/auth';

interface ProfileStore {
    profileData: Partial<EnrichedUser> | null;
    isEditing: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;

    setProfile: (profile: EnrichedUser) => void;
    updateField: <K extends keyof EnrichedUser>(key: K, value: EnrichedUser[K]) => void;
    setEditing: (isEditing: boolean) => void;
    setSaving: (isSaving: boolean) => void;
    resetEdits: () => void;
}

export const useProfileStore = create<ProfileStore>()(
    persist(
        (set, get) => ({
            profileData: null,
            isEditing: false,
            isSaving: false,
            hasUnsavedChanges: false,

            setProfile: (profile) => set({
                profileData: profile,
                hasUnsavedChanges: false,
            }),

            updateField: (key, value) => set(s => ({
                profileData: { ...s.profileData, [key]: value },
                hasUnsavedChanges: true,
            })),

            setEditing: (isEditing) => set({ isEditing }),

            setSaving: (isSaving) => set({ isSaving }),

            resetEdits: () => set(s => ({
                profileData: s.profileData,
                hasUnsavedChanges: false,
                isEditing: false,
            })),
        }),
        {
            name: 'erp-profile',
            partialize: (s) => ({ profileData: s.profileData }),
        }
    )
);
