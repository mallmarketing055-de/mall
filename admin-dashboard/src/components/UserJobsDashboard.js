import React, { useState } from 'react';
import Layout from './Layout';
import { dashboardAPI } from '../services/api';
import './UserJobsDashboard.css';

const UserJobsDashboard = () => {
    const [userId, setUserId] = useState('');
    const [jobsData, setJobsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    /**
     * Fetch user jobs from backend using dashboardAPI
     */
    const fetchUserJobs = async (customerId) => {
        if (!customerId || !customerId.trim()) {
            setError('Please enter a valid User ID');
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(false);

        try {
            const response = await dashboardAPI.getUserJobs(customerId);

            if (response.data.success) {
                setJobsData(response.data);
                setSearched(true);
            } else {
                setError(response.data.message || 'Failed to fetch jobs');
            }
        } catch (err) {
            console.error('Error fetching user jobs:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to fetch user jobs'
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle search button click
     */
    const handleSearch = (e) => {
        e.preventDefault();
        fetchUserJobs(userId);
    };

    /**
     * Format date for display
     */
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Get status badge class
     */
    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            processing: 'status-processing',
            completed: 'status-completed',
            failed: 'status-failed'
        };
        return statusClasses[status] || '';
    };

    /**
     * Get status icon
     */
    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            processing: '⚡',
            completed: '✅',
            failed: '❌'
        };
        return icons[status] || '•';
    };

    return (
        <Layout>
            <div className="user-jobs-dashboard">
                <div className="dashboard-header">
                    <h1>User Checkout Jobs</h1>
                    <p className="subtitle">View checkout job status and history for any user</p>
                </div>

                {/* Search Form */}
                <div className="search-section">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="input-group">
                            <label htmlFor="userId">User ID (Customer ID)</label>
                            <input
                                type="text"
                                id="userId"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter customer ID..."
                                className="user-id-input"
                            />
                        </div>
                        <button
                            type="submit"
                            className="search-button"
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Search Jobs'}
                        </button>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading jobs...</p>
                    </div>
                )}

                {/* Results */}
                {!loading && searched && jobsData && (
                    <div className="results-section">
                        {/* Summary Cards */}
                        <div className="summary-cards">
                            <div className="summary-card total">
                                <div className="card-icon">📊</div>
                                <div className="card-content">
                                    <h3>Total Jobs</h3>
                                    <p className="card-value">{jobsData.totalJobs}</p>
                                </div>
                            </div>

                            <div className="summary-card pending">
                                <div className="card-icon">⏳</div>
                                <div className="card-content">
                                    <h3>Pending</h3>
                                    <p className="card-value">{jobsData.statusSummary.pending}</p>
                                </div>
                            </div>

                            <div className="summary-card processing">
                                <div className="card-icon">⚡</div>
                                <div className="card-content">
                                    <h3>Processing</h3>
                                    <p className="card-value">{jobsData.statusSummary.processing}</p>
                                </div>
                            </div>

                            <div className="summary-card completed">
                                <div className="card-icon">✅</div>
                                <div className="card-content">
                                    <h3>Completed</h3>
                                    <p className="card-value">{jobsData.statusSummary.completed}</p>
                                </div>
                            </div>

                            <div className="summary-card failed">
                                <div className="card-icon">❌</div>
                                <div className="card-content">
                                    <h3>Failed</h3>
                                    <p className="card-value">{jobsData.statusSummary.failed}</p>
                                </div>
                            </div>
                        </div>

                        {/* Jobs Table */}
                        {jobsData.jobs.length > 0 ? (
                            <div className="jobs-table-container">
                                <h2>Job History</h2>
                                <div className="table-wrapper">
                                    <table className="jobs-table">
                                        <thead>
                                            <tr>
                                                <th>Transaction</th>
                                                <th>Status</th>
                                                <th>Amount</th>
                                                <th>Attempts</th>
                                                <th>Created</th>
                                                <th>Completed</th>
                                                <th>Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobsData.jobs.map((job) => (
                                                <tr key={job.id}>
                                                    <td>
                                                        <div className="transaction-info">
                                                            <span className="transaction-ref">{job.transactionReference}</span>
                                                            <span className="transaction-id">
                                                                {job.transactionId ? `${job.transactionId.substring(0, 8)}...` : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${getStatusClass(job.status)}`}>
                                                            {getStatusIcon(job.status)} {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="amount-cell">{job.transactionAmount.toFixed(2)}</td>
                                                    <td className="attempts-cell">
                                                        <span className={job.attempts >= job.maxAttempts ? 'max-attempts' : ''}>
                                                            {job.attempts}/{job.maxAttempts}
                                                        </span>
                                                    </td>
                                                    <td className="date-cell">{formatDate(job.createdAt)}</td>
                                                    <td className="date-cell">{formatDate(job.completedAt)}</td>
                                                    <td>
                                                        <button
                                                            className="details-button"
                                                            onClick={() => alert(JSON.stringify(job, null, 2))}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="no-jobs-message">
                                <p>No jobs found for this user.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Initial State */}
                {!loading && !searched && !error && (
                    <div className="initial-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>Search for User Jobs</h3>
                        <p>Enter a customer ID above to view their checkout job history</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UserJobsDashboard;
