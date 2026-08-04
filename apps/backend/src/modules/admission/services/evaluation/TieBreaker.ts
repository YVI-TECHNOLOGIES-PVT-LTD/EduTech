export interface CandidateMeritInput {
    applicationId: string;
    finalScore: number;
    examPercentage: number;
    interviewPercentage: number;
    dateOfBirth: Date;
    applicationDate: Date;
}

export class TieBreaker {
    /**
     * Resolves identical scores priorities.
     */
    public breakTie(
        c1: CandidateMeritInput,
        c2: CandidateMeritInput,
        tieBreakers: string[] = ['Exam Score', 'Interview Score', 'Age', 'Application Date']
    ): number {
        for (const rule of tieBreakers) {
            if (rule === 'Exam Score') {
                if (c1.examPercentage !== c2.examPercentage) {
                    return c2.examPercentage - c1.examPercentage; // Higher score wins
                }
            } else if (rule === 'Interview Score') {
                if (c1.interviewPercentage !== c2.interviewPercentage) {
                    return c2.interviewPercentage - c1.interviewPercentage; // Higher score wins
                }
            } else if (rule === 'Age') {
                const age1 = c1.dateOfBirth.getTime();
                const age2 = c2.dateOfBirth.getTime();
                if (age1 !== age2) {
                    return age2 - age1; // Younger candidate wins (later timestamp DOB first)
                }
            } else if (rule === 'Application Date') {
                const time1 = c1.applicationDate.getTime();
                const time2 = c2.applicationDate.getTime();
                if (time1 !== time2) {
                    return time1 - time2; // Earlier application wins
                }
            }
        }
        return 0;
    }
}
