import React, { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus, FaSearch, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import Layout from './Layout';
import { useTranslation } from 'react-i18next';
// We are REUSING ProductManagement styles via the same class names to ensure consistency
// No separate CSS file is needed if we strictly follow existing class structure.
// However, the user asked for updated .css reflecting same styling. 
// We will clone the ProductManagement structure which uses inline <style jsx> AND scoped classes.
// But to ensure it works perfect, we will copy the exact structure of ProductManagement.js (Reference).

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state (simulated since backend might not support it for courses yet, but UI needs it)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({ totalPoints: 0, monthlyPoints: 0 });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: '',
    status: 'available'
  });
  const [errors, setErrors] = useState({});

  const { t } = useTranslation();

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Assuming the admin getAll API returns { data: [...] } or { data: { courses: [...] } }
      // Adjusting based on previous step implementation
      const response = await courseAPI.getAllCoursesAdmin();
      const statsResponse = await courseAPI.getCourseStats();

      // Set stats
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      // Filter locally for search if backend doesn't support it
      let allCourses = response.data.data || [];
      if (searchTerm) {
        allCourses = allCourses.filter(c =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setCourses(allCourses);
      setTotalPages(1); // Default to 1 for now
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error(t('coursesPage.messages.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openModal = (course = null) => {
    setEditingCourse(course);
    setFormData({
      name: course?.name || '',
      description: course?.description || '',
      pointsCost: course?.pointsCost || '',
      status: course?.status || 'available'
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData({
      name: '',
      description: '',
      pointsCost: '',
      status: 'available'
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('coursesPage.form.name') + ' is required';
    if (!formData.pointsCost || Number(formData.pointsCost) < 0) newErrors.pointsCost = t('coursesPage.form.pointsCost') + ' is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        pointsCost: Number(formData.pointsCost)
      };

      if (editingCourse) {
        await courseAPI.updateCourse(editingCourse._id, payload);
        toast.success(t('coursesPage.messages.updateSuccess'));
      } else {
        await courseAPI.createCourse(payload);
        toast.success(t('coursesPage.messages.createSuccess'));
      }
      closeModal();
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || t('coursesPage.messages.operationError'));
    }
  };

  return (
    <Layout>
      <div className="course-management">
        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <FaChartLine />
            </div>
            <div className="stat-info">
              <h3>{t('coursesPage.totalPoints')}</h3>
              <p>{stats.totalPoints.toLocaleString()}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <FaCalendarAlt />
            </div>
            <div className="stat-info">
              <h3>{t('coursesPage.monthlyPoints')}</h3>
              <p>{stats.monthlyPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Search Bar and Actions */}
        <div className="search-and-actions">
          <div className="search-bar">
            <div className="search-input">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={t("coursesPage.searchPlaceholder")}
                value={searchTerm}
                onChange={handleSearch}
                className="form-control"
              />
            </div>
          </div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => openModal()}>
              <FaPlus /> {t("coursesPage.addNew")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">{t("coursesPage.loading")}</div>
        ) : (
          <>
            <div className="modern-table-container">
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th><span>{t("coursesPage.courseInfo")}</span></th>
                      <th><span>{t("coursesPage.subscribedUsers")}</span></th>
                      <th><span>{t("coursesPage.pointsCost")}</span></th>
                      <th><span>{t("coursesPage.status")}</span></th>
                      <th><span>{t("coursesPage.createdAt")}</span></th>
                      <th><span>{t("coursesPage.actions")}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id} className="table-row">
                        <td className="product-info-cell">
                          <div className="product-avatar">
                            <div className="product-icon">
                              {course.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="product-details">
                              <div className="product-name">{course.name}</div>
                              <div className="product-name-arabic">{course.description || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="price-cell">
                          <div className="price-info">
                            <span className="price-value">{course.totalSubscriptions}</span>
                          </div>
                        </td>
                        <td className="price-cell">
                          <div className="price-info">
                            <span className="price-value">{course.pointsCost} pts</span>
                          </div>
                        </td>
                        <td className="category-cell">
                          <div className="category-info">
                            <span className={`stock-badge ${course.status === 'available' ? 'in-stock' : 'out-of-stock'}`}>
                              {course.status === 'available' ? t('coursesPage.statusAvailable') : t('coursesPage.statusExpired')}
                            </span>
                          </div>
                        </td>
                        <td>
                          {new Date(course.createdAt).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => openModal(course)}
                              title={t("coursesPage.edit")}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {courses.length === 0 && !loading && (
                  <div className="empty-state">
                    <p>{t("coursesPage.noCourses")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination placeholder if needed later */}
            {totalPages > 1 && (
              <div className="pagination">
                {/* Matched pagination structure */}
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCourse ? t("coursesPage.edit") : t("coursesPage.addNew")}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t("coursesPage.form.name")}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    placeholder={t("coursesPage.form.name")}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">{t("coursesPage.form.pointsCost")}</label>
                  <input
                    type="number"
                    name="pointsCost"
                    value={formData.pointsCost}
                    onChange={handleChange}
                    className={`form-control ${errors.pointsCost ? 'error' : ''}`}
                    placeholder={t("coursesPage.form.pointsCost")}
                  />
                  {errors.pointsCost && <span className="error-text">{errors.pointsCost}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">{t("coursesPage.form.status")}</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="available">{t("coursesPage.statusAvailable")}</option>
                    <option value="expired">{t("coursesPage.statusExpired")}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("coursesPage.form.description")}</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder={t("coursesPage.form.description")}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    {t("coursesPage.form.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCourse ? t("coursesPage.form.update") : t("coursesPage.form.create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Exactly copied styles from ProductManagement.js for consistency */}
      <style jsx>{`
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-5px);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-info h3 {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-info p {
          margin: 5px 0 0;
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .main-content {
          margin-left: 8px;
          max-width: none;
        }
        .course-management {
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

        .modern-table th span {
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

        /* Product Info Cell Reused */
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
        }

        /* Badges */
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

        .stock-badge.out-of-stock {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          color: #721c24;
          border: 1px solid #f1556c;
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

        /* Actions */
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

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalSlideIn 0.3s ease-out;
          overflow: hidden;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          color: #4a5568;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .form-control {
          width: 100%;
          padding: 10px 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          outline: none;
        }

        .modal-footer {
          padding: 20px;
          background: #f7fafc;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(102, 126, 234, 0.5);
        }

        .btn-secondary {
          background: #edf2f7;
          color: #4a5568;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
        }

        .error-text {
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 4px;
          display: block;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: #a0aec0;
        }
      `}</style>
    </Layout>
  );
};

export default CourseManagement;
