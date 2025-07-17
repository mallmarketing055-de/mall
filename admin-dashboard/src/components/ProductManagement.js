import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { productAPI } from '../services/api';
import { toast } from 'react-toastify';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    nameArabic: '',
    description: '',
    descriptionArabic: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm
      };
      
      const response = await productAPI.getAllProducts(params);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
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
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await productAPI.createProduct(productData);
        toast.success('Product created successfully');
      }
      
      fetchProducts();
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productAPI.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.nameArabic.trim()) {
      newErrors.nameArabic = 'Arabic name is required';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openModal = (product = null) => {
    setEditingProduct(product);
    setFormData({
      name: product?.name || '',
      nameArabic: product?.nameArabic || '',
      description: product?.description || '',
      descriptionArabic: product?.descriptionArabic || '',
      price: product?.price?.toString() || '',
      category: product?.category || '',
      stock: product?.stock?.toString() || '',
      image: product?.image || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      nameArabic: '',
      description: '',
      descriptionArabic: '',
      price: '',
      category: '',
      stock: '',
      image: ''
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="product-management">
        {/* Search Bar and Actions */}
        <div className="search-and-actions">
          <div className="search-bar">
            <div className="search-input">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="form-control"
              />
            </div>
          </div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => openModal()}>
              <FaPlus /> Add New Product
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <>
            <div className="modern-table-container">
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">
                          <span>Product Info</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Category</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Pricing</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Stock</span>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <span>Actions</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="table-row">
                        <td className="product-info-cell">
                          <div className="product-avatar">
                            <div className="product-icon">
                              {(product.name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div className="product-details">
                              <div className="product-name">{product.name}</div>
                              <div className="product-name-arabic">{product.nameArabic}</div>
                            </div>
                          </div>
                        </td>
                        <td className="category-cell">
                          <div className="category-info">
                            <span className="category-badge">
                              {product.category}
                            </span>
                          </div>
                        </td>
                        <td className="price-cell">
                          <div className="price-info">
                            <span className="price-value">${product.price?.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="stock-cell">
                          <div className="stock-info">
                            <span className={`stock-badge ${product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                              {product.stock} units
                            </span>
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => openModal(product)}
                              title="Edit Product"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(product.id)}
                              title="Delete Product"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {products.length === 0 && (
                  <div className="empty-state">
                    <p>No products found</p>
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
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`form-control ${errors.name ? 'error' : ''}`}
                      placeholder="Enter product name"
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Arabic Name</label>
                    <input
                      type="text"
                      name="nameArabic"
                      value={formData.nameArabic}
                      onChange={handleChange}
                      className={`form-control ${errors.nameArabic ? 'error' : ''}`}
                      placeholder="Enter Arabic name"
                    />
                    {errors.nameArabic && <span className="error-text">{errors.nameArabic}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`form-control ${errors.category ? 'error' : ''}`}
                      placeholder="Enter category"
                    />
                    {errors.category && <span className="error-text">{errors.category}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`form-control ${errors.price ? 'error' : ''}`}
                      placeholder="Enter price"
                    />
                    {errors.price && <span className="error-text">{errors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className={`form-control ${errors.stock ? 'error' : ''}`}
                      placeholder="Enter stock quantity"
                    />
                    {errors.stock && <span className="error-text">{errors.stock}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Arabic Description</label>
                  <textarea
                    name="descriptionArabic"
                    value={formData.descriptionArabic}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Enter Arabic description"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter image URL"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update' : 'Create'} Product
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
    </Layout>
  );
};

export default ProductManagement;
