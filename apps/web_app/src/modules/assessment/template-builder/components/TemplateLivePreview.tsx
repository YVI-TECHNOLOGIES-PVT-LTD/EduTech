import React, { useState } from 'react';
import { useTemplatePreview } from '../hooks/useTemplateBuilder';
import { Loader2, Monitor, FileText, Smartphone, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface TemplateLivePreviewProps {
    templateId: string;
}

export const TemplateLivePreview: React.FC<TemplateLivePreviewProps> = ({ templateId }) => {
    const [format, setFormat] = useState('html'); // 'html', 'pdf', 'mobile'
    const { data, isLoading, refetch } = useTemplatePreview(templateId, format);

    return (
        <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden h-full flex flex-col min-h-[500px]">
            <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-primary" /> Live Rendering Preview
                </CardTitle>
                <div className="flex gap-1 shrink-0">
                    <Button
                        size="icon"
                        variant={format === 'html' ? 'default' : 'ghost'}
                        onClick={() => setFormat('html')}
                        className="h-8 w-8 rounded-lg shrink-0"
                    >
                        <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={format === 'mobile' ? 'default' : 'ghost'}
                        onClick={() => setFormat('mobile')}
                        className="h-8 w-8 rounded-lg shrink-0"
                    >
                        <Smartphone className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => refetch()}
                        className="h-8 w-8 rounded-lg shrink-0"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-5 flex-1 bg-slate-50/50 flex flex-col justify-center items-center relative overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-400 font-bold text-xs py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        Generating contract layout preview...
                    </div>
                ) : !data || !data.html ? (
                    <p className="text-[10px] text-gray-400 font-bold">Failed to load rendering preview.</p>
                ) : (
                    <div 
                        className={`w-full bg-white border border-gray-100 rounded-2xl shadow-premium-sm transition-all duration-300 p-2 overflow-y-auto ${
                            format === 'mobile' ? 'max-w-[375px] min-h-[500px]' : 'max-w-full'
                        }`}
                        dangerouslySetInnerHTML={{ __html: data.html }}
                    />
                )}
            </CardContent>
        </Card>
    );
};
export default TemplateLivePreview;
