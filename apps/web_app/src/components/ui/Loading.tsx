export const Loading = ({ message = "Loading..." }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 space-y-3 animate-fade-in">
        <div className="w-10 h-10 border-3 border-muted border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-muted-foreground tracking-wide">{message}</p>
    </div>
);
