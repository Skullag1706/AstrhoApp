import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, CheckCircle, X, Loader2,
  Package, AlertTriangle, Wrench, Calendar
} from 'lucide-react';
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

function getStatusColor(estado: boolean) {
  return estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
}

function getStatusLabel(estado: boolean) {
  return estado ? 'Activo' : 'Inactivo';
}

function getTypeColor(categoriaId: number) {
  const colors = ['bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-green-100 text-green-800'];
  return colors[categoriaId % colors.length] || 'bg-gray-100 text-gray-800';
}

function StatCard({ icon, value, label }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-pink-50/20 border border-gray-50 flex items-center space-x-6 hover:shadow-2xl hover:shadow-pink-100/50 transition-all group">
      <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 flex items-center justify-center group-hover:bg-pink-50 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-gray-800 tracking-tight">{value}</p>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

export function SupplyManagement({ hasPermission }: SupplyManagementProps) {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplyToDelete, setSupplyToDelete] = useState<Supply | null>(null);

  // ── Fetch data from API ──
  const fetchSupplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await supplyService.getSupplies();
      const rawArray = unwrapArray(raw);
      const items = rawArray.map((item: any) => ({
        insumoId: item.insumoId ?? item.InsumoId ?? 0,
        sku: item.sku ?? item.Sku ?? item.SKU ?? '',
        nombre: item.nombre ?? item.Nombre ?? '',
        descripcion: item.descripcion ?? item.Descripcion ?? '',
        categoriaId: item.categoriaId ?? item.CategoriaId ?? 0,
        categoriaNombre: item.categoriaNombre ?? item.CategoriaNombre ?? '',
        estado: item.estado ?? item.Estado ?? true,
        stock: item.stock ?? item.Stock ?? item.cantidad ?? item.Cantidad ?? item.existencias ?? 0
      }));
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
      const timer = setTimeout(() => setShowSuccessAlert(false), 4000);
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

  const handleDeleteSupply = (supply: Supply) => {
    setSupplyToDelete(supply);
    setShowDeleteModal(true);
  };

  const confirmDeleteSupply = async () => {
    if (!supplyToDelete) return;

    try {
      await supplyService.deleteSupply(supplyToDelete.insumoId);
      await fetchSupplies();
      setShowDeleteModal(false);
      setSupplyToDelete(null);
      setShowSuccessAlert(true);
      setAlertMessage('Insumo eliminado exitosamente');
    } catch (err) {
      console.error('Error deleting supply:', err);
      setShowDeleteModal(false);
      setSupplyToDelete(null);
      setShowSuccessAlert(true);
      setAlertMessage('Error al eliminar el insumo');
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
          stock: supplyData.stock ?? supplyData.quantity ?? supplyData.cantidad ?? selectedSupply.stock,
        });
      } else {
        await supplyService.createSupply({
          sku: supplyData.sku || '',
          nombre: supplyData.nombre || supplyData.name || '',
          descripcion: supplyData.descripcion || supplyData.description || '',
          categoriaId: supplyData.categoriaId || 1,
          estado: supplyData.estado ?? true,
          stock: supplyData.stock ?? supplyData.quantity ?? supplyData.cantidad ?? 0,
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
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Insumos</h2>
          <p className="text-gray-600">
            Inventario y materiales • Control de existencias y stock
          </p>
        </div>

        {hasPermission('manage_supplies') && (
          <button
            onClick={handleCreateSupply}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Nuevo Insumo</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
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
          <p className="text-gray-600">Cargando inventario...</p>
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
            <h3 className="text-xl font-bold text-gray-800">Listado de Insumos</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Insumo</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">SKU</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Categoría</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                  <th className="px-6 py-5 text-right font-semibold text-gray-800">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron resultados
                    </td>
                  </tr>
                ) : paginatedSupplies.map((supply) => (
                  <tr key={supply.insumoId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{supply.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-mono text-sm">{supply.sku}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(supply.categoriaId)}`}>
                        {supply.categoriaNombre || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${(supply.stock ?? 0) <= 0
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : (supply.stock ?? 0) <= 5
                              ? 'bg-orange-50 text-orange-600 border border-orange-100'
                              : 'bg-green-50 text-green-600 border border-green-100'
                          }`}>
                          {supply.stock ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(supply.estado)}`}>
                        {getStatusLabel(supply.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetail(supply)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission('manage_supplies') && (
                          <>
                            <button
                              onClick={() => handleEditSupply(supply)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSupply(supply)}
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

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {filteredSupplies.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredSupplies.length)} de {filteredSupplies.length} registros
            </div>
            <SimplePagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={goToPage}
            />
          </div>
        </div>
      )}


      {showDetailModal && selectedSupply && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Detalle del Insumo</h3>
                  <p className="text-pink-100/80 text-sm">Información completa del registro</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nombre</label>
                  <p className="text-lg font-bold text-gray-800">{selectedSupply.nombre}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">SKU</label>
                  <p className="text-lg font-mono font-bold text-purple-600">{selectedSupply.sku}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Categoría</label>
                  <p className="font-semibold text-gray-700">{selectedSupply.categoriaNombre || 'N/A'}</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Estado</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedSupply.estado)}`}>
                    {getStatusLabel(selectedSupply.estado)}
                  </span>
                </div>
                <div className="text-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Stock</label>
                  <p className={`font-bold ${(selectedSupply.stock ?? 0) <= 5 ? 'text-red-500' : 'text-green-500'
                    }`}>
                    {selectedSupply.stock ?? 0} Unidades
                  </p>
                </div>
              </div>

              <div className="bg-pink-50/50 p-6 rounded-xl border border-pink-100 relative overflow-hidden">
                <label className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2 block">Descripción</label>
                <p className="text-gray-600 italic relative z-10 leading-relaxed">
                  {selectedSupply.descripcion || 'Sin descripción disponible.'}
                </p>
                <Package className="absolute -bottom-2 -right-2 w-16 h-16 text-pink-100/50 -rotate-12" />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-200 transition-all uppercase tracking-wider text-sm"
                >
                  Cerrar
                </button>
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

      {showDeleteModal && supplyToDelete && (
        <DeleteConfirmModal
          supplyName={supplyToDelete.nombre}
          onConfirm={confirmDeleteSupply}
          onCancel={() => {
            setShowDeleteModal(false);
            setSupplyToDelete(null);
          }}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({ supplyName, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-wider">Eliminar Registro</h3>
              <p className="text-red-100/80 text-xs">Acción irreversible</p>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6 leading-relaxed">
            ¿Estás completamente seguro de que quieres eliminar el insumo <span className="font-bold text-gray-800 underline decoration-red-300 decoration-2">"{supplyName}"</span>?
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onCancel}
              className="py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all uppercase tracking-widest border border-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-red-200 transition-all uppercase tracking-widest text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
