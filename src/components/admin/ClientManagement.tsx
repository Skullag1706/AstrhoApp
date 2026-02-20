import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, Eye, Edit, Calendar,
  Phone, Mail, MapPin, Heart, Scissors, ShoppingBag,
  X, Save, AlertCircle, Star, TrendingUp, Clock, Trash2, CheckCircle
} from 'lucide-react';
import { mockUsers, mockSales, mockAppointments, mockServices, mockRoles } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface ClientManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function ClientManagement({ hasPermission }: ClientManagementProps) {
  const [clients, setClients] = useState(mockUsers.filter(u => u.role === 'customer'));
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
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

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
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

  const getClientSales = (clientId) => {
    return mockSales.filter(sale => sale.customerId === clientId);
  };

  const getClientAppointments = (clientId) => {
    return mockAppointments.filter(apt => apt.customerId === clientId);
  };

  const getDocumentTypeLabel = (client) => {
    return client.documentType || 'CC';
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowNewClientModal(true);
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      setClients(clients.filter(client => client.id !== clientToDelete.id));
      setShowDeleteModal(false);
      setClientToDelete(null);
      setShowSuccessAlert(true);
      setAlertMessage('Cliente eliminado exitosamente');
    }
  };

  const handleCreateClient = (clientData) => {
    if (editingClient) {
      // Editando cliente existente
      const updatedClient = {
        ...editingClient,
        ...clientData,
        name: `${clientData.firstName} ${clientData.lastName}`,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setClients(clients.map(client => 
        client.id === editingClient.id ? updatedClient : client
      ));
      setEditingClient(null);
      setShowSuccessAlert(true);
      setAlertMessage('Cliente actualizado exitosamente');
    } else {
      // Creando nuevo cliente
      const newClient = {
        id: Math.max(...clients.map(c => c.id)) + 1,
        ...clientData,
        visitCount: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setClients([...clients, newClient]);
      setShowSuccessAlert(true);
      setAlertMessage('Cliente registrado exitosamente');
    }
    setShowNewClientModal(false);
  };

  const handleUpdateClient = (updatedClient) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
    setSelectedClient(updatedClient);
  };

  const handleToggleClientStatus = (clientId) => {
    setClients(clients.map(client => 
      client.id === clientId 
        ? { 
            ...client, 
            status: client.status === 'active' ? 'inactive' : 'active',
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : client
    ));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h2>
          <p className="text-gray-600">
            Administra la información y historial de todos los clientes
          </p>
        </div>

        {hasPermission('manage_clients') && (
          <button
            onClick={() => setShowNewClientModal(true)}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Cliente</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
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
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Lista de Clientes</h3>
          <p className="text-gray-600">
            {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Tipo Documento</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Documento</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Contacto</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedClients.map((client) => {
                const clientSales = getClientSales(client.id);
                const clientAppointments = getClientAppointments(client.id);
                
                return (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                        {getDocumentTypeLabel(client)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{client.documentId}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{client.name}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{client.phone}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {hasPermission('manage_clients') && (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={client.status === 'active'}
                              onChange={() => handleToggleClientStatus(client.id)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                            <span className={`ml-3 text-sm font-medium ${
                              client.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {client.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver perfil"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {hasPermission('manage_clients') && (
                          <>
                            <button
                              onClick={() => handleEditClient(client)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar cliente"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteClient(client)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar cliente"
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
            Mostrando {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Confirmar Eliminación</h3>
                  <p className="text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás segura de que quieres eliminar al cliente <strong>{clientToDelete.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {clientToDelete.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{clientToDelete.name}</div>
                      <div className="text-sm text-gray-600">{clientToDelete.email}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteClient}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Modal */}
      {showClientModal && selectedClient && (
        <ClientProfileModal
          client={selectedClient}
          onClose={() => setShowClientModal(false)}
          sales={getClientSales(selectedClient.id)}
          appointments={getClientAppointments(selectedClient.id)}
          services={mockServices}
          onUpdate={handleUpdateClient}
          hasPermission={hasPermission}
        />
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => {
            setShowNewClientModal(false);
            setEditingClient(null);
          }}
          onSave={handleCreateClient}
          editingClient={editingClient}
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

// Client Profile Modal Component
function ClientProfileModal({ client, onClose, sales, appointments, services, onUpdate, hasPermission }) {
  const getServiceInfo = (serviceId) => services.find(s => s.id === serviceId);

  const futureAppointments = appointments.filter(apt => 
    new Date(apt.date) >= new Date() && apt.status !== 'cancelled'
  );
  
  const pastAppointments = appointments.filter(apt => 
    new Date(apt.date) < new Date() || apt.status === 'completed'
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalles del Cliente</h3>
              <p className="text-pink-100">Información completa del cliente</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-pink-500" />
              <span>Información Personal</span>
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Nombre Completo</label>
                <p className="font-semibold text-gray-800">{client.name}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Tipo de Documento</label>
                <p className="font-semibold text-gray-800">{client.documentType || 'CC'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Número de Documento</label>
                <p className="font-semibold text-gray-800">{client.documentId}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-semibold text-gray-800">{client.email}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Teléfono</label>
                <p className="font-semibold text-gray-800">{client.phone}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Fecha de Nacimiento</label>
                <p className="font-semibold text-gray-800">{client.birthDate || 'No registrada'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Dirección</label>
                <p className="font-semibold text-gray-800">{client.address || 'No registrada'}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Estado</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {client.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Notas del Cliente */}
          {client.notes && (
            <div className="bg-yellow-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-yellow-800 mb-3">Notas del Cliente</h4>
              <p className="text-yellow-800">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// New Client Modal Component
function NewClientModal({ onClose, onSave, editingClient }) {
  const [formData, setFormData] = useState({
    firstName: editingClient?.firstName || '',
    lastName: editingClient?.lastName || '',
    documentType: editingClient?.documentType || 'CC',
    documentId: editingClient?.documentId || '',
    phone: editingClient?.phone || '',
    role: editingClient?.role || 'customer',
    status: editingClient?.status || 'active',
    notes: editingClient?.notes || ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Nombre requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'Apellido requerido';
    if (!formData.documentId.trim()) newErrors.documentId = 'Documento requerido';
    if (!formData.phone.trim()) newErrors.phone = 'Teléfono requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {editingClient ? 'Editar Cliente' : 'Registrar Cliente'}
              </h3>
              <p className="text-pink-100">
                {editingClient ? 'Actualiza la información del cliente' : 'Registra un nuevo cliente en el sistema'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo y Número de Documento */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => handleChange('documentType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                disabled={editingClient}
              >
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="NIT">NIT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de Documento *
              </label>
              <input
                type="text"
                value={formData.documentId}
                onChange={(e) => handleChange('documentId', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.documentId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: 1234567890"
                disabled={editingClient}
              />
              {errors.documentId && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.documentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nombre y Apellido */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: María"
              />
              {errors.firstName && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.firstName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: García"
              />
              {errors.lastName && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.lastName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: +57 300 123 4567"
            />
            {errors.phone && (
              <div className="flex items-center space-x-1 mt-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.phone}</span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent resize-none"
              placeholder="Observaciones, preferencias, alergias..."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{editingClient ? 'Actualizar' : 'Guardar'} Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}