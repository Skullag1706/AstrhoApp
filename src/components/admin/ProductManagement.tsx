import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Edit, Trash2, Search,
  DollarSign, Save, X, Eye, AlertCircle, CheckCircle
} from 'lucide-react';
import { mockProducts } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';
import { supplyCategoryService, Category as APICategory } from '../../services/supplyCategoryService';
import { supplyService, Supply as APISupply } from '../../services/supplyService';

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  category: string;
  categoryId: number;
  status: 'active' | 'inactive';
  quantity: number;
}

interface ProductManagementProps {
  hasPermission: (permission: string) => boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Activo';
    case 'inactive': return 'Inactivo';
    default: return status;
  }
};

export function ProductManagement({ hasPermission }: ProductManagementProps) {

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<APICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Map API Supply to UI model
  const mapSupplyToUI = (supply: APISupply, fallbackCategory?: string): Product => ({
    id: supply.insumoId,
    name: supply.nombre,
    description: supply.descripcion || '',
    sku: supply.sku,
    category: supply.categoriaNombre || fallbackCategory || 'Sin categoría',
    categoryId: supply.categoriaId,
    status: supply.estado ? 'active' : 'inactive',
    quantity: supply.stock || 0
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [suppliesData, categoriesData] = await Promise.all([
        supplyService.getSupplies(),
        supplyCategoryService.getCategories()
      ]);

      console.log('Supplies data received:', suppliesData);
      console.log('Categories data received:', categoriesData);

      if (!Array.isArray(suppliesData)) {
        console.error('Supplies data is not an array:', suppliesData);
        throw new Error('Los datos de insumos recibidos no tienen el formato correcto (se esperaba un arreglo).');
      }

      setProducts(suppliesData.map(mapSupplyToUI));
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setErrorModalMessage(error.message || 'No se pudieron cargar los datos. Por favor, intente de nuevo.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Auto-hide success alert after 4 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  const matchesSearch = (product: any, term: string) => {
    const normalized = term.toLowerCase();
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized)
    );
  };

  const filteredProducts = products.filter(product =>
    matchesSearch(product, searchTerm)
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const productCategories = categories.map(cat => ({
    id: cat.categoriaId,
    name: cat.nombre,
    status: cat.estado ? 'active' : 'inactive'
  }));

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleViewDetail = (product: any) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    const productName = productToDelete.name;
    const productId = productToDelete.id;

    try {
      await supplyService.deleteSupply(productId);
      setProducts(products.filter(p => p.id !== productId));
      setAlertMessage(`Insumo "${productName}" eliminado correctamente`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Error deleting supply:', error);
      setErrorModalMessage('No se pudo eliminar el insumo. Por favor, intente de nuevo.');
      setShowErrorModal(true);
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const mapUIToSupply = (uiData: any, id?: number): APISupply => {
    return {
      insumoId: id || 0,
      sku: uiData.sku,
      nombre: uiData.name,
      descripcion: uiData.description || '',
      categoriaId: Number(uiData.categoryId) || 0,
      estado: uiData.status === 'active',
      stock: Number(uiData.quantity) || 0
    } as APISupply;
  };

  // Toggle status directly from listing
  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    // Optimistic update immediately in UI
    const optimisticProduct: Product = { ...product, status: newStatus };
    setProducts(prev => prev.map(p => p.id === product.id ? optimisticProduct : p));
    try {
      const apiData = mapUIToSupply({ ...product, status: newStatus }, product.id);
      const updatedSupply = await supplyService.updateSupply(product.id, apiData);
      // Sync with API response, preserving category name if API doesn't return it
      setProducts(prev => prev.map(p =>
        p.id === product.id ? mapSupplyToUI(updatedSupply, product.category) : p
      ));
      setAlertMessage(`Estado de "${product.name}" cambiado a ${newStatus === 'active' ? 'Activo' : 'Inactivo'}`);
      setShowSuccessAlert(true);
    } catch (error) {
      // Revert optimistic update on failure
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      console.error('Error toggling status:', error);
      setErrorModalMessage('No se pudo cambiar el estado. Por favor, intente de nuevo.');
      setShowErrorModal(true);
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (selectedProduct) {
        const apiData = mapUIToSupply(productData, selectedProduct.id);
        const updatedSupply = await supplyService.updateSupply(selectedProduct.id, apiData);
        // Find the category name from the loaded categories list
        const categoryName = categories.find(
          (c) => c.categoriaId === Number(productData.categoryId)
        )?.nombre || selectedProduct.category;
        setProducts(prev => prev.map(p =>
          p.id === selectedProduct.id ? mapSupplyToUI(updatedSupply, categoryName) : p
        ));
        setAlertMessage(`Insumo "${productData.name}" actualizado correctamente`);
        setShowSuccessAlert(true);
      } else {
        const apiData = mapUIToSupply(productData);
        // Omit insumoId for creation if the service expects Omit<Supply, 'insumoId'>
        const { insumoId, ...createData } = apiData;
        const newSupply = await supplyService.createSupply(createData);
        // Find the category name from the loaded categories list
        const categoryName = categories.find(
          (c) => c.categoriaId === Number(productData.categoryId)
        )?.nombre || 'Sin categoría';
        setProducts(prev => [mapSupplyToUI(newSupply, categoryName), ...prev]);
        setAlertMessage(`Insumo "${productData.name}" registrado correctamente`);
        setShowSuccessAlert(true);
      }
      setShowProductModal(false);
    } catch (error: any) {
      console.error('Error saving supply:', error);
      const isDuplicate = error.message?.toLowerCase().includes('ya existe') ||
        error.message?.toLowerCase().includes('already') ||
        error.message?.includes('400') ||
        error.message?.toLowerCase().includes('duplicate');

      setErrorModalMessage(isDuplicate
        ? 'Este registro ya existe. por favor ingrese otro diferente'
        : 'Error al guardar el insumo. Por favor, verifique que todos los campos sean válidos e intente de nuevo.');
      setShowErrorModal(true);
    }
  };





  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Insumos</h2>
          <p className="text-gray-600">
            Catálogo maestro • Control de inventario global
          </p>
        </div>

        {hasPermission('manage_products') && (
          <button
            onClick={handleCreateProduct}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Nuevo Insumo</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-8">
          <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Sincronizando insumos...</p>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Listado de Productos</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Insumo</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">SKU</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Categoría</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Existencias</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                    <th className="px-6 py-4 text-right font-semibold text-gray-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{product.name}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-100">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                           <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            product.quantity <= 0
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : product.quantity <= 5
                                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                : 'bg-green-50 text-green-600 border border-green-100'
                            }`}>
                            {product.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={product.status === 'active'}
                              onChange={() => handleToggleStatus(product)}
                              className="sr-only peer"
                              disabled={!hasPermission('manage_products')}
                            />
                            <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600 ${!hasPermission('manage_products') ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                            <span className={`ml-3 text-xs font-bold ${product.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                              {product.status === 'active' ? 'On' : 'Off'}
                            </span>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetail(product)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('manage_products') && (
                            <>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} registros
              </div>
              <SimplePagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </>
      )}

      {/* Modales */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          categories={categories}
        />
      )}

      {showDetailModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showDeleteModal && productToDelete && (
        <DeleteConfirmModal
          productName={productToDelete.name}
          onConfirm={confirmDeleteProduct}
          onCancel={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
        />
      )}

      {showErrorModal && (
        <ErrorModal
          message={errorModalMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-24 right-4 z-[2147483647] animate-in slide-in-from-top-5 duration-300">
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
    </div>
  );
}

// Error Modal Component
function ErrorModal({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! Algo salió mal</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-red-200 transition-all uppercase tracking-wider text-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductModalProps {
  product: any;
  onClose: () => void;
  onSave: (data: any) => void;
  categories: APICategory[];
}

function ProductModal({ product, onClose, onSave, categories }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    status: product?.status || 'active',
    description: product?.description || '',
    quantity: product?.quantity || 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const activeCategories = categories.filter((cat: APICategory) => cat.estado === true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{product ? 'Editar Insumo' : 'Registrar Insumo'}</h3>
              <p className="text-pink-100/80 text-sm">Información completa del registro</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre del Insumo *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none ${errors.name ? 'border-red-300' : ''}`}
                placeholder="Ej: Shampoo"
              />
              {errors.name && (
                <div className="flex items-center space-x-1 mt-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-xl text-sm text-gray-400 font-mono"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Categoría</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none"
              >
                <option value="">Seleccionar</option>
                {activeCategories.map((cat: any) => (
                  <option key={cat.categoriaId} value={cat.categoriaId}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 text-center block w-full">Estado</label>
              <div className="flex items-center justify-center pt-2">
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
                  <span className={`ml-3 text-xs font-bold ${formData.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                    {formData.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none resize-none"
              placeholder="Descripción detallada..."
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-200 transition-all uppercase tracking-wider text-sm"
            >
              {product ? 'Actualizar Registro' : 'Registrar Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ProductDetailModal({ product, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight tracking-widest uppercase">Detalles del Insumo</h3>
              <p className="text-pink-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1 italic">Ficha técnica completa</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Nombre del Insumo</label>
              <p className="text-xl font-black text-gray-800 tracking-tight">{product.name}</p>
            </div>
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">SKU de Referencia</label>
              <p className="text-xl font-mono font-black text-purple-600 tracking-wider">{product.sku}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1 text-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Categoría</label>
              <p className="text-sm font-bold text-gray-600 uppercase">{product.category}</p>
            </div>
            <div className="space-y-1 text-center border-x border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Estado</label>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mt-2 border-2 ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
            </div>
            <div className="space-y-1 text-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Existencias</label>
              <p className="text-sm font-black text-pink-500 uppercase">{product.quantity} Disponibles</p>
            </div>
          </div>

          {product.description && (
            <div className="bg-pink-50/30 p-8 rounded-[2rem] border-2 border-dashed border-pink-100 relative overflow-hidden">
              <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4 block">Descripción Técnica</label>
              <p className="text-gray-600 italic leading-relaxed relative z-10">"{product.description}"</p>
              <Package className="absolute -bottom-4 -right-4 w-24 h-24 text-pink-100/50 -rotate-12" />
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black shadow-xl shadow-pink-100 hover:shadow-pink-200 transition-all uppercase tracking-[0.3em] text-xs"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ productName, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase">Eliminar Registro</h3>
              <p className="text-red-100/80 text-xs">Acción irreversible</p>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6 leading-relaxed">
            ¿Estás completamente seguro de que quieres eliminar el insumo <span className="font-bold text-gray-800 underline decoration-red-300 decoration-2">"{productName}"</span>?
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onCancel}
              className="py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all uppercase tracking-wider border border-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-red-200 transition-all uppercase tracking-wider text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
