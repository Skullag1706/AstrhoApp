import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, CheckCircle, AlertCircle, XCircle,
  MapPin, Phone, Scissors, ChevronLeft, ChevronRight, Filter,
  Plus, Eye, Edit, MessageCircle
} from 'lucide-react';

interface ClientAppointmentsProps {
  currentUser: any;
  onBookNewAppointment?: () => void;
}

export function ClientAppointments({ currentUser, onBookNewAppointment }: ClientAppointmentsProps) {
  const [appointments] = useState([
    {
      id: 1,
      service: 'Corte y Peinado',
      serviceId: 1,
      date: '2024-01-20',
      time: '10:00',
      duration: 45,
      professional: 'María Elena',
      professionalId: 2,
      status: 'confirmed',
      price: 35000,
      notes: 'Cliente prefiere corte en capas',
      location: 'Cll 55 #42-16 Medellín'
    },
    {
      id: 2,
      service: 'Tratamiento Capilar',
      serviceId: 2,
      date: '2024-01-25',
      time: '14:30',
      duration: 60,
      professional: 'Astrid Eugenia',
      professionalId: 1,
      status: 'pending',
      price: 55000,
      notes: 'Tratamiento hidratante',
      location: 'Cll 55 #42-16 Medellín'
    },
    {
      id: 3,
      service: 'Coloración',
      serviceId: 3,
      date: '2024-01-10',
      time: '09:00',
      duration: 120,
      professional: 'Astrid Eugenia',
      professionalId: 1,
      status: 'completed',
      price: 85000,
      notes: 'Tinte rubio dorado',
      location: 'Cll 55 #42-16 Medellín'
    },
    {
      id: 4,
      service: 'Manicure & Pedicure',
      serviceId: 6,
      date: '2024-01-15',
      time: '16:00',
      duration: 75,
      professional: 'María Elena',
      professionalId: 2,
      status: 'completed',
      price: 45000,
      notes: 'Esmaltado francés',
      location: 'Cll 55 #42-16 Medellín'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Filter appointments based on status
  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'upcoming') {
      return apt.status === 'confirmed' || apt.status === 'pending';
    }
    return apt.status === filterStatus;
  });

  // Sort appointments by date (newest first)
  const sortedAppointments = filteredAppointments.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Pagination
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  const upcomingAppointments = appointments.filter(apt => 
    isUpcoming(apt.date) && (apt.status === 'confirmed' || apt.status === 'pending')
  );

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  return (
    <section className="py-20 bg-gradient-to-br from-pink-50/30 to-purple-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Mis Citas Agendadas
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Aquí puedes ver todas tus citas programadas, su estado y detalles importantes
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="text-center mb-8">
          <button
            onClick={onBookNewAppointment}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center space-x-3 mx-auto"
          >
            <Plus className="w-6 h-6" />
            <span>Agendar Nueva Cita</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Filtrar Citas</h3>
              <p className="text-sm text-gray-600">
                {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="upcoming">Próximas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Grid */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Mis Citas</h3>
          </div>

          <div className="p-6">
            {paginatedAppointments.length > 0 ? (
              <div className="grid gap-6">
                {paginatedAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Appointment Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">{appointment.service}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(appointment.date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{appointment.time} ({appointment.duration} min)</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>con {appointment.professional}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{appointment.location}</span>
                              </span>
                            </div>
                            {appointment.notes && (
                              <div className="flex items-start space-x-1 text-sm text-gray-600">
                                <MessageCircle className="w-4 h-4 mt-0.5" />
                                <span>{appointment.notes}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span>{getStatusLabel(appointment.status)}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800 mt-2">
                              ${appointment.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {appointment.status === 'pending' && isUpcoming(appointment.date) && (
                          <button className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold hover:bg-green-200 transition-colors flex items-center justify-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirmar</span>
                          </button>
                        )}
                        
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && isUpcoming(appointment.date) && (
                          <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2">
                            <Edit className="w-4 h-4" />
                            <span>Reprogramar</span>
                          </button>
                        )}
                        
                        <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-semibold hover:bg-purple-200 transition-colors flex items-center justify-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Ver Detalles</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes citas agendadas</h3>
                <p className="text-gray-500 mb-6">¡Agenda tu primera cita y disfruta de nuestros servicios!</p>
                <button
                  onClick={onBookNewAppointment}
                  className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Agendar Servicio
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedAppointments.length)} de {sortedAppointments.length} servicios
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        currentPage === index + 1
                          ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}