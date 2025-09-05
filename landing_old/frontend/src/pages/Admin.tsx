import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NeuroCard from '../components/NeuroCard';
import NeuroButton from '../components/NeuroButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface Submission {
  id: string;
  username: string;
  email: string;
  category: string;
  filename: string;
  codeTokens: number;
  stringTokens: number;
  totalTokens: number;
  createdAt: string;
  lastModified: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Analytics {
  totalSubmissions: number;
  submissionsByCategory: Record<string, number>;
  totalUsers: number;
  recentActivity: number;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [codeView, setCodeView] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    fetchSubmissions();
    fetchAnalytics();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
    setIsLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const viewCode = async (submission: Submission) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}/code`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCodeView(data.code);
        setSelectedSubmission(submission);
      }
    } catch (error) {
      console.error('Failed to fetch code:', error);
    }
  };

  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/admin/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status }),
      });
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await fetch(`/api/admin/submissions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchSubmissions();
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(null);
          setCodeView('');
        }
      } catch (error) {
        console.error('Failed to delete submission:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const tabs = [
    { id: 'submissions', name: 'Submissions', count: submissions.length },
    { id: 'analytics', name: 'Analytics', count: analytics?.totalUsers || 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-gold-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">Admin Panel</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage submissions and view analytics
        </p>
      </div>

      <NeuroCard className="p-6">
        <div className="flex space-x-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gold-500 text-white'
                  : `${isDark ? 'bg-neuro-dark shadow-neuro-dark' : 'bg-neuro-light shadow-neuro-light'} hover:shadow-neuro-${isDark ? 'dark' : 'light'}-inset`
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {activeTab === 'submissions' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {submissions.length === 0 ? (
                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No submissions found
                </p>
              ) : (
                submissions.map((submission) => (
                  <NeuroCard
                    key={submission.id}
                    className="p-4 hover:shadow-neuro-light-inset cursor-pointer"
                    onClick={() => viewCode(submission)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{submission.filename}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          by {submission.username} ({submission.email})
                        </p>
                      </div>
                      <span className={`text-sm font-medium capitalize ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="capitalize">{submission.category}</span>
                      <span>{submission.totalTokens} tokens</span>
                      <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                    </div>
                  </NeuroCard>
                ))
              )}
            </div>

            <div className="space-y-4">
              {selectedSubmission && (
                <NeuroCard className="p-4">
                  <h3 className="font-semibold mb-4">Submission Details</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div><strong>File:</strong> {selectedSubmission.filename}</div>
                    <div><strong>User:</strong> {selectedSubmission.username}</div>
                    <div><strong>Category:</strong> {selectedSubmission.category}</div>
                    <div><strong>Tokens:</strong> {selectedSubmission.totalTokens}</div>
                    <div><strong>Status:</strong> <span className={getStatusColor(selectedSubmission.status)}>
                      {selectedSubmission.status}
                    </span></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <NeuroButton
                        onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved')}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        Approve
                      </NeuroButton>
                      <NeuroButton
                        onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected')}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                      >
                        Reject
                      </NeuroButton>
                    </div>
                    <NeuroButton
                      onClick={() => deleteSubmission(selectedSubmission.id)}
                      variant="secondary"
                      size="sm"
                      className="w-full text-red-500"
                    >
                      Delete
                    </NeuroButton>
                  </div>
                </NeuroCard>
              )}

              {codeView && (
                <NeuroCard className="p-4">
                  <h3 className="font-semibold mb-4">Code Preview</h3>
                  <div className={`p-4 rounded-lg font-mono text-sm max-h-96 overflow-auto ${
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <pre>{codeView}</pre>
                  </div>
                </NeuroCard>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeuroCard className="p-6 text-center">
              <div className="text-3xl font-bold text-gold-500">{analytics.totalSubmissions}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Submissions
              </div>
            </NeuroCard>

            <NeuroCard className="p-6 text-center">
              <div className="text-3xl font-bold text-gold-500">{analytics.totalUsers}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Registered Users
              </div>
            </NeuroCard>

            <NeuroCard className="p-6 text-center">
              <div className="text-3xl font-bold text-gold-500">{analytics.recentActivity}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Recent Activity (7d)
              </div>
            </NeuroCard>

            <NeuroCard className="p-6">
              <h3 className="font-semibold mb-4">By Category</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(analytics.submissionsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category}:</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </NeuroCard>
          </div>
        )}
      </NeuroCard>
    </div>
  );
};

export default Admin;