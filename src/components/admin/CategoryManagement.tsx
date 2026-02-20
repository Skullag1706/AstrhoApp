import React, { useState, useEffect } from 'react';
import {
  FolderTree, Plus, Edit, Trash2, Search, AlertCircle, X, Save,
  Eye, CheckCircle
} from 'lucide-react';
import { mockProducts } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';
import { supplyCategoryService, Category as APICategory } from '../../services/supplyCategoryService';

interface CategoryManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function CategoryManagement({ hasPermission }: CategoryManagementProps) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Map API category to UI category
  const mapCategoryToUI = (apiCat: APICategory) => ({
    id: apiCat.categoriaId,
    name: apiCat.nombre,
    description: apiCat.descripcion,
    status: apiCat.estado ? 'active' : 'inactive',
    productCount: apiCat.cantidadProductos || 0,
    createdAt: apiCat.fechaCreacion || new Date().toISOString().split('T')[0],
    updatedAt: apiCat.fechaActualizacion || new Date().toISOString().split('T')[0],
    type: 'product' // Default type as per requirement
  });

  // Map UI category to API category
  const mapCategoryToAPI = (uiCat: any): Omit<APICategory, 'categoriaId'> => ({
    nombre: uiCat.name,
    descripcion: uiCat.description,
    estado: uiCat.status === 'active'
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await supplyCategoryService.getCategories();
      setCategories(data.map(mapCategoryToUI));
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('No se pudieron cargar las categorías. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-hide success alert after 4 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  const filteredCategories = categories.filter((category: any) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category: any) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = async () => {
    const hasProducts = getProductsByCategory(selectedCategory.id).length > 0;

    if (hasProducts) {
      setErrorModalMessage('No se puede eliminar una categoría que tiene insumos asociados. Por favor, reasigne o elimine los insumos primero.');
      setShowErrorModal(true);
      return;
    }

    const categoryName = selectedCategory.name;
    try {
      await supplyCategoryService.deleteCategory(selectedCategory.id);
      setCategories(categories.filter((c: any) => c.id !== selectedCategory.id));
      setShowDeleteModal(false);
      setSelectedCategory(null);

      // Mostrar alerta de eliminación exitosa
      setShowSuccessAlert(true);
      setAlertMessage(`Categoría "${categoryName}" eliminada correctamente`);
    } catch (err) {
      console.error('Error deleting category:', err);
      setErrorModalMessage('No se pudo eliminar la categoría. Es posible que existan dependencias en el sistema.');
      setShowErrorModal(true);
    }
  };

  const handleToggleCategoryStatus = async (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    if (!category) return;

    try {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      const categoryToUpdate = { ...category, status: newStatus };
      const apiData = mapCategoryToAPI(categoryToUpdate);

      const updatedAPICategory = await supplyCategoryService.updateCategory(categoryId, apiData);

      setCategories(categories.map((c: any) =>
        c.id === categoryId
          ? mapCategoryToUI(updatedAPICategory)
          : c
      ));

      setAlertMessage(`Estado de "${category.name}" actualizado a ${newStatus === 'active' ? 'Activo' : 'Inactivo'}`);
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('Error toggling category status:', err);
      setErrorModalMessage('No se pudo actualizar el estado de la categoría. Verifique su conexión e intente de nuevo.');
      setShowErrorModal(true);
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSaveCategory = async (categoryData: any) => {
    try {
      if (selectedCategory) {
        // Edit existing category - merge to ensure we have all fields
        const updatedData = { ...selectedCategory, ...categoryData };
        const updatedAPI = await supplyCategoryService.updateCategory(
          (selectedCategory as any).id,
          mapCategoryToAPI(updatedData)
        );

        setCategories(categories.map((c: any) =>
          c.id === (selectedCategory as any).id
            ? mapCategoryToUI(updatedAPI)
            : c
        ));
        setAlertMessage(`Categoría "${categoryData.name}" actualizada correctamente`);
      } else {
        // Create new category
        const createdAPI = await supplyCategoryService.createCategory(mapCategoryToAPI(categoryData) as APICategory);
        setCategories([...categories, mapCategoryToUI(createdAPI)]);
        setAlertMessage(`Categoría "${categoryData.name}" creada correctamente`);
      }
      setShowSuccessAlert(true);
      setShowEditModal(false);
    } catch (err) {
      console.error('Error saving category:', err);
      setErrorModalMessage('Error al guardar la categoría. Por favor, verifique que todos los campos sean válidos e intente de nuevo.');
      setShowErrorModal(true);
    }
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setShowEditModal(true);
  };

  const getProductsByCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return mockProducts.filter(product => product.category === category?.name) || [];
  };

  const getCategoryMetrics = (category: any) => {
    const products = getProductsByCategory(category.id);
    const productCount = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    return {
      productCount,
      totalValue,
      lowStockCount
    };
  };

  // Calculate totals
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.status === 'active');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Categoría de Insumos</h2>
          <p className="text-gray-600">
            Organiza insumos por categorías para mejor gestión del inventario
          </p>
        </div>

        {hasPermission('manage_categories') && (
          <button
            onClick={handleCreateCategory}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Categoría</span>
          </button>
        )}
      </div>



      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar categorías por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Descripción</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-medium">Cargando categorías...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 text-red-500">
                      <AlertCircle className="w-12 h-12" />
                      <p className="font-medium">{error}</p>
                      <button
                        onClick={fetchCategories}
                        className="text-pink-600 hover:text-pink-700 font-semibold underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedCategories.map((category) => {
                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{category.name}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md">{category.description}</div>
                    </td>

                    <td className="px-6 py-4">
                      {hasPermission('manage_categories') ? (
                        <div className="flex items-center space-x-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={category.status === 'active'}
                              onChange={() => handleToggleCategoryStatus(category.id)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                            <span className={`ml-3 text-sm font-medium ${category.status === 'active' ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {category.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </label>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${category.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {category.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowDetailModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_categories') && (
                          <>
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCategories.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FolderTree className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron categorías que coincidan con los filtros.</p>
            </div>
          )}
        </div>

        {/* Pagination - Always visible */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredCategories.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredCategories.length)} de {filteredCategories.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
            onPrevious={goToPreviousPage}
            onNext={goToNextPage}
          />
        </div>
      </div>

      {/* Category Edit Modal */}
      {showEditModal && (
        <CategoryEditModal
          category={selectedCategory}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveCategory}
        />
      )}

      {/* Category Detail Modal */}
      {showDetailModal && (
        <CategoryDetailModal
          category={selectedCategory}
          onClose={() => setShowDetailModal(false)}
          getProductsByCategory={getProductsByCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          category={selectedCategory}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteCategory}
        />
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-[2000] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 min-w-[320px]">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{alertMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          message={errorModalMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
}

// Error Modal Component
function ErrorModal({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! Algo salió mal</h3>
          <p className="text-gray-600 mb-8">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// Category Edit Modal Component
function CategoryEditModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    status: category?.status || 'active'
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {category ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <p className="text-pink-100">
                {category ? 'Actualiza la información de la categoría' : 'Crea una nueva categoría de insumos'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Ej: Cuidado Capilar, Tratamientos..."
            />
            {errors.name && (
              <div className="flex items-center space-x-1 mt-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Describe qué incluye esta categoría..."
            />
            {errors.description && (
              <div className="flex items-center space-x-1 mt-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.description}</span>
              </div>
            )}
          </div>

          {/* Solo mostrar campo de estado cuando se está editando */}
          {category && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{category ? 'Actualizar' : 'Crear'} Categoría</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Detail Modal Component
function CategoryDetailModal({ category, onClose, getProductsByCategory }) {
  const products = getProductsByCategory(category.id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 text-gray-800 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                Detalles de la Categoría
              </h3>
              <p className="text-gray-600">
                {category.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Details */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Información de la Categoría</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre:</p>
                <p className="text-lg font-bold">{category.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado:</p>
                <p className={`text-lg font-bold ${category.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                  {category.status === 'active' ? 'Activa' : 'Inactiva'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Descripción:</p>
                <p className="text-lg font-bold">{category.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Creado:</p>
                <p className="text-lg font-bold">{category.createdAt}</p>
              </div>
              {category.updatedAt && (
                <div>
                  <p className="text-sm text-gray-600">Actualizado:</p>
                  <p className="text-lg font-bold">{category.updatedAt}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Insumos en Categoría ({products.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{product.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock <= product.minStock
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    Stock: {product.stock}
                  </span>
                </div>
              ))}
              {products.length > 5 && (
                <div className="text-center text-xs text-gray-500">
                  +{products.length - 5} insumos más
                </div>
              )}
              {products.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No hay insumos en esta categoría
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ category, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Confirmar Eliminación</h3>
              <p className="text-gray-600">Esta acción no se puede deshacer</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              ¿Estás segura de que quieres eliminar la categoría <strong>{category.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800">{category.name}</div>
                <div className="text-sm text-gray-600">{category.description}</div>
                <div className="text-sm text-gray-600">
                  Estado: {category.status === 'active' ? 'Activa' : 'Inactiva'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}