import { studentApi } from '../services/student.api';

export function useIdentity(studentId?: string) {
  const generateIdCard = async (id: string) => {
    const res = await studentApi.generateIdCard(id);
    return res.data;
  };

  const bulkGenerateIDCards = async (data: { student_ids: string[] }) => {
    const res = await studentApi.bulkGenerateIDCards(data);
    return res.data;
  };

  return {
    barcode: null as any,
    isLoadingBarcode: false,
    generateIdCard,
    isGenerating: false,
    bulkGenerateIDCards,
    isBulkGenerating: false,
  };
}
