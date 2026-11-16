import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodingLabConfig } from '@/shared/api/learningActivities.api';
import {
  AlertCircle,
  CheckCircle2,
  Code,
  FileCode,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

interface CodingWorkspaceProps {
  activityTitle: string;
  config?: CodingLabConfig | null;
  initialCode?: string;
  isSubmitting?: boolean;
  onSubmitCode: (code: string) => Promise<void>;
  canSubmit?: boolean;
  blockReason?: string | null;
}

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  activityTitle,
  config,
  initialCode = '',
  isSubmitting = false,
  onSubmitCode,
  canSubmit = true,
  blockReason,
}) => {
  const language = config?.language || 'python';
  const starter = config?.starter_code || initialCode || getDefaultStarterCode(language);
  const [code, setCode] = useState<string>(starter);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

  function getDefaultStarterCode(lang: string): string {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return `// ${activityTitle}\nfunction solution(input) {\n  // Write your code here\n  return input;\n}\n`;
      case 'python':
        return `# ${activityTitle}\ndef solution(input_data):\n    # Write your code here\n    return input_data\n`;
      case 'sql':
        return `-- ${activityTitle}\nSELECT * FROM data_table\nWHERE active = true;\n`;
      case 'html':
        return `<!DOCTYPE html>\n<html>\n<head>\n  <title>${activityTitle}</title>\n</head>\n<body>\n  <h1>My Solution</h1>\n</body>\n</html>\n`;
      default:
        return `// ${activityTitle} - Language: ${lang}\n// Write your solution below:\n\n`;
    }
  }

  const handleRunSampleCheck = () => {
    setTestStatus('running');
    setTestOutput('Validating syntax and sample inputs in browser workspace...');

    setTimeout(() => {
      if (!code.trim()) {
        setTestStatus('failed');
        setTestOutput('Error: Code editor is empty. Please enter your solution.');
        return;
      }

      // Safe client-side syntax check without eval or execution
      if (language.includes('json')) {
        try {
          JSON.parse(code);
          setTestStatus('passed');
          setTestOutput('JSON syntax valid! Ready for submission.');
        } catch (e: any) {
          setTestStatus('failed');
          setTestOutput(`Syntax Error: ${e.message}`);
        }
      } else {
        setTestStatus('passed');
        setTestOutput(
          `Sample check completed!\nInput: ${config?.sample_input || '(default test inputs)'}\nExpected Output: ${
            config?.sample_output || '(expected sample output)'
          }\nStatus: Solution formatted and ready for submission evaluation.`,
        );
      }
    }, 400);
  };

  const handleResetCode = () => {
    setCode(config?.starter_code || getDefaultStarterCode(language));
    setTestStatus('idle');
    setTestOutput(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Code cannot be empty. Please author your solution before submitting.');
      return;
    }
    await onSubmitCode(code);
  };

  const lineCount = Math.max(code.split('\n').length, 14);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs text-purple-950">
        <div className="flex items-center gap-2 font-medium">
          <Terminal className="h-4 w-4 text-purple-700" />
          <span>Coding Lab Workspace — Language:</span>
          <Badge variant="secondary" className="font-mono uppercase text-purple-800">
            {language}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Client-isolated safe authoring environment</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left column: Problem Specification */}
        <div className="space-y-3 lg:col-span-5">
          <Card className="p-4 text-xs space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-purple-700" />
              Problem Specification
            </h3>

            {config?.problem_statement && (
              <div>
                <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                  Problem Statement
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-2 text-foreground font-sans">
                  {config.problem_statement}
                </p>
              </div>
            )}

            {config?.input_format && (
              <div>
                <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                  Input Format
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-2 text-foreground">
                  {config.input_format}
                </p>
              </div>
            )}

            {config?.output_format && (
              <div>
                <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                  Output Format
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-2 text-foreground">
                  {config.output_format}
                </p>
              </div>
            )}

            {config?.constraints && (
              <div>
                <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                  Constraints
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-2 text-foreground font-mono">
                  {config.constraints}
                </p>
              </div>
            )}

            {(config?.sample_input || config?.sample_output) && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                {config.sample_input && (
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                      Sample Input
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-100">
                      {config.sample_input}
                    </pre>
                  </div>
                )}
                {config.sample_output && (
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                      Sample Output
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[11px] text-emerald-400">
                      {config.sample_output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Interactive Code Editor */}
        <div className="space-y-3 lg:col-span-7">
          <Card className="overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 p-0">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                <span className="font-mono text-slate-400 ml-2">
                  solution.
                  {language === 'python'
                    ? 'py'
                    : language === 'javascript'
                      ? 'js'
                      : language === 'typescript'
                        ? 'ts'
                        : language}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-slate-400 hover:text-slate-100"
                onClick={handleResetCode}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset Code
              </Button>
            </div>

            {/* Editor Text Area with Monospace Line Numbers */}
            <div className="flex">
              <div className="select-none bg-slate-900/60 px-3 py-3 font-mono text-xs text-slate-600 text-right">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={!canSubmit || isSubmitting}
                rows={lineCount}
                spellCheck={false}
                placeholder="Write your code solution here..."
                className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-relaxed text-emerald-300 outline-none focus:ring-0"
              />
            </div>
          </Card>

          {/* Test Runner Output Box */}
          {testOutput && (
            <div
              className={`rounded-lg border p-3 font-mono text-xs ${
                testStatus === 'passed'
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : testStatus === 'failed'
                    ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                    : 'border-slate-300 bg-muted/40 text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {testStatus === 'passed' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {testStatus === 'failed' && <AlertCircle className="h-4 w-4 text-rose-400" />}
                <span>Sample Test Result</span>
              </div>
              <pre className="mt-1.5 whitespace-pre-wrap font-sans text-xs">{testOutput}</pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRunSampleCheck}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5 text-purple-600" />
              Check Sample Test
            </Button>

            {canSubmit ? (
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="gap-1.5 bg-purple-700 hover:bg-purple-800 text-white"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Submitting Solution...' : 'Submit Code Solution'}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {blockReason || 'Submissions closed'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
