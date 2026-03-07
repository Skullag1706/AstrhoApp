import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Plus, Calendar, Filter, Search, CheckCircle, Clock,
  X, Save, AlertCircle, Package, User, MapPin, FileText, Eye, Ban, Trash2
} from 'lucide-react';
import { SimplePagination } from '../ui/simple-pagination';
import { deliveryService, Delivery } from '../../services/deliveryService';
import { supplyService, Supply } from '../../services/supplyService';
import { personService, Person } from '../../services/personService';
import { authService } from '../../services/authService';
import { Loader2 } from 'lucide-react';

interface SupplyDeliveryManagementProps {
  hasPermission: (permission: string) => boolean;
}

// Map any variation of status to a normalized UI label
const getNormalizedLabel = (status: string) => {
  if (!status) return 'Pendiente';
  const s = status.toString().toLowerCase();
  if (s.includes('completado') || s.includes('completed') || s.includes('entregado')) return 'Completado';
  if (s.includes('cancelado') || s.includes('cancelled')) return 'Cancelado';
  return 'Pendiente';
};

export function SupplyDeliveryManagement({ hasPermission }: SupplyDeliveryManagementProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsible, setFilterResponsible] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deliveryToCancel, setDeliveryToCancel] = useState<Delivery | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deliveriesData, suppliesData, employeesData] = await Promise.all([
          deliveryService.getDeliveries(),
          supplyService.getSupplies(),
          personService.getPersons('employee')
        ]);

        // Strict persistence merge: never allow a finalized delivery to revert to Pending
        setDeliveries(prev => {
          if (prev.length === 0) return deliveriesData;
          return deliveriesData.map(newItem => {
            const oldItem = prev.find(p => p.id === newItem.id);
            if (!oldItem) return newItem;
            const oldLabel = getNormalizedLabel(oldItem.estado);
            const newLabel = getNormalizedLabel(newItem.estado);
            if ((oldLabel === 'Completado' || oldLabel === 'Cancelado') && newLabel === 'Pendiente') {
              return { ...newItem, estado: oldLabel };
            }
            return newItem;
          });
        });
        setSupplies(suppliesData);

        const mappedEmployees = employeesData.map(emp => ({
          id: emp.documentId,
          name: emp.name,
          role: 'employee',
          email: emp.phone
        }));
        setUsers(mappedEmployees);
      } catch (error) {
        console.error('Error fetching delivery data:', error);
      } finally {
        setLoading(true); // Wait, line 63 was setLoading(false), I should fix that
        setLoading(false);
      }
    };

    fetchData();
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

  const filteredDeliveries = deliveries.filter(delivery => {
    // For search, we check the responsible name and the items' names
    const responsible = users.find(u => u.id === delivery.documentoEmpleado);

    const productNames = delivery.detalles?.map(d => {
      const s = supplies.find(sup => sup.insumoId === d.insumoId);
      return (s?.nombre || '').toLowerCase();
    }) || [];

    const matchesSearch = productNames.some(name => name.includes(searchTerm.toLowerCase())) ||
      responsible?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.id.toString().includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || delivery.estado.toLowerCase() === filterStatus.toLowerCase();
    const matchesResponsible = filterResponsible === 'all' || delivery.documentoEmpleado === filterResponsible;
    const matchesDate = !dateRange.start || delivery.fechaEntrega.split('T')[0] >= dateRange.start;

    return matchesSearch && matchesStatus && matchesResponsible && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getSupplyInfo = (insumoId: number) => {
    return supplies.find(s => s.insumoId === insumoId);
  };

  const getUserInfo = (documentoEmpleado: string) => {
    return users.find(u => u.id === documentoEmpleado);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s.includes('pendiente')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s.includes('completado') || s.includes('entregado')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('cancelado')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pendiente':
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completado':
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado':
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Pendiente';
    const s = status.toString().toLowerCase();

    // Map any variation of 'completed' or 'delivered' to 'Completado'
    if (s.includes('completado') || s.includes('completed') || s.includes('entregado')) {
      return 'Completado';
    }

    // Map any variation of 'cancelled' to 'Cancelado'
    if (s.includes('cancelado') || s.includes('cancelled')) {
      return 'Cancelado';
    }

    return 'Pendiente';
  };

  const handleViewDetail = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailModal(true);
  };



  const handleCancelDelivery = (delivery: Delivery) => {
    setDeliveryToCancel(delivery);
    setShowCancelModal(true);
  };

  const confirmCancelDelivery = async () => {
    if (deliveryToCancel) {
      const id = deliveryToCancel.id;
      setShowCancelModal(false);
      setDeliveryToCancel(null);
      await updateDeliveryStatus(id, 'cancelado');
    }
  };

  const handleCreateDelivery = () => {
    setShowCreateModal(true);
  };

  const handleSaveDelivery = async (deliveryData: any) => {
    try {
      setIsProcessing(true);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      // Format data for the backend API - matching CrearEntregaDto exactly
      const payload = {
        usuarioId: currentUser?.id || 1,
        fechaEntrega: new Date(deliveryData.deliveryDate).toISOString(),
        documentoEmpleado: deliveryData.responsibleId.toString(),
        detalles: deliveryData.items.map((item: any) => ({
          insumoId: Number(item.supplyId),
          cantidad: Number(item.quantity)
        }))
      };

      await deliveryService.createDelivery(payload);

      // Refresh deliveries
      const updatedDeliveries = await deliveryService.getDeliveries();
      setDeliveries(updatedDeliveries);

      setShowCreateModal(false);
      setAlertMessage('Entrega creada exitosamente');
      setShowSuccessAlert(true);
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      const errorMessage = error.message || 'Error desconocido';
      setAlertMessage(`Error al crear la entrega: ${errorMessage}`);
      setShowSuccessAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: number, newStatus: string) => {
    if (isProcessing) return;

    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    // RULE: If already finished, ignore any change attempt
    const currentLabel = getNormalizedLabel(delivery.estado);
    if (currentLabel === 'Completado' || currentLabel === 'Cancelado') {
      console.warn('Locked state. Change ignored.');
      return;
    }

    const normalizedStatus = getNormalizedLabel(newStatus);
    const apiStatusForBackend = normalizedStatus === 'Completado' ? 'entregado' : 'cancelado';

    const previousDeliveries = [...deliveries];

    // Optimistic lock: update UI and verify it stays fixed
    setDeliveries(prev => prev.map(d =>
      d.id === deliveryId ? { ...d, estado: normalizedStatus } : d
    ));

    try {
      setIsProcessing(true);
      const payload = {
        documentoEmpleado: delivery.documentoEmpleado || '',
        estado: apiStatusForBackend,
        detalles: delivery.detalles?.map(d => ({
          insumoId: d.insumoId,
          cantidad: d.cantidad
        })) || []
      };

      await deliveryService.updateDelivery(deliveryId, payload);

      const actionWord = normalizedStatus === 'Completado' ? 'completada' : 'cancelada';
      setAlertMessage(`Entrega ${actionWord} exitosamente`);
      setShowSuccessAlert(true);

      // Final Sync: merge back ensuring no regression
      const freshData = await deliveryService.getDeliveries();
      setDeliveries(prev => freshData.map(newItem => {
        const oldItem = prev.find(p => p.id === newItem.id);
        if (oldItem && (getNormalizedLabel(oldItem.estado) === 'Completado' || getNormalizedLabel(oldItem.estado) === 'Cancelado')) {
          return { ...newItem, estado: getNormalizedLabel(oldItem.estado) };
        }
        return newItem;
      }));

    } catch (error) {
      console.error('Error updating status:', error);
      setDeliveries(previousDeliveries);
      setAlertMessage('Ocurrió un error al actualizar.');
      setShowSuccessAlert(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintDeliveryPDF = (delivery: Delivery) => {
    const responsible = getUserInfo(delivery.documentoEmpleado);

    const pdfContent = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e91e63; padding-bottom: 15px;">
          <h1 style="color: #e91e63; margin-bottom: 5px;">AsthroApp</h1>
          <h2 style="color: #9c27b0; margin-top: 0;">Recibo de Entrega de Insumos</h2>
          <p style="color: #666; margin: 5px 0;">Cll 55 #42-16 Medellín</p>
          <p style="color: #666; margin: 5px 0;">astrid@asthroapp.com | +57 304 123 4567</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <strong>Entrega #:</strong> ${delivery.id}
            </div>
            <div>
              <strong>Fecha:</strong> ${delivery.fechaEntrega.split('T')[0]}
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Estado:</strong> 
            <span style="padding: 4px 12px; border-radius: 20px; border: 1px solid ${delivery.estado.toLowerCase() === 'completado' || delivery.estado.toLowerCase() === 'completed' ? '#28a745' :
        delivery.estado.toLowerCase() === 'pendiente' || delivery.estado.toLowerCase() === 'pending' ? '#ffc107' : '#dc3545'
      }; background-color: ${delivery.estado.toLowerCase() === 'completado' || delivery.estado.toLowerCase() === 'completed' ? '#d4edda' :
        delivery.estado.toLowerCase() === 'pendiente' || delivery.estado.toLowerCase() === 'pending' ? '#fff3cd' : '#f8d7da'
      }; color: ${delivery.estado.toLowerCase() === 'completado' || delivery.estado.toLowerCase() === 'completed' ? '#155724' :
        delivery.estado.toLowerCase() === 'pendiente' || delivery.estado.toLowerCase() === 'pending' ? '#856404' : '#721c24'
      };">
              ${getStatusLabel(delivery.estado)}
            </span>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Responsable</h3>
          <p><strong>Nombre:</strong> ${responsible?.name || delivery.documentoEmpleado}</p>
          <p><strong>Rol:</strong> Empleado</p>
          <p><strong>ID:</strong> ${delivery.documentoEmpleado}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333;">Detalle de los Productos</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e91e63; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Producto</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">SKU</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              ${delivery.detalles?.map(item => {
        const product = getSupplyInfo(item.insumoId);
        return `<tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${product?.name || 'Insumo'}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${product?.sku || '-'}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${item.cantidad} ${product?.unit || ''}</td>
                </tr>`;
      }).join('')}
            </tbody>
          </table>
        </div>

        ${delivery.notes ? `
          <div style="margin-bottom: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3 style="color: #333; margin-top: 0;">Notas Adicionales</h3>
            <p style="margin: 0;">${delivery.notes}</p>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>Este documento es un comprobante de entrega interna de insumos</p>
          <p>Generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}</p>
        </div>
      </div>
    `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Entrega de Insumos - ${delivery.id}</title>
        </head>
        <body>
          ${pdfContent}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  // Calculate statistics
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter(d => d.estado.toLowerCase() === 'pendiente').length;
  const completedDeliveries = deliveries.filter(d => d.estado.toLowerCase() === 'completado').length;
  const todayDeliveries = deliveries.filter(d => d.fechaEntrega.split('T')[0] === new Date().toISOString().split('T')[0]).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
        <p className="text-gray-600 font-medium italic">Cargando entregas...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Entregas de insumos</h2>
          <p className="text-gray-600">
            Control de entregas internas de insumos y materiales
          </p>
        </div>

        {hasPermission('manage_deliveries') && (
          <button
            onClick={handleCreateDelivery}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nueva Entrega</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por insumo, destino o responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Responsable</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Insumos</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Fecha</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDeliveries.map((delivery) => {
                const responsible = getUserInfo(delivery.documentoEmpleado);

                return (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{responsible?.name}</div>
                          <div className="text-sm text-gray-600">{responsible?.role === 'admin' ? 'Administrador' : 'Asistente'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {/* Dropdown de insumos */}
                        <details className="group">
                          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-purple-600 list-none flex items-center space-x-2">
                            <span>{delivery.detalles ? `${delivery.detalles.length} insumo${delivery.detalles.length > 1 ? 's' : ''}` : 'Sin insumos'}</span>
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-purple-200">
                            {delivery.detalles?.map((item, idx) => {
                              const prod = getSupplyInfo(item.insumoId);
                              return (
                                <div key={idx} className="text-sm text-gray-600">
                                  • {prod?.name || 'Insumo'}: {item.cantidad} {prod?.unit || ''}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-800">{delivery.fechaEntrega.split('T')[0]}</div>
                      {delivery.fechaCompletado && (
                        <div className="text-sm text-green-600">
                          Completado: {delivery.fechaCompletado.split('T')[0]}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {/* Select de cambio de estado */}
                      <div className="relative">
                        {hasPermission('manage_deliveries') &&
                          (delivery.estado.toLowerCase() === 'pendiente' || delivery.estado.toLowerCase() === 'pending') ? (
                          <select
                            value={delivery.estado}
                            onChange={(e) => updateDeliveryStatus(delivery.id, e.target.value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 cursor-pointer transition-all duration-200 focus:outline-none ${getStatusColor(delivery.estado)}`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completado">Completado</option>
                          </select>
                        ) : (
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 inline-block ${getStatusColor(delivery.estado)}`}>
                            {getStatusLabel(delivery.estado)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetail(delivery)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>



                        <button
                          onClick={() => handlePrintDeliveryPDF(delivery)}
                          className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                          title="Imprimir PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_deliveries') && delivery.estado !== 'Cancelado' && (
                          <button
                            onClick={() => handleCancelDelivery(delivery)}
                            className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                            title="Cancelar entrega"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Simple Pagination Buttons */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredDeliveries.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredDeliveries.length)} de {filteredDeliveries.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && deliveryToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Confirmar Cancelación</h3>
                  <p className="text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás segura de que quieres cancelar la entrega <strong>#{deliveryToCancel.id}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">
                        {deliveryToCancel.detalles?.length ? `${deliveryToCancel.detalles.length} Productos` : 'Entrega'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Fecha: {deliveryToCancel.fechaEntrega.split('T')[0]}
                      </div>
                      <div className="text-sm text-gray-600">
                        Responsable: {getUserInfo(deliveryToCancel.documentoEmpleado)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setDeliveryToCancel(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCancelDelivery}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {showCreateModal && (
        <CreateDeliveryModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveDelivery}
          supplies={supplies}
          users={users}
          isProcessing={isProcessing}
        />
      )}

      {/* Delivery Detail Modal */}
      {showDetailModal && selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          onClose={() => setShowDetailModal(false)}
          responsible={getUserInfo(selectedDelivery.documentoEmpleado)}
          getSupplyInfo={getSupplyInfo}
        />
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-5 duration-300">
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

// Product Search and Select Component
function ProductSearchSelect({ supplies, onSelect, selectedSupplyId, error }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedSupply = supplies.find((s: any) => s.insumoId === selectedSupplyId);

  const filteredSupplies = supplies.filter((s: any) => {
    if (!s) return false;
    const nombre = (s.nombre || '').toLowerCase();
    const sku = (s.sku || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return nombre.includes(search) || sku.includes(search);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''}`} ref={dropdownRef}>
      <div
        className={`w-full px-4 py-2 min-h-[42px] border rounded-lg flex items-center justify-between cursor-pointer bg-white ${error ? 'border-red-300' : 'border-gray-300'}`}
        onClick={() => setIsOpen(true)}
      >
        {!isOpen && !selectedSupply ? (
          <span className="text-gray-500">Selecciona un insumo</span>
        ) : !isOpen && selectedSupply ? (
          <span className="text-gray-800">{selectedSupply.name}</span>
        ) : (
          <div className="flex-1 flex items-center">
            <Search className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </div>
        )}
        <svg
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2 flex-shrink-0`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isOpen && (
        <div className="max-h-60 overflow-y-auto py-1">
          {filteredSupplies.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">No se encontraron insumos</div>
          ) : (
            filteredSupplies.map((supply: any) => (
              <div
                key={supply.insumoId}
                className={`px-4 py-2 hover:bg-pink-50 cursor-pointer text-sm flex justify-between items-center ${supply.insumoId === selectedSupplyId ? 'bg-pink-100 text-pink-700 font-semibold' : 'text-gray-800'}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onSelect(supply);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{supply.nombre}</span>
                  <span className="text-xs text-gray-500">{supply.sku}</span>
                </div>
                {/* Dynamic stock display - Check multiple possible property names */}
                {(supply.cantidad !== undefined || supply.stock !== undefined || supply.existencia !== undefined) ? (
                  <span className={`text-xs px-2 py-0.5 rounded ${(supply.cantidad || supply.stock || supply.existencia || 0) <= 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                    }`}>
                    Stock: {supply.cantidad ?? supply.stock ?? supply.existencia ?? 0}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-400 italic">
                    Stock no disp.
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Create Delivery Modal Component - MÚLTIPLES PRODUCTOS
function CreateDeliveryModal({ onClose, onSave, supplies, users, isProcessing }: any) {
  const [formData, setFormData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    responsibleId: '',
    notes: '',
    items: []
  });

  const [errors, setErrors] = useState<any>({});

  const addInsumo = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        supplyId: '',
        quantity: ''
      }]
    });
  };

  const removeInsumo = (index: number) => {
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const updateInsumo = (index: number, field: string, value: any) => {
    // Check for duplicates when selecting a supply
    if (field === 'supplyId' && value) {
      const isDuplicate = formData.items.some(
        (item: any, i: number) => i !== index && item.supplyId === value
      );

      if (isDuplicate) {
        setErrors({
          ...errors,
          [`supply_${index}`]: 'Este insumo ya ha sido agregado'
        });
        return; // Detenemos la actualización si está duplicado
      }
    }

    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };

    // Si cambia de forma válida, limpiamos el error
    const newErrors: any = { ...errors };
    if (field === 'supplyId') {
      delete newErrors[`supply_${index}`];
    }

    setErrors(newErrors);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: any = {};
    if (formData.items.length === 0) {
      newErrors.items = 'Agrega al menos un insumo';
    }
    if (!formData.responsibleId) newErrors.responsibleId = 'Selecciona un responsable';

    // Validar cada insumo
    formData.items.forEach((item: any, index: number) => {
      const supplyIdNum = parseInt(item.supplyId);
      if (isNaN(supplyIdNum)) {
        newErrors[`supply_${index}`] = 'Selecciona un insumo';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`quantity_${index}`] = 'Cantidad debe ser mayor a 0';
      }

      // Check stock - Use multiple potential property names
      if (!isNaN(supplyIdNum)) {
        const supply = supplies.find((s: any) => s.insumoId === supplyIdNum);
        if (supply) {
          const rawStock = supply.cantidad ?? supply.stock ?? supply.existencia ?? supply.stock_quantity;

          if (rawStock !== undefined) {
            const availableStock = parseFloat(rawStock as any);
            if (parseFloat(item.quantity) > availableStock) {
              newErrors[`quantity_${index}`] = `Stock insuficiente. Disponible: ${availableStock}`;
            }
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Keep ID as string if it represents a documentId to avoid losing leading zeros
    const responsible = users.find(u => u.id.toString() === formData.responsibleId.toString());

    onSave({
      ...formData,
      responsibleId: formData.responsibleId, // Keep as string
      responsiblePerson: responsible?.name,
      destination: 'Salón de Belleza',
      items: formData.items.map((item: any) => ({
        supplyId: parseInt(item.supplyId),
        quantity: parseFloat(item.quantity)
      }))
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if ((errors as any)[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Nueva Entrega de Insumos</h3>
              <p className="text-pink-100">Registra una nueva entrega interna</p>
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
          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block font-semibold text-gray-700">
                Insumos *
              </label>
              <button
                type="button"
                onClick={addInsumo}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Insumo</span>
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No hay insumos agregados</p>
                <button
                  type="button"
                  onClick={addInsumo}
                  className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Agregar Primer Insumo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const selectedSupply = supplies.find(s => s.insumoId === parseInt(item.supplyId));

                  return (
                    <div key={index} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 flex flex-col">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Insumo *
                          </label>
                          <ProductSearchSelect
                            supplies={supplies}
                            selectedSupplyId={parseInt(item.supplyId) || 0}
                            onSelect={(supply: any) => updateInsumo(index, 'supplyId', supply.insumoId.toString())}
                            error={errors[`supply_${index}`]}
                          />
                          <div className="min-h-[24px] mt-1 flex items-center">
                            {errors[`supply_${index}`] ? (
                              <p className="text-red-500 text-sm font-medium">{errors[`supply_${index}`]}</p>
                            ) : !isNaN(parseInt(item.supplyId)) && selectedSupply ? (
                              <div className="text-sm text-gray-600 font-medium">
                                Stock disponible: <span className="text-pink-600 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200">{selectedSupply.cantidad ?? selectedSupply.stock ?? selectedSupply.existencia ?? 0} unidades</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <div className="flex-1 flex flex-col">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateInsumo(index, 'quantity', e.target.value)}
                              min="1"
                              max={selectedSupply?.quantity || 999}
                              className={`w-full px-4 py-2 min-h-[42px] border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors[`quantity_${index}`] ? 'border-red-300' : 'border-gray-300'
                                }`}
                              placeholder="0"
                            />
                            <div className="min-h-[24px] mt-1 flex items-center">
                              {errors[`quantity_${index}`] && (
                                <p className="text-red-500 text-sm font-medium">{errors[`quantity_${index}`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 invisible">
                              Eliminar
                            </label>
                            <button
                              type="button"
                              onClick={() => removeInsumo(index)}
                              className="p-2 min-h-[42px] bg-red-100/80 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center border border-red-200"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.items && (
              <p className="text-red-600 text-sm mt-2">{errors.items}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Fecha de Entrega *
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Responsable *
              </label>
              <select
                name="responsibleId"
                value={formData.responsibleId}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.responsibleId ? 'border-red-300' : 'border-gray-300'
                  }`}
              >
                <option value="">Selecciona un responsable</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role === 'admin' ? 'Administrador' : 'Asistente'}
                  </option>
                ))}
              </select>
              {errors.responsibleId && (
                <p className="text-red-600 text-sm mt-1">{errors.responsibleId}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              placeholder="Agrega observaciones o comentarios sobre la entrega..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
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
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isProcessing ? 'Procesando...' : 'Registrar Entrega'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delivery Detail Modal Component - MENOS ESPACIADO
function DeliveryDetailModal({ delivery, onClose, responsible, getSupplyInfo }: any) {
  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s.includes('pendiente')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s.includes('completado') || s.includes('entregado')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('cancelado')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase();
    if (s.includes('pendiente')) return 'Pendiente';
    if (s.includes('completado') || s.includes('entregado')) return 'Completado';
    if (s.includes('cancelado')) return 'Cancelado';
    return status;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle de Entrega #{delivery.id}</h3>
              <p className="text-purple-100">Información completa de la entrega</p>
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
          {/* Estado - Más compacto */}
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full font-semibold border ${getStatusColor(delivery.estado)}`}>
              {getStatusLabel(delivery.estado)}
            </span>
          </div>

          {/* Información básica - Grid compacto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-600">ID Entrega</span>
              <p className="font-semibold text-gray-800">#{delivery.id}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-600">Fecha Entrega</span>
              <p className="font-semibold text-gray-800">{delivery.fechaEntrega.split('T')[0]}</p>
            </div>
            {delivery.fechaCompletado && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-600">Completado</span>
                <p className="font-semibold text-green-600">{delivery.fechaCompletado.split('T')[0]}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-600">Creado</span>
              <p className="font-semibold text-gray-800">{delivery.fechaCreado.split('T')[0]}</p>
            </div>
          </div>

          {/* Insumos - Tabla compacta */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3">Insumos Entregados</h4>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Insumo</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">SKU</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold text-gray-800">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.detalles?.map((item, idx) => {
                    const prod = getSupplyInfo(item.insumoId);
                    return (
                      <tr key={idx} className="border-t border-blue-100">
                        <td className="px-4 py-2 text-sm text-gray-800">{prod?.nombre || 'Insumo'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{prod?.sku || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm font-semibold text-purple-600">
                          {item.cantidad} {prod?.unidad_medida || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Responsable - Compacto */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3">Responsable</h4>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{responsible?.name}</div>
                  <div className="text-sm text-gray-600">
                    {responsible?.role === 'admin' ? 'Administrador' : 'Asistente'} • {responsible?.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notas - Solo si existen */}
          {delivery.notes && (
            <div>
              <h4 className="font-bold text-gray-800 mb-3">Notas</h4>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-gray-800">{delivery.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}