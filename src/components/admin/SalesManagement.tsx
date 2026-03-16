import React, { useEffect, useState  } from 'react';
import { CheckCircle, 
  DollarSign, Plus, Search, Filter, Eye, X, Calendar,
  CreditCard, TrendingUp, Users,
  Ban, FileText, Scissors,
  AlertCircle, Save, Clock, ShoppingBag, Phone, Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { salesService, SaleView } from '../../services/salesService';
import { userService } from '../../services/userService';
import { personService } from '../../services/personService';
import { SimplePagination } from '../ui/simple-pagination';

interface SalesManagementProps {
  hasPermission: (permission: string) => boolean;
  currentUser: any;
}

export function SalesManagement({ hasPermission, currentUser }: SalesManagementProps) {
  const [sales, setSales] = useState<SaleView[]>([]);
  const [selectedSale, setSelectedSale] = useState<SaleView | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setCancelModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<SaleView | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await salesService.getAll();
        setSales(data);
      } catch (err) {
        console.error('Error loading sales:', err);
        setError('Error al cargar ventas');
        toast.error('Error al cargar ventas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter sales based on search and filters
  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (String(sale.customerId || '')).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  if (loading && sales.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-pink-300 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando ventas...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'refunded': return 'Anulada';
      default: return status;
    }
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleCancelSale = (sale) => {
    setSaleToCancel(sale);
    setCancelModal(true);
  };

  const confirmCancelSale = async (observacion: string) => {
    if (saleToCancel) {
      try {
        setLoading(true);
        // Llamada real a la API para anular
        await salesService.cancel(saleToCancel.id, observacion);
        
        const updatedSale = { 
          ...saleToCancel, 
          status: 'refunded' as const, 
          notes: observacion, 
          updatedAt: new Date().toISOString().split('T')[0] 
        };

        setSales(sales.map(sale => 
          sale.id === saleToCancel.id ? updatedSale : sale
        ));

        // Si la venta anulada es la que se está viendo en el detalle, actualizarla también
        if (selectedSale && selectedSale.id === saleToCancel.id) {
          setSelectedSale(updatedSale);
        }
        
        toast.success(`Venta ${saleToCancel.id} anulada correctamente`);
        setCancelModal(false);
        setSaleToCancel(null);
      } catch (err) {
        console.error('Error al anular venta:', err);
        toast.error('Error al anular la venta. Verifique la conexión o el ID.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateSale = (saleData) => {
    // Creando nueva venta
    const newSale = {
      id: `VNT-${String(Math.max(...sales.map(s => parseInt(s.id.split('-')[1])), 0) + 1).padStart(3, '0')}`,
      ...saleData,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setSales([...sales, newSale]);
    toast.success(`Venta ${newSale.id} registrada correctamente`);
    // setShowNewSaleModal(false); // Esta función no parece estar definida en el scope actual, pero la mantengo si existiera
  };

  const handlePrintReceipt = (sale) => {
    // Crear contenido del recibo
    const customerName = sale.customerName || '';
    const employeeName = sale.employeeName || '';
    
    const receiptContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #e91e63; padding-bottom: 15px; margin-bottom: 15px;">
          <h1 style="color: #e91e63; margin: 0;">AsthroApp</h1>
          <p style="margin: 5px 0; color: #666;">Salón de Belleza</p>
          <p style="margin: 5px 0; color: #666;">Cll 55 #42-16 Medellín</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">RECIBO DE VENTA</h3>
          <p><strong>ID Venta:</strong> ${sale.id}</p>
          <p><strong>Fecha:</strong> ${sale.date} - ${sale.time}</p>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Empleado:</strong> ${employeeName}</p>
        </div>
        
        ${sale.services && sale.services.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">SERVICIOS:</h4>
            ${sale.services.map(service => {
              return `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${service.name || service.serviceId}</span>
                <span>$${(service.totalPrice || 0).toLocaleString()}</span>
              </div>`;
            }).join('')}
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>$${(sale.subtotal || 0).toLocaleString()}</span>
          </div>
          ${sale.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Descuento:</span>
              <span style="color: #e91e63;">-$${(sale.discount || 0).toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>$${(sale.total || 0).toLocaleString()}</span>
          </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 12px; color: #666;">
          <p><strong>Método de Pago:</strong> ${
            sale.paymentMethod === 'cash' ? 'Efectivo' :
            sale.paymentMethod === 'transfer' ? 'Transferencia' : 
            sale.paymentMethod === 'nequi' ? 'Nequi' :
            sale.paymentMethod === 'daviplata' ? 'Daviplata' : 'Otro'
          }</p>
          ${sale.notes ? `<p><strong>Observaciones:</strong> ${sale.notes}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
          <p>¡Gracias por tu preferencia!</p>
          <p>astrid@asthroapp.com | +57 304 123 4567</p>
        </div>
      </div>
    `;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Recibo de Venta - ${sale.id}</title>
          </head>
          <body>
            ${receiptContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Ventas</h2>
          <p className="text-gray-600">
            Registro y seguimiento de todas las ventas del salón
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por ID, documento o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="refunded">Anuladas</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Documento</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Cliente</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Servicios</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Total</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-600">
                    No hay ventas para mostrar. Ajusta filtros o intenta nuevamente más tarde.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-gray-800">{sale.customerId || '---'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{sale.customerName || 'Cliente'}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Scissors className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-purple-600">{sale.services?.length || 0}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-600">
                          ${sale.total.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sale.status)}`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewSale(sale)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {hasPermission('manage_sales') && (
                            <>
                              <button
                                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                title="Imprimir recibo"
                                onClick={() => handlePrintReceipt(sale)}
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              
                              {sale.status === 'completed' && (
                                <button
                                  onClick={() => handleCancelSale(sale)}
                                  className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                  title="Anular venta"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Updated Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && saleToCancel && (
        <CancelSaleModal
          sale={saleToCancel}
          isConfirming={loading}
          onClose={() => {
            setCancelModal(false);
            setSaleToCancel(null);
          }}
          onConfirm={confirmCancelSale}
        />
      )}

      {/* Sale Detail Modal */}
      {showDetailModal && selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setShowDetailModal(false)}
          onCancel={handleCancelSale}
          onPrint={handlePrintReceipt}
          hasPermission={hasPermission}
        />
      )}
    </div>
  );
}

// Cancel Sale Modal Component
function CancelSaleModal({ sale, isConfirming, onClose, onConfirm }: {
  sale: SaleView;
  isConfirming: boolean;
  onClose: () => void;
  onConfirm: (observation: string) => void;
}) {
  const [observation, setObservation] = useState('');

  const handleConfirm = () => {
    if (isConfirming) return;
    onConfirm(observation);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
            {isConfirming ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <AlertCircle className="w-10 h-10 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">
            {isConfirming ? 'Procesando...' : '¿Anular Venta?'}
          </h3>
          <p className="text-red-100 text-sm mt-1">Esta acción no se puede deshacer</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-gray-600 leading-relaxed">
              ¿Estás segura de que quieres anular la venta <span className="font-bold text-gray-800">#{sale.id}</span>? Se generará un registro de devolución.
            </p>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Cliente:</span>
              <span className="font-bold text-red-700">{sale.customerName || 'No registrado'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Hora:</span>
              <span className="font-bold text-red-700">{sale.time}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest">Total:</span>
              <span className="font-bold text-red-700">${(sale.total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Motivo de Anulación *</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all font-medium text-gray-700 resize-none"
              rows={3}
              placeholder="Explica brevemente el motivo..."
              disabled={isConfirming}
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              disabled={!observation.trim() || isConfirming}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center space-x-2 ${!observation.trim() || isConfirming
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-red-200 hover:scale-[1.02] active:scale-95'
                }`}
            >
              {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isConfirming ? 'Anulando...' : 'Confirmar Anulación'}</span>
            </button>
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-gray-200 hover:text-gray-700 transition-all"
            >
              Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sale Detail Modal Component
function SaleDetailModal({ sale, onClose, onCancel, onPrint, hasPermission }) {
  const [customerInfo, setCustomerInfo] = useState<{ email?: string; phone?: string }>({
    email: sale.customerEmail,
    phone: sale.customerPhone
  });
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    const fetchExtraInfo = async () => {
      if (customerInfo.email && customerInfo.phone) return;
      
      setLoadingInfo(true);
      try {
        // 1. Try to find by customerId if it's a usuarioId
        if (sale.customerId && typeof sale.customerId === 'number') {
          const users = await userService.getAll();
          const user = users.find(u => u.usuarioId === sale.customerId);
          if (user) {
            setCustomerInfo(prev => ({ ...prev, email: user.email }));
          }
        }

        // 2. Try to find in Clientes to get phone/email
        const clients = await personService.getPersons('client');
        const client = clients.find(c => 
          (sale.customerId && (String(c.usuarioId) === String(sale.customerId) || String(c.documentId) === String(sale.customerId))) ||
          (sale.customerName && c.name === sale.customerName)
        );

        if (client) {
          setCustomerInfo(prev => ({ 
            ...prev, 
            email: prev.email || client.email, 
            phone: prev.phone || client.phone 
          }));
        }
      } catch (err) {
        console.error('Error fetching extra customer info:', err);
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchExtraInfo();
  }, [sale]);

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'nequi': return 'Nequi';
      case 'daviplata': return 'Daviplata';
      case 'mixed': return 'Mixto';
      default: return 'Otro';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header - Fixed at top */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-5 text-white shrink-0 shadow-md z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold leading-tight">Detalle de Venta {sale.id}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-110 active:scale-95 transition-all shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50/30 no-scrollbar">
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Info Cards Row */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Customer Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-2 text-purple-500 mb-3">
                  <Users className="w-4 h-4" />
                  <h4 className="font-bold uppercase text-[10px] tracking-widest">Cliente</h4>
                </div>
                <div className="mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Documento:</span>
                  <p className="font-mono text-gray-600 text-sm">{sale.customerId || 'No registrado'}</p>
                </div>
                <p className="font-bold text-gray-800 text-lg mb-1 truncate">
                  {sale.customerName || 'Cliente No Registrado'}
                </p>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-sm">{customerInfo.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Payment Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-2 text-pink-500 mb-3">
                  <CreditCard className="w-4 h-4" />
                  <h4 className="font-bold uppercase text-[10px] tracking-widest">Pago y Atención</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Método:</span>
                    <span className="font-bold text-gray-700">{getPaymentMethodLabel(sale.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Atendido por:</span>
                    <span className="font-bold text-gray-700 truncate ml-2">{sale.employeeName || 'Personal'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Doc. Empleado:</span>
                    <span className="font-mono text-gray-600 text-xs">{sale.employeeId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className={`rounded-2xl p-5 border shadow-sm flex flex-col items-center justify-center ${
                sale.status === 'completed' 
                ? 'bg-green-50/50 border-green-100 text-green-600' 
                : 'bg-red-50/50 border-red-100 text-red-600'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  sale.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {sale.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                </div>
                <span className="font-black uppercase text-[10px] tracking-[0.2em]">
                  {sale.status === 'completed' ? 'Venta Exitosa' : 'Venta Anulada'}
                </span>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-gray-700 text-sm flex items-center space-x-2">
                  <Scissors className="w-4 h-4 text-pink-400" />
                  <span>Servicios y Productos</span>
                </h4>
                <span className="text-[10px] font-black bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full uppercase">
                  {sale.services?.length || 0} ítems
                </span>
              </div>
              
              <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Nombre del Servicio</th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sale.services?.map((service, index) => (
                      <tr key={index} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">{service.name || 'Servicio'}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                          ${(service.totalPrice || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section: Observations and Totals */}
            <div className="grid md:grid-cols-2 gap-6 pb-4">
              {/* Observations */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-blue-500">
                  <FileText className="w-4 h-4" />
                  <h4 className="font-bold text-[10px] uppercase tracking-widest">Observaciones</h4>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm min-h-[120px]">
                  <p className="text-gray-600 text-sm italic leading-relaxed">
                    {sale.notes || 'Sin observaciones adicionales.'}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-green-50 rounded-3xl p-8 border border-green-100 shadow-sm flex flex-col justify-center min-h-[160px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-green-700/70">Subtotal</span>
                    <span className="font-bold text-lg text-green-600">${(sale.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {(sale.discount || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-green-700/70">Descuento</span>
                      <span className="font-bold text-lg text-green-600">-${(sale.discount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-6 mt-2 border-t border-green-200 flex justify-between items-center px-2">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-green-800">Total</span>
                    <span className="font-bold text-lg text-green-600">
                      ${(sale.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-5 bg-white border-t border-gray-100 flex flex-wrap gap-3 justify-end shrink-0 z-20">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl font-black text-gray-500 hover:bg-gray-200 hover:text-gray-800 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
