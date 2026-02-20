import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Plus, Eye, Filter, Search, Calendar, AlertTriangle, 
  CheckCircle, Clock, Truck, Package, X, Save, DollarSign, 
  FileText, Ban, File, Trash2, ChevronDown
} from 'lucide-react';
import { mockPurchaseOrders, mockSuppliers, mockProducts, mockUsers } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface PurchaseManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function PurchaseManagement({ hasPermission }: PurchaseManagementProps) {
  const [purchases, setPurchases] = useState(mockPurchaseOrders);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [products, setProducts] = useState(mockProducts); // Estado local de productos/insumos
  const itemsPerPage = 8;

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
    const supplier = mockSuppliers.find(s => s.id === purchase.supplierId);
    const matchesSearch = purchase.id.toString().includes(searchTerm) ||
                         supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex);

  const getSupplierName = (supplierId) => {
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Proveedor desconocido';
  };

  const getUserName = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'cancelled': return 'Anulado';
      default: return status;
    }
  };

  const handleViewDetail = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };



  const handleStatusChange = (purchaseId, newStatus) => {
    // Este método ya no se usará porque el estado solo cambia con el botón anular
    setStatusDropdownOpen(null);
  };

  const toggleStatusDropdown = (purchaseId) => {
    setStatusDropdownOpen(statusDropdownOpen === purchaseId ? null : purchaseId);
  };

  const handleStatusDropdownClick = (e, purchaseId) => {
    e.stopPropagation();
    toggleStatusDropdown(purchaseId);
  };

  // Available status options (ya no se usan porque el cambio es solo con botón anular)
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

  const handleCancelPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setShowCancelModal(true);
  };

  const confirmCancelPurchase = (observation) => {
    if (!selectedPurchase) return;

    // Anular la compra
    setPurchases(purchases.map(p => 
      p.id === selectedPurchase.id 
        ? { ...p, status: 'cancelled', observation }
        : p
    ));

    setShowCancelModal(false);
    setSelectedPurchase(null);
    setShowSuccessAlert(true);
    setAlertMessage('Compra anulada exitosamente');
  };

  const handleGeneratePDF = (purchase) => {
    const supplier = mockSuppliers.find(s => s.id === purchase.supplierId);
    const createdByUser = mockUsers.find(u => u.id === purchase.createdBy);
    
    const receiptContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #e91e63; padding-bottom: 15px; margin-bottom: 15px;">
          <h1 style="color: #e91e63; margin: 0;">AstroApp</h1>
          <p style="margin: 5px 0; color: #666;">Salón de Belleza</p>
          <p style="margin: 5px 0; color: #666;">Cll 55 #42-16 Medellín</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">FACTURA DE COMPRA</h3>
          <p><strong>ID Compra:</strong> #${purchase.id}</p>
          <p><strong>Fecha de Orden:</strong> ${purchase.orderDate}</p>
          <p><strong>Fecha Esperada:</strong> ${purchase.expectedDate}</p>
          ${purchase.receivedDate ? `<p><strong>Fecha Recibida:</strong> ${purchase.receivedDate}</p>` : ''}
          <p><strong>Estado:</strong> ${getStatusLabel(purchase.status)}</p>
          <p><strong>Creado por:</strong> ${createdByUser?.name || 'Usuario desconocido'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">INFORMACIÓN DEL PROVEEDOR:</h4>
          <p><strong>Proveedor:</strong> ${supplier?.name || 'Proveedor desconocido'}</p>
          <p><strong>Contacto:</strong> ${supplier?.contactPerson || 'N/A'}</p>
          <p><strong>Email:</strong> ${supplier?.email || 'N/A'}</p>
          <p><strong>Teléfono:</strong> ${supplier?.phone || 'N/A'}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">PRODUCTOS ORDENADOS:</h4>
          ${purchase.items.map(item => `
            <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
              <div style="font-weight: bold;">${item.productName}</div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span>Cantidad:</span>
                <span>${item.quantity}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span>Precio Unitario:</span>
                <span>${item.unitPrice.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                <span>Total:</span>
                <span>${item.totalPrice.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 2px 0; color: #666;">
                <span>Recibido:</span>
                <span>${item.received || 0}/${item.quantity}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>${purchase.subtotal.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Impuestos:</span>
            <span>${purchase.tax.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 5px;">
            <span>TOTAL:</span>
            <span>${purchase.total.toLocaleString()}</span>
          </div>
        </div>
        
        ${purchase.notes ? `
          <div style="margin-top: 15px; font-size: 12px; color: #666;">
            <p><strong>Notas:</strong> ${purchase.notes}</p>
          </div>
        ` : ''}
        
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
          <title>Factura de Compra - #${purchase.id}</title>
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

  const handleSavePurchase = (purchaseData) => {
    if (selectedPurchase) {
      // Editar compra existente
      const updatedPurchase = {
        ...selectedPurchase,
        ...purchaseData,
        // Mantener campos que no deben cambiar al editar
        id: selectedPurchase.id,
        createdBy: selectedPurchase.createdBy,
        orderDate: selectedPurchase.orderDate
      };
      setPurchases(purchases.map(p => 
        p.id === selectedPurchase.id ? updatedPurchase : p
      ));
    } else {
      // Crear nueva compra
      const newPurchase = {
        id: Math.max(...purchases.map(p => p.id)) + 1,
        ...purchaseData,
        status: 'approved',
        orderDate: new Date().toISOString().split('T')[0],
        createdBy: 1, // Current user ID
        receivedDate: null
      };
      setPurchases([...purchases, newPurchase]);
    }
    setShowCreateModal(false);
    setSelectedPurchase(null);
    setShowSuccessAlert(true);
    setAlertMessage('Compra registrada exitosamente');
  };

  // Financial summary
  const totalPurchaseValue = purchases.reduce((sum, p) => sum + p.total, 0);
  const monthlyPurchases = purchases.filter(p => {
    const purchaseDate = new Date(p.orderDate);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear;
  });

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

      {/* Purchases Table */}
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
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-gray-800">{purchase.orderDate}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">
                      {getSupplierName(purchase.supplierId)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-gray-800">{purchase.items.length}</div>
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
                      <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(purchase.status)}`}>
                        {getStatusLabel(purchase.status)}
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
                      
                      {hasPermission('manage_purchases') && purchase.status !== 'cancelled' && (
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

      {/* Pagination - Always visible */}
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

      {/* Purchase Detail Modal */}
      {showDetailModal && selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setShowDetailModal(false)}
          suppliers={mockSuppliers}
          users={mockUsers}
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
          suppliers={mockSuppliers}
          products={products} // Usar el estado local de productos
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

// Purchase Detail Modal Component
function PurchaseDetailModal({ purchase, onClose, suppliers, users }) {
  const supplier = suppliers.find(s => s.id === purchase.supplierId);
  const createdByUser = users.find(u => u.id === purchase.createdBy);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'cancelled': return 'Anulado';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle de Compra #{purchase.id}</h3>
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

        <div className="p-6">
          {/* Purchase Info */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Basic Info */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información de la Compra</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Compra:</span>
                  <span className="font-semibold text-gray-800">#{purchase.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de Orden:</span>
                  <span className="text-gray-800">{purchase.orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha Esperada:</span>
                  <span className="text-gray-800">{purchase.expectedDate}</span>
                </div>
                {purchase.receivedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha Recibida:</span>
                    <span className="text-green-600 font-semibold">{purchase.receivedDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Creado por:</span>
                  <span className="text-gray-800">{createdByUser?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(purchase.status)}`}>
                    {getStatusLabel(purchase.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información del Proveedor</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Proveedor:</span>
                  <span className="font-semibold text-gray-800">{supplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contacto:</span>
                  <span className="text-gray-800">{supplier?.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-800">{supplier?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="text-gray-800">{supplier?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-8">
            <h4 className="font-bold text-gray-800 mb-4">Productos Ordenados</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Producto</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Cantidad</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Precio Unit.</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-800">Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchase.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">${item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">${item.totalPrice.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          item.received === item.quantity 
                            ? 'bg-green-100 text-green-800' 
                            : item.received > 0 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.received || 0} / {item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              {purchase.notes && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-4">Notas</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{purchase.notes}</p>
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
                    <span className="text-gray-800">${purchase.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impuestos:</span>
                    <span className="text-gray-800">${purchase.tax.toLocaleString()}</span>
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
function PurchaseCreateModal({ onClose, onSave, suppliers, products }) {
  // Obtener fecha actual en formato YYYY-MM-DD
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: getCurrentDate(), // Fecha actual automática
    items: []
  });

  const [errors, setErrors] = useState({});

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

  const addProduct = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
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
    const item = { ...newItems[index] };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      item.productId = value;
      item.productName = product ? product.name : '';
      item.unitPrice = product ? product.price : 0;
    } else if (field === 'quantity') {
      item.quantity = parseInt(value) || 1;
    }
    
    // Recalcular total
    item.totalPrice = item.quantity * item.unitPrice;
    newItems[index] = item;
    
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.supplierId) {
      newErrors.supplierId = 'Selecciona un proveedor';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'Agrega al menos un producto';
    }
    
    formData.items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`product_${index}`] = 'Selecciona un producto';
      }
      if (item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'La cantidad debe ser mayor a 0';
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

    // Calcular totales
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.19; // 19% IVA
    const total = subtotal + tax;

    const purchaseData = {
      ...formData,
      supplierId: parseInt(formData.supplierId),
      subtotal,
      tax,
      total,
      items: formData.items.map(item => ({
        ...item,
        productId: parseInt(item.productId),
        received: 0
      }))
    };

    onSave(purchaseData);
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
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

        <form onSubmit={handleSubmit} className="p-6">
          {/* Información básica */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.supplierId ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Seleccionar proveedor...</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-red-600 text-sm mt-1">{errors.supplierId}</p>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800">Productos de la Compra</h4>
              <button
                type="button"
                onClick={addProduct}
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {errors.items && (
              <p className="text-red-600 text-sm mb-4">{errors.items}</p>
            )}

            {formData.items.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay productos agregados</p>
                <p className="text-sm text-gray-500 mt-2">Usa el botón "Agregar Producto" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Producto *
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-300"
                          required
                        >
                          <option value="">Seleccionar producto...</option>
                          {products
                            .filter(p => p.status === 'active' && (!formData.supplierId || p.supplierId === parseInt(formData.supplierId)))
                            .map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - ${product.price.toLocaleString()}
                              </option>
                            ))}
                        </select>
                        {formData.supplierId && products.filter(p => p.status === 'active' && p.supplierId === parseInt(formData.supplierId)).length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">Este proveedor no tiene insumos registrados</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-300"
                          required
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                            ${item.totalPrice.toLocaleString()}
                          </div>
                        </div>
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
                ))}

                {/* Totales */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-semibold text-gray-800">
                        ${formData.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">IVA (19%):</span>
                      <span className="font-semibold text-gray-800">
                        ${(formData.items.reduce((sum, item) => sum + item.totalPrice, 0) * 0.19).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-purple-300 pt-2">
                      <span className="font-bold text-gray-800">Total:</span>
                      <span className="font-bold text-purple-700 text-lg">
                        ${(formData.items.reduce((sum, item) => sum + item.totalPrice, 0) * 1.19).toLocaleString()}
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
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                formData.items.length === 0
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
function CancelConfirmationModal({ purchase, onClose, onConfirm }) {
  const [observation, setObservation] = useState('');

  const handleConfirm = () => {
    onConfirm(observation);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
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
              ¿Estás segura de que quieres anular la compra <strong>#{purchase.id}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800">
                  Orden de Compra #{purchase.id}
                </div>
                <div className="text-sm text-gray-600">
                  Fecha: {new Date(purchase.orderDate).toLocaleDateString('es-ES')}
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
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                !observation.trim()
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