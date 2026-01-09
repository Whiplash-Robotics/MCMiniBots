import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import CodeEditor from '../components/CodeEditor';
import { useTheme } from '../context/ThemeContext';
import { Upload, FileCode, X, Info, Code2, Feather, Scale, Dumbbell, Rocket, Target, CheckCircle, XCircle } from 'lucide-react';

const TokenCounter: React.FC = () => {
  const { isDark } = useTheme();
  const [code, setCode] = useState('');
  const [tokens, setTokens] = useState({ code: 0, string: 0 });
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'help'>('editor');

  const categories = [
    { id: 'lightweight', name: 'Lightweight', icon: Feather, limit: 512, color: 'text-blue-500' },
    { id: 'middleweight', name: 'Middleweight', icon: Scale, limit: 1024, color: 'text-green-500' },
    { id: 'heavyweight', name: 'Heavyweight', icon: Dumbbell, limit: 2048, color: 'text-yellow-500' },
    { id: 'superheavy', name: 'Superheavy', icon: Rocket, limit: null, color: 'text-purple-500' },
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
    <div className={`flex flex-col h-screen ${isDark ? 'bg-bg-dark' : 'bg-bg-light'}`}>
      <Navbar />

      {/* Main Container - No Scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex-shrink-0 px-6 pt-6 pb-4 border-b ${isDark ? 'border-border-dark' : 'border-border-light'}`}>
          <h1 className="text-2xl font-bold text-gold-500 mb-1">Token Counter</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Analyze your JavaScript code and check token counts
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex-shrink-0 px-6 border-b ${isDark ? 'border-border-dark' : 'border-border-light'}`}>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'editor'
                  ? isDark
                    ? 'text-gold-400'
                    : 'text-gold-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>Editor</span>
              </div>
              {activeTab === 'editor' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-gold-400' : 'bg-gold-600'}`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                activeTab === 'help'
                  ? isDark
                    ? 'text-gold-400'
                    : 'text-gold-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Help</span>
              </div>
              {activeTab === 'help' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-gold-400' : 'bg-gold-600'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'editor' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Top Bar */}
            <div className={`flex-shrink-0 px-6 py-3 border-b ${isDark ? 'border-border-dark bg-surface-dark' : 'border-border-light bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-4">
                {/* Left: File Upload */}
                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    isDark
                      ? 'border-border-dark hover:border-gold-500/50 bg-surface-dark-hover'
                      : 'border-border-light hover:border-gold-500/50 bg-white'
                  }`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Choose File</span>
                    <input
                      type="file"
                      accept=".js"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {file && (
                    <>
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-gold-500" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <button
                        onClick={clearCode}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-red-500/20 text-red-400'
                            : 'hover:bg-red-100 text-red-600'
                        }`}
                        aria-label="Clear"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Right: Token Display & Category */}
                <div className="flex items-center gap-4">
                  {totalTokens > 0 && (
                    <>
                      <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full ${
                        isDark ? 'bg-surface-dark-hover' : 'bg-white border border-border-light'
                      }`}>
                        <span className="text-xs">Code: <strong>{tokens.code}</strong></span>
                        <span className="text-xs">String: <strong>{tokens.string}</strong></span>
                        <span className={`text-xs font-bold ${currentCategory.color}`}>
                          Total: {totalTokens}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isDark ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-gold-100 border border-gold-500/30'
                      }`}>
                        {React.createElement(currentCategory.icon, { className: 'w-4 h-4 text-gold-500' })}
                        <span className={`text-xs font-bold ${isDark ? 'text-gold-400' : 'text-gold-600'}`}>
                          {currentCategory.name}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Editor - Full Height */}
            <div className="flex-1 overflow-hidden px-6 py-4">
              <CodeEditor
                value={code}
                onChange={setCode}
                onTokenCount={(codeTokens, stringTokens) => setTokens({ code: codeTokens, string: stringTokens })}
                height="100%"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Token Ignore Documentation */}
              <div className={`p-6 rounded-xl border ${
                isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
              }`}>
                <h3 className="text-lg font-bold text-gold-500 mb-4">Token Ignore Feature</h3>
                <div className={`space-y-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>
                    Use <code className={`px-2 py-1 rounded font-mono text-xs ${isDark ? 'bg-gray-800 text-gold-400' : 'bg-gray-200 text-gold-600'}`}>//@token-ignore</code> to exclude lines from token counting during development.
                  </p>
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-100 border-yellow-500/30'
                  }`}>
                    <strong className="text-yellow-600 dark:text-yellow-400">Important:</strong>
                    <p className="mt-2">
                      This decorator only works in the Token Counter page. It is <strong>NOT allowed</strong> in submissions and will be ignored during tournament play.
                    </p>
                  </div>
                  <div>
                    <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Example:</strong>
                    <pre className={`mt-2 p-4 rounded-lg overflow-x-auto text-xs font-mono ${
                      isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>{`//@token-ignore
console.log("This line won't be counted");
console.log("Neither will this");

// Empty line above ends the ignore block
console.log("This line WILL be counted");`}</pre>
                  </div>
                </div>
              </div>

              {/* Category Reference */}
              <div className={`p-6 rounded-xl border ${
                isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
              }`}>
                <h3 className="text-lg font-bold text-gold-500 mb-4">Weight Categories</h3>
                <div className="grid gap-3">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const fits = !category.limit || totalTokens <= category.limit;
                    const isCurrent = category === currentCategory && totalTokens > 0;

                    return (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                          isCurrent
                            ? isDark
                              ? 'bg-gold-500/10 border-2 border-gold-500/50'
                              : 'bg-gold-100 border-2 border-gold-500/50'
                            : isDark
                              ? 'bg-surface-dark-hover border border-border-dark'
                              : 'bg-gray-50 border border-border-light'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isCurrent ? 'text-gold-500' : 'text-gray-500'}`} />
                          <div>
                            <div className={`font-medium ${isCurrent ? 'text-gold-500' : ''}`}>
                              {category.name}
                            </div>
                            <div className="text-xs opacity-75">
                              {category.limit ? `≤ ${category.limit} tokens` : 'Unlimited tokens'}
                            </div>
                          </div>
                        </div>
                        <div>
                          {totalTokens > 0 && (
                            isCurrent ? (
                              <Target className="w-5 h-5 text-gold-500" />
                            ) : fits ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              {totalTokens > 0 && (
                <div className={`p-6 rounded-xl border ${
                  isDark ? 'bg-surface-dark border-border-dark' : 'bg-white border-border-light'
                }`}>
                  <h3 className="text-lg font-bold text-gold-500 mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Lines of Code</div>
                      <div className="text-2xl font-bold mt-1">{code.split('\n').length}</div>
                    </div>
                    <div>
                      <div className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Characters</div>
                      <div className="text-2xl font-bold mt-1">{code.length}</div>
                    </div>
                    <div>
                      <div className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</div>
                      <div className={`text-2xl font-bold mt-1 ${currentCategory.color}`}>
                        {currentCategory.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenCounter;
