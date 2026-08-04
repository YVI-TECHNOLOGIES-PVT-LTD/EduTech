import React from 'react';
import { QuestionBankManager } from './QuestionBankManager';

export const QuestionBankPage: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <QuestionBankManager />
        </div>
    );
};
export default QuestionBankPage;
