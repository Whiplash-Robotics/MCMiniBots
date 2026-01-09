import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

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

  return (
    <div className={`h-full rounded-xl overflow-hidden border ${
      isDark ? 'border-border-dark' : 'border-border-light'
    }`}>
      <React.Suspense
        fallback={
          <div
            style={{ height }}
            className={`flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
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
    </div>
  );
};

export default CodeEditor;