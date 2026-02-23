import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Edit, Trash2, Search,
  DollarSign, Save, X, Eye, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockProducts } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';
import { supplyCategoryService, Category as APICategory } from '../../services/supplyCategoryService';
import { supplyService, Supply as APISupply } from '../../services/supplyService';
import { brandService, Brand as APIBrand } from '../../services/brandService';

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  brand: string;
  brandId: number;
  category: string;
  categoryId: number;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  createdAt?: string;
  updatedAt?: string;
}

interface ProductManagementProps {
  hasPermission: (permission: string) => boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'discontinued': return 'bg-red-100 text-red-800';
    case 'out_of_stock': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Activo';
    case 'discontinued': return 'Descontinuado';
    case 'out_of_stock': return 'Agotado';
    default: return status;
  }
};

export function ProductManagement({ hasPermission }: ProductManagementProps) {

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<APICategory[]>([]);
  const [brands, setBrands] = useState<APIBrand[]>([]);
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

  // Map API Supply to UI model
  const mapSupplyToUI = (supply: APISupply) => ({
    id: supply.insumoId,
    name: supply.nombre,
    description: supply.descripcion || '',
    sku: supply.sku,
    brand: supply.marcaNombre || 'Sin marca',
    brandId: supply.marcaId,
    category: supply.categoriaNombre || 'Sin categoría',
    categoryId: supply.categoriaId,
    status: supply.estado ? 'active' : 'inactive',
    createdAt: supply.fechaCreacion,
    updatedAt: supply.fechaActualizacion
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [suppliesData, categoriesData, brandsData] = await Promise.all([
        supplyService.getSupplies(),
        supplyCategoryService.getCategories(),
        brandService.getBrands()
      ]);

      console.log('Supplies data received:', suppliesData);
      console.log('Categories data received:', categoriesData);
      console.log('Brands data received:', brandsData);

      if (!Array.isArray(suppliesData)) {
        console.error('Supplies data is not an array:', suppliesData);
        throw new Error('Los datos de insumos recibidos no tienen el formato correcto (se esperaba un arreglo).');
      }

      setProducts(suppliesData.map(mapSupplyToUI));
      setCategories(categoriesData);
      setBrands(brandsData);
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

  const matchesSearch = (product: any, term: string) => {
    const normalized = term.toLowerCase();
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized) ||
      product.brand.toLowerCase().includes(normalized)
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
      toast.success(`Insumo "${productName}" eliminado correctamente`);
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
    const categoryObj = categories.find(c => c.nombre === uiData.category);
    const brandObj = brands.find(b => b.nombre === uiData.brand);
    return {
      insumoId: id || 0,
      sku: uiData.sku,
      nombre: uiData.name,
      descripcion: uiData.description || '',
      categoriaId: categoryObj?.categoriaId || 0,
      marcaId: brandObj?.marcaId || 0,
      estado: uiData.status === 'active'
    } as APISupply;
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (selectedProduct) {
        const apiData = mapUIToSupply(productData, selectedProduct.id);
        const updatedSupply = await supplyService.updateSupply(selectedProduct.id, apiData);
        setProducts(products.map(p =>
          p.id === selectedProduct.id ? mapSupplyToUI(updatedSupply) : p
        ));
        toast.success(`Insumo "${productData.name}" actualizado correctamente`);
      } else {
        const apiData = mapUIToSupply(productData);
        // Omit insumoId for creation if the service expects Omit<Supply, 'insumoId'>
        const { insumoId, ...createData } = apiData;
        const newSupply = await supplyService.createSupply(createData);
        setProducts([mapSupplyToUI(newSupply), ...products]);
        toast.success(`Insumo "${productData.name}" registrado correctamente`);
      }
      setShowProductModal(false);
    } catch (error) {
      console.error('Error saving supply:', error);
      setErrorModalMessage('No se pudo guardar el insumo. Por favor, intente de nuevo.');
      setShowErrorModal(true);
    }
  };





  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Insumos</h2>
          <p className="text-gray-600">
            Control completo del inventario y características de insumos
          </p>
        </div>

        {hasPermission('manage_products') && (
          <button
            onClick={handleCreateProduct}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Insumo</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 translate-y-10">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Cargando insumos...</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">SKU</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Marca</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Categoría</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map(product => {
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-800">{product.name}</td>
                        <td className="px-6 py-4 text-gray-700">{product.sku}</td>
                        <td className="px-6 py-4 text-gray-700">{product.brand}</td>
                        <td className="px-6 py-4 text-gray-700">{product.category}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                            {getStatusLabel(product.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetail(product)}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {hasPermission('manage_products') && (
                              <>
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product)}
                                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
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
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                {' - '}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                {' de '}
                {filteredProducts.length} registros
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
          brands={brands}
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

// Modal para crear/editar insumo
interface ProductModalProps {
  product: any;
  onClose: () => void;
  onSave: (data: any) => void;
  categories: APICategory[];
  brands: APIBrand[];
}

function ProductModal({ product, onClose, onSave, categories, brands }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    brand: product?.brand || '',
    category: product?.category || '',
    status: product?.status || 'active',
    description: product?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtrar solo categorías activas
  const activeCategories = categories.filter((cat: APICategory) => cat.estado === true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (!formData.brand.trim()) newErrors.brand = 'La marca es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {product ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
              </h3>
              <p className="text-pink-100">Complete los datos del insumo</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Insumo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                placeholder="Ej: Shampoo Keratina"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                placeholder="Ej: SHP-KER-001"
              />
              {errors.sku && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.sku}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marca *
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">Seleccionar marca</option>
                {brands.map((brand: any) => (
                  <option key={brand.marcaId} value={brand.nombre}>
                    {brand.nombre}
                  </option>
                ))}
              </select>
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.brand}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                {activeCategories.map((cat: any) => (
                  <option key={cat.categoriaId} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              <option value="discontinued">Descontinuado</option>
              <option value="out_of_stock">Agotado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              placeholder="Descripción del insumo..."
            />
          </div>

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
              <span>{product ? 'Actualizar' : 'Registrar'} Insumo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de detalles del insumo
function ProductDetailModal({ product, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalles del Insumo</h3>
              <p className="text-blue-100">Información completa</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="text-lg font-semibold text-gray-800">{product.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">SKU</p>
              <p className="text-lg font-semibold text-gray-800">{product.sku}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Marca</p>
              <p className="text-lg font-semibold text-gray-800">{product.brand}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Categoría</p>
              <p className="text-lg font-semibold text-gray-800">{product.category}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block mt-1 ${getStatusColor(product.status)}`}>
              {getStatusLabel(product.status)}
            </span>
          </div>

          {product.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Descripción</p>
              <p className="text-gray-700 italic">"{product.description}"</p>
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de confirmación de eliminación
function DeleteConfirmModal({ productName, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-red-400 to-pink-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h3 className="text-2xl font-bold">Confirmar Eliminación</h3>
              <p className="text-red-100">Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que quieres eliminar el insumo{' '}
            <span className="font-bold">"{productName}"</span>?
          </p>
          <p className="text-sm text-gray-600">
            Se eliminarán todos los datos asociados a este insumo.
          </p>

          <div className="flex space-x-4 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}