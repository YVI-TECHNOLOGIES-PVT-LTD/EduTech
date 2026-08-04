import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetUploader } from '../components/AssetUploader';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export const QuestionAssetsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate('/app/assessment/questions')}
                    className="rounded-xl border-gray-200"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                        <Paperclip className="w-6 h-6 text-primary" /> Question Attachments Repository
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Upload media assets, view active linkages, and manage proctoring materials.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <AssetUploader />
            </div>
        </div>
    );
};
export default QuestionAssetsPage;
