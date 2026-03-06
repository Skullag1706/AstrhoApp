import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Plus, Eye, Filter, Search, Calendar, AlertTriangle,
  CheckCircle, Clock, Truck, Package, X, Save, DollarSign,
  FileText, Ban, File, Trash2, ChevronDown, Loader2
} from 'lucide-react';
import { purchaseService, PurchaseAPI } from '../../services/purchaseService';
import { supplierService, SupplierAPI } from '../../services/supplierService';
import { supplyService, Supply } from '../../services/supplyService';
import { SimplePagination } from '../ui/simple-pagination';

interface PurchaseManagementProps {
  hasPermission: (permission: string) => boolean;
}

// Helper: ASP.NET with ReferenceHandler.Preserve wraps arrays in { $values: [...] }
// This utility unwraps at any nesting level.
function unwrapValues(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(unwrapValues);
  if (typeof obj === 'object') {
    // If the object itself is a $values wrapper, return the inner array
    if (Array.isArray(obj.$values)) {
      return obj.$values.map(unwrapValues);
    }
    // Otherwise recurse into each key
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (key === '$id' || key === '$ref') continue; // skip JSON ref metadata
      result[key] = unwrapValues(obj[key]);
    }
    return result;
  }
  return obj;
}

export function PurchaseManagement({ hasPermission }: PurchaseManagementProps) {
  const [purchases, setPurchases] = useState<PurchaseAPI[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierAPI[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseAPI | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 8;

  // ── Fetch data from API ──
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await purchaseService.getAll();
      console.log('Compras API raw response:', raw);

      // Extract the array from any wrapper format
      let items: any[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && Array.isArray(raw.$values)) {
        items = raw.$values;
      } else if (raw && Array.isArray(raw.data)) {
        items = raw.data;
      } else if (raw && Array.isArray(raw.result)) {
        items = raw.result;
      }

      // Unwrap nested $values (e.g. detalles.$values)
      const cleaned = items.map(unwrapValues);
      setPurchases(cleaned);
    } catch (err) {
      console.error('Error loading purchases:', err);
      setError('Error al cargar las compras');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const raw = await supplierService.getAll();
      let items: any[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && Array.isArray(raw.$values)) {
        items = raw.$values;
      } else if (raw && Array.isArray(raw.data)) {
        items = raw.data;
      } else if (raw && Array.isArray(raw.result)) {
        items = raw.result;
      }
      setSuppliers(items);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  const fetchSupplies = async () => {
    try {
      const raw = await supplyService.getSupplies();
      let items: any[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && Array.isArray(raw.$values)) {
        items = raw.$values;
      } else if (raw && Array.isArray(raw.data)) {
        items = raw.data;
      } else if (raw && Array.isArray(raw.result)) {
        items = raw.result;
      }
      setSupplies(items);
    } catch (err) {
      console.error('Error loading supplies:', err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchSupplies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownOpen !== null) {
        const dropdownElements = document.querySelectorAll('[data-dropdown]');
        const clickedInsideDropdown = Array.from(dropdownElements).some(element =>
          element.contains(event.target)
        );

        if (!clickedInsideDropdown) {
          setStatusDropdownOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownOpen]);

  // Auto-hide success alert after 4 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.compraId.toString().includes(searchTerm) ||
      purchase.proveedorNombre?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex);

  const getStatusColor = (estado: boolean) => {
    return estado
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (estado: boolean) => {
    return estado ? 'Aprobado' : 'Anulado';
  };

  const getStatusIcon = (estado: boolean) => {
    return estado
      ? <CheckCircle className="w-4 h-4" />
      : <X className="w-4 h-4" />;
  };

  const handleViewDetail = (purchase: PurchaseAPI) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  const handleStatusChange = (purchaseId, newStatus) => {
    setStatusDropdownOpen(null);
  };

  const toggleStatusDropdown = (purchaseId) => {
    setStatusDropdownOpen(statusDropdownOpen === purchaseId ? null : purchaseId);
  };

  const handleStatusDropdownClick = (e, purchaseId) => {
    e.stopPropagation();
    toggleStatusDropdown(purchaseId);
  };

  const statusOptions = [];

  const handleCreatePurchase = () => {
    setSelectedPurchase(null);
    setShowCreateModal(true);
  };

  // Pagination handlers
  const goToPage = (page) => {
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

  const handleCancelPurchase = (purchase: PurchaseAPI) => {
    setSelectedPurchase(purchase);
    setShowCancelModal(true);
  };

  const confirmCancelPurchase = async (observation: string) => {
    if (!selectedPurchase) return;

    try {
      await purchaseService.update(selectedPurchase.compraId, {
        proveedorId: selectedPurchase.proveedorId,
        iva: selectedPurchase.iva,
        estado: false
      });

      await fetchPurchases();

      setShowCancelModal(false);
      setSelectedPurchase(null);
      setShowSuccessAlert(true);
      setAlertMessage('Compra anulada exitosamente');
    } catch (err) {
      console.error('Error cancelling purchase:', err);
      setShowSuccessAlert(true);
      setAlertMessage('Error al anular la compra');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO');
    } catch {
      return dateStr;
    }
  };

  const handleGeneratePDF = (purchase: PurchaseAPI) => {
    const receiptContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #e91e63; padding-bottom: 15px; margin-bottom: 15px;">
          <h1 style="color: #e91e63; margin: 0;">AstroApp</h1>
          <p style="margin: 5px 0; color: #666;">Salón de Belleza</p>
          <p style="margin: 5px 0; color: #666;">Cll 55 #42-16 Medellín</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">FACTURA DE COMPRA</h3>
          <p><strong>ID Compra:</strong> #${purchase.compraId}</p>
          <p><strong>Fecha de Registro:</strong> ${formatDate(purchase.fechaRegistro)}</p>
          <p><strong>Estado:</strong> ${getStatusLabel(purchase.estado)}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">INFORMACIÓN DEL PROVEEDOR:</h4>
          <p><strong>Proveedor:</strong> ${purchase.proveedorNombre}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">INSUMOS ORDENADOS:</h4>
          ${purchase.detalles.map(item => `
            <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
              <div style="font-weight: bold;">${item.insumoNombre}</div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span>Cantidad:</span>
                <span>${item.cantidad}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span>Precio Unitario:</span>
                <span>$${item.precioUnitario.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span>Subtotal:</span>
                <span>$${item.subtotal.toLocaleString()}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>$${purchase.subtotal.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>IVA (${purchase.iva}%):</span>
            <span>$${((purchase.subtotal * purchase.iva) / 100).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 5px;">
            <span>TOTAL:</span>
            <span>$${purchase.total.toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
          <p>Documento generado el ${new Date().toLocaleDateString('es-CO')}</p>
          <p>astrid@asthroapp.com | +57 304 123 4567</p>
        </div>
      </div>
    `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Factura de Compra - #${purchase.compraId}</title>
        </head>
        <body>
          ${receiptContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  const handleSavePurchase = async (purchaseData: { proveedorId: number; iva: number; items: { insumoId: number; cantidad: number; precioUnitario: number }[] }) => {
    try {
      await purchaseService.create({
        proveedorId: purchaseData.proveedorId,
        iva: purchaseData.iva,
        items: purchaseData.items
      });

      await fetchPurchases();

      setShowCreateModal(false);
      setSelectedPurchase(null);
      setShowSuccessAlert(true);
      setAlertMessage('Compra registrada exitosamente');
    } catch (err) {
      console.error('Error creating purchase:', err);
      setShowSuccessAlert(true);
      setAlertMessage('Error al registrar la compra');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Compras</h2>
          <p className="text-gray-600">
            Control de órdenes de compra y abastecimiento de inventario
          </p>
        </div>

        {hasPermission('manage_purchases') && (
          <button
            onClick={handleCreatePurchase}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Nueva Compra</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por ID o proveedor..."
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
          <p className="text-gray-600">Cargando compras...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchPurchases}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Purchases Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Historial de Compras</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Fecha</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Proveedor</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Cantidad</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Costo Total</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentPurchases.map((purchase) => (
                  <tr key={purchase.compraId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-gray-800">{formatDate(purchase.fechaRegistro)}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {purchase.proveedorNombre}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-800">{purchase.detalles?.length || 0}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-800">
                        ${purchase.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Subtotal: ${purchase.subtotal.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(purchase.estado)}`}>
                          {getStatusLabel(purchase.estado)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(purchase)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleGeneratePDF(purchase)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Generar PDF"
                        >
                          <File className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_purchases') && purchase.estado && (
                          <button
                            onClick={() => handleCancelPurchase(purchase)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Anular Compra"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination - Always visible */}
      {!loading && !error && (
        <div className="px-6 py-4 bg-white rounded-b-2xl border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredPurchases.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} de {filteredPurchases.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* Purchase Detail Modal */}
      {showDetailModal && selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          suppliers={suppliers}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Purchase Creation Modal */}
      {showCreateModal && (
        <PurchaseCreateModal
          onClose={() => {
            setShowCreateModal(false);
            setSelectedPurchase(null);
          }}
          onSave={handleSavePurchase}
          suppliers={suppliers}
          supplies={supplies}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedPurchase && (
        <CancelConfirmationModal
          purchase={selectedPurchase}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedPurchase(null);
          }}
          onConfirm={confirmCancelPurchase}
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

// Purchase Detail Modal Component
function PurchaseDetailModal({ purchase, suppliers, onClose }: { purchase: PurchaseAPI; suppliers: SupplierAPI[]; onClose: () => void }) {
  const getStatusColor = (estado: boolean) => {
    return estado
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusLabel = (estado: boolean) => {
    return estado ? 'Aprobado' : 'Anulado';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO');
    } catch {
      return dateStr;
    }
  };

  const supplier = suppliers.find(s => s.proveedorId === purchase.proveedorId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 text-white rounded-t-3xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle de Compra #{purchase.compraId}</h3>
              <p className="text-purple-100">Información completa de la orden de compra</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Purchase Info + Supplier Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Purchase Info */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información de la Compra</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-gray-600">ID de Compra:</span>
                  <span className="font-semibold text-gray-800">#{purchase.compraId}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Fecha de Registro:</span>
                  <span className="text-gray-800">{formatDate(purchase.fechaRegistro)}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(purchase.estado)}`}>
                    {getStatusLabel(purchase.estado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información del Proveedor</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-gray-600">Proveedor:</span>
                  <span className="font-semibold text-gray-800">{purchase.proveedorNombre}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Contacto:</span>
                  <span className="text-gray-800">{supplier?.personaContacto || 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-800">{supplier?.correo || 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="text-gray-800">{supplier?.telefono || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-8">
            <h4 className="font-bold text-gray-800 mb-4">Insumos Ordenados</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Insumo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Cantidad</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Precio Unit.</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchase.detalles?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.insumoNombre}</td>
                      <td className="px-4 py-3 text-gray-600">{item.cantidad}</td>
                      <td className="px-4 py-3 text-gray-600">${item.precioUnitario.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">${item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid md:grid-cols-2 gap-8">
            <div></div>
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Resumen Financiero</h4>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">${purchase.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA ({purchase.iva}%):</span>
                    <span className="text-gray-800">${((purchase.subtotal * purchase.iva) / 100).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="font-bold text-green-600 text-lg">${purchase.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Purchase Creation Modal Component
function PurchaseCreateModal({ onClose, onSave, suppliers, supplies }: {
  onClose: () => void;
  onSave: (data: any) => void;
  suppliers: SupplierAPI[];
  supplies: Supply[];
}) {
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    proveedorId: '',
    iva: '19',
    orderDate: getCurrentDate(),
    items: [] as { insumoId: string; insumoNombre: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        insumoId: '',
        insumoNombre: '',
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0
      }]
    });
  };

  const removeProduct = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (field === 'insumoId') {
      const supply = supplies.find(s => s.insumoId === parseInt(value));
      item.insumoId = value;
      item.insumoNombre = supply ? supply.nombre : '';
    } else if (field === 'cantidad') {
      item.cantidad = parseInt(value) || 1;
    } else if (field === 'precioUnitario') {
      item.precioUnitario = parseFloat(value) || 0;
    }

    // Recalcular subtotal
    item.subtotal = item.cantidad * item.precioUnitario;
    newItems[index] = item;

    setFormData({
      ...formData,
      items: newItems
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.proveedorId) {
      newErrors.proveedorId = 'Selecciona un proveedor';
    }

    if (!formData.iva || parseFloat(formData.iva) < 0) {
      newErrors.iva = 'Ingresa un valor de IVA válido';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Agrega al menos un insumo';
    }

    formData.items.forEach((item, index) => {
      if (!item.insumoId) {
        newErrors[`product_${index}`] = 'Selecciona un insumo';
      }
      if (item.cantidad <= 0) {
        newErrors[`quantity_${index}`] = 'La cantidad debe ser mayor a 0';
      }
      if (item.precioUnitario <= 0) {
        newErrors[`price_${index}`] = 'El precio debe ser mayor a 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const purchaseData = {
      proveedorId: parseInt(formData.proveedorId),
      iva: parseFloat(formData.iva),
      items: formData.items.map(item => ({
        insumoId: parseInt(item.insumoId),
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      }))
    };

    onSave(purchaseData);
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  const ivaPercent = parseFloat(formData.iva) || 0;
  const ivaAmount = subtotal * (ivaPercent / 100);
  const total = subtotal + ivaAmount;

  // Filter only active suppliers (estado === true)
  const activeSuppliers = suppliers.filter(s => s.estado === true);

  // Filter only active supplies (estado === true)
  const activeSupplies = supplies.filter(s => s.estado === true);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Registrar Nueva Compra</h3>
              <p className="text-pink-100">Crear orden de compra para proveedor</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {/* Información básica */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Fecha de Orden (automática y no editable) */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Fecha de Orden
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  disabled
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Fecha automática (hoy)</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Proveedor *
              </label>
              <select
                name="proveedorId"
                value={formData.proveedorId}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl appearance-none outline-none bg-white focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all ${errors.proveedorId ? 'border-red-300' : 'border-gray-300'
                  }`}
                required
              >
                <option value="">Seleccionar proveedor...</option>
                {activeSuppliers.map(supplier => (
                  <option key={supplier.proveedorId} value={supplier.proveedorId}>
                    {supplier.nombre}
                  </option>
                ))}
              </select>
              {errors.proveedorId && (
                <p className="text-red-600 text-sm mt-1">{errors.proveedorId}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                IVA (%) *
              </label>
              <input
                type="number"
                name="iva"
                value={formData.iva}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.iva ? 'border-red-300' : 'border-gray-300'
                  }`}
                required
              />
              {errors.iva && (
                <p className="text-red-600 text-sm mt-1">{errors.iva}</p>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800">Insumos de la Compra</h4>
              <button
                type="button"
                onClick={addProduct}
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Insumo</span>
              </button>
            </div>

            {errors.items && (
              <p className="text-red-600 text-sm mb-4">{errors.items}</p>
            )}

            {formData.items.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay insumos agregados</p>
                <p className="text-sm text-gray-500 mt-2">Usa el botón "Agregar Insumo" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Insumo *
                        </label>
                        <select
                          value={item.insumoId}
                          onChange={(e) => updateProduct(index, 'insumoId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none outline-none bg-white focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
                          required
                        >
                          <option value="">Seleccionar insumo...</option>
                          {activeSupplies.map(supply => (
                            <option key={supply.insumoId} value={supply.insumoId}>
                              {supply.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateProduct(index, 'cantidad', e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Precio Unit. *
                        </label>
                        <input
                          type="number"
                          value={item.precioUnitario}
                          onChange={(e) => updateProduct(index, 'precioUnitario', e.target.value)}
                          min="0"
                          step="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-300"
                          required
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Subtotal
                          </label>
                          <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                            ${item.subtotal.toLocaleString()}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Eliminar insumo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totales */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-semibold text-gray-800">
                        ${subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">IVA ({ivaPercent}%):</span>
                      <span className="font-semibold text-gray-800">
                        ${ivaAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-purple-300 pt-2">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="font-bold text-purple-700 text-lg">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formData.items.length === 0}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${formData.items.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-400 to-purple-500 text-white hover:shadow-lg'
                }`}
            >
              <Save className="w-5 h-5" />
              <span>Registrar Compra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Cancel Confirmation Modal Component
function CancelConfirmationModal({ purchase, onClose, onConfirm }: {
  purchase: PurchaseAPI;
  onClose: () => void;
  onConfirm: (observation: string) => void;
}) {
  const [observation, setObservation] = useState('');

  const handleConfirm = () => {
    onConfirm(observation);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Confirmar Anulación</h3>
              <p className="text-gray-600">Esta acción no se puede deshacer</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              ¿Estás segura de que quieres anular la compra <strong>#{purchase.compraId}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800">
                  Orden de Compra #{purchase.compraId}
                </div>
                <div className="text-sm text-gray-600">
                  Fecha: {formatDate(purchase.fechaRegistro)}
                </div>
                <div className="text-sm text-gray-600">
                  Total: ${purchase.total.toLocaleString()}
                </div>
                <div className="text-sm text-red-600 font-medium">
                  El estado cambiará a "Anulado" y no se podrá revertir
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Observación */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motivo de Anulación *
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none"
              placeholder="Escribe el motivo por el cual se anula esta compra..."
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!observation.trim()}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${!observation.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:shadow-lg'
                }`}
            >
              Anular Compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}