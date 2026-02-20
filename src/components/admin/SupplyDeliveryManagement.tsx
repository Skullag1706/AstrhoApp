import React, { useState, useEffect } from 'react';
import { 
  Send, Plus, Calendar, Filter, Search, CheckCircle, Clock, 
  X, Save, AlertCircle, Package, User, MapPin, FileText, Eye, Edit, Ban, Trash2
} from 'lucide-react';
import { mockSupplyDeliveries, mockSupplies, mockUsers } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface SupplyDeliveryManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function SupplyDeliveryManagement({ hasPermission }: SupplyDeliveryManagementProps) {
  const [deliveries, setDeliveries] = useState(mockSupplyDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsible, setFilterResponsible] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deliveryToCancel, setDeliveryToCancel] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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
    const supply = mockSupplies.find(s => s.id === delivery.supplyId);
    const responsible = mockUsers.find(u => u.id === delivery.responsibleId);
    
    const matchesSearch = supply?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         responsible?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    const matchesResponsible = filterResponsible === 'all' || delivery.responsibleId === parseInt(filterResponsible);
    const matchesDate = !dateRange.start || delivery.deliveryDate >= dateRange.start;
    
    return matchesSearch && matchesStatus && matchesResponsible && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const getSupplyInfo = (supplyId) => {
    return mockSupplies.find(s => s.id === supplyId);
  };

  const getUserInfo = (userId) => {
    return mockUsers.find(u => u.id === userId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleViewDetail = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailModal(true);
  };

  const handleEditDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowEditModal(true);
  };

  const handleCancelDelivery = (delivery) => {
    setDeliveryToCancel(delivery);
    setShowCancelModal(true);
  };

  const confirmCancelDelivery = () => {
    if (deliveryToCancel) {
      updateDeliveryStatus(deliveryToCancel.id, 'cancelled');
      setShowCancelModal(false);
      setDeliveryToCancel(null);
      setAlertMessage('Entrega cancelada exitosamente');
      setShowSuccessAlert(true);
    }
  };

  const handleCreateDelivery = () => {
    setShowCreateModal(true);
  };

  const handleSaveDelivery = (deliveryData) => {
    const newDelivery = {
      id: Math.max(...deliveries.map(d => d.id)) + 1,
      ...deliveryData,
      status: 'pending',
      createdBy: 1, // Current user
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDeliveries([...deliveries, newDelivery]);
    setShowCreateModal(false);
    setAlertMessage('Entrega creada exitosamente');
    setShowSuccessAlert(true);
  };

  const updateDeliveryStatus = (deliveryId, newStatus) => {
    setDeliveries(deliveries.map(delivery => 
      delivery.id === deliveryId 
        ? { 
            ...delivery, 
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
          }
        : delivery
    ));
  };

  const handlePrintDeliveryPDF = (delivery) => {
    const supply = getSupplyInfo(delivery.supplyId);
    const responsible = getUserInfo(delivery.responsibleId);
    
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
              <strong>Fecha:</strong> ${delivery.deliveryDate}
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Estado:</strong> 
            <span style="padding: 4px 12px; border-radius: 20px; background-color: ${
              delivery.status === 'completed' ? '#d4edda' :
              delivery.status === 'pending' ? '#fff3cd' : '#f8d7da'
            }; color: ${
              delivery.status === 'completed' ? '#155724' :
              delivery.status === 'pending' ? '#856404' : '#721c24'
            };">
              ${getStatusLabel(delivery.status)}
            </span>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
          <h3 style="color: #333; margin-top: 0;">Responsable</h3>
          <p><strong>Nombre:</strong> ${responsible?.name}</p>
          <p><strong>Rol:</strong> ${responsible?.role === 'admin' ? 'Administrador' : 'Asistente'}</p>
          <p><strong>Email:</strong> ${responsible?.email}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333;">Detalle de los Productos</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e91e63; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Producto</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">SKU</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Cantidad</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Unidad</th>
              </tr>
            </thead>
            <tbody>
              ${delivery.items ? delivery.items.map(item => {
                const product = mockSupplies.find(s => s.id === item.supplyId);
                return `<tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${product?.name}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${product?.sku}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${item.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${product?.unit}</td>
                </tr>`;
              }).join('') : `<tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${supply?.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${supply?.sku}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold;">${delivery.quantity}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${supply?.unit}</td>
              </tr>`}
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
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;
  const completedDeliveries = deliveries.filter(d => d.status === 'completed').length;
  const todayDeliveries = deliveries.filter(d => d.deliveryDate === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Entregas de insumo</h2>
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
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Productos</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Fecha</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDeliveries.map((delivery) => {
                const supply = getSupplyInfo(delivery.supplyId);
                const responsible = getUserInfo(delivery.responsibleId);
                
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
                        {/* Dropdown de productos */}
                        <details className="group">
                          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-purple-600 list-none flex items-center space-x-2">
                            <span>{delivery.items ? `${delivery.items.length} producto${delivery.items.length > 1 ? 's' : ''}` : '1 producto'}</span>
                            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-purple-200">
                            {delivery.items ? delivery.items.map((item, idx) => {
                              const prod = getSupplyInfo(item.supplyId);
                              return (
                                <div key={idx} className="text-sm text-gray-600">
                                  • {prod?.name}: {item.quantity} {prod?.unit}
                                </div>
                              );
                            }) : (
                              <div className="text-sm text-gray-600">
                                • {supply?.name}: {delivery.quantity} {supply?.unit}
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-gray-800">{delivery.deliveryDate}</div>
                      {delivery.completedAt && (
                        <div className="text-sm text-green-600">
                          Completado: {delivery.completedAt}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {/* Select de cambio de estado */}
                      <div className="flex items-center space-x-2">
                        {hasPermission('manage_deliveries') && delivery.status !== 'completed' && delivery.status !== 'cancelled' ? (
                          <select
                            value={delivery.status}
                            onChange={(e) => {
                              updateDeliveryStatus(delivery.id, e.target.value);
                              if (e.target.value === 'completed') {
                                setAlertMessage('Entrega completada exitosamente');
                                setShowSuccessAlert(true);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-pink-300 ${getStatusColor(delivery.status)}`}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="completed">Completado</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                            {getStatusLabel(delivery.status)}
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
                        
                        {hasPermission('manage_deliveries') && delivery.status !== 'cancelled' && delivery.status !== 'completed' && (
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
                        {getSupplyInfo(deliveryToCancel.supplyId)?.name || 'Insumo'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Cantidad: {deliveryToCancel.quantity} {getSupplyInfo(deliveryToCancel.supplyId)?.unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        Destino: {deliveryToCancel.destination}
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
          supplies={mockSupplies}
          users={mockUsers.filter(u => u.role !== 'customer')}
        />
      )}

      {/* Delivery Detail Modal */}
      {showDetailModal && selectedDelivery && (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          onClose={() => setShowDetailModal(false)}
          supply={getSupplyInfo(selectedDelivery.supplyId)}
          responsible={getUserInfo(selectedDelivery.responsibleId)}
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

// Create Delivery Modal Component - MÚLTIPLES PRODUCTOS
function CreateDeliveryModal({ onClose, onSave, supplies, users }) {
  const [formData, setFormData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    responsibleId: '',
    notes: '',
    items: []
  });

  const [errors, setErrors] = useState({});

  const addProduct = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        supplyId: '',
        quantity: ''
      }]
    });
  };

  const removeProduct = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const updateProduct = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (formData.items.length === 0) {
      newErrors.items = 'Agrega al menos un producto';
    }
    if (!formData.responsibleId) newErrors.responsibleId = 'Selecciona un responsable';

    // Validar cada producto
    formData.items.forEach((item, index) => {
      if (!item.supplyId) {
        newErrors[`supply_${index}`] = 'Selecciona un producto';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'Cantidad debe ser mayor a 0';
      }
      
      // Check stock
      const supply = supplies.find(s => s.id === parseInt(item.supplyId));
      if (supply && parseInt(item.quantity) > supply.quantity) {
        newErrors[`quantity_${index}`] = `Stock insuficiente. Disponible: ${supply.quantity}`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const responsible = users.find(u => u.id === parseInt(formData.responsibleId));
    
    onSave({
      ...formData,
      responsibleId: parseInt(formData.responsibleId),
      responsiblePerson: responsible?.name,
      destination: 'Salón de Belleza',
      items: formData.items.map(item => ({
        supplyId: parseInt(item.supplyId),
        quantity: parseInt(item.quantity)
      }))
    });
  };

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
                Productos *
              </label>
              <button
                type="button"
                onClick={addProduct}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No hay productos agregados</p>
                <button
                  type="button"
                  onClick={addProduct}
                  className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Agregar Primer Producto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const selectedSupply = supplies.find(s => s.id === parseInt(item.supplyId));
                  
                  return (
                    <div key={index} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="grid md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Producto *
                          </label>
                          <select
                            value={item.supplyId}
                            onChange={(e) => updateProduct(index, 'supplyId', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                              errors[`supply_${index}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Selecciona un producto</option>
                            {supplies.filter(s => s.status === 'active' && s.quantity > 0).map(supply => (
                              <option key={supply.id} value={supply.id}>
                                {supply.name} - Stock: {supply.quantity} {supply.unit}
                              </option>
                            ))}
                          </select>
                          {selectedSupply && (
                            <div className="text-xs text-gray-600 mt-1">
                              Disponible: {selectedSupply.quantity} {selectedSupply.unit}
                            </div>
                          )}
                          {errors[`supply_${index}`] && (
                            <p className="text-red-600 text-xs mt-1">{errors[`supply_${index}`]}</p>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                              min="1"
                              max={selectedSupply?.quantity || 999}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                                errors[`quantity_${index}`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="0"
                            />
                            {errors[`quantity_${index}`] && (
                              <p className="text-red-600 text-xs mt-1">{errors[`quantity_${index}`]}</p>
                            )}
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
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
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.responsibleId ? 'border-red-300' : 'border-gray-300'
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
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Crear Entrega</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delivery Detail Modal Component - MENOS ESPACIADO
function DeliveryDetailModal({ delivery, onClose, supply, responsible, getSupplyInfo }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
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
            <span className={`px-4 py-2 rounded-full font-semibold border ${getStatusColor(delivery.status)}`}>
              {getStatusLabel(delivery.status)}
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
              <p className="font-semibold text-gray-800">{delivery.deliveryDate}</p>
            </div>
            {delivery.completedAt && (
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-600">Completado</span>
                <p className="font-semibold text-green-600">{delivery.completedAt}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-600">Creado</span>
              <p className="font-semibold text-gray-800">{delivery.createdAt}</p>
            </div>
          </div>

          {/* Productos - Tabla compacta */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3">Productos Entregados</h4>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Producto</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">SKU</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold text-gray-800">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.items ? delivery.items.map((item, idx) => {
                    const prod = getSupplyInfo(item.supplyId);
                    return (
                      <tr key={idx} className="border-t border-blue-100">
                        <td className="px-4 py-2 text-sm text-gray-800">{prod?.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{prod?.sku}</td>
                        <td className="px-4 py-2 text-center text-sm font-semibold text-purple-600">
                          {item.quantity} {prod?.unit}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-800">{supply?.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{supply?.sku}</td>
                      <td className="px-4 py-2 text-center text-sm font-semibold text-purple-600">
                        {delivery.quantity} {supply?.unit}
                      </td>
                    </tr>
                  )}
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