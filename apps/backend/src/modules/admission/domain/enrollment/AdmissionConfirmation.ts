export class AdmissionConfirmation {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public studentId: string | null,
        public readonly admissionNumber: string,
        public readonly confirmedAt: Date,
        public readonly confirmedBy: string | null
    ) {}

    public linkStudent(studentId: string) {
        this.studentId = studentId;
    }
}
