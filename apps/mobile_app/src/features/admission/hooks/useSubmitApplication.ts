import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../../../api/applications.api';
import { documentsApi } from '../../../api/documents.api';
import { feesApi } from '../../../api/fees.api';
import { QUERY_KEYS } from '../../../api/query-keys';
import { DraftStorage } from '../../../storage/draft-storage';
import { useAuthStore } from '../../../stores/auth.store';
import { AdmissionApplication, PaymentMode } from '../../../types/admission.types';
import { FullWizardState } from '../schemas/wizard.schemas';

export interface SubmitWizardParams {
  wizardState: FullWizardState;
  onProgressUpdate?: (stepDescription: string) => void;
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || 'anonymous_parent';

  return useMutation<AdmissionApplication, Error, SubmitWizardParams>({
    mutationFn: async ({ wizardState, onProgressUpdate }) => {
      onProgressUpdate?.('Creating application record...');

      // 1. Create or resolve application draft
      let appId = wizardState.createdAppId;
      let appData: AdmissionApplication | null = null;

      if (!appId) {
        const createPayload = {
          org_id: wizardState.academics.school_id || user?.school_id || 'org_main',
          academic_year_id: wizardState.academics.academic_year_id || 'ay_current',
          academic_year_grade_id: wizardState.academics.academic_year_grade_id || undefined,
          student_first_name: wizardState.student.student_first_name.trim(),
          student_last_name: wizardState.student.student_last_name.trim(),
          date_of_birth: wizardState.student.date_of_birth,
          gender: wizardState.student.gender,
          parent_name: wizardState.parent.parent_name.trim(),
          parent_email: wizardState.parent.parent_email.trim(),
          parent_phone: wizardState.parent.parent_phone.trim(),
          contact_relationship: wizardState.parent.contact_relationship,
          previous_school_name: wizardState.academics.previous_school_name?.trim() || undefined,
          previous_grade: wizardState.academics.previous_grade?.trim() || undefined,
          previous_percentage: undefined,
          status: 'documents_pending' as any,
        };

        appData = await applicationsApi.create(createPayload);
        appId = appData.application_id || (appData as any).id;
      }

      if (!appId) {
        throw new Error('Could not resolve application ID for submission.');
      }

      // 2. Upload Document Files
      const docEntries = Object.entries(wizardState.documents);
      const failedDocs: string[] = [];

      for (let i = 0; i < docEntries.length; i++) {
        const [docTypeId, fileObj] = docEntries[i];
        onProgressUpdate?.(`Uploading document ${i + 1} of ${docEntries.length}...`);

        try {
          await documentsApi.upload({
            applicationId: appId,
            documentTypeId: docTypeId,
            file: {
              uri: fileObj.uri,
              name: fileObj.name,
              type: fileObj.type,
            },
          });
        } catch (uploadErr) {
          failedDocs.push(fileObj.name || docTypeId);
        }
      }

      // If document upload failed, keep documents_pending and return error
      if (failedDocs.length > 0) {
        throw new Error(
          `Application created (${appId.slice(0, 8)}), but file upload failed for ${failedDocs.join(', ')}. Please retry upload.`,
        );
      }

      // 3. Finalize Status to 'submitted'
      onProgressUpdate?.('Finalizing submission...');
      const updatedApp = await applicationsApi.updateStatus(appId, {
        status: 'submitted',
      });

      // 4. Record fee payment
      try {
        await feesApi.recordPayment(appId, {
          payment_mode: (wizardState.declaration.payment_mode as PaymentMode) || 'upi',
          transaction_reference: `MOB-${Date.now()}`,
          remarks: 'Admission processing fee settled on mobile application submission',
        });
      } catch (payErr) {
        // Non-fatal ledger notice
      }

      // 5. Clear Local Draft upon successful submission
      await DraftStorage.clearDraft(userId, appId);
      await DraftStorage.clearDraft(userId, 'new_wizard_draft');

      return updatedApp;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.mine() });
      const id = data.application_id || (data as any).id;
      if (id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.applications.detail(id) });
      }
    },
  });
}
