import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, ChevronLeft, ChevronRight, Plus,
  ArrowLeft, ArrowRight, CheckCircle, X, Save, Scissors
} from 'lucide-react';
import { serviceService } from '../services/serviceService';

const FALLBACK_SERVICES = [
  { id: 1, name: 'Corte y Peinado', duration: 45, price: 35000, color: 'bg-blue-500' },
  { id: 2, name: 'Tratamiento Capilar', duration: 60, price: 55000, color: 'bg-green-500' },
  { id: 3, name: 'Coloración', duration: 120, price: 85000, color: 'bg-purple-500' },
  { id: 4, name: 'Peinado Especial', duration: 90, price: 65000, color: 'bg-pink-500' },
  { id: 5, name: 'Alisado Brasileño', duration: 180, price: 120000, color: 'bg-indigo-500' },
  { id: 6, name: 'Manicure & Pedicure', duration: 75, price: 45000, color: 'bg-orange-500' }
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

const professionals = [
  { id: 1, name: 'Astrid Eugenia Hoyos', color: 'bg-rose-500', avatar: 'AH' },
  { id: 2, name: 'María Elena García', color: 'bg-violet-500', avatar: 'MG' },
  { id: 3, name: 'Carmen López', color: 'bg-emerald-500', avatar: 'CL' }
];

// Mock existing appointments
const existingAppointments = [
  {
    id: 1,
    serviceId: 1,
    professionalId: 1,
    date: '2024-01-20',
    time: '10:00',
    duration: 45,
    customer: 'Ana García'
  },
  {
    id: 2,
    serviceId: 2,
    professionalId: 2,
    date: '2024-01-20',
    time: '14:30',
    duration: 60,
    customer: 'Laura Pérez'
  },
  {
    id: 3,
    serviceId: 3,
    professionalId: 1,
    date: '2024-01-21',
    time: '09:00',
    duration: 120,
    customer: 'Sofia Ruiz'
  }
];

interface Professional {
  id: number;
  name: string;
  role: string;
  rating: number;
  image: string;
  availability: string[];
}

interface AppointmentBookingProps {
  currentUser?: any;
  onBookingComplete?: (appointment: any) => void;
  onBack?: () => void;
  initialService?: any;
}

export function AppointmentBooking({ currentUser, onBookingComplete, onBack, initialService }: AppointmentBookingProps) {
  const [step, setStep] = useState(initialService ? 2 : 1);
  const [selectedServices, setSelectedServices] = useState<any[]>(initialService ? [initialService] : []);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceService.getServices();
        console.log('Services API Data (Booking):', data);

        const servicesArray = Array.isArray(data) ? data : (data as any).data || [];

        const activeServices = servicesArray
          .filter((s: any) => (s.estado !== undefined ? s.estado : s.Estado))
          .map((s: any) => ({
            id: s.servicioId || s.ServicioId,
            name: s.nombre || s.Nombre || 'Sin nombre',
            description: s.descripcion || s.Descripcion || '',
            price: s.precio || s.Precio || 0,
            duration: s.duracion || s.Duracion || 0,
            category: 'General',
            icon: Scissors,
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
            color: 'bg-pink-500'
          }));

        setServices(activeServices);
      } catch (error) {
        console.error('Error fetching services for booking:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Get current week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);

  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Calculate total duration and price
  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  // Toggle service selection
  const toggleServiceSelection = (service: any) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Check if time slot is available
  const isTimeSlotAvailable = (date: string, time: string, professionalId: number, duration: number) => {
    const appointments = existingAppointments.filter(apt =>
      apt.date === date && apt.professionalId === professionalId
    );

    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = hours * 60 + minutes;
    const slotEnd = slotStart + duration;

    return !appointments.some(apt => {
      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      const aptStart = aptHours * 60 + aptMinutes;
      const aptEnd = aptStart + apt.duration;

      // Check for overlap
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  // Get appointment for specific slot
  const getAppointmentForSlot = (date: string, time: string, professionalId: number) => {
    return existingAppointments.find(apt => {
      if (apt.date !== date || apt.professionalId !== professionalId) return false;

      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = hours * 60 + minutes;

      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      const aptStart = aptHours * 60 + aptMinutes;
      const aptEnd = aptStart + apt.duration;

      return slotTime >= aptStart && slotTime < aptEnd;
    });
  };

  const handleTimeSlotClick = (date: string, time: string, professionalId: number) => {
    if (selectedServices.length === 0) return;

    const totalDuration = getTotalDuration();
    if (isTimeSlotAvailable(date, time, professionalId, totalDuration)) {
      setSelectedDate(date);
      setSelectedTime(time);
      setSelectedProfessional(professionals.find(p => p.id === professionalId));
      setShowBookingModal(true);
    }
  };

  const handleBookingConfirm = () => {
    const newAppointment = {
      services: selectedServices.map(s => ({ id: s.id, name: s.name, duration: s.duration, price: s.price })),
      professionalId: selectedProfessional.id,
      professional: selectedProfessional.name,
      date: selectedDate,
      time: selectedTime,
      duration: getTotalDuration(),
      price: getTotalPrice(),
      customer: currentUser?.name || 'Cliente',
      status: 'confirmed'
    };

    if (onBookingComplete) {
      onBookingComplete(newAppointment);
    }

    setShowBookingModal(false);
    setStep(3);
  };

  const resetBooking = () => {
    setSelectedServices([]);
    setSelectedProfessional(null);
    setSelectedDate('');
    setSelectedTime('');
    setStep(1);
  };

  if (step === 1) {
    return (
      <section className="py-20 bg-gradient-to-br from-pink-50/30 to-purple-50/30 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Selecciona tus Servicios
            </h2>
            <p className="text-xl text-gray-600">
              Puedes elegir uno o varios servicios para tu cita
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {services.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => toggleServiceSelection(service)}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${isSelected
                      ? 'border-pink-500 bg-pink-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-pink-300'
                      }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected
                          ? 'bg-pink-500 border-pink-500'
                          : 'border-gray-300'
                          }`}>
                          {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 ${service.color} rounded-full flex items-center justify-center`}>
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-800 text-lg">{service.name}</h4>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration} min</span>
                          </span>
                          <span className="font-bold text-pink-600 text-lg">
                            ${service.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-6">
                <h4 className="font-bold text-gray-800 mb-4">Resumen de Servicios Seleccionados</h4>
                <div className="space-y-2 mb-4">
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{index + 1}. {service.name}</span>
                      <span className="text-gray-600">{service.duration} min • ${service.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-pink-200 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">Duración Total: </span>
                    <span className="font-bold text-gray-800">{getTotalDuration()} min</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio Total: </span>
                    <span className="font-bold text-pink-600 text-xl">${getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-semibold"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver a Mis Citas</span>
                </button>
              )}

              {selectedServices.length > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (step === 2) {
    return (
      <section className="py-20 bg-gradient-to-br from-pink-50/30 to-purple-50/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Agenda tu Cita
            </h2>
            <p className="text-xl text-gray-600">
              Selecciona fecha, hora y profesional
            </p>
          </div>

          {/* Selected Services Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Servicios Seleccionados</h3>
              <button
                onClick={() => setStep(1)}
                className="text-pink-600 hover:text-pink-700 font-semibold"
              >
                Modificar Servicios
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 ${service.color} rounded-full flex items-center justify-center`}>
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.duration} min • ${service.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <div>
                <span className="text-gray-600">Duración Total: </span>
                <span className="font-bold text-gray-800">{getTotalDuration()} min</span>
              </div>
              <div>
                <span className="text-gray-600">Precio Total: </span>
                <span className="font-bold text-pink-600 text-xl">${getTotalPrice().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Calendar Header */}
          <div className="bg-white rounded-t-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {currentWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                >
                  Hoy
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextWeek}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Week Header */}
            <div className="grid grid-cols-8 gap-1">
              <div className="p-4 text-center font-semibold text-gray-600">Hora</div>
              {weekDates.map((date, index) => (
                <div key={index} className="p-4 text-center">
                  <div className="font-semibold text-gray-800">
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className={`text-2xl font-bold ${date.toDateString() === new Date().toDateString()
                    ? 'text-pink-600'
                    : 'text-gray-700'
                    }`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-b-2xl shadow-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-1 border-t border-gray-100">
                  {/* Time Label */}
                  <div className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
                    {time}
                  </div>

                  {/* Time Slots for each day */}
                  {weekDates.map((date, dayIndex) => {
                    const dateString = date.toISOString().split('T')[0];
                    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <div key={dayIndex} className="relative">
                        {professionals.map((professional) => {
                          const appointment = getAppointmentForSlot(dateString, time, professional.id);
                          const isAvailable = !isPastDate && isTimeSlotAvailable(dateString, time, professional.id, getTotalDuration());

                          if (appointment) {
                            // Show existing appointment
                            const service = services.find(s => s.id === appointment.serviceId) || FALLBACK_SERVICES.find(s => s.id === appointment.serviceId);
                            return (
                              <div
                                key={professional.id}
                                className={`h-12 m-0.5 ${service?.color || 'bg-gray-400'} rounded text-white text-xs p-1 flex items-center justify-center`}
                              >
                                <span className="truncate">{appointment.customer}</span>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={professional.id}
                              onClick={() => isAvailable && handleTimeSlotClick(dateString, time, professional.id)}
                              disabled={!isAvailable}
                              className={`h-12 m-0.5 text-xs rounded transition-all ${isAvailable
                                ? 'bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:border-green-300'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                              {isAvailable && (
                                <span className="flex flex-col items-center">
                                  <div className={`w-4 h-4 ${professional.color} rounded-full mb-1`}></div>
                                  <span className="truncate">{professional.name.split(' ')[0]}</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Professionals Legend */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h4 className="font-semibold text-gray-800 mb-4">Profesionales Disponibles</h4>
            <div className="flex flex-wrap gap-4">
              {professionals.map((professional) => (
                <div key={professional.id} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 ${professional.color} rounded-full`}></div>
                  <span className="text-gray-700">{professional.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Confirmar Cita</h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Servicios</div>
                    <div className="space-y-2">
                      {selectedServices.map((service, index) => (
                        <div key={service.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 ${service.color} rounded-full flex items-center justify-center`}>
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800 text-sm">{service.name}</div>
                            <div className="text-xs text-gray-600">{service.duration} min • ${service.price.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Profesional</div>
                    <div className="font-semibold text-gray-800">{selectedProfessional?.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Fecha y Hora</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(selectedDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} a las {selectedTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duración Total</div>
                    <div className="font-semibold text-gray-800">{getTotalDuration()} minutos</div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold text-pink-600">${getTotalPrice().toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBookingConfirm}
                    className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Confirmar Cita
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (step === 3) {
    return (
      <section className="py-20 bg-gradient-to-br from-pink-50/30 to-purple-50/30 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Cita Confirmada!
            </h2>

            <p className="text-xl text-gray-600 mb-8">
              Tu cita ha sido agendada exitosamente. Te enviaremos un recordatorio por email.
            </p>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-8 text-left">
              <h4 className="font-bold text-gray-800 mb-4">Detalles de tu Cita</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 block mb-2">Servicios:</span>
                  <div className="space-y-2">
                    {selectedServices.map((service, index) => (
                      <div key={service.id} className="flex items-center space-x-2 ml-4">
                        <div className={`w-6 h-6 ${service.color} rounded-full flex items-center justify-center`}>
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-semibold text-gray-800">{service.name}</span>
                        <span className="text-sm text-gray-600">({service.duration} min)</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profesional:</span>
                  <span className="font-semibold text-gray-800">{selectedProfessional?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-semibold text-gray-800">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duración Total:</span>
                  <span className="font-semibold text-gray-800">{getTotalDuration()} min</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-pink-600 pt-3 border-t border-pink-200">
                  <span>Total:</span>
                  <span>${getTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetBooking}
                className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Agendar Otra Cita
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Ver Mis Citas
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}