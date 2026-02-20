import React, { useState } from 'react';
import { 
  DollarSign, Plus, Search, Filter, Eye, X, Calendar,
  CreditCard, TrendingUp, Users,
  Ban, FileText, Scissors,
  AlertCircle, Save
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockSales, mockUsers, mockProducts, mockServices, mockAppointments } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface SalesManagementProps {
  hasPermission: (permission: string) => boolean;
  currentUser: any;
}

export function SalesManagement({ hasPermission, currentUser }: SalesManagementProps) {
  const [sales, setSales] = useState(mockSales);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setCancelModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter sales based on search and filters
  const filteredSales = sales.filter(sale => {
    const customer = mockUsers.find(u => u.id === sale.customerId);
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchesDate = !filterDate || sale.date === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
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

  const getCustomerInfo = (customerId) => {
    return mockUsers.find(u => u.id === customerId);
  };

  const getEmployeeInfo = (employeeId) => {
    return mockUsers.find(u => u.id === employeeId);
  };

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

  const confirmCancelSale = () => {
    if (saleToCancel) {
      setSales(sales.map(sale => 
        sale.id === saleToCancel.id 
          ? { ...sale, status: 'refunded', updatedAt: new Date().toISOString().split('T')[0] }
          : sale
      ));
      toast.success(`Venta ${saleToCancel.id} anulada correctamente`);
      setCancelModal(false);
      setSaleToCancel(null);
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
    const customer = getCustomerInfo(sale.customerId);
    const employee = getEmployeeInfo(sale.employeeId);
    
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
          <p><strong>Cliente:</strong> ${customer?.name}</p>
          <p><strong>Empleado:</strong> ${employee?.name}</p>
        </div>
        
        ${sale.services && sale.services.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">SERVICIOS:</h4>
            ${sale.services.map(service => {
              const serviceInfo = mockServices.find(s => s.id === service.serviceId);
              return `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${serviceInfo?.name}</span>
                <span>$${service.totalPrice.toLocaleString()}</span>
              </div>`;
            }).join('')}
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>$${sale.subtotal.toLocaleString()}</span>
          </div>
          ${sale.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Descuento:</span>
              <span style="color: #e91e63;">-$${sale.discount.toLocaleString()}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>$${sale.total.toLocaleString()}</span>
          </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 12px; color: #666;">
          <p><strong>Método de Pago:</strong> ${
            sale.paymentMethod === 'cash' ? 'Efectivo' :
            sale.paymentMethod === 'transfer' ? 'Transferencia' : 'Otro'
          }</p>
          ${sale.notes ? `<p><strong>Notas:</strong> ${sale.notes}</p>` : ''}
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
              placeholder="Buscar ventas por ID o cliente..."
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
          
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            placeholder="Filtrar por fecha"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Cliente</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Fecha</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Servicios</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Total</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSales.map((sale) => {
                const customer = getCustomerInfo(sale.customerId);
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{customer?.name}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-gray-800">{sale.date}</div>
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
                        
                        {hasPermission('manage_sales') && sale.status === 'completed' && (
                          <>
                            <button
                              className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                              title="Imprimir recibo"
                              onClick={() => handlePrintReceipt(sale)}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleCancelSale(sale)}
                              className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                              title="Anular venta"
                            >
                              <Ban className="w-4 h-4" />
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

      {/* Cancel Sale Modal */}
      {showCancelModal && saleToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Confirmar Anulación</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Estás segura de que quieres anular la venta <strong>{saleToCancel.id}</strong>?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmCancelSale}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Anular
                </button>
                <button
                  onClick={() => setCancelModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showDetailModal && selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setShowDetailModal(false)}
          customer={getCustomerInfo(selectedSale.customerId)}
          employee={getEmployeeInfo(selectedSale.employeeId)}
          services={mockServices}
          onCancel={handleCancelSale}
          onPrint={handlePrintReceipt}
          hasPermission={hasPermission}
        />
      )}
    </div>
  );
}

// Sale Detail Modal Component
function SaleDetailModal({ sale, onClose, customer, employee, services, onCancel, onPrint, hasPermission }) {
  const getServiceInfo = (serviceId) => services.find(s => s.id === serviceId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle de Venta {sale.id}</h3>
              <p className="text-pink-100">Información completa de la transacción</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Sale and Customer Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información de la Venta</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Venta:</span>
                  <span className="font-semibold text-gray-800">{sale.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="text-gray-800">{sale.date} - {sale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Empleado:</span>
                  <span className="text-gray-800">{employee?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Pago:</span>
                  <span className="text-gray-800">
                    {sale.paymentMethod === 'cash' ? 'Efectivo' :
                     sale.paymentMethod === 'transfer' ? 'Transferencia' : 'Otro'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información del Cliente</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-semibold text-gray-800">{customer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-800">{customer?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="text-gray-800">{customer?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          {sale.services && sale.services.length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 mb-4">Servicios Prestados</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-800">Servicio</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-800">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.services.map((service, index) => {
                      const serviceInfo = getServiceInfo(service.serviceId);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium text-gray-800">{serviceInfo?.name}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">${service.totalPrice.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              {sale.notes && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Notas</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{sale.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4">Resumen Financiero</h4>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">${sale.subtotal.toLocaleString()}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="text-red-600">-${sale.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="font-bold text-green-600 text-lg">${sale.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {hasPermission('manage_sales') && sale.status === 'completed' && (
            <div className="mt-8 flex space-x-4 justify-end">
              <button
                onClick={() => onPrint(sale)}
                className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Imprimir Recibo</span>
              </button>
              
              <button
                onClick={() => onCancel(sale)}
                className="bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Ban className="w-5 h-5" />
                <span>Anular Venta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}