import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { FaSearch, FaEye, FaDownload, FaFilter, FaReceipt } from 'react-icons/fa';
import { transactionAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

const TransactionManagement = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    completedTransactions: 0,
    pendingTransactions: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchTransactionStats();
  }, [currentPage, searchTerm, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Check authentication
      const token = localStorage.getItem('adminToken');
      console.log('Admin token exists:', !!token);

      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        ...filters
      };

      console.log('Fetching transactions with params:', params);
      const response = await transactionAPI.getAllTransactions(params);
      console.log('Transactions API Response:', response.data); // Debug log

      const transactions = response.data.data?.transactions || [];
      console.log('Transactions found:', transactions.length);
      setTransactions(transactions);
      setTotalPages(response.data.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      console.error('Error details:', error.response);
      toast.error(t("transactionsPage.errorFetch") || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      const response = await transactionAPI.getTransactionStats();
      console.log('Transaction Stats Response:', response.data); // Debug log
      setStats(response.data.data?.stats || response.data.stats || {});
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

  const handleViewTransaction = async (transactionId) => {
    try {
      const response = await transactionAPI.getTransactionById(transactionId);
      console.log('Transaction Detail Response:', response.data); // Debug log
      setSelectedTransaction(response.data.data?.transaction || response.data.transaction);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to fetch transaction details');
    }
  };

  const handleExportTransactions = async () => {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      
      const response = await transactionAPI.exportTransactions(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast.error('Failed to export transactions');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
    setCurrentPage(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, format = 'number' }) => (
    <div className="stat-card">
      <div className="stat-content">
        <div className="stat-info">
          <h3>{title}</h3>
          <p>
            {format === 'currency'
              ? `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              : (value || 0).toLocaleString()
            }
          </p>
        </div>
        <div className="stat-icon" style={{ backgroundColor: color }}>
          <Icon />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="transaction-management">


        {/* Stats Cards */}
        <div className="stats-grid">
       <StatCard title={t("transactionsPage.totalTransactions")} value={stats.totalTransactions} icon={FaReceipt} color="#007bff" />
          <StatCard title={t("transactionsPage.totalAmount")} value={stats.totalAmount} icon={FaReceipt} color="#28a745" format="currency" />
          <StatCard title={t("transactionsPage.completed")} value={stats.completedTransactions} icon={FaReceipt} color="#17a2b8" />
          <StatCard title={t("transactionsPage.pending")} value={stats.pendingTransactions} icon={FaReceipt} color="#ffc107" />
</div>
        {/* Search Bar with Action Buttons */}
        <div className="search-bar-container">
          <div className="search-input">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t("transactionsPage.searchPlaceholder")}
              value={searchTerm}
              onChange={handleSearch}
              className="form-control"
            />
          </div>
          <div className="search-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> {t("transactionsPage.filters")}
            </button>
            <button
              className="btn btn-success"
              onClick={handleExportTransactions}
            >
              <FaDownload /> {t("transactionsPage.export")}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="form-group">
                <label>{t("transactionsPage.status")}</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="form-control"
                >
                  <option value="">{t("transactionsPage.allStatuses")}</option>
                  <option value="completed">{t("transactionsPage.completed")}</option>
                  <option value="pending">{t("transactionsPage.pending")}</option>
                  <option value="failed">{t("transactionsPage.failed")}</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{t("transactionsPage.dateFrom")}</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>{t("transactionsPage.dateTo")}</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>{t("transactionsPage.minAmount")}</label>
                <input
                  type="number"
                  step="0.01"
                  name="minAmount"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  className="form-control"
                  placeholder="0.00"
                />
              </div>
              
              <div className="form-group">
                <label>{t("transactionsPage.maxAmount")}</label>
                <input
                  type="number"
                  step="0.01"
                  name="maxAmount"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  className="form-control"
                  placeholder="0.00"
                />
              </div>
              
              <div className="form-group">
                <label>&nbsp;</label>
                <button 
                  className="btn btn-secondary"
                  onClick={clearFilters}
                >
                  {t("transactionsPage.clearFilters")}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
           <div className="loading">{t("transactionsPage.loading")}</div>
        ) : (
          <>
            <div className="modern-table-container">
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.id")}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.transactionInfo")}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.userDetails")}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.amount")}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.statusType")}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.date")}</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>{t("transactionsPage.actions")}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id || transaction.id} className="table-row">
                        <td className="transaction-info-cell">
                           <td className="amount-cell">
                          <div className="amount-info">
                            <span className="amount-value">${transaction._id || 'NAN'}</span>
                          </div>
                        </td>
                          <div className="transaction-avatar">
                            <div className="transaction-icon">
                              <FaReceipt />
                            </div>
                            <div className="transaction-details">
                              <div className="transaction-id">#{transaction._id || transaction.id}</div>
                              <div className="transaction-ref">Ref: {transaction.reference || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-name">{transaction.userName || 'N/A'}</div>
                            <div className="user-email">{transaction.userEmail || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <div className="amount-info">
                            <span className="amount-value">${transaction.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </td>
                        <td className="status-type-cell">
                          <div className="status-type-info">
                            <span className={`status-badge ${getStatusBadgeClass(transaction.status)}`}>
                              {transaction.status || 'Pending'}
                            </span>
                            <span className="type-badge">
                              {transaction.type || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="date-cell">
                          <div className="date-info">
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn view-btn"
                              onClick={() => handleViewTransaction(transaction._id || transaction.id)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {transactions.length === 0 && !loading && (
                  <div className="empty-state">
                    <FaReceipt />
                    <p>{t("transactionsPage.noTransactions")}</p>
                    <p>Debug: Transactions array length: {transactions.length}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  {t("transactionsPage.previous")}
                </button>
                <span className="page-info">
                  {t("transactionsPage.pageOf", { currentPage, totalPages })}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  {t("transactionsPage.next")}
                </button>
              </div>
            )}
          </>
        )}

        {/* Transaction Details Modal */}
        {showModal && selectedTransaction && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{t("transactionsPage.detailsTitle")}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="transaction-details">
                  <div className="detail-row">
                    <label>Transaction ID:</label>
                    <span>#{selectedTransaction._id || selectedTransaction.id}</span>
                  </div>
                  <div className="detail-row">
                    <label>User:</label>
                    <span>{selectedTransaction.userName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Amount:</label>
                    <span>${selectedTransaction.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedTransaction.status)}`}>
                      {selectedTransaction.status || 'Pending'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Type:</label>
                    <span className="capitalize">{selectedTransaction.type || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Description:</label>
                    <span>{selectedTransaction.description || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Payment Method:</label>
                    <span className="capitalize">{selectedTransaction.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Reference:</label>
                    <span>{selectedTransaction.reference || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Created Date:</label>
                    <span>{selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  {selectedTransaction.updatedAt && (
                    <div className="detail-row">
                      <label>Updated Date:</label>
                      <span>{new Date(selectedTransaction.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
       .main-content{
        margin-left: 7px;
        max-width: none;
      }
       
        .transaction-management {
          width: 100%;
          margin: 0;
          padding: 8px;
        }

        .page-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 30px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
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

        .search-bar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
        }

        .search-input {
          position: relative;
          flex: 1;
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

        .search-actions {
          display: flex;
          gap: 10px;
        }

        .search-actions .btn {
          white-space: nowrap;
        }

        .filters-panel {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          align-items: end;
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

        /* Transaction Info Cell */
        .transaction-info-cell {
          min-width: 200px;
        }

        .transaction-avatar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .transaction-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(162, 155, 254, 0.3);
        }

        .transaction-details {
          flex: 1;
        }

        .transaction-id {
          font-weight: 600;
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .transaction-ref {
          font-size: 12px;
          color: #7f8c8d;
        }

        /* User Cell */
        .user-cell {
          min-width: 180px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #2c3e50;
        }

        .user-email {
          font-size: 12px;
          color: #7f8c8d;
        }

        /* Amount Cell */
        .amount-cell {
          min-width: 120px;
        }

        .amount-value {
          font-size: 16px;
          font-weight: 700;
          color: #27ae60;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid #a3d977;
          box-shadow: 0 2px 4px rgba(39, 174, 96, 0.2);
        }

        /* Status & Type Cell */
        .status-type-cell {
          min-width: 150px;
        }

        .status-type-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-completed {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          color: #155724;
          border: 1px solid #a3d977;
        }

        .status-pending {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          color: #856404;
          border: 1px solid #ffd93d;
        }

        .status-failed {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          color: #721c24;
          border: 1px solid #f1556c;
        }

        .type-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          color: #1976d2;
          text-transform: capitalize;
          border: 1px solid #90caf9;
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
          min-width: 80px;
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

        .capitalize {
          text-transform: capitalize;
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

        .transaction-details {
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
          .page-header {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .header-actions {
            justify-content: center;
          }

          .search-bar-container {
            flex-direction: column;
            gap: 15px;
          }

          .search-input {
            max-width: 100%;
          }

          .search-actions {
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filters-grid {
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

export default TransactionManagement;
