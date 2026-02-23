import React, { useState, useEffect } from 'react';
import {
  Scissors, Plus, Edit, Trash2, Eye, Search, Filter, Clock, DollarSign,
  Package, X, Save, AlertCircle, TrendingUp, Calendar, Tag, Star, Users,
  Image as ImageIcon, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { serviceService, Service as APIService } from '../../services/serviceService';
import { SimplePagination } from '../ui/simple-pagination';

const API_ORIGIN = 'http://www.astrhoapp.somee.com';
const DEFAULT_SERVICE_IMAGE = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop';

// Helper for image retry logic
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  const currentSrc = target.src;

  if (target.dataset.triedAll === 'true') return;

  console.log(`SuperMapper: Image load fail for ${currentSrc}, attempting recovery chain...`);

  // Extraer el nombre del archivo
  const parts = currentSrc.split('/');
  const filename = parts[parts.length - 1];

  switch (target.dataset.retryCount) {
    case undefined:
    case '0':
      target.dataset.retryCount = '1';
      target.src = `${API_ORIGIN}/imagenes/${filename}`;
      break;
    case '1':
      target.dataset.retryCount = '2';
      // Algunas veces en IIS subdirectorios, puede estar bajo /api/imagenes/
      target.src = `${API_ORIGIN}/api/imagenes/${filename}`;
      break;
    case '2':
      target.dataset.retryCount = '3';
      // Fallback a wwwroot explicito si está mal configurado el router
      target.src = `${API_ORIGIN}/wwwroot/imagenes/${filename}`;
      break;
    case '3':
      target.dataset.retryCount = '4';
      target.src = `${API_ORIGIN}/api/wwwroot/imagenes/${filename}`;
      break;
    default:
      // Fallback final si nada funcionó
      target.src = DEFAULT_SERVICE_IMAGE;
      target.dataset.triedAll = 'true';
      break;
  }
};

export function ServiceManagement({ hasPermission }: ServiceManagementProps) {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Helper avanzado para procesar cualquier formato de imagen del backend
  const processImageSource = (raw: any): string => {
    if (!raw) {
      console.log('SuperMapper: Raw input is empty/null');
      return '';
    }

    console.log('SuperMapper Debug [Input]:', typeof raw === 'string' && raw.length > 100 ? `${raw.substring(0, 50)}... [length: ${raw.length}]` : raw);

    const PLACEHOLDER = DEFAULT_SERVICE_IMAGE;

    if (raw && typeof raw === 'object' && raw.type !== 'Buffer' && !Array.isArray(raw)) {
      console.log('SuperMapper: Detected unknown object type in image field:', Object.keys(raw));
    }

    // Caso 1: Objeto con Buffer
    if (raw && typeof raw === 'object' && raw.type === 'Buffer' && Array.isArray(raw.data)) {
      raw = raw.data;
    }

    // Caso 2: Array de bytes (byte[])
    if (Array.isArray(raw)) {
      try {
        const uint8Array = new Uint8Array(raw);
        let binary = '';
        const chunk = 8192;
        for (let i = 0; i < uint8Array.length; i += chunk) {
          const sub = uint8Array.subarray(i, i + chunk);
          binary += String.fromCharCode.apply(null, Array.from(sub));
        }
        return `data:image/png;base64,${btoa(binary)}`;
      } catch (e) {
        console.error('SuperMapper: Error en Byte Array:', e);
        return PLACEHOLDER;
      }
    }

    if (typeof raw !== 'string') return '';

    let str = raw.trim();
    if (!str) return '';

    // Caso 3: URL Completa
    if (str.startsWith('http')) return str;

    // Caso 4: Data URI ya formado
    if (str.startsWith('data:')) return str;

    // Caso 5: Ruta de Disco Local (Filtro y Rescate)
    if (str.match(/^[a-zA-Z]:\\/) || str.includes('\\')) {
      const parts = str.split(/[\\/]/);
      const fileName = parts[parts.length - 1];
      if (fileName && fileName.includes('.')) {
        return `${API_ORIGIN}/uploads/${fileName}`;
      }
      return PLACEHOLDER;
    }

    // Caso 6: Cadena HEXADECIMAL (0xFFD8...)
    if (/^(0x)?[0-9a-fA-F]{100,}$/.test(str)) {
      try {
        const cleanHex = str.startsWith('0x') ? str.substring(2) : str;
        const binary = cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
        if (binary) {
          const uint8 = new Uint8Array(binary);
          let binStr = '';
          for (let i = 0; i < uint8.length; i++) binStr += String.fromCharCode(uint8[i]);
          const b64 = btoa(binStr);
          let mime = 'image/png';
          if (cleanHex.toLowerCase().startsWith('ffd8')) mime = 'image/jpeg';
          return `data:${mime};base64,${b64}`;
        }
      } catch (e) {
        console.error('SuperMapper: Error en Hex conversion:', e);
      }
    }

    // Caso 7: Ruta relativa o solo nombre de archivo
    if (str.length < 500 && (str.includes('.') || str.includes('/') || str.includes('\\'))) {
      // Normalizar backslashes a forward slashes
      const normalizedStr = str.replace(/\\/g, '/');
      const path = normalizedStr.startsWith('/') ? normalizedStr : `/${normalizedStr}`;

      // SIEMPRE priorizar /imagenes/ ya que el usuario confirmó que es donde se alojan
      if (!path.includes('/imagenes/') && !path.includes('/uploads/') && !path.includes('/api/') && !path.includes('/Images/')) {
        return `${API_ORIGIN}/imagenes${path}`;
      }
      return `${API_ORIGIN}${path}`;
    }

    // Caso 8: Base64 crudo
    const cleanB64 = str.replace(/[\s\n\r"']/g, '');
    if (cleanB64.length > 50) {
      let mimeType = 'image/png';
      if (cleanB64.startsWith('/9j/') || cleanB64.startsWith('/9J/')) mimeType = 'image/jpeg';
      else if (cleanB64.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
      else if (cleanB64.startsWith('R0lGOD')) mimeType = 'image/gif';
      else if (cleanB64.startsWith('UklGR')) mimeType = 'image/webp';

      return `data:${mimeType};base64,${cleanB64}`;
    }

    return PLACEHOLDER;
  };

  // Map API Service to UI model
  const mapServiceToUI = (service: any) => {
    // INTROSPECCIÓN DESESPERADA: Log de todas las llaves para encontrar el campo oculto
    console.log(`SuperMapper: Keys for service ${service.nombre || service.Nombre || '?'}:`, Object.keys(service).join(', '));

    const rawImage =
      service.imagen || service.Imagen ||
      service.foto || service.Foto ||
      service.image || service.Image ||
      service.imageUrl || service.image_url ||
      service.urlImagen || service.UrlImagen ||
      service.rutaImagen || service.RutaImagen ||
      service.pathImagen || service.PathImagen ||
      service.linkImagen || service.LinkImagen ||
      service.archivo || service.Archivo ||
      service.icono || service.Icono ||
      service.imagenPrincipal || service.ImagenPrincipal;

    const imageUrl = processImageSource(rawImage);

    console.log(`SuperMapper Debug [Result] for ${service.nombre || service.Nombre || 'unknown'}:`,
      imageUrl ? (imageUrl.startsWith('data:') ? 'base64 data...' : imageUrl) : 'No image produced - Check keys above!');

    return {
      id: service.servicioId || service.ServicioId || service.id,
      name: service.nombre || service.Nombre || 'Sin nombre',
      description: service.descripcion || service.Descripcion || '',
      price: service.precio || service.Precio || 0,
      duration: service.duracion || service.Duracion || 0,
      status: (service.estado !== undefined ? service.estado : (service.Estado !== undefined ? service.Estado : (service.activo !== undefined ? service.activo : service.Activo))) ? 'active' : 'inactive',
      updatedAt: (service.fechaActualizacion || service.FechaActualizacion || service.fechaCreacion || service.FechaCreacion || '').split('T')[0] || new Date().toISOString().split('T')[0],
      image: imageUrl || DEFAULT_SERVICE_IMAGE,
      popularity: 0,
      appointments: 0
    };
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await serviceService.getServices();
      console.log('Services API Data Raw:', data);

      // Handle array or object with data property
      const servicesArray = Array.isArray(data) ? data : (data as any).data || [];
      console.log('Processed Services Array:', servicesArray);

      setServices(servicesArray.map(mapServiceToUI));
    } catch (error) {
      console.error('Error fetching services:', error);
      setErrorModalMessage('Error al cargar la lista de servicios. Por favor, intente de nuevo.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
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

  const handleViewDetail = (service: any) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleDeleteService = (service: any) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const confirmDeleteService = async () => {
    try {
      await serviceService.deleteService(selectedService.id);
      setServices(services.filter(s => s.id !== selectedService.id));
      setShowDeleteModal(false);
      setSelectedService(null);
      setAlertMessage(`Servicio "${selectedService.name}" eliminado exitosamente`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Error deleting service:', error);
      setErrorModalMessage('No se pudo eliminar el servicio. Es posible que existan dependencias.');
      setShowErrorModal(true);
    }
  };

  const handleToggleServiceStatus = async (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      const updatedStatus = service.status === 'active' ? false : true;

      // Usar mapUIToFormData en lugar de JSON para asegurar compatibilidad con el backend
      const updatedUiData = {
        ...service,
        status: updatedStatus ? 'active' : 'inactive'
      };

      const formData = mapUIToFormData(updatedUiData, serviceId);

      console.log('Sending status update payload via FormData');
      const result = await serviceService.updateService(serviceId, formData);

      setServices(services.map(s =>
        s.id === serviceId
          ? mapServiceToUI(result)
          : s
      ));

      setAlertMessage(`Estado de "${service.name}" actualizado a ${updatedStatus ? 'Activo' : 'Inactivo'}`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Error toggling service status:', error);
      setErrorModalMessage('Error al cambiar el estado del servicio. Verifique su conexión.');
      setShowErrorModal(true);
    }
  };

  const mapUIToFormData = (uiData: any, id?: number): FormData => {
    const formData = new FormData();

    // Usar PascalCase para compatibilidad con backend .NET (Somee)
    formData.append('Nombre', uiData.name || '');
    formData.append('nombre', uiData.name || '');
    formData.append('Descripcion', uiData.description || '');
    formData.append('descripcion', uiData.description || '');
    formData.append('Precio', String(uiData.price || 0));
    formData.append('precio', String(uiData.price || 0));
    formData.append('Duracion', String(uiData.duration || 0));
    formData.append('duracion', String(uiData.duration || 0));

    const isStatusActive = uiData.status === 'active' || uiData.status === true;
    formData.append('Estado', String(isStatusActive));
    formData.append('estado', String(isStatusActive));
    formData.append('Activo', String(isStatusActive));
    formData.append('activo', String(isStatusActive));

    // Incluir ID (requerido para PUT)
    if (id !== undefined) {
      formData.append('ServicioId', String(id));
      formData.append('servicioId', String(id));
      formData.append('Id', String(id));
    }

    // Manejar imagen - El usuario dice que ahora es una columna directa
    const fieldName = 'Imagen'; // O 'imagen'
    const fieldNameSecondary = 'imagen';

    if (uiData.imageFile instanceof File) {
      formData.append(fieldName, uiData.imageFile);
      formData.append(fieldNameSecondary, uiData.imageFile);
    } else if (typeof uiData.image === 'string' && uiData.image.includes('base64,')) {
      const base64Content = uiData.image.split('base64,')[1];
      formData.append(fieldName, base64Content);
      formData.append(fieldNameSecondary, base64Content);
    } else if (typeof uiData.image === 'string' && !uiData.image.includes('placeholder')) {
      formData.append(fieldName, uiData.image);
      formData.append(fieldNameSecondary, uiData.image);
    }

    return formData;
  };

  const handleSaveService = async (serviceData: any) => {
    try {
      if (selectedService) {
        // Edit existing service
        const formData = mapUIToFormData(serviceData, selectedService.id);
        const result = await serviceService.updateService(selectedService.id, formData);

        setServices(services.map(s =>
          s.id === selectedService.id
            ? mapServiceToUI(result)
            : s
        ));
        setAlertMessage(`Servicio "${serviceData.name}" actualizado exitosamente`);
      } else {
        // Create new service
        const formData = mapUIToFormData(serviceData);
        const result = await serviceService.createService(formData);

        setServices([mapServiceToUI(result), ...services]);
        setAlertMessage(`Servicio "${serviceData.name}" creado exitosamente`);
      }
      setShowEditModal(false);
      setShowSuccessAlert(true);
    } catch (error: any) {
      console.error('Error saving service:', error);
      const isDuplicate = error.message?.toLowerCase().includes('ya existe') ||
        error.message?.toLowerCase().includes('already') ||
        error.message?.includes('400') ||
        error.message?.toLowerCase().includes('duplicate');

      setErrorModalMessage(isDuplicate
        ? 'Este registro ya existe. por favor ingrese otro diferente'
        : (error.message || 'Error al guardar el servicio. Verifique los datos.'));
      setShowErrorModal(true);
    }
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setShowEditModal(true);
  };



  // Calculate stats
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'active').length;

  return (
    <React.Fragment>
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
                          <span className={`ml-3 text-sm font-medium ${service.status === 'active' ? 'text-green-600' : 'text-red-600'
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



        {/* Error Modal */}
        {showErrorModal && (
          <ErrorModal
            message={errorModalMessage}
            onClose={() => setShowErrorModal(false)}
          />
        )}
      </div>

      {/* Success Alert positioned absolutely at the root level to circumvent stacking bounds */}
      {showSuccessAlert && (
        <div className="fixed top-24 right-4 z-[2147483647] animate-in slide-in-from-top-5 duration-300">
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
    </React.Fragment>
  );
}

// Error Modal Component
function ErrorModal({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! Algo salió mal</h3>
          <p className="text-gray-600 mb-8">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// Service Detail Modal Component
function ServiceDetailModal({ service, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="relative h-64 bg-gradient-to-r from-pink-400 to-purple-500 rounded-t-3xl">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover opacity-80 rounded-t-3xl"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/60 to-purple-500/60 rounded-t-3xl"></div>
          <div className="absolute inset-0 flex items-center justify-between p-6 text-white">
            <div>
              <h3 className="text-3xl font-bold">{service.name}</h3>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${service.status === 'active'
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
                  <span className={`font-semibold ${service.status === 'active' ? 'text-green-600' : 'text-gray-600'
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
    image: service?.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
    imageFile: null,
    images: service?.images || []
  });

  const [errors, setErrors] = useState({});
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
          image: reader.result as string,
          imageFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({
      ...formData,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
      imageFile: null
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
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
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.duration ? 'border-red-300' : 'border-gray-300'
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
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.price ? 'border-red-300' : 'border-gray-300'
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
                  onError={handleImageError}
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
                  <span className={`ml-3 text-sm font-medium ${formData.status === 'active' ? 'text-green-600' : 'text-red-600'
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
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.description ? 'border-red-300' : 'border-gray-300'
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
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