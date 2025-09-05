import React, { useState, useEffect } from 'react';
import { redirect } from 'react-router';
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
  rejectionReason?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  submissionCount: number;
}

interface Analytics {
  totalSubmissions: number;
  submissionsByCategory: Record<string, number>;
  totalUsers: number;
  recentActivity: number;
}

// Loader function for route protection (recommended approach in v7)
export async function adminLoader({ request }: { request: Request }) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw redirect('/login');
  }

  // Verify admin status with your API
  try {
    const response = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw redirect('/');
    }
    const data = await response.json();
    if (!data.user?.isAdmin) {
      throw redirect('/');
    }
  } catch (error) {
    throw redirect('/');
  }

  return null;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'pending' | 'submissions' | 'users' | 'analytics'>('pending');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [codeView, setCodeView] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [resetPasswordData, setResetPasswordData] = useState<{userId: string, newPassword: string} | null>(null);
  const [rejectionData, setRejectionData] = useState<{submissionId: string, reason: string} | null>(null);
  const [bulkRejectionData, setBulkRejectionData] = useState<{reason: string} | null>(null);

  // Keep the client-side check as fallback, but loader should handle this
  if (!user?.isAdmin) {
    window.location.href = '/';
    return null;
  }

  useEffect(() => {
    fetchPendingSubmissions();
    fetchSubmissions();
    fetchUsers();
    fetchAnalytics();
  }, []);

  // Search users when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearch]);

  const fetchPendingSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to fetch pending submissions:', error);
    }
    setIsLoading(false);
  };

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
  };

  const fetchUsers = async () => {
    try {
      const searchQuery = userSearch ? `?search=${encodeURIComponent(userSearch)}` : '';
      const response = await fetch(`/api/admin/users${searchQuery}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
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

  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      await fetch(`/api/admin/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, rejectionReason }),
      });
      setRejectionData(null); // Clear rejection dialog
      fetchPendingSubmissions();
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const bulkUpdateSubmissions = async (action: 'approve' | 'reject' | 'delete', rejectionReason?: string) => {
    if (selectedSubmissions.size === 0) return;
    
    try {
      await fetch('/api/admin/submissions/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          submissionIds: Array.from(selectedSubmissions),
          action: action,
          rejectionReason: rejectionReason
        }),
      });
      setSelectedSubmissions(new Set());
      setBulkRejectionData(null); // Clear bulk rejection dialog
      fetchPendingSubmissions();
      fetchSubmissions();
    } catch (error) {
      console.error('Failed to bulk update submissions:', error);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await fetch(`/api/admin/submissions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchPendingSubmissions();
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

  const resetUserPassword = async (userId: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword }),
      });
      
      if (response.ok) {
        alert('Password reset successfully!');
        setResetPasswordData(null);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    }
  };

  const toggleSubmissionSelection = (id: string) => {
    const newSelection = new Set(selectedSubmissions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSubmissions(newSelection);
  };

  const selectAllSubmissions = (submissions: Submission[]) => {
    setSelectedSubmissions(new Set(submissions.map(s => s.id)));
  };

  const clearSubmissionSelection = () => {
    setSelectedSubmissions(new Set());
  };

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeView);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Failed to copy code to clipboard');
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
    { id: 'pending', name: 'Pending', count: pendingSubmissions.length },
    { id: 'submissions', name: 'All Submissions', count: submissions.length },
    { id: 'users', name: 'Users', count: users.length },
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
          Manage users, submissions, and view analytics
        </p>
      </div>

      <NeuroCard className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
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

        {/* Main Layout - 2 Column Split */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Content */}
          <div className="space-y-4">
            {/* Pending Submissions Tab */}
            {activeTab === 'pending' && (
              <>
                {selectedSubmissions.size > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <NeuroButton onClick={() => bulkUpdateSubmissions('approve')} variant="secondary" size="sm">
                      Approve Selected ({selectedSubmissions.size})
                    </NeuroButton>
                    <NeuroButton 
                      onClick={() => setBulkRejectionData({reason: ''})} 
                      variant="secondary" 
                      size="sm"
                      className="text-orange-500"
                    >
                      Reject Selected ({selectedSubmissions.size})
                    </NeuroButton>
                    <NeuroButton onClick={() => bulkUpdateSubmissions('delete')} variant="secondary" size="sm" className="text-red-500">
                      Delete Selected ({selectedSubmissions.size})
                    </NeuroButton>
                    <NeuroButton onClick={clearSubmissionSelection} variant="secondary" size="sm">
                      Clear Selection
                    </NeuroButton>
                  </div>
                )}
                
                {pendingSubmissions.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <NeuroButton onClick={() => selectAllSubmissions(pendingSubmissions)} variant="secondary" size="sm">
                      Select All
                    </NeuroButton>
                  </div>
                )}
                
                <div className="space-y-4">
                  {pendingSubmissions.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No pending submissions
                    </p>
                  ) : (
                    pendingSubmissions.map((submission) => (
                      <NeuroCard
                        key={submission.id}
                        className={`p-4 hover:shadow-neuro-light-inset cursor-pointer ${
                          selectedSubmissions.has(submission.id) ? 'ring-2 ring-gold-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.has(submission.id)}
                            onChange={() => toggleSubmissionSelection(submission.id)}
                            className="mt-1"
                          />
                          <div className="flex-1" onClick={() => viewCode(submission)}>
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
                          </div>
                        </div>
                      </NeuroCard>
                    ))
                  )}
                </div>
              </>
            )}

            {/* All Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
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
                      {submission.status === 'rejected' && submission.rejectionReason && (
                        <div className={`mt-2 p-2 rounded text-xs ${
                          isDark ? 'bg-red-950 text-red-300' : 'bg-red-50 text-red-700'
                        }`}>
                          <strong>Rejection reason:</strong> {submission.rejectionReason}
                        </div>
                      )}
                    </NeuroCard>
                  ))
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl border ${
                      isDark 
                        ? 'bg-neuro-dark border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className="grid gap-4">
                  {users.length === 0 ? (
                    <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No users found
                    </p>
                  ) : (
                    users.map((user) => (
                      <NeuroCard
                        key={user.id}
                        className="p-4 hover:shadow-neuro-light-inset cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {user.username}
                              {user.isAdmin && <span className="text-xs bg-gold-500 text-white px-2 py-1 rounded">ADMIN</span>}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {user.email}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{user.submissionCount} submissions</p>
                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </NeuroCard>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="grid md:grid-cols-2 gap-6">
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
          </div>

          {/* Right Column - Code Preview & Details (Always Visible) */}
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
                  {selectedSubmission.rejectionReason && (
                    <div><strong>Rejection Reason:</strong> {selectedSubmission.rejectionReason}</div>
                  )}
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
                      onClick={() => setRejectionData({submissionId: selectedSubmission.id, reason: ''})}
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Code Preview</h3>
                  <NeuroButton
                    onClick={copyCodeToClipboard}
                    variant="secondary"
                    size="sm"
                  >
                    📋 Copy
                  </NeuroButton>
                </div>
                <div className={`p-4 rounded-lg font-mono text-sm max-h-96 overflow-auto ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <pre>{codeView}</pre>
                </div>
              </NeuroCard>
            )}

            {selectedUser && (
              <NeuroCard className="p-4">
                <h3 className="font-semibold mb-4">User Details</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div><strong>Username:</strong> {selectedUser.username}</div>
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Admin:</strong> {selectedUser.isAdmin ? 'Yes' : 'No'}</div>
                  <div><strong>Submissions:</strong> {selectedUser.submissionCount}</div>
                  <div><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
                
                <div className="space-y-2">
                  <NeuroButton
                    onClick={() => setResetPasswordData({userId: selectedUser.id, newPassword: ''})}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Reset Password
                  </NeuroButton>
                </div>
              </NeuroCard>
            )}
          </div>
        </div>

        {/* Dialogs */}
        {rejectionData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <NeuroCard className="p-6 m-4 w-full max-w-md">
              <h3 className="font-semibold mb-4">Reject Submission</h3>
              <div className="space-y-4">
                <textarea
                  placeholder="Enter rejection reason (optional)"
                  value={rejectionData.reason}
                  onChange={(e) => setRejectionData({...rejectionData, reason: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl border resize-none ${
                    isDark 
                      ? 'bg-neuro-dark border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                  rows={4}
                />
                <div className="flex gap-2">
                  <NeuroButton
                    onClick={() => updateSubmissionStatus(rejectionData.submissionId, 'rejected', rejectionData.reason)}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-red-500"
                  >
                    Reject
                  </NeuroButton>
                  <NeuroButton
                    onClick={() => setRejectionData(null)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          </div>
        )}

        {bulkRejectionData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <NeuroCard className="p-6 m-4 w-full max-w-md">
              <h3 className="font-semibold mb-4">Bulk Reject Submissions</h3>
              <div className="space-y-4">
                <textarea
                  placeholder="Enter rejection reason (optional)"
                  value={bulkRejectionData.reason}
                  onChange={(e) => setBulkRejectionData({...bulkRejectionData, reason: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl border resize-none ${
                    isDark 
                      ? 'bg-neuro-dark border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                  rows={4}
                />
                <div className="flex gap-2">
                  <NeuroButton
                    onClick={() => bulkUpdateSubmissions('reject', bulkRejectionData.reason)}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-red-500"
                  >
                    Reject ({selectedSubmissions.size})
                  </NeuroButton>
                  <NeuroButton
                    onClick={() => setBulkRejectionData(null)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          </div>
        )}

        {resetPasswordData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <NeuroCard className="p-6 m-4 w-full max-w-md">
              <h3 className="font-semibold mb-4">Reset Password</h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={resetPasswordData.newPassword}
                  onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark 
                      ? 'bg-neuro-dark border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                />
                <div className="flex gap-2">
                  <NeuroButton
                    onClick={() => resetUserPassword(resetPasswordData.userId, resetPasswordData.newPassword)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={resetPasswordData.newPassword.length < 6}
                  >
                    Reset Password
                  </NeuroButton>
                  <NeuroButton
                    onClick={() => setResetPasswordData(null)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          </div>
        )}
      </NeuroCard>
    </div>
  );
};

export default Admin;