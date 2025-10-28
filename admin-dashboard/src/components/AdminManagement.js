import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

const AdminManagement = () => {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      console.log('Fetching admins...');
      const response = await adminAPI.getAllAdmins();
      console.log('Admin API response:', response);
      console.log('Response data structure:', response.data);

      // Handle the response structure from the backend
      let adminsData = [];
      if (response.data && response.data.data && response.data.data.admins) {
        // Backend returns: { success: true, data: { admins: [...] } }
        adminsData = response.data.data.admins;
      } else if (response.data && response.data.admins) {
        // Direct admins in data.admins
        adminsData = response.data.admins;
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array response
        adminsData = response.data;
      }

      console.log('Setting admins:', adminsData);
      setAdmins(adminsData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      console.error('Error details:', error.response?.data);
      toast.error(t("adminPage.fetchFailed") + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingAdmin) {
        await adminAPI.updateAdmin(editingAdmin._id, formData);
        toast.success('Admin updated successfully');
      } else {
        await adminAPI.createAdmin(formData);
        toast.success('Admin created successfully');
      }
      
      fetchAdmins();
      closeModal();
    } catch (error) {
      console.error('Error saving admin:', error);
      toast.error(error.response?.data?.message || 'Failed to save admin');
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      await adminAPI.deleteAdmin(adminId);
      toast.success(t("adminPage.updatedSuccess"));
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t("adminPage.usernameRequired");
    }
    
    if (!formData.email.trim()) {
      newErrors.email =  t("adminPage.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("adminPage.emailInvalid");
    }
    
    if (!editingAdmin && !formData.password) {
      newErrors.password =  t("adminPage.passwordRequired");
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = t("adminPage.passwordMinLength");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openModal = (admin = null) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin?.username || '',
      email: admin?.email || '',
      password: ''
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setFormData({ username: '', email: '', password: '' });
    setErrors({});
    setShowPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Layout>
      <div className="admin-management">
        <div className="page-header">
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FaPlus /> {t("adminPage.addAdmin")}
          </button>
        </div>

        {loading ? (
          <div className="loading">{t("adminPage.loadingAdmins")}</div>
        ) : (
          <div className="modern-table-container">
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th><span>{t("adminPage.adminProfile")}</span></th>
                    <th><span>{t("adminPage.emailAddress")}</span></th>
                    <th><span>{t("adminPage.createdDate")}</span></th>
                    <th><span>{t("adminPage.actions")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id} className="table-row">
                      <td className="admin-profile-cell">
                        <div className="admin-avatar">
                          <div className="avatar-circle">
                            {(admin.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div className="admin-info">
                            <div className="admin-name">{admin.username}</div>
                            <div className="admin-role">{t("adminPage.administrator")}</div>
                          </div>
                        </div>
                      </td>
                      <td className="email-cell">
                        <div className="email-info">
                          <span className="email-value">{admin.email}</span>
                        </div>
                      </td>
                      <td className="date-cell">
                        <div className="date-info">
                          {new Date(admin.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => openModal(admin)}
                            title="Edit Admin"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(admin._id)}
                            title="Delete Admin"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {admins.length === 0 && (
                <div className="empty-state">
                  <p>{t("adminPage.noAdminsFound")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingAdmin ? t("adminPage.editAdmin") : t("adminPage.addAdmin")}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t("adminPage.username")}</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`form-control ${errors.username ? 'error' : ''}`}
                    placeholder="Enter username"
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">{t("adminPage.email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    placeholder="Enter email"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("adminPage.password")}{" "}{editingAdmin && `(${t("adminPage.passwordNote")})`}
                  </label>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-control ${errors.password ? 'error' : ''}`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    {t("adminPage.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingAdmin ? t("adminPage.updateAdmin") : t("adminPage.createAdmin")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
      .main-content{
        margin-left: 5px;
        max-width: none;
      }
        .admin-management {
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

        .page-header h1 {
          margin: 0;
          color: #333;
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

        /* Admin Profile Cell */
        .admin-profile-cell {
          min-width: 250px;
        }

        .admin-avatar {
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

        .admin-info {
          flex: 1;
        }

        .admin-name {
          font-weight: 600;
          font-size: 16px;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .admin-role {
          font-size: 13px;
          color: #7f8c8d;
          background: #e8f5e8;
          color: #2e7d32;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
          display: inline-block;
        }

        /* Email Cell */
        .email-cell {
          min-width: 200px;
        }

        .email-value {
          font-size: 14px;
          color: #2c3e50;
          font-weight: 500;
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

        .password-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
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
          .page-header {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }

          .modal {
            width: 95%;
            margin: 20px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AdminManagement;
