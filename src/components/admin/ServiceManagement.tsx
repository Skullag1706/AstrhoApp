import React, { useState, useEffect } from 'react';
import { 
  Scissors, Plus, Edit, Trash2, Eye, Search, Filter, Clock, DollarSign,
  Package, X, Save, AlertCircle, TrendingUp, Calendar, Tag, Star, Users,
  Image as ImageIcon, CheckCircle
} from 'lucide-react';
import { mockServices, mockCategories, mockSales, mockAppointments } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface ServiceManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function ServiceManagement({ hasPermission }: ServiceManagementProps) {
  const [services, setServices] = useState(mockServices);
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || service.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleViewDetail = (service) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleDeleteService = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const confirmDeleteService = () => {
    setServices(services.filter(s => s.id !== selectedService.id));
    setShowDeleteModal(false);
    setSelectedService(null);
    setAlertMessage('Servicio eliminado exitosamente');
    setShowSuccessAlert(true);
  };

  const handleToggleServiceStatus = (serviceId) => {
    setServices(services.map(s => 
      s.id === serviceId 
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString().split('T')[0] }
        : s
    ));
  };

  const handleSaveService = (serviceData) => {
    if (selectedService) {
      // Edit existing service
      setServices(services.map(s => 
        s.id === selectedService.id 
          ? { ...s, ...serviceData, updatedAt: new Date().toISOString().split('T')[0] }
          : s
      ));
      setAlertMessage('Servicio actualizado exitosamente');
    } else {
      // Create new service
      const newService = {
        id: Math.max(...services.map(s => s.id)) + 1,
        ...serviceData,
        popularity: 0,
        appointments: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setServices([...services, newService]);
      setAlertMessage('Servicio creado exitosamente');
    }
    setShowEditModal(false);
    setShowSuccessAlert(true);
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setShowEditModal(true);
  };



  // Calculate stats
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'active').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Servicios</h2>
          <p className="text-gray-600">
            Administra todos los servicios ofrecidos en el salón
          </p>
        </div>

        {hasPermission('manage_services') && (
          <button
            onClick={handleCreateService}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Servicio</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar servicios por nombre o descripción..."
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
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Servicio</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Duración</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Precio</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.updatedAt}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800">{service.duration} min</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="font-bold text-green-600">
                      ${service.price.toLocaleString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={service.status === 'active'}
                          onChange={() => handleToggleServiceStatus(service.id)}
                          className="sr-only peer"
                          disabled={!hasPermission('manage_services')}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                        <span className={`ml-3 text-sm font-medium ${
                          service.status === 'active' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {service.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </label>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetail(service)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {hasPermission('manage_services') && (
                        <>
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteService(service)}
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

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredServices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredServices.length)} de {filteredServices.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showEditModal && (
        <ServiceEditModal
          service={selectedService}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveService}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          service={selectedService}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteService}
        />
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-4 z-50">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm">{alertMessage}</p>
        </div>
      )}
    </div>
  );
}

// Service Detail Modal Component
function ServiceDetailModal({ service, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="relative h-64 bg-gradient-to-r from-pink-400 to-purple-500 rounded-t-3xl">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover opacity-80 rounded-t-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/60 to-purple-500/60 rounded-t-3xl"></div>
          <div className="absolute inset-0 flex items-center justify-between p-6 text-white">
            <div>
              <h3 className="text-3xl font-bold">{service.name}</h3>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  service.status === 'active' 
                    ? 'bg-green-400 text-white' 
                    : 'bg-gray-400 text-white'
                }`}>
                  {service.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
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
          {/* Service Information */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información del Servicio</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-semibold text-gray-800">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duración:</span>
                  <span className="text-gray-800">{service.duration} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio:</span>
                  <span className="font-bold text-green-600">${service.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-semibold ${
                    service.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {service.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4">Estadísticas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Popularidad:</span>
                  <span className="font-semibold text-gray-800">{service.popularity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Citas:</span>
                  <span className="text-gray-800">{service.appointments}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h4 className="font-bold text-gray-800 mb-4">Descripción</h4>
            <p className="text-gray-700 bg-gray-50 rounded-xl p-4">{service.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Service Edit Modal Component
function ServiceEditModal({ service, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration: service?.duration || 30,
    price: service?.price || 0,
    status: service?.status || 'active',
    image: service?.image || '/api/placeholder/300/200',
    images: service?.images || []
  });

  const [errors, setErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(service?.image || null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crear una URL temporal para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({
          ...formData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    setFormData({
      ...formData,
      image: '/api/placeholder/300/200'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (formData.duration <= 0) newErrors.duration = 'La duración debe ser mayor a 0';
    if (formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['duration', 'price'].includes(name) ? parseFloat(value) || 0 : value
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {service ? 'Editar Servicio' : 'Registrar Servicio'}
              </h3>
              <p className="text-pink-100">
                {service ? 'Actualiza la información del servicio' : 'Registra un nuevo servicio'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Servicio *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Corte y Peinado"
            />
            {errors.name && (
              <div className="flex items-center space-x-1 mt-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.name}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duración (minutos) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.duration ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.duration && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.duration}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio (COP) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.price && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.price}</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload de Imagen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagen del Servicio
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Haz clic para subir una imagen</p>
                  <p className="text-xs text-gray-500">PNG, JPG o WEBP (máx. 5MB)</p>
                </label>
              </div>
            )}
          </div>

          {service && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado
              </label>
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                  <span className={`ml-3 text-sm font-medium ${
                    formData.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formData.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe el servicio detalladamente..."
            />
            {errors.description && (
              <div className="flex items-center space-x-1 mt-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.description}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              {service ? 'Actualizar' : 'Crear'} Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ service, onClose, onConfirm }) {
  return (
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
              ¿Estás segura de que quieres eliminar el servicio <strong>{service.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800">{service.name}</div>
                <div className="text-sm text-gray-600">Duración: {service.duration} minutos</div>
                <div className="text-sm text-gray-600">Precio: ${service.price.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Citas realizadas: {service.appointments}</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}