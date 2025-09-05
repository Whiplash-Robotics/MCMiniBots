import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import NeuroCard from './NeuroCard';

// Dynamic import for Monaco Editor to avoid SSR issues
const Editor = React.lazy(() => import('@monaco-editor/react'));

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onTokenCount?: (codeTokens: number, stringTokens: number) => void;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  onTokenCount,
  height = '400px',
}) => {
  const { isDark } = useTheme();
  const [tokens, setTokens] = useState({ code: 0, string: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCode = async (code: string) => {
    if (!code.trim()) {
      setTokens({ code: 0, string: 0 });
      onTokenCount?.(0, 0);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTokens({ code: data.codeTokens, string: data.stringTokens });
        onTokenCount?.(data.codeTokens, data.stringTokens);
      }
    } catch (error) {
      console.error('Failed to analyze tokens:', error);
    }
    setIsAnalyzing(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      analyzeCode(value);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleChange = (newValue: string | undefined) => {
    const code = newValue || '';
    onChange(code);
  };

  const totalTokens = tokens.code + tokens.string;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Code Editor</h3>
        <NeuroCard className="px-4 py-2">
          <div className="flex items-center space-x-4 text-sm">
            <span>Code: <strong>{tokens.code}</strong></span>
            <span>String: <strong>{tokens.string}</strong></span>
            <span className={`font-bold ${
              totalTokens > 2048 ? 'text-red-500' : 
              totalTokens > 1024 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              Total: {totalTokens}
            </span>
            {isAnalyzing && <span className="text-blue-500">Analyzing...</span>}
          </div>
        </NeuroCard>
      </div>

      <NeuroCard className="overflow-hidden">
        <React.Suspense 
          fallback={
            <div 
              style={{ height }}
              className="flex items-center justify-center text-gray-500"
            >
              Loading editor...
            </div>
          }
        >
          <Editor
            height={height}
            defaultLanguage="javascript"
            theme={isDark ? 'vs-dark' : 'light'}
            value={value}
            onChange={handleChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
            }}
          />
        </React.Suspense>
      </NeuroCard>
    </div>
  );
};

export default CodeEditor;