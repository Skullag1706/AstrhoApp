import React, { useState } from 'react';
import { 
  Scissors, Droplets, Sparkles, Heart, Clock, Search, 
  Eye, ChevronLeft, ChevronRight, Filter, Calendar, X
} from 'lucide-react';

const services = [
  {
    id: 1,
    name: 'Corte y Peinado',
    description: 'Corte personalizado según tu tipo de rostro y estilo',
    price: 35000,
    duration: 45,
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop',
    icon: Scissors,
    color: 'from-pink-400 to-rose-500',
    category: 'Cortes',
    isActive: true
  },
  {
    id: 2,
    name: 'Tratamiento Capilar',
    description: 'Hidratación profunda para cabello dañado y seco',
    price: 55000,
    duration: 60,
    rating: 5.0,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
    icon: Droplets,
    color: 'from-purple-400 to-violet-500',
    category: 'Tratamientos',
    isActive: true
  },
  {
    id: 3,
    name: 'Coloración',
    description: 'Tintes y mechas con productos de alta calidad',
    price: 85000,
    duration: 120,
    rating: 4.8,
    reviews: 203,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop',
    icon: Sparkles,
    color: 'from-pink-500 to-purple-600',
    category: 'Coloración',
    isActive: true
  },
  {
    id: 4,
    name: 'Peinado Especial',
    description: 'Peinados para eventos especiales y ocasiones importantes',
    price: 65000,
    duration: 90,
    rating: 4.9,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop',
    icon: Heart,
    color: 'from-rose-400 to-pink-500',
    category: 'Peinados',
    isActive: true
  },
  {
    id: 5,
    name: 'Alisado Brasileño',
    description: 'Alisado duradero con queratina natural',
    price: 120000,
    duration: 180,
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=300&fit=crop',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-500',
    category: 'Tratamientos',
    isActive: true
  },
  {
    id: 6,
    name: 'Manicure & Pedicure',
    description: 'Cuidado completo de manos y pies',
    price: 45000,
    duration: 75,
    rating: 4.8,
    reviews: 91,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop',
    icon: Heart,
    color: 'from-pink-400 to-purple-400',
    category: 'Cuidado Corporal',
    isActive: true
  },
  {
    id: 7,
    name: 'Mascarilla Facial',
    description: 'Tratamiento facial hidratante y relajante',
    price: 40000,
    duration: 50,
    rating: 4.6,
    reviews: 78,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
    icon: Sparkles,
    color: 'from-green-400 to-teal-500',
    category: 'Tratamientos Faciales',
    isActive: true
  },
  {
    id: 8,
    name: 'Extensiones de Cabello',
    description: 'Aplicación profesional de extensiones naturales',
    price: 95000,
    duration: 150,
    rating: 4.5,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=300&fit=crop',
    icon: Scissors,
    color: 'from-amber-400 to-orange-500',
    category: 'Extensiones',
    isActive: true
  }
];

const categories = ['Todos', 'Cortes', 'Tratamientos', 'Coloración', 'Peinados', 'Cuidado Corporal', 'Tratamientos Faciales', 'Extensiones'];

interface ServicesProps {
  onBookAppointment: (selectedService?: any) => void;
}

export function Services({ onBookAppointment }: ServicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || service.category === filterCategory;
    return matchesSearch && matchesCategory && service.isActive;
  });

  const handleServiceBooking = (service) => {
    onBookAppointment(service);
  };

  const handleViewDetails = (service) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const toggleFavorite = (serviceId: number) => {
    setFavorites(prev => 
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
function ServiceDetailModal({ service, onClose, onBookAppointment }) {
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