import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { pointsAPI } from '../services/api'; // هنا يبقى فيه تعريف للـ API الخاص بالنقاط
import { useTranslation } from 'react-i18next';
import {
  FaCalendarAlt, FaCoins, FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

const PointsManagement = () => {
  const [pointsStats, setPointsStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    customerId: '',
    points: ''
  });
  const [errors, setErrors] = useState({});

  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = { page: currentPage, search: searchTerm };
      const response = await pointsAPI.getOverview(params, token);
      const users = response.data.data || {};
      console.log(users);
      setPointsStats(users);
      setTotalPages(response.data.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID is required';
    if (!formData.points || parseFloat(formData.points) <= 0) newErrors.points = 'Valid points are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await pointsAPI.addPoints(formData.customerId, parseFloat(formData.points), token);
      toast.success(`Added ${response.data.data.pointsAdded} points to ${response.data.data.customer.username}`);
      setFormData({ customerId: '', points: '' });
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding points:', error);
      toast.error(error.response?.data?.message || 'Failed to add points');
    }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setFormData({
      customerId: user?.customerId || '',
      points: ''
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ customerId: '', points: '' });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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

    </div>
  );

  return (
    <Layout>
      <div className="points-management">
        <div className="search-and-actions">
          <div className="search-bar">
          </div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => openModal()}>
              <FaPlus /> {t("pointsPage.addPoints")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">{t("pointsPage.loading")}</div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard
                title={t("pointsPage.totalThisMonth")}
                value={pointsStats.totalPointsThisMonth}
                change={0} // ممكن تستخدم أي قيمة مناسبة للتغيير لو عندك
                icon={FaCoins}
                color="#3b82f6"
                colorEnd="#1d4ed8"
              />

              <StatCard
                title={t("pointsPage.totalAllTime")}
                value={pointsStats.totalPointsAllTime}
                change={0}
                icon={FaCoins}
                color="#f59e0b"
                colorEnd="#d97706"
              />

              <StatCard
                title={t("pointsPage.period")}
                value={`${pointsStats.period.monthName} ${pointsStats.period.year}`}
                icon={FaCalendarAlt}
                color="#10b981"
                colorEnd="#059669"
              />
            </div>
          </>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingUser ? t("pointsPage.editPoints") : t("pointsPage.addPoints")}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label>{t("pointsPage.form.customerId")}</label>
                  <input
                    type="text"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className={`form-control ${errors.customerId ? 'error' : ''}`}
                  />
                  {errors.customerId && <span className="error-text">{errors.customerId}</span>}
                </div>
                <div className="form-group">
                  <label>{t("pointsPage.form.points")}</label>
                  <input
                    type="number"
                    name="points"
                    value={formData.points}
                    onChange={handleChange}
                    className={`form-control ${errors.points ? 'error' : ''}`}
                  />
                  {errors.points && <span className="error-text">{errors.points}</span>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    {t("pointsPage.form.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? t("pointsPage.form.update") : t("pointsPage.form.add")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
       .main-content{
        margin-left: 8px;
        max-width: none;
      }
        .product-management {
          width: 100%;
          margin: 0;
          padding: 8px;
        }

        .search-and-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .search-bar {
          flex: 1;
          max-width: 400px;
        }

        .page-actions {
          flex-shrink: 0;
        }

        .search-input {
          position: relative;
          max-width: 400px;
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

        /* Product Info Cell */
        .product-info-cell {
          min-width: 250px;
        }

        .product-avatar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .product-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 18px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .product-details {
          flex: 1;
        }

        .product-name {
          font-weight: 600;
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .product-name-arabic {
          font-size: 13px;
          color: #7f8c8d;
          direction: rtl;
          text-align: right;
        }

        /* Category Cell */
        .category-cell {
          min-width: 120px;
        }

        .category-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
          color: white;
          text-transform: capitalize;
          box-shadow: 0 2px 4px rgba(116, 185, 255, 0.3);
        }

        /* Price Cell */
        .price-cell {
          min-width: 100px;
        }

        .price-value {
          font-size: 16px;
          font-weight: 700;
          color: #27ae60;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #a3d977;
          box-shadow: 0 2px 4px rgba(39, 174, 96, 0.2);
        }

        /* Stock Cell */
        .stock-cell {
          min-width: 120px;
        }

        .stock-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .stock-badge.in-stock {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          color: #155724;
          border: 1px solid #a3d977;
        }

        .stock-badge.low-stock {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          color: #856404;
          border: 1px solid #ffd93d;
        }

        .stock-badge.out-of-stock {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          color: #721c24;
          border: 1px solid #f1556c;
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

        .edit-btn {
          background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%);
          color: white;
        }

        .edit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
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
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .large-modal {
          max-width: 800px;
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

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .error-text {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .form-control.error {
          border-color: #dc3545;
        }

        @media (max-width: 768px) {
          .search-and-actions {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .search-bar {
            max-width: none;
          }

          .modal {
            width: 95%;
            margin: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
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

export default PointsManagement;
