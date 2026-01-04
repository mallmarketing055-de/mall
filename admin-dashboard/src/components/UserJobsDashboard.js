import React, { useState } from 'react';
import Layout from './Layout';
import { dashboardAPI } from '../services/api';
import './UserJobsDashboard.css';
import { useTranslation } from "react-i18next";

const UserJobsDashboard = () => {
    const { t } = useTranslation();
    const [userId, setUserId] = useState('');
    const [jobsData, setJobsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    const fetchUserJobs = async (customerId) => {
        if (!customerId || !customerId.trim()) {
            setError(t("userJobsPage.errorValidId"));
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
                setError(response.data.message || t("userJobsPage.loadingJobs"));
            }
        } catch (err) {
            console.error('Error fetching user jobs:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                t("userJobsPage.loadingJobs")
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUserJobs(userId);
    };

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

    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            processing: 'status-processing',
            completed: 'status-completed',
            failed: 'status-failed'
        };
        return statusClasses[status] || '';
    };

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
                    <h1>{t("userJobsPage.title")}</h1>
                    <p className="subtitle">{t("userJobsPage.subtitle")}</p>
                </div>

                {/* Search Form */}
                <div className="search-section">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="input-group">
                            <label htmlFor="userId">{t("userJobsPage.userIdLabel")}</label>
                            <input
                                type="text"
                                id="userId"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder={t("userJobsPage.searchPlaceholder")}
                                className="user-id-input"
                            />
                        </div>
                        <button
                            type="submit"
                            className="search-button"
                            disabled={loading}
                        >
                            {loading ? t("userJobsPage.searching") : t("userJobsPage.searchButton")}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>{t("userJobsPage.loadingJobs")}</p>
                    </div>
                )}

                {!loading && searched && jobsData && (
                    <div className="results-section">
                        <div className="summary-cards">
                            <div className="summary-card total">
                                <div className="card-icon">📊</div>
                                <div className="card-content">
                                    <h3>{t("userJobsPage.totalJobs")}</h3>
                                    <p className="card-value">{jobsData.totalJobs}</p>
                                </div>
                            </div>

                            <div className="summary-card pending">
                                <div className="card-icon">⏳</div>
                                <div className="card-content">
                                    <h3>{t("userJobsPage.pending")}</h3>
                                    <p className="card-value">{jobsData.statusSummary.pending}</p>
                                </div>
                            </div>

                            <div className="summary-card processing">
                                <div className="card-icon">⚡</div>
                                <div className="card-content">
                                    <h3>{t("userJobsPage.processing")}</h3>
                                    <p className="card-value">{jobsData.statusSummary.processing}</p>
                                </div>
                            </div>

                            <div className="summary-card completed">
                                <div className="card-icon">✅</div>
                                <div className="card-content">
                                    <h3>{t("userJobsPage.completed")}</h3>
                                    <p className="card-value">{jobsData.statusSummary.completed}</p>
                                </div>
                            </div>

                            <div className="summary-card failed">
                                <div className="card-icon">❌</div>
                                <div className="card-content">
                                    <h3>{t("userJobsPage.failed")}</h3>
                                    <p className="card-value">{jobsData.statusSummary.failed}</p>
                                </div>
                            </div>
                        </div>

                        {jobsData.jobs.length > 0 ? (
                            <div className="jobs-table-container">
                                <h2>{t("userJobsPage.jobHistory")}</h2>
                                <div className="table-wrapper">
                                    <table className="jobs-table">
                                        <thead>
                                            <tr>
                                                <th>{t("userJobsPage.transaction")}</th>
                                                <th>{t("userJobsPage.status")}</th>
                                                <th>{t("userJobsPage.amount")}</th>
                                                <th>{t("userJobsPage.attempts")}</th>
                                                <th>{t("userJobsPage.created")}</th>
                                                <th>{t("userJobsPage.completedAt")}</th>
                                                <th>{t("userJobsPage.details")}</th>
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
                                                            {getStatusIcon(job.status)} {t(`userJobsPage.${job.status}`)}
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
                                                            {t("userJobsPage.view")}
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
                                <p>{t("userJobsPage.noJobs")}</p>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !searched && !error && (
                    <div className="initial-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>{t("userJobsPage.initialTitle")}</h3>
                        <p>{t("userJobsPage.initialSubtitle")}</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UserJobsDashboard;
