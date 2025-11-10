import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { socialMediaAPI } from '../services/api'; // 👈 you'll create this next
import { useTranslation } from "react-i18next";

const SocialMediaLinks = () => {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    icon: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await socialMediaAPI.getAllLinks();
      let linksData = [];

      if (response.data?.data) linksData = response.data.data;
      else if (Array.isArray(response.data)) linksData = response.data;
      
      setLinks(linksData);
    } catch (error) {
      toast.error(t("socialMediaLinksPage.fetchFailed"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingLink) {
        await socialMediaAPI.updateLink(editingLink._id, formData);
        toast.success(t("socialMediaLinksPage.update") + ' ' + t("socialMediaLinksPage.addLink"));
      } else {
        await socialMediaAPI.createLink(formData);
        toast.success(t("socialMediaLinksPage.create") + ' ' + t("socialMediaLinksPage.addLink"));
      }
      fetchLinks();
      closeModal();
    } catch (error) {
      toast.error(t("socialMediaLinksPage.saveFailed"));
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("socialMediaLinksPage.deleteConfirm"))) return;

    try {
      await socialMediaAPI.deleteLink(id);
      toast.success(t("socialMediaLinksPage.deleteLink"));
      fetchLinks();
    } catch (error) {
      toast.error(t("socialMediaLinksPage.deleteFailed"));
      console.error(error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
     if (!formData.platform.trim()) newErrors.platform = t("socialMediaLinksPage.platformRequired");
    if (!formData.url.trim()) newErrors.url = t("socialMediaLinksPage.urlRequired");
    if (!/^https?:\/\//.test(formData.url)) newErrors.url = t("socialMediaLinksPage.urlInvalid");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openModal = (link = null) => {
    setEditingLink(link);
    setFormData({
      platform: link?.platform || '',
      url: link?.url || '',
      icon: link?.icon || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLink(null);
    setFormData({ platform: '', url: '', icon: '' });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <Layout>
      <div className="admin-management">
        <div className="page-header">
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FaPlus /> {t("socialMediaLinksPage.addSocialLink")}
          </button>
        </div>

        {loading ? (
          <div className="loading">{t("socialMediaLinksPage.loadingLinks")}</div>
        ) : (
          <div className="modern-table-container">
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th><span>{t("socialMediaLinksPage.platform")}</span></th>
                    <th><span>{t("socialMediaLinksPage.url")}</span></th>
                    <th><span>{t("socialMediaLinksPage.icon")}</span></th>
                    <th><span>{t("socialMediaLinksPage.actions")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link._id} className="table-row">
                      <td>{t(`socialMediaLinksPage.${link.platform}`) || link.platform}</td>
                      <td><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></td>
                      <td>{link.icon || '-'}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button className="action-btn edit-btn" onClick={() => openModal(link)} title="Edit">
                            <FaEdit />
                          </button>
                          <button className="action-btn delete-btn" onClick={() => handleDelete(link._id)} title="Delete">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {links.length === 0 && (
                <div className="empty-state">
                  <p>{t("socialMediaLinksPage.noLinksFound")}</p>
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
                <h2>{editingLink ? t("socialMediaLinksPage.editLink") : t("socialMediaLinksPage.addLink")}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                    <label>{t("socialMediaLinksPage.platform")}</label>
                    <select
                        name="platform"
                        value={formData.platform}
                        onChange={handleChange}
                        className={`form-control ${errors.platform ? 'error' : ''}`}
                    >
                        <option value="">{t("socialMediaLinksPage.selectPlatform")}</option>
                        <option value="facebook">{t("socialMediaLinksPage.facebook")}</option>
                        <option value="twitter">{t("socialMediaLinksPage.twitter")}</option>
                        <option value="instagram">{t("socialMediaLinksPage.instagram")}</option>
                        <option value="linkedin">{t("socialMediaLinksPage.linkedin")}</option>
                        <option value="youtube">{t("socialMediaLinksPage.youtube")}</option>
                        <option value="tiktok">{t("socialMediaLinksPage.tiktok")}</option>
                        <option value="other">{t("socialMediaLinksPage.other")}</option>
                    </select>
                    {errors.platform && <span className="error-text">{errors.platform}</span>}
                    <small className="notice-text">
                        {t("socialMediaLinksPage.choosePlatformNotice")}
                    </small>
                </div>


                <div className="form-group">
                  <label>{t("socialMediaLinksPage.url")}</label>
                  <input
                    type="text"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className={`form-control ${errors.url ? 'error' : ''}`}
                    placeholder="https://twitter.com/username"
                  />
                  {errors.url && <span className="error-text">{errors.url}</span>}
                </div>

                <div className="form-group">
                  <label>{t("socialMediaLinksPage.icon")}</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g. twitter-icon.png"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>{t("socialMediaLinksPage.cancel")}</button>
                  <button type="submit" className="btn btn-primary">{editingLink ? t("socialMediaLinksPage.update") : t("socialMediaLinksPage.create")}</button>
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
    </Layout>
  );
};

export default SocialMediaLinks;
