import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import {
  FaUsers,
  FaBox,
  FaReceipt,
  FaUserShield,
  FaArrowUp,
  FaArrowDown,
  FaEye
} from 'react-icons/fa';
import { userAPI, productAPI, transactionAPI, adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();

  const [stats, setStats] = useState({
    users: { total: 0, change: 0 },
    products: { total: 0, change: 0 },
    transactions: { total: 0, change: 0 },
    admins: { total: 0, change: 0 }
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchMonthlyReport();
  }, []);

  // Fetch main dashboard stats
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, productsRes, transactionsRes, adminsRes] = await Promise.allSettled([
        userAPI.getUserStats(),
        productAPI.getAllProducts({ limit: 1 }),
        transactionAPI.getTransactionStats(),
        adminAPI.getAllAdmins()
      ]);

      const newStats = { ...stats };

      // Users
      if (usersRes.status === 'fulfilled') {
        const userData = usersRes.value.data;
        newStats.users = {
          total: userData?.data?.stats?.totalUsers || userData?.stats?.totalUsers || 0,
          change: userData?.data?.monthlyGrowth || userData?.monthlyGrowth || 0
        };
      }

      // Products
      if (productsRes.status === 'fulfilled') {
        const productData = productsRes.value.data;
        newStats.products = {
          total: productData?.data?.pagination?.totalItems || Array.isArray(productData?.data) ? productData.data.length : 0,
          change: 0
        };
      }

      // Transactions
      if (transactionsRes.status === 'fulfilled') {
        const transactionData = transactionsRes.value.data;
        newStats.transactions = {
          total: transactionData?.data?.stats?.totalTransactions || transactionData?.stats?.totalTransactions || 0,
          change: transactionData?.data?.monthlyGrowth || transactionData?.monthlyGrowth || 0
        };
      }

      // Admins
      if (adminsRes.status === 'fulfilled') {
        const adminData = adminsRes.value.data;
        newStats.admins = {
          total: adminData?.data?.admins?.length || adminData?.admins?.length || 0,
          change: 0
        };
      }

      setStats(newStats);

      // Recent Transactions
      const recentRes = await transactionAPI.getAllTransactions({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecentTransactions(recentRes.data.data?.transactions || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Monthly Report
  const fetchMonthlyReport = async () => {
    try {
      const res = await transactionAPI.getMonthlyReport();
      if (res.data.success) setMonthlyReport(res.data.data);
    } catch (error) {
      console.error("Failed to fetch monthly report:", error);
      toast.error("Failed to load monthly report");
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color, colorEnd }) => (
    <div className="stat-card" style={{ '--card-color': color, '--card-color-end': colorEnd || color }}>
      <div className="stat-header">
        <div className="stat-info">
          <h3 className="stat-title">{title}</h3>
          <p className="stat-value">{loading ? '...' : (value || 0).toLocaleString()}</p>
        </div>
        <div className="stat-icon">
          <Icon />
        </div>
      </div>
      <div className="stat-footer">
        <div className={`stat-change ${(change || 0) >= 0 ? 'positive' : 'negative'}`}>
          {(change || 0) >= 0 ? <FaArrowUp /> : <FaArrowDown />}
          <span>{Math.abs(change || 0)}%</span>
        </div>
        <span className="stat-period">{t("dashboardPage.vsLastMonth")}</span>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="dashboard">

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard title={t("dashboardPage.totalUsers")} value={stats.users.total} change={stats.users.change} icon={FaUsers} color="#3b82f6" colorEnd="#1d4ed8" />
          <StatCard title={t("dashboardPage.totalProducts")} value={stats.products.total} change={stats.products.change} icon={FaBox} color="#f59e0b" colorEnd="#d97706" />
          <StatCard title={t("dashboardPage.totalTransactions")} value={stats.transactions.total} change={stats.transactions.change} icon={FaReceipt} color="#8b5cf6" colorEnd="#7c3aed" />
          <StatCard title={t("dashboardPage.totalAdmins")} value={stats.admins.total} change={stats.admins.change} icon={FaUserShield} color="#10b981" colorEnd="#059669" />
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{t("dashboardPage.recentTransactions")}</h2>
            </div>
            {loading ? (
              <div className="loading">{t("dashboardPage.loading")}</div>
            ) : recentTransactions.length > 0 ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("Transaction ID")}</th>
                      <th>{t("User")}</th>
                      <th>{t("Amount")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction._id || transaction.id}>
                        <td>#{transaction._id || transaction.id}</td>
                        <td>{transaction.userName || 'N/A'}</td>
                        <td>${transaction.amount?.toFixed(2) || '0.00'}</td>
                        <td>
                          <span className={`status-badge ${transaction.status?.toLowerCase()}`}>
                            {transaction.status || 'Pending'}
                          </span>
                        </td>
                        <td>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FaReceipt />
                <p>{t("dashboardPage.noRecentTransactions")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Report */}
        <div className="dashboard-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Monthly Report {monthlyReport ? `- ${monthlyReport.period.monthName} ${monthlyReport.period.year}` : ''}
              </h2>
            </div>
            {monthlyReport ? (
              <>
                {/* Summary */}
                <div className="stats-grid" style={{ marginBottom: '20px' }}>
                  <StatCard title="Total Purchases" value={monthlyReport.summary.totalPurchases} change={0} icon={FaReceipt} color="#f97316" />
                  <StatCard title="Total Revenue" value={monthlyReport.summary.totalRevenue} change={0} icon={FaArrowUp} color="#10b981" />
                  <StatCard title="Reward Points" value={monthlyReport.summary.totalRewardPoints} change={0} icon={FaArrowUp} color="#8b5cf6" />
                  <StatCard title="App Points" value={monthlyReport.summary.totalAppPoints} change={0} icon={FaReceipt} color="#f97316" />
                  <StatCard title="Gifts Points" value={monthlyReport.summary.totalGiftsPoints} change={0} icon={FaArrowUp} color="#10b981" />
                  <StatCard title="Tree Points" value={monthlyReport.summary.totalTreePoints} change={0} icon={FaArrowUp} color="#8b5cf6" />
                </div>

                {/* Purchases Table */}
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Amount</th>
                        <th>Reward Points</th>
                        <th>App Points</th>
                        <th>Gifts Points</th>
                        <th>Tree Points</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReport.purchases.map(purchase => (
                        <tr key={purchase._id}>
                          <td>{purchase.userName}</td>
                          <td>{purchase.userEmail}</td>
                          <td>${purchase.amount.toLocaleString()}</td>
                          <td>{purchase.rewardPointsEarned}</td>
                          <td>{purchase.appPointsShare}</td>
                          <td>{purchase.giftsPointsShare}</td>
                          <td>{purchase.treePointsShare}</td>
                          <td>{new Date(purchase.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="loading">Loading monthly report...</div>
            )}
          </div>
        </div>

      </div>
      {/* </Layout>
  );
};

export default Dashboard; */}


      <style jsx>{`
      .main-content{
        margin-left: 8px;
        max-width: none;
      }
        .dashboard {
          padding: 25px 25px 25px 0;
          background: transparent;
          min-height: 100vh;
          width: 100%;
          margin: 0;
          overflow-x: hidden;
          box-sizing: border-box;
          max-width: none;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--card-color, #667eea), var(--card-color-end, #764ba2));
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .stat-title {
          font-size: 16px;
          color: #64748b;
          margin-bottom: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 42px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          line-height: 1;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          background: linear-gradient(135deg, var(--card-color, #667eea), var(--card-color-end, #764ba2));
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .stat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .stat-change.positive {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .stat-change.negative {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .stat-period {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .dashboard-section {
          margin-bottom: 40px;
          max-width: 100%;
          width: 100%;
          box-sizing: border-box;
        }

        .card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 30px 35px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        }

        .card-title {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .table-responsive {
          overflow-x: auto;
          margin: 0;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          background: transparent;
        }

        .table th,
        .table td {
          padding: 20px 35px;
          text-align: left;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .table th {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          font-weight: 700;
          color: #475569;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .table td {
          color: #334155;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .table tbody tr:hover {
          background: rgba(102, 126, 234, 0.05);
          transition: background 0.2s ease;
        }

        .status-badge {
          padding: 10px 18px;
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
        }

        .status-badge.completed {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .status-badge.pending {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }

        .status-badge.failed {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 80px 35px;
          color: #64748b;
        }

        .empty-state svg {
          font-size: 5rem;
          margin-bottom: 25px;
          opacity: 0.6;
          color: #94a3b8;
        }

        .empty-state p {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
        }

        .loading {
          text-align: center;
          padding: 80px;
          font-size: 1.5rem;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(15px);
          margin: 25px;
          font-weight: 600;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 14px 28px;
          border: none;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-size: 0.85rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }

        .btn-sm {
          padding: 12px 24px;
          font-size: 0.8rem;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.cancelled {
          background: #f3f4f6;
          color: #374151;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
          font-style: italic;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .empty-state svg {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 15px 15px 15px 0;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .stat-card {
            padding: 25px;
          }

          .stat-value {
            font-size: 32px;
          }

          .card-header {
            padding: 25px 20px;
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .table th,
          .table td {
            padding: 15px 20px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;
