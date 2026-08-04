import { Calendar, Armchair, PenTool, GraduationCap, Check, ArrowRight, ScrollText } from 'lucide-react';

interface ExamProgressGuideProps {
    currentStep?: 'schedule' | 'seating' | 'hall-tickets' | 'marks' | 'publish' | 'dashboard';
}

export const ExamProgressGuide = ({ currentStep = 'dashboard' }: ExamProgressGuideProps) => {
    const steps = [
        { id: 'schedule', label: '1. Schedule', icon: Calendar },
        { id: 'seating', label: '2. Seating', icon: Armchair },
        { id: 'hall-tickets', label: '3. Hall Tickets', icon: ScrollText },
        { id: 'marks', label: '4. Enter Marks', icon: PenTool },
        { id: 'publish', label: '5. Publish', icon: GraduationCap },
    ];

    const getStatus = (stepId: string) => {
        // Simple logic: if current step is 'dashboard', all are muted/default.
        // If specific step, previous ones are 'completed', current is 'active', next are 'pending'.
        if (currentStep === 'dashboard') return 'default';

        // Check completion status using index
        const stepIndex = steps.findIndex(s => s.id === stepId);
        const currentIndex = steps.findIndex(s => s.id === currentStep);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="w-full bg-white border-b border-gray-100 p-4 mb-6 sticky top-0 z-10 shadow-sm/50 backdrop-blur-sm bg-white/90">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10" />

                    {steps.map((step) => {
                        const status = getStatus(step.id);

                        let circleClass = "bg-gray-100 text-gray-400 border-gray-200";
                        let textClass = "text-gray-400";

                        if (status === 'completed') {
                            circleClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                            textClass = "text-emerald-700 font-bold";
                        } else if (status === 'active') {
                            circleClass = "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50";
                            textClass = "text-indigo-700 font-black";
                        } else if (status === 'default') {
                            circleClass = "bg-white text-gray-500 border-gray-200";
                            textClass = "text-gray-500 font-medium";
                        }

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2 sm:px-4 rounded-xl">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${circleClass}`}>
                                    {status === 'completed' ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <step.icon className="w-4 h-4 sm:w-5 sm:h-5 " />}
                                </div>
                                <span className={`text-[10px] sm:text-xs uppercase tracking-wider ${textClass} hidden sm:block`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
