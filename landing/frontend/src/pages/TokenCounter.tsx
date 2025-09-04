import React, { useState } from 'react';
import NeuroCard from '../components/NeuroCard';
import NeuroButton from '../components/NeuroButton';
import CodeEditor from '../components/CodeEditor';
import { useTheme } from '../context/ThemeContext';

const TokenCounter: React.FC = () => {
  const { isDark } = useTheme();
  const [code, setCode] = useState('');
  const [tokens, setTokens] = useState({ code: 0, string: 0 });
  const [file, setFile] = useState<File | null>(null);

  const categories = [
    { name: 'Lightweight', limit: 512, color: 'text-blue-500' },
    { name: 'Middleweight', limit: 1024, color: 'text-green-500' },
    { name: 'Heavyweight', limit: 2048, color: 'text-yellow-500' },
    { name: 'Superheavy', limit: null, color: 'text-purple-500' },
  ];

  const totalTokens = tokens.code + tokens.string;

  const getCategory = () => {
    if (totalTokens <= 512) return categories[0];
    if (totalTokens <= 1024) return categories[1];
    if (totalTokens <= 2048) return categories[2];
    return categories[3];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'text/javascript') {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(uploadedFile);
    } else {
      alert('Please upload a JavaScript (.js) file');
    }
  };

  const clearCode = () => {
    setCode('');
    setFile(null);
    setTokens({ code: 0, string: 0 });
  };

  const currentCategory = getCategory();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">Token Counter</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Analyze your JavaScript code and check token counts
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="space-y-6">
            <NeuroCard className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Upload File or Paste Code</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".js"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isDark
                      ? 'bg-neuro-dark shadow-neuro-dark hover:shadow-neuro-dark-inset'
                      : 'bg-neuro-light shadow-neuro-light hover:shadow-neuro-light-inset'
                  }`}
                >
                  Choose File
                </label>
                {file && (
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {file.name}
                  </span>
                )}
                <div className="flex-1"></div>
                <NeuroButton onClick={clearCode} variant="secondary" size="sm">
                  Clear
                </NeuroButton>
              </div>
            </NeuroCard>

            <CodeEditor
              value={code}
              onChange={setCode}
              onTokenCount={(codeTokens, stringTokens) => setTokens({ code: codeTokens, string: stringTokens })}
              height="600px"
            />
          </div>
        </div>

        <div className="space-y-6">
          <NeuroCard className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Token Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Code Tokens:</span>
                <span className="font-bold">{tokens.code}</span>
              </div>
              <div className="flex justify-between">
                <span>String Tokens:</span>
                <span className="font-bold">{tokens.string}</span>
              </div>
              <hr className={`border-${isDark ? 'gray-700' : 'gray-300'}`} />
              <div className="flex justify-between text-lg">
                <span>Total:</span>
                <span className={`font-bold ${currentCategory.color}`}>
                  {totalTokens}
                </span>
              </div>
            </div>
          </NeuroCard>

          <NeuroCard className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Category Fit</h3>
            <div className="space-y-3">
              {categories.map((category) => {
                const fits = !category.limit || totalTokens <= category.limit;
                const isCurrent = category === currentCategory && totalTokens > 0;
                
                return (
                  <div
                    key={category.name}
                    className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                      isCurrent
                        ? `bg-gold-500 text-white shadow-neuro-${isDark ? 'dark' : 'light'}`
                        : fits
                        ? `${isDark ? 'bg-green-900' : 'bg-green-100'} text-green-500`
                        : `${isDark ? 'bg-red-900' : 'bg-red-100'} text-red-500`
                    }`}
                  >
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm opacity-75">
                        {category.limit ? `≤ ${category.limit} tokens` : 'Unlimited'}
                      </div>
                    </div>
                    <div className="text-xl">
                      {isCurrent ? '🎯' : fits ? '✅' : '❌'}
                    </div>
                  </div>
                );
              })}
            </div>
          </NeuroCard>

          {totalTokens > 0 && (
            <NeuroCard className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div>Lines of code: {code.split('\n').length}</div>
                <div>Characters: {code.length}</div>
                <div>Category: <span className={`font-bold ${currentCategory.color}`}>
                  {currentCategory.name}
                </span></div>
              </div>
            </NeuroCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenCounter;