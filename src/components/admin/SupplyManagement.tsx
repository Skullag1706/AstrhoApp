import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Search, Edit, Trash2, Eye, Package, Wrench, AlertTriangle, X, Loader2 } from 'lucide-react';
import { supplyService, Supply } from '../../services/supplyService';
import { supplierService } from '../../services/supplierService';
import { SupplyEditModal } from './modals/SupplyEditModal';
import { SimplePagination } from '../ui/simple-pagination';

interface SupplyManagementProps {
  hasPermission: (permission: string) => boolean;
}

// Helper: unwrap ASP.NET $values wrappers
function unwrapArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.$values)) return raw.$values;
  if (raw && Array.isArray(raw.data)) return raw.data;
  if (raw && Array.isArray(raw.result)) return raw.result;
  return [];
}

export function SupplyManagement({ hasPermission }: SupplyManagementProps) {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ── Fetch data from API ──
  const fetchSupplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await supplyService.getSupplies();
      const items = unwrapArray(raw);
      setSupplies(items);
    } catch (err) {
      console.error('Error loading supplies:', err);
      setError('Error al cargar los insumos');
      setSupplies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const raw = await supplierService.getAll();
      setSuppliers(unwrapArray(raw));
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  useEffect(() => {
    fetchSupplies();
    fetchSuppliers();
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

  // Reset a página 1 cuando cambia búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch =
      (supply.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supply.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Stats from API data
  const stats = {
    totalSupplies: supplies.length,
    activeSupplies: supplies.filter(s => s.estado === true).length,
    inactiveSupplies: supplies.filter(s => s.estado === false).length,
    lowStockSupplies: supplies.filter(s => (s.stock ?? 0) <= 5 && (s.stock ?? 0) > 0).length,
  };

  // Paginación
  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);
  const paginatedSupplies = filteredSupplies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => setCurrentPage(page);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const handleCreateSupply = () => {
    setSelectedSupply(null);
    setShowEditModal(true);
  };

  const handleEditSupply = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowEditModal(true);
  };

  const handleViewDetail = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowDetailModal(true);
  };

  const handleDeleteSupply = async (supplyId: number) => {
    const supply = supplies.find(s => s.insumoId === supplyId);
    if (window.confirm(`¿Estás seguro de que quieres eliminar el insumo "${supply?.nombre}"?`)) {
      try {
        await supplyService.deleteSupply(supplyId);
        await fetchSupplies();
        setShowSuccessAlert(true);
        setAlertMessage('Insumo eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting supply:', err);
        setShowSuccessAlert(true);
        setAlertMessage('Error al eliminar el insumo');
      }
    }
  };

  const handleSaveSupply = async (supplyData: any) => {
    try {
      if (selectedSupply) {
        await supplyService.updateSupply(selectedSupply.insumoId, {
          sku: supplyData.sku || supplyData.name,
          nombre: supplyData.nombre || supplyData.name,
          descripcion: supplyData.descripcion || supplyData.description || '',
          categoriaId: supplyData.categoriaId || selectedSupply.categoriaId,
          estado: supplyData.estado ?? selectedSupply.estado,
          stock: supplyData.stock ?? supplyData.quantity ?? selectedSupply.stock,
        });
      } else {
        await supplyService.createSupply({
          sku: supplyData.sku || '',
          nombre: supplyData.nombre || supplyData.name || '',
          descripcion: supplyData.descripcion || supplyData.description || '',
          categoriaId: supplyData.categoriaId || 1,
          estado: supplyData.estado ?? true,
          stock: supplyData.stock ?? supplyData.quantity ?? 0,
        });
      }

      await fetchSupplies();
      setShowEditModal(false);
      setShowSuccessAlert(true);
      setAlertMessage(selectedSupply ? 'Insumo actualizado exitosamente' : 'Insumo creado exitosamente');
    } catch (err) {
      console.error('Error saving supply:', err);
      setShowSuccessAlert(true);
      setAlertMessage('Error al guardar el insumo');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Insumos</h2>
          <p className="text-gray-600">Control de inventario de insumos y materiales</p>
        </div>

        {hasPermission('manage_supplies') && (
          <button
            onClick={handleCreateSupply}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Insumo</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Wrench className="w-8 h-8 text-blue-600" />} value={stats.totalSupplies} label="Total Insumos" />
        <StatCard icon={<CheckCircle className="w-8 h-8 text-green-600" />} value={stats.activeSupplies} label="Activos" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-yellow-600" />} value={stats.lowStockSupplies} label="Stock Bajo" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-red-600" />} value={stats.inactiveSupplies} label="Inactivos" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar insumos por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-8">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando insumos...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchSupplies}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Lista de Insumos</h3>
            <p className="text-gray-600">
              {filteredSupplies.length} insumo{filteredSupplies.length !== 1 ? 's' : ''} encontrado{filteredSupplies.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">SKU</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Categoría</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedSupplies.map((supply) => (
                  <tr key={supply.insumoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{supply.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{supply.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{supply.categoriaNombre || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${(supply.stock ?? 0) <= 0
                          ? 'bg-red-100 text-red-800'
                          : (supply.stock ?? 0) <= 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                        {supply.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${supply.estado
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {supply.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => handleViewDetail(supply)} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="Ver Detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasPermission('manage_supplies') && (
                        <>
                          <button onClick={() => handleEditSupply(supply)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteSupply(supply.insumoId)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {filteredSupplies.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              {' - '}
              {Math.min(currentPage * itemsPerPage, filteredSupplies.length)}
              {' de '}
              {filteredSupplies.length} registros
            </div>

            <SimplePagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={goToPage}
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSupply && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 text-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Detalle de Insumo</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2"><span className="text-gray-600">Nombre:</span><span className="font-semibold text-gray-800">{selectedSupply.nombre}</span></div>
              <div className="flex gap-2"><span className="text-gray-600">SKU:</span><span className="text-gray-800">{selectedSupply.sku}</span></div>
              <div className="flex gap-2"><span className="text-gray-600">Descripción:</span><span className="text-gray-800">{selectedSupply.descripcion || 'N/A'}</span></div>
              <div className="flex gap-2"><span className="text-gray-600">Categoría:</span><span className="text-gray-800">{selectedSupply.categoriaNombre || 'N/A'}</span></div>
              <div className="flex gap-2 items-center">
                <span className="text-gray-600">Stock:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${(selectedSupply.stock ?? 0) <= 0
                    ? 'bg-red-100 text-red-800'
                    : (selectedSupply.stock ?? 0) <= 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                  {selectedSupply.stock ?? 0}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedSupply.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedSupply.estado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <SupplyEditModal
          supply={selectedSupply}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveSupply}
          suppliers={suppliers}
        />
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 duration-300">
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

function StatCard({ icon, value, label }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
      {icon}
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}
