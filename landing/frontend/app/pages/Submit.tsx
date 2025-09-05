import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NeuroCard from '../components/NeuroCard';
import NeuroButton from '../components/NeuroButton';
import CodeEditor from '../components/CodeEditor';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface Submission {
  id: string;
  category: string;
  filename: string;
  codeTokens: number;
  stringTokens: number;
  totalTokens: number;
  lastModified: string;
}

const Submit: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('lightweight');
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('');
  const [tokens, setTokens] = useState({ code: 0, string: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = [
    { id: 'lightweight', name: 'Lightweight', limit: 512 },
    { id: 'middleweight', name: 'Middleweight', limit: 1024 },
    { id: 'heavyweight', name: 'Heavyweight', limit: 2048 },
    { id: 'superheavy', name: 'Superheavy', limit: null },
  ];

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const totalTokens = tokens.code + tokens.string;
  const isOverLimit = currentCategory?.limit && totalTokens > currentCategory.limit;

  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchUserSubmissions();
  }, []);

  const fetchUserSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!filename.trim()) {
      setMessage({ type: 'error', text: 'Please enter a filename' });
      return;
    }

    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter some code' });
      return;
    }

    if (isOverLimit) {
      setMessage({ type: 'error', text: `Code exceeds ${currentCategory?.limit} token limit for ${currentCategory?.name}` });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          category: selectedCategory,
          filename: filename.endsWith('.js') ? filename : `${filename}.js`,
          code,
          codeTokens: tokens.code,
          stringTokens: tokens.string,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setCode('');
        setFilename('');
        setTokens({ code: 0, string: 0 });
        fetchUserSubmissions();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    }

    setIsSubmitting(false);
  };

  const loadSubmission = (submission: Submission) => {
    fetch(`/api/submissions/${submission.id}/code`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setCode(data.code);
        setFilename(submission.filename.replace('.js', ''));
        setSelectedCategory(submission.category);
      }
    })
    .catch(console.error);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">Submit Your Bot</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose a category and upload your JavaScript bot
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <NeuroCard className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Category Selection</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl transition-all duration-200 text-left ${
                    selectedCategory === category.id
                      ? `bg-gold-500 text-white shadow-neuro-${isDark ? 'dark' : 'light'}`
                      : `${isDark ? 'bg-neuro-dark shadow-neuro-dark' : 'bg-neuro-light shadow-neuro-light'} hover:shadow-neuro-${isDark ? 'dark' : 'light'}-inset`
                  }`}
                >
                  <div className="font-semibold">{category.name}</div>
                  <div className="text-sm opacity-75">
                    {category.limit ? `${category.limit} tokens` : 'Unlimited'}
                  </div>
                </button>
              ))}
            </div>
          </NeuroCard>

          <NeuroCard className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Enter filename (without .js)"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-xl border-none outline-none transition-all duration-200 ${
                  isDark
                    ? 'bg-neuro-dark shadow-neuro-dark-inset text-white placeholder-gray-400'
                    : 'bg-neuro-light shadow-neuro-light-inset text-gray-800 placeholder-gray-500'
                }`}
              />
              <div className="text-sm font-medium">.js</div>
            </div>
            
            {currentCategory && (
              <div className="flex justify-between text-sm">
                <span>Token limit: {currentCategory.limit || 'Unlimited'}</span>
                <span className={`font-bold ${
                  isOverLimit ? 'text-red-500' : 'text-green-500'
                }`}>
                  Current: {totalTokens}
                </span>
              </div>
            )}
          </NeuroCard>

          <CodeEditor
            value={code}
            onChange={setCode}
            onTokenCount={(codeTokens, stringTokens) => setTokens({ code: codeTokens, string: stringTokens })}
            height="500px"
          />

          {message && (
            <NeuroCard className={`p-4 ${
              message.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {message.text}
            </NeuroCard>
          )}

          <NeuroButton
            onClick={handleSubmit}
            variant="gold"
            size="lg"
            disabled={isSubmitting || !filename.trim() || !code.trim() || isOverLimit}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Bot'}
          </NeuroButton>
        </div>

        <div className="space-y-6">
          <NeuroCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Submissions</h3>
            {submissions.length === 0 ? (
              <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No submissions yet
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => loadSubmission(submission)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-neuro-${isDark ? 'dark' : 'light'}-inset ${
                      isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{submission.filename}</div>
                    <div className="text-sm opacity-75 capitalize">{submission.category}</div>
                    <div className="text-xs">{submission.totalTokens} tokens</div>
                  </div>
                ))}
              </div>
            )}
          </NeuroCard>
        </div>
      </div>
    </div>
  );
};

export default Submit;