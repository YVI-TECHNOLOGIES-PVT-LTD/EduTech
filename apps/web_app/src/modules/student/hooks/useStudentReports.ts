import { studentApi } from '../services/student.api';

export function useStudentReports() {
  const exportStudents = async (params: any) => {
    const res = await studentApi.exportStudents(params);
    return res.data;
  };

  return {
    exportStudents,
    isExporting: false,
  };
}
