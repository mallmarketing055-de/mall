import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { FaTrash, FaSearch, FaEye, FaUsers } from 'react-icons/fa';
import { userAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [currentPage, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm
      };

      console.log('Fetching users with params:', params);
      const response = await userAPI.getAllUsers(params);
      console.log('Users API response:', response);
      console.log('Response data structure:', response.data);

      // Handle the response structure from the backend
      if (response.data && response.data.data) {
        // Backend returns: { success: true, data: { users: [...], pagination: {...} } }
        if (Array.isArray(response.data.data)) {
          // Direct array in data.data
          setUsers(response.data.data);
          setTotalPages(1);
        } else if (response.data.data.users) {
          // Users array in data.data.users
          setUsers(response.data.data.users || []);
          setTotalPages(response.data.data.pagination?.totalPages || 1);
        } else {
          setUsers([]);
          setTotalPages(1);
        }
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array response
        setUsers(response.data);
        setTotalPages(1);
      } else if (response.data && response.data.users) {
        // Users array in data.users
        setUsers(response.data.users || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        // Fallback
        console.log('Unexpected response structure, setting empty array');
        setUsers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log('Fetching user stats...');
      const response = await userAPI.getUserStats();
      console.log('User stats response:', response);
      console.log('User stats data structure:', response.data);

      // Handle the response structure from the backend
      let statsData = {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0
      };

      if (response.data && response.data.data && response.data.data.stats) {
        // Backend returns: { success: true, data: { stats: {...} } }
        statsData = response.data.data.stats;
      } else if (response.data && response.data.stats) {
        // Direct stats in data.stats
        statsData = response.data.stats;
      }

      console.log('Setting stats:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await userAPI.getUserById(userId);
      setSelectedUser(response.data.user);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to fetch user details');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="stat-card">
      <div className="stat-content">
        <div className="stat-info">
          <h3>{title}</h3>
          <p>{(value || 0).toLocaleString()}</p>
        </div>
        <div className="stat-icon" style={{ backgroundColor: color }}>
          <Icon />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
<div className="user-management">
  {/* Stats Cards */}
  <div className="stats-grid">
    <StatCard
      title={t("usersPage.totalUsers")}
      value={stats.totalUsers}
      icon={FaUsers}
      color="#007bff"
    />
    <StatCard
      title={t("usersPage.activeUsers")}
      value={stats.activeUsers}
      icon={FaUsers}
      color="#28a745"
    />
    <StatCard
      title={t("usersPage.newThisMonth")}
      value={stats.newUsersThisMonth}
      icon={FaUsers}
      color="#17a2b8"
    />
  </div>

  {/* Search Bar */}
  <div className="search-bar">
    <div className="search-input">
      <FaSearch className="search-icon" />
      <input
        type="text"
        placeholder={t("usersPage.searchPlaceholder")}
        value={searchTerm}
        onChange={handleSearch}
        className="form-control"
      />
    </div>
  </div>

  {loading ? (
    <div className="loading">{t("usersPage.loading")}</div>
  ) : (
    <>
      <div className="modern-table-container">
        <div className="table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    <span>{t("usersPage.id")}</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>{t("usersPage.userProfile")}</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>{t("usersPage.contactInfo")}</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>{t("usersPage.referralSystem")}</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>{t("usersPage.joinedDate")}</span>
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <span>{t("usersPage.actions")}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id || user.id} className="table-row">
                  <td>
                    <div className="date-info">
                      {user._id ? user._id : t("usersPage.noData")}
                    </div>
                  </td>
                  <td className="user-profile-cell">
                    <div className="user-avatar">
                      <div className="avatar-circle">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <div className="user-name">
                          {user.name || t("usersPage.noData")}
                        </div>
                        <div className="user-username">
                          @{user.username || t("usersPage.noData")}
                        </div>
                        <div className="user-gender">
                          <span
                            className={`gender-badge ${(user.Gender || user.gender || "").toLowerCase()}`}
                          >
                            {user.Gender || user.gender || t("usersPage.noData")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="contact-cell">
                    <div className="contact-info">
                      <div className="email-info">
                        <span className="contact-label">{t("usersPage.email")}:</span>
                        <span className="contact-value">
                          {user.email || t("usersPage.noData")}
                        </span>
                      </div>
                      <div className="phone-info">
                        <span className="contact-label">{t("usersPage.phone")}:</span>
                        <span className="contact-value">
                          {user.phone || t("usersPage.noData")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="referral-cell">
                    <div className="referral-info">
                      <div className="referral-item">
                        <span className="referral-label">{t("usersPage.parent")}:</span>
                        {user.referredBy ? (
                          <span className="reference-parent">{user.referredBy}</span>
                        ) : (
                          <span className="no-reference">
                            {t("usersPage.noReferral")}
                          </span>
                        )}
                      </div>
                      <div className="referral-item">
                        <span className="referral-label">{t("usersPage.myCode")}:</span>
                        {user.referenceNumber ? (
                          <span className="reference-number">
                            {user.referenceNumber}
                          </span>
                        ) : (
                          <span className="no-reference">
                            {t("usersPage.notGenerated")}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="date-cell">
                    <div className="date-info">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : t("usersPage.noData")}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewUser(user._id || user.id)}
                        title={t("usersPage.viewDetails")}
                      >
                        <FaEye />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(user._id || user.id)}
                        title={t("usersPage.deleteUser")}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state">
              <FaUsers />
              <p>{t("usersPage.noUsersFound")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            {t("usersPage.previous")}
          </button>
          <span className="page-info">
            {t("usersPage.pageInfo", { current: currentPage, total: totalPages })}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {t("usersPage.next")}
          </button>
        </div>
      )}
    </>
  )}

  {/* User Details Modal */}
  {showModal && selectedUser && (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t("usersPage.userDetails")}</h2>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="user-details">
            <div className="detail-row">
              <label>{t("usersPage.name")}:</label>
              <span>{selectedUser.name || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.username")}:</label>
              <span>{selectedUser.username || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.email")}:</label>
              <span>{selectedUser.email || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.phone")}:</label>
              <span>{selectedUser.phone || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.gender")}:</label>
              <span className="capitalize">
                {selectedUser.Gender || selectedUser.gender || t("usersPage.noData")}
              </span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.dob")}:</label>
              <span>
                {selectedUser.DOB
                  ? new Date(selectedUser.DOB).toLocaleDateString()
                  : t("usersPage.noData")}
              </span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.address")}:</label>
              <span>{selectedUser.Address || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.communicationType")}:</label>
              <span className="capitalize">
                {selectedUser.communicationType || t("usersPage.noData")}
              </span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.referenceNumber")}:</label>
              <span>{selectedUser.referenceNumber || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.referredBy")}:</label>
              <span>{selectedUser.referredBy || t("usersPage.noData")}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.referralLevel")}:</label>
              <span>{selectedUser.referralLevel || 0}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.totalReferrals")}:</label>
              <span>{selectedUser.totalReferrals || 0}</span>
            </div>
            <div className="detail-row">
              <label>{t("usersPage.joinedAt")}:</label>
              <span>
                {selectedUser.createdAt
                  ? new Date(selectedUser.createdAt).toLocaleString()
                  : t("usersPage.noData")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>;


      <style jsx>{`
       .main-content{
        margin-left: 7px;
        max-width: none;
      }
       
        .user-management {
          width: 100%;
          margin: 0;
          padding: 8px;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          margin: 0;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .stat-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-info h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-info p {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }

        .search-bar {
          margin-bottom: 20px;
        }

        .search-input {
          position: relative;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-size: 16px;
        }

        .search-input .form-control {
          padding-left: 40px;
        }

        /* Modern Table Styles */
        .modern-table-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .modern-table {
          width: 100%;
          border-collapse: collapse;
          background: transparent;
        }

        .modern-table thead {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .modern-table th {
          padding: 20px 15px;
          text-align: left;
          border: none;
          position: relative;
        }

        .th-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .th-content span {
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .table-row {
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .table-row:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .modern-table td {
          padding: 20px 15px;
          border: none;
          vertical-align: middle;
        }

        /* User Profile Cell */
        .user-profile-cell {
          min-width: 250px;
        }

        .user-avatar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .avatar-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 18px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .user-username {
          font-size: 13px;
          color: #7f8c8d;
          margin-bottom: 6px;
        }

        .gender-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .gender-badge.male {
          background: #e3f2fd;
          color: #1976d2;
        }

        .gender-badge.female {
          background: #fce4ec;
          color: #c2185b;
        }

        .gender-badge {
          background: #f5f5f5;
          color: #666;
        }

        /* Contact Cell */
        .contact-cell {
          min-width: 200px;
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .email-info, .phone-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .contact-label {
          font-size: 11px;
          font-weight: 600;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contact-value {
          font-size: 13px;
          color: #2c3e50;
          font-weight: 500;
        }

        /* Referral Cell */
        .referral-cell {
          min-width: 220px;
        }

        .referral-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .referral-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .referral-label {
          font-size: 11px;
          font-weight: 600;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .reference-parent {
          display: inline-block;
          color: #007bff;
          font-weight: 600;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          border: 1px solid #90caf9;
          box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
        }

        .reference-number {
          display: inline-block;
          color: #28a745;
          font-weight: 700;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
          border: 1px solid #a3d977;
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
        }

        .no-reference {
          color: #6c757d;
          font-style: italic;
          font-size: 12px;
          opacity: 0.7;
        }

        /* Date Cell */
        .date-cell {
          min-width: 120px;
        }

        .date-info {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
        }

        /* Actions Cell */
        .actions-cell {
          min-width: 120px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .view-btn {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
        }

        .view-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
        }

        .delete-btn {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
        }

        .delete-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
        }

        .empty-state {
          text-align: center;
          padding: 60px 40px;
          color: #7f8c8d;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          margin: 20px;
        }

        .empty-state svg {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
        }

        .page-info {
          font-size: 14px;
          color: #666;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px;
        }

        .user-details {
          display: grid;
          gap: 15px;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 15px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row label {
          font-weight: 600;
          color: #333;
        }

        .detail-row span {
          color: #666;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .modal {
            width: 95%;
            margin: 20px;
          }

          .detail-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default UserManagement;
