import React, { useState, useEffect } from 'react';
import { redirect, useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import NeuroCard from '../components/NeuroCard';
import NeuroButton from '../components/NeuroButton';
import CodeEditor from '../components/CodeEditor';
import { useTheme } from '../context/ThemeContext';

interface Submission {
  id: string;
  category: string;
  filename: string;
  codeTokens: number;
  stringTokens: number;
  totalTokens: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  lastModified: string;
}

// Loader function for route protection (recommended approach in v7)
export async function submitLoader({ request }: { request: Request }) {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    throw redirect('/login');
  }

  // Optionally verify token with your API
  try {
    const response = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw redirect('/login');
    }
  } catch (error) {
    throw redirect('/login');
  }

  return null;
}

const Submit: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('lightweight');
  const [code, setCode] = useState('');
  const [tokens, setTokens] = useState({ code: 0, string: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null); // Track which category is being edited

  const categories = [
    { id: 'lightweight', name: 'Lightweight', limit: 512 },
    { id: 'middleweight', name: 'Middleweight', limit: 1024 },
    { id: 'heavyweight', name: 'Heavyweight', limit: 2048 },
    { id: 'superheavy', name: 'Superheavy', limit: null },
  ];

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const totalTokens = tokens.code + tokens.string;
  const isOverLimit = currentCategory?.limit && totalTokens > currentCategory.limit;

  // Helper functions
  const getSubmissionForCategory = (category: string) => {
    return submissions.find(sub => sub.category === category);
  };

  const generateFilename = (category: string, username: string) => {
    return `${username}_${category}_bot.js`;
  };

  const getCurrentSubmission = () => getSubmissionForCategory(selectedCategory);
  const isCurrentlyEditing = isEditing === selectedCategory;

  // Check authentication on client side
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserSubmissions();
    }
  }, [user]);

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
          filename: generateFilename(selectedCategory, user.username),
          code,
          codeTokens: tokens.code,
          stringTokens: tokens.string,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setCode('');
        setTokens({ code: 0, string: 0 });
        setIsEditing(null);
        fetchUserSubmissions();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    }

    setIsSubmitting(false);
  };

  const startEditing = (category: string) => {
    const submission = getSubmissionForCategory(category);
    if (submission) {
      setIsEditing(category);
      setSelectedCategory(category);
      
      // Load the submission code
      fetch(`/api/submissions/${submission.id}/code`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCode(data.code);
        }
      })
      .catch(console.error);
    } else {
      // Start new submission for this category
      setIsEditing(category);
      setSelectedCategory(category);
      setCode('');
    }
  };

  const cancelEditing = () => {
    setIsEditing(null);
    setCode('');
    setMessage(null);
  };

  const loadSubmission = (submission: Submission) => {
    startEditing(submission.category);
  };

  // Don't render anything if user is not loaded yet
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-6 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gold-500 mb-2">Submit Your Bot</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose a category and upload your JavaScript bot
          </p>
        </div>

        {/* Main Layout: Editor on left, Categories on right */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor Section - Left Side */}
          <div className="lg:col-span-2">
            {isEditing ? (
              <div className="space-y-6">
                <NeuroCard className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gold-500">
                      Editing: {categories.find(c => c.id === selectedCategory)?.name}
                    </h3>
                    <div className="text-sm">
                      <span className={`font-bold ${isOverLimit ? 'text-red-500' : 'text-green-500'}`}>
                        {totalTokens} / {currentCategory?.limit || '∞'} tokens
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">
                      Filename: {generateFilename(selectedCategory, user.username)}
                    </div>
                  </div>

                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    onTokenCount={(codeTokens, stringTokens) => setTokens({ code: codeTokens, string: stringTokens })}
                    height="600px"
                  />

                  {message && (
                    <NeuroCard className={`p-4 mt-4 ${
                      message.type === 'success' 
                        ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                        : isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                    }`}>
                      {message.text}
                    </NeuroCard>
                  )}

                  <div className="flex space-x-4 mt-6">
                    <NeuroButton
                      onClick={handleSubmit}
                      variant="gold"
                      size="lg"
                      disabled={isSubmitting || !code.trim() || isOverLimit}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Submitting...' : 
                       getCurrentSubmission() ? 'Update Submission' : 'Create Submission'}
                    </NeuroButton>
                    <NeuroButton
                      onClick={cancelEditing}
                      variant="secondary"
                      size="lg"
                      className="flex-1"
                    >
                      Cancel
                    </NeuroButton>
                  </div>
                </NeuroCard>
              </div>
            ) : (
              <NeuroCard className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gold-500 mb-4">Ready to Code?</h3>
                <p className={`text-lg mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a category from the sidebar to start creating or editing your bot submission.
                </p>
                <div className="text-sm opacity-75">
                  You can have one submission per weight category. Each submission will be automatically 
                  named and can be edited anytime before the tournament begins.
                </div>
              </NeuroCard>
            )}
          </div>

          {/* Category Sidebar - Right Side */}
          <div className="space-y-6">
            <NeuroCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gold-500">Weight Categories</h3>
              <div className="space-y-4">
                {categories.map((category) => {
                  const submission = getSubmissionForCategory(category.id);
                  const isCurrentEditing = isEditing === category.id;
                  
                  return (
                    <div key={category.id} className={`p-4 rounded-xl transition-all duration-200 ${
                      isCurrentEditing 
                        ? isDark ? 'bg-gold-900 border border-gold-500' : 'bg-gold-100 border border-gold-500'
                        : isDark ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <div className="mb-3">
                        <h4 className="font-bold text-gold-500">{category.name}</h4>
                        <p className="text-xs opacity-75">
                          {category.limit ? `≤ ${category.limit} tokens` : 'Unlimited'}
                        </p>
                      </div>

                      {submission ? (
                        <div className="space-y-2">
                          <div className={`p-2 rounded-lg text-xs ${
                            submission.status === 'approved' 
                              ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                              : submission.status === 'rejected'
                              ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                              : isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {submission.status === 'approved' ? '✅ Approved' : 
                             submission.status === 'rejected' ? '❌ Rejected' : 
                             '⏳ Pending Review'} • {submission.totalTokens} tokens
                          </div>
                          {submission.status === 'rejected' && submission.rejectionReason && (
                            <div className={`p-2 rounded-lg text-xs ${
                              isDark ? 'bg-red-950 text-red-300' : 'bg-red-50 text-red-700'
                            }`}>
                              <strong>Reason:</strong> {submission.rejectionReason}
                            </div>
                          )}
                          <div className="text-xs opacity-75">
                            Modified: {new Date(submission.lastModified).toLocaleDateString()}
                          </div>
                          {!isCurrentEditing ? (
                            <NeuroButton
                              onClick={() => startEditing(category.id)}
                              size="sm"
                              className="w-full"
                            >
                              Edit
                            </NeuroButton>
                          ) : (
                            <NeuroButton
                              onClick={cancelEditing}
                              variant="secondary"
                              size="sm"
                              className="w-full"
                            >
                              Cancel
                            </NeuroButton>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className={`p-2 rounded-lg text-xs ${
                            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                            No submission
                          </div>
                          {!isCurrentEditing ? (
                            <NeuroButton
                              onClick={() => startEditing(category.id)}
                              variant="gold"
                              size="sm"
                              className="w-full"
                            >
                              Create
                            </NeuroButton>
                          ) : (
                            <NeuroButton
                              onClick={cancelEditing}
                              variant="secondary"
                              size="sm"
                              className="w-full"
                            >
                              Cancel
                            </NeuroButton>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Submit;
