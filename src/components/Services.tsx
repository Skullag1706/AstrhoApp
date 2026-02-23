import React, { useState, useEffect } from 'react';
import {
  Scissors, Droplets, Sparkles, Heart, Clock, Search,
  Eye, ChevronLeft, ChevronRight, Filter, Calendar, X
} from 'lucide-react';

import { toast } from 'sonner';
import { serviceService, Service as APIService } from '../services/serviceService';

const categories = ['Todos', 'Cortes', 'Tratamientos', 'Coloración', 'Peinados', 'Cuidado Corporal', 'Tratamientos Faciales', 'Extensiones'];

interface ServicesProps {
  onBookAppointment: (selectedService?: any) => void;
}

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

export function Services({ onBookAppointment }: ServicesProps) {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

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

  const mapAPIServiceToUI = (service: any) => {
    // INTROSPECCIÓN DESESPERADA: Log de todas las llaves para encontrar el campo oculto
    console.log(`Public SuperMapper: Keys for service ${service.nombre || service.Nombre || '?'}:`, Object.keys(service).join(', '));

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
      rating: 5.0, // Default rating
      reviews: Math.floor(Math.random() * 50) + 10,
      image: imageUrl || DEFAULT_SERVICE_IMAGE,
      icon: Scissors,
      color: 'from-pink-400 to-rose-500',
      category: service.categoriaNombre || service.CategoriaNombre || 'General',
      // Default category
      isActive: (service.estado !== undefined ? service.estado : (service.Estado !== undefined ? service.Estado : (service.activo !== undefined ? service.activo : service.Activo)))
    };
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await serviceService.getServices();
      console.log('Raw API Data:', data);
      console.log('Services API Data (Public):', data);

      const servicesArray = Array.isArray(data) ? data : (data as any).data || [];
      setServices(servicesArray.map(mapAPIServiceToUI));
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar servicios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || service.category === filterCategory;
    return matchesSearch && matchesCategory && service.isActive;
  });

  const handleServiceBooking = (service: any) => {
    onBookAppointment(service);
  };

  const handleViewDetails = (service: any) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const toggleFavorite = (serviceId: number) => {
    setFavorites((prev: number[]) =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <section id="services-section" className="py-20 bg-gradient-to-br from-pink-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ofrecemos una amplia gama de servicios de belleza profesionales
            con los mejores productos y técnicas del mercado
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredServices.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Service Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`}></div>
                  <div className="absolute top-4 right-4">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-pink-500" />
                    </div>
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">{service.name}</h3>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{service.duration} min</span>
                    </div>
                    <div className="font-bold text-pink-600">
                      ${service.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(service)}
                      className="flex-1 px-4 py-2 border-2 border-pink-300 text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-all flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Más</span>
                    </button>
                    <button
                      onClick={() => handleServiceBooking(service)}
                      className={`flex-1 px-4 py-2 bg-gradient-to-r ${service.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Agendar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-600 mb-6">
              Contáctanos y te ayudaremos a encontrar el servicio perfecto para ti
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onBookAppointment()}
                className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Consultar Disponibilidad
              </button>
              <button className="border-2 border-pink-300 text-pink-600 px-8 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-all duration-300">
                Contactar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {showDetailModal && selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setShowDetailModal(false)}
          onBookAppointment={handleServiceBooking}
        />
      )}
    </section>
  );
}

// Service Detail Modal Component
interface ServiceDetailModalProps {
  service: any;
  onClose: () => void;
  onBookAppointment: (service: any) => void;
}

function ServiceDetailModal({ service, onClose, onBookAppointment }: ServiceDetailModalProps) {
  const Icon = service.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className={`bg-gradient-to-r ${service.color} p-6 text-white rounded-t-3xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{service.name}</h3>
                <p className="text-white/80">{service.category}</p>
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
          {/* Service Image */}
          <div className="mb-6">
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-48 object-cover rounded-xl shadow-lg"
              onError={handleImageError}
            />
          </div>

          {/* Service Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información del Servicio</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-semibold text-gray-800 flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration} minutos</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio:</span>
                  <span className="text-2xl font-bold text-pink-600">
                    ${service.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    {service.category}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4">Descripción</h4>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                onBookAppointment(service);
                onClose();
              }}
              className={`px-6 py-3 bg-gradient-to-r ${service.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2`}
            >
              <Calendar className="w-5 h-5" />
              <span>Agendar Servicio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}