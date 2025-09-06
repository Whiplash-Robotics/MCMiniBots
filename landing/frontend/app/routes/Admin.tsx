import React, { useState, useEffect } from "react";
import { redirect, useNavigate } from "react-router";
import NeuroCard from "../components/NeuroCard";
import NeuroButton from "../components/NeuroButton";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
// Client-only Chart wrapper component
const ClientOnlyChart: React.FC<{
  options: any;
  series: any;
  type: any;
  height: number;
}> = ({ options, series, type, height }) => {
  const [isClient, setIsClient] = useState(false);
  const [Chart, setChart] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Only import on client side
    if (typeof window !== 'undefined') {
      import("react-apexcharts").then((module) => {
        setChart(() => module.default);
      });
    }
  }, []);

  if (!isClient || !Chart) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-gold-500">Loading chart...</div>
      </div>
    );
  }

  return <Chart options={options} series={series} type={type} height={height} />;
};

// Helper function to safely access localStorage during SSR
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("token");
};

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
  status: "pending" | "approved" | "rejected";
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
  // Skip authentication check during SSR - let client handle it completely
  if (typeof window === 'undefined') {
    return null;
  }

  const token = getToken();
  if (!token) {
    throw redirect("/login");
  }

  // Verify admin status with your API
  try {
    const response = await fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw redirect("/");
    }
    const data = await response.json();
    if (!data.user?.isAdmin) {
      throw redirect("/");
    }
  } catch (error) {
    throw redirect("/");
  }

  return null;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "pending" | "submissions" | "users" | "analytics"
  >("pending");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>(
    []
  );
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [codeView, setCodeView] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [userSearch, setUserSearch] = useState<string>("");
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const [resetPasswordData, setResetPasswordData] = useState<{
    userId: string;
    newPassword: string;
  } | null>(null);
  const [rejectionData, setRejectionData] = useState<{
    submissionId: string;
    reason: string;
  } | null>(null);
  const [bulkRejectionData, setBulkRejectionData] = useState<{
    reason: string;
  } | null>(null);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Client-side authentication check
  useEffect(() => {
    if (!isClient) return;
    
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    
    // Check if user is loaded and is admin
    if (user !== null && !user?.isAdmin) {
      navigate("/");
      return;
    }
  }, [user, navigate, isClient]);

  useEffect(() => {
    if (!isClient) return;
    fetchPendingSubmissions();
    fetchSubmissions();
    fetchUsers();
    fetchAnalytics();
  }, [isClient]);

  // Search users when search term changes
  useEffect(() => {
    if (!isClient) return;
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearch, isClient]);

  const fetchPendingSubmissions = async () => {
    try {
      const response = await fetch("/api/admin/submissions/pending", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingSubmissions(data.submissions);
      }
    } catch (error) {
      console.error("Failed to fetch pending submissions:", error);
    }
    setIsLoading(false);
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const searchQuery = userSearch
        ? `?search=${encodeURIComponent(userSearch)}`
        : "";
      const response = await fetch(`/api/admin/users${searchQuery}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const viewCode = async (submission: Submission) => {
    try {
      const response = await fetch(
        `/api/admin/submissions/${submission.id}/code`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCodeView(data.code);
        setSelectedSubmission(submission);
      }
    } catch (error) {
      console.error("Failed to fetch code:", error);
    }
  };

  const updateSubmissionStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
    rejectionReason?: string
  ) => {
    try {
      await fetch(`/api/admin/submissions/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status, rejectionReason }),
      });
      setRejectionData(null); // Clear rejection dialog
      
      // Clear selection if the submission is no longer pending and was selected
      if (status !== "pending" && selectedSubmission?.id === id) {
        setSelectedSubmission(null);
        setCodeView("");
      }
      
      fetchPendingSubmissions();
      fetchSubmissions();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const bulkUpdateSubmissions = async (
    action: "approve" | "reject" | "delete",
    rejectionReason?: string
  ) => {
    if (selectedSubmissions.size === 0) return;

    try {
      await fetch("/api/admin/submissions/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          submissionIds: Array.from(selectedSubmissions),
          action: action,
          rejectionReason: rejectionReason,
        }),
      });
      setSelectedSubmissions(new Set());
      setBulkRejectionData(null); // Clear bulk rejection dialog
      fetchPendingSubmissions();
      fetchSubmissions();
    } catch (error) {
      console.error("Failed to bulk update submissions:", error);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (typeof window !== 'undefined' && confirm("Are you sure you want to delete this submission?")) {
      try {
        await fetch(`/api/admin/submissions/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        fetchPendingSubmissions();
        fetchSubmissions();
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(null);
          setCodeView("");
        }
      } catch (error) {
        console.error("Failed to delete submission:", error);
      }
    }
  };

  const resetUserPassword = async (userId: string, newPassword: string) => {
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      if (response.ok) {
        if (typeof window !== 'undefined') alert("Password reset successfully!");
        setResetPasswordData(null);
      } else {
        const data = await response.json();
        if (typeof window !== 'undefined') alert(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      if (typeof window !== 'undefined') alert("Failed to reset password");
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
    setSelectedSubmissions(new Set(submissions.map((s) => s.id)));
  };

  const clearSubmissionSelection = () => {
    setSelectedSubmissions(new Set());
  };

  const copyCodeToClipboard = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(codeView);
      alert("Code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy code:", err);
      alert("Failed to copy code to clipboard");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const tabs = [
    { id: "pending", name: "Pending", count: pendingSubmissions.length },
    { id: "submissions", name: "All Submissions", count: submissions.length },
    { id: "users", name: "Users", count: users.length },
    { id: "analytics", name: "Analytics", count: analytics?.totalUsers || 0 },
  ];

  // Show loading state during SSR, while user data isn't available, or while data is loading
  if (!isClient || !user || isLoading) {
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
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
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
                  ? "bg-gold-500 text-white"
                  : `${isDark ? "bg-neuro-dark shadow-neuro-dark" : "bg-neuro-light shadow-neuro-light"} hover:shadow-neuro-${isDark ? "dark" : "light"}-inset`
              }`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {/* Main Layout - 2 Column Split */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Submission Lists */}
          <div className="space-y-4">
            {/* Pending Submissions Tab */}
            {activeTab === "pending" && (
              <>
                {selectedSubmissions.size > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <NeuroButton
                      onClick={() => bulkUpdateSubmissions("approve")}
                      variant="secondary"
                      size="sm"
                    >
                      Approve Selected ({selectedSubmissions.size})
                    </NeuroButton>
                    <NeuroButton
                      onClick={() => setBulkRejectionData({ reason: "" })}
                      variant="secondary"
                      size="sm"
                      className="text-orange-500"
                    >
                      Reject Selected ({selectedSubmissions.size})
                    </NeuroButton>
                    <NeuroButton
                      onClick={() => bulkUpdateSubmissions("delete")}
                      variant="secondary"
                      size="sm"
                      className="text-red-500"
                    >
                      Delete Selected ({selectedSubmissions.size})
                    </NeuroButton>
                    <NeuroButton
                      onClick={clearSubmissionSelection}
                      variant="secondary"
                      size="sm"
                    >
                      Clear Selection
                    </NeuroButton>
                  </div>
                )}

                {pendingSubmissions.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <NeuroButton
                      onClick={() => selectAllSubmissions(pendingSubmissions)}
                      variant="secondary"
                      size="sm"
                    >
                      Select All
                    </NeuroButton>
                  </div>
                )}

                <div className="space-y-4">
                  {pendingSubmissions.length === 0 ? (
                    <p
                      className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      No pending submissions
                    </p>
                  ) : (
                    pendingSubmissions.map((submission) => (
                      <NeuroCard
                        key={submission.id}
                        className={`p-4 hover:shadow-neuro-light-inset cursor-pointer ${
                          selectedSubmissions.has(submission.id)
                            ? "ring-2 ring-gold-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.has(submission.id)}
                            onChange={() =>
                              toggleSubmissionSelection(submission.id)
                            }
                            className="mt-1"
                          />
                          <div
                            className="flex-1"
                            onClick={() => viewCode(submission)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">
                                  {submission.filename}
                                </h3>
                                <p
                                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  by {submission.username} ({submission.email})
                                </p>
                              </div>
                              <span
                                className={`text-sm font-medium capitalize ${getStatusColor(submission.status)}`}
                              >
                                {submission.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="capitalize">
                                {submission.category}
                              </span>
                              <span>{submission.totalTokens} tokens</span>
                              <span>
                                {new Date(
                                  submission.createdAt
                                ).toLocaleDateString()}
                              </span>
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
            {activeTab === "submissions" && (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <p
                    className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
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
                          <h3 className="font-semibold">
                            {submission.filename}
                          </h3>
                          <p
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            by {submission.username} ({submission.email})
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium capitalize ${getStatusColor(submission.status)}`}
                        >
                          {submission.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="capitalize">
                          {submission.category}
                        </span>
                        <span>{submission.totalTokens} tokens</span>
                        <span>
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {submission.status === "rejected" &&
                        submission.rejectionReason && (
                          <div
                            className={`mt-2 p-2 rounded text-xs ${
                              isDark
                                ? "bg-red-950 text-red-300"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            <strong>Rejection reason:</strong>{" "}
                            {submission.rejectionReason}
                          </div>
                        )}
                    </NeuroCard>
                  ))
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl border ${
                      isDark
                        ? "bg-neuro-dark border-gray-600 text-white placeholder-gray-400"
                        : "bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500"
                    }`}
                  />
                </div>

                <div className="grid gap-4">
                  {users.length === 0 ? (
                    <p
                      className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
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
                              {user.isAdmin && (
                                <span className="text-xs bg-gold-500 text-white px-2 py-1 rounded">
                                  ADMIN
                                </span>
                              )}
                            </h3>
                            <p
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {user.email}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{user.submissionCount} submissions</p>
                            <p
                              className={`${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
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
            {activeTab === "analytics" && analytics && (
              <div className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NeuroCard className="p-6 text-center">
                    <div className="text-3xl font-bold text-gold-500">
                      {analytics.totalSubmissions}
                    </div>
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Total Submissions
                    </div>
                  </NeuroCard>

                  <NeuroCard className="p-6 text-center">
                    <div className="text-3xl font-bold text-gold-500">
                      {analytics.totalUsers}
                    </div>
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Registered Users
                    </div>
                  </NeuroCard>

                  <NeuroCard className="p-6 text-center">
                    <div className="text-3xl font-bold text-gold-500">
                      {analytics.recentActivity}
                    </div>
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Recent Activity (7d)
                    </div>
                  </NeuroCard>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut Chart - Category Distribution */}
                  <NeuroCard className="p-6">
                    <h3 className="font-semibold mb-6 text-lg">Category Distribution</h3>
                    <ClientOnlyChart
                      options={{
                        chart: {
                          type: 'donut',
                          background: 'transparent',
                        },
                        labels: Object.keys(analytics.submissionsByCategory).map(cat => 
                          cat.charAt(0).toUpperCase() + cat.slice(1)
                        ),
                        colors: ['#D4A574', '#B8956A', '#9C8560', '#807556'],
                        legend: {
                          position: 'bottom',
                          labels: {
                            colors: isDark ? '#e5e7eb' : '#374151'
                          }
                        },
                        dataLabels: {
                          enabled: true,
                          style: {
                            colors: ['#000']
                          }
                        },
                        plotOptions: {
                          pie: {
                            donut: {
                              size: '60%'
                            }
                          }
                        },
                        theme: {
                          mode: isDark ? 'dark' : 'light'
                        }
                      } as ApexOptions}
                      series={Object.values(analytics.submissionsByCategory)}
                      type="donut"
                      height={300}
                    />
                  </NeuroCard>

                  {/* Bar Chart - Category Comparison */}
                  <NeuroCard className="p-6">
                    <h3 className="font-semibold mb-6 text-lg">Submissions by Category</h3>
                    <ClientOnlyChart
                      options={{
                        chart: {
                          type: 'bar',
                          background: 'transparent',
                          toolbar: {
                            show: false
                          }
                        },
                        plotOptions: {
                          bar: {
                            horizontal: false,
                            columnWidth: '55%',
                            borderRadius: 4,
                          },
                        },
                        dataLabels: {
                          enabled: false,
                        },
                        xaxis: {
                          categories: Object.keys(analytics.submissionsByCategory).map(cat => 
                            cat.charAt(0).toUpperCase() + cat.slice(1)
                          ),
                          labels: {
                            style: {
                              colors: isDark ? '#e5e7eb' : '#374151'
                            }
                          }
                        },
                        yaxis: {
                          labels: {
                            style: {
                              colors: isDark ? '#e5e7eb' : '#374151'
                            }
                          }
                        },
                        colors: ['#D4A574'],
                        theme: {
                          mode: isDark ? 'dark' : 'light'
                        },
                        grid: {
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                        }
                      } as ApexOptions}
                      series={[{
                        name: 'Submissions',
                        data: Object.values(analytics.submissionsByCategory)
                      }]}
                      type="bar"
                      height={300}
                    />
                  </NeuroCard>
                </div>

                {/* Additional Analytics Chart */}
                <NeuroCard className="p-6">
                  <h3 className="font-semibold mb-6 text-lg">Overview Metrics</h3>
                  <ClientOnlyChart
                    options={{
                      chart: {
                        type: 'bar',
                        background: 'transparent',
                        toolbar: {
                          show: false
                        }
                      },
                      plotOptions: {
                        bar: {
                          horizontal: true,
                          borderRadius: 4,
                        },
                      },
                      dataLabels: {
                        enabled: false,
                      },
                      xaxis: {
                        categories: ['Total Submissions', 'Total Users', 'Recent Activity (7d)'],
                        labels: {
                          style: {
                            colors: isDark ? '#e5e7eb' : '#374151'
                          }
                        }
                      },
                      yaxis: {
                        labels: {
                          style: {
                            colors: isDark ? '#e5e7eb' : '#374151'
                          }
                        }
                      },
                      colors: ['#D4A574'],
                      theme: {
                        mode: isDark ? 'dark' : 'light'
                      },
                      grid: {
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                      }
                    } as ApexOptions}
                    series={[{
                      name: 'Count',
                      data: [analytics.totalSubmissions, analytics.totalUsers, analytics.recentActivity]
                    }]}
                    type="bar"
                    height={200}
                  />
                </NeuroCard>
              </div>
            )}
          </div>

          {/* Right Column - Code Review & Details */}
          <div className="space-y-4">
            {/* Code Preview - Always show if available */}
            {codeView && (
              <NeuroCard className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Code Review</h3>
                  <div className="flex gap-2">
                    <NeuroButton
                      onClick={copyCodeToClipboard}
                      variant="secondary"
                      size="sm"
                    >
                      📋 Copy
                    </NeuroButton>
                    <NeuroButton
                      onClick={() => {
                        setSelectedSubmission(null);
                        setCodeView("");
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      ✕ Close
                    </NeuroButton>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg font-mono text-sm max-h-96 overflow-auto ${
                    isDark ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <pre>{codeView}</pre>
                </div>
              </NeuroCard>
            )}

            {/* Submission Details - Only show if submission is selected and pending */}
            {selectedSubmission && (
              <NeuroCard className="p-4">
                <h3 className="font-semibold mb-4 text-lg">Submission Actions</h3>
                <div className="space-y-3 text-sm mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>File:</strong> {selectedSubmission.filename}
                    </div>
                    <div>
                      <strong>User:</strong> {selectedSubmission.username}
                    </div>
                    <div>
                      <strong>Category:</strong> {selectedSubmission.category}
                    </div>
                    <div>
                      <strong>Tokens:</strong> {selectedSubmission.totalTokens}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <strong>Status:</strong>{" "}
                    <span className={`${getStatusColor(selectedSubmission.status)} font-semibold`}>
                      {selectedSubmission.status.toUpperCase()}
                    </span>
                  </div>
                  {selectedSubmission.rejectionReason && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-red-950 text-red-300' : 'bg-red-50 text-red-700'}`}>
                      <strong>Rejection Reason:</strong> {selectedSubmission.rejectionReason}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <NeuroButton
                      onClick={() =>
                        updateSubmissionStatus(
                          selectedSubmission.id,
                          "approved"
                        )
                      }
                      variant="secondary"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                    >
                      ✓ Approve
                    </NeuroButton>
                    <NeuroButton
                      onClick={() =>
                        setRejectionData({
                          submissionId: selectedSubmission.id,
                          reason: selectedSubmission.rejectionReason || "",
                        })
                      }
                      variant="secondary"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600"
                    >
                      ⚠ Reject
                    </NeuroButton>
                  </div>
                  
                  {/* Additional Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSubmission.status !== "pending" && (
                      <NeuroButton
                        onClick={() =>
                          updateSubmissionStatus(
                            selectedSubmission.id,
                            "pending"
                          )
                        }
                        variant="secondary"
                        size="sm"
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        ↺ Move to Pending
                      </NeuroButton>
                    )}
                    <NeuroButton
                      onClick={() => deleteSubmission(selectedSubmission.id)}
                      variant="secondary"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      🗑 Delete
                    </NeuroButton>
                  </div>
                </div>
              </NeuroCard>
            )}

            {/* User Details - Only show when user tab is active */}
            {selectedUser && activeTab === "users" && (
              <NeuroCard className="p-4">
                <h3 className="font-semibold mb-4 text-lg">User Management</h3>
                <div className="space-y-3 text-sm mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Username:</strong> {selectedUser.username}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedUser.email}
                    </div>
                    <div>
                      <strong>Admin:</strong> {selectedUser.isAdmin ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Submissions:</strong> {selectedUser.submissionCount}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <NeuroButton
                  onClick={() =>
                    setResetPasswordData({
                      userId: selectedUser.id,
                      newPassword: "",
                    })
                  }
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  🔑 Reset Password
                </NeuroButton>
              </NeuroCard>
            )}

            {/* Empty State */}
            {!codeView && !selectedSubmission && !selectedUser && (
              <NeuroCard className="p-8 text-center">
                <div className={`text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  👁️
                </div>
                <h3 className="font-semibold mb-2 text-lg">Code Review Panel</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select a submission from the left to view and review the code here.
                </p>
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
                  onChange={(e) =>
                    setRejectionData({
                      ...rejectionData,
                      reason: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-xl border resize-none ${
                    isDark
                      ? "bg-neuro-dark border-gray-600 text-white placeholder-gray-400"
                      : "bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                  rows={4}
                />
                <div className="flex gap-2">
                  <NeuroButton
                    onClick={() =>
                      updateSubmissionStatus(
                        rejectionData.submissionId,
                        "rejected",
                        rejectionData.reason
                      )
                    }
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
                  onChange={(e) =>
                    setBulkRejectionData({
                      ...bulkRejectionData,
                      reason: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-xl border resize-none ${
                    isDark
                      ? "bg-neuro-dark border-gray-600 text-white placeholder-gray-400"
                      : "bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                  rows={4}
                />
                <div className="flex gap-2">
                  <NeuroButton
                    onClick={() =>
                      bulkUpdateSubmissions("reject", bulkRejectionData.reason)
                    }
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
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      newPassword: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark
                      ? "bg-neuro-dark border-gray-600 text-white placeholder-gray-400"
                      : "bg-neuro-light border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                />
                <div className="flex gap-2">
                  <NeuroButton
                    onClick={() =>
                      resetUserPassword(
                        resetPasswordData.userId,
                        resetPasswordData.newPassword
                      )
                    }
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
