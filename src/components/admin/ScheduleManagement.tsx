import React, { useState } from 'react';
import { 
  Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, 
  CheckCircle, AlertCircle, XCircle, Edit, Eye, Filter, Trash2,
  Save, X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockAppointments, mockUsers, mockServices } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';
import { Switch } from '../ui/switch';

interface ScheduleManagementProps {
  hasPermission: (permission: string) => boolean;
}

// Mock schedules data with individual day schedules
const mockSchedules = [
  {
    id: 1,
    name: 'Horario Regular Lunes-Viernes',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    schedule: {
      monday: { startTime: '08:00', endTime: '18:00' },
      tuesday: { startTime: '08:00', endTime: '18:00' },
      wednesday: { startTime: '08:00', endTime: '18:00' },
      thursday: { startTime: '08:00', endTime: '18:00' },
      friday: { startTime: '08:00', endTime: '18:00' }
    },
    status: 'active',
    createdAt: '2024-01-10',
    employees: [1, 2]
  },
  {
    id: 2,
    name: 'Horario Sábados',
    days: ['saturday'],
    schedule: {
      saturday: { startTime: '09:00', endTime: '16:00' }
    },
    status: 'active',
    createdAt: '2024-01-10',
    employees: [1]
  },
  {
    id: 3,
    name: 'Horario Especial Diciembre',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    schedule: {
      monday: { startTime: '08:00', endTime: '20:00' },
      tuesday: { startTime: '08:00', endTime: '20:00' },
      wednesday: { startTime: '08:00', endTime: '20:00' },
      thursday: { startTime: '08:00', endTime: '20:00' },
      friday: { startTime: '08:00', endTime: '20:00' },
      saturday: { startTime: '09:00', endTime: '18:00' }
    },
    status: 'inactive',
    createdAt: '2024-01-05',
    employees: [1, 2, 3]
  }
];

export function ScheduleManagement({ hasPermission }: ScheduleManagementProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('schedules'); // 'day', 'week', 'schedules'
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [schedules, setSchedules] = useState(mockSchedules);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Generate time slots from 8:00 AM to 8:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get appointments for selected date
  const getAppointmentsForDate = (date) => {
    return mockAppointments.filter(apt => apt.date === date);
  };

  // Get appointment for specific time slot
  const getAppointmentForSlot = (date, time) => {
    const appointments = getAppointmentsForDate(date);
    return appointments.find(apt => {
      const aptTime = apt.time;
      const aptEndTime = calculateEndTime(apt.time, apt.duration);
      return time >= aptTime && time < aptEndTime;
    });
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Get user name by ID
  const getUserName = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  // Get service name by ID
  const getServiceName = (serviceId) => {
    const service = mockServices.find(s => s.id === serviceId);
    return service ? service.name : 'Servicio desconocido';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Navigation functions
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Schedule management functions
  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleModal(true);
  };

  const handleViewScheduleDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleDeleteSchedule = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const confirmDeleteSchedule = () => {
    if (selectedSchedule) {
      setSchedules(schedules.filter(s => s.id !== selectedSchedule.id));
      toast.success(`Horario "${selectedSchedule.name}" eliminado correctamente`);
      setShowDeleteModal(false);
      setSelectedSchedule(null);
    }
  };

  const handleToggleScheduleStatus = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    const newStatus = schedule.status === 'active' ? 'inactive' : 'active';
    setSchedules(schedules.map(s => 
      s.id === scheduleId 
        ? { ...s, status: newStatus }
        : s
    ));
    
    if (newStatus === 'active') {
      toast.success(`Horario "${schedule.name}" activado correctamente`);
    } else {
      toast.info(`Horario "${schedule.name}" inactivado correctamente`);
    }
  };

  const handleSaveSchedule = (scheduleData) => {
    if (selectedSchedule) {
      setSchedules(schedules.map(s => 
        s.id === selectedSchedule.id 
          ? { ...s, ...scheduleData }
          : s
      ));
      toast.success(`Horario "${scheduleData.name}" actualizado correctamente`);
    } else {
      const newSchedule = {
        id: Math.max(...schedules.map(s => s.id), 0) + 1,
        ...scheduleData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSchedules([...schedules, newSchedule]);
      toast.success(`Horario "${scheduleData.name}" registrado correctamente`);
    }
    setShowScheduleModal(false);
  };

  const appointmentsForDate = getAppointmentsForDate(selectedDate);
  const employees = mockUsers.filter(user => user.role === 'asistente' || user.role === 'admin');

  // Filter appointments by employee if selected
  const filteredAppointments = filterEmployee === 'all' 
    ? appointmentsForDate 
    : appointmentsForDate.filter(apt => apt.employeeId === parseInt(filterEmployee));

  const getDayName = (day) => {
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return days[day] || day;
  };

  const getScheduleTimeRange = (schedule) => {
    const times = [];
    schedule.days.forEach(day => {
      if (schedule.schedule[day]) {
        times.push(`${schedule.schedule[day].startTime} - ${schedule.schedule[day].endTime}`);
      }
    });
    // Remove duplicates and return the most common range
    const uniqueTimes = [...new Set(times)];
    return uniqueTimes.length === 1 ? uniqueTimes[0] : 'Horarios variables';
  };

  // Pagination for schedules
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = schedules.slice(startIndex, startIndex + itemsPerPage);

  if (viewMode === 'schedules') {
    return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Gestión de Horarios</h2>
            <p className="text-gray-600">
              Administra los horarios de trabajo semanales del salón
            </p>
          </div>

          {hasPermission('manage_schedules') && (
            <button
              onClick={handleCreateSchedule}
              className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Registrar Horario</span>
            </button>
          )}
        </div>

        {/* Schedules List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Horarios Configurados</h3>
            <p className="text-gray-600">
              {schedules.length} horario{schedules.length !== 1 ? 's' : ''} configurado{schedules.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {paginatedSchedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-800">{schedule.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          schedule.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 mb-1">Días:</div>
                          <div className="font-semibold text-gray-800">
                            {schedule.days.map(day => getDayName(day)).join(', ')}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Horario:</div>
                          <div className="font-semibold text-gray-800">
                            {getScheduleTimeRange(schedule)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-gray-600 text-sm mb-1">Empleados asignados:</div>
                        <div className="flex flex-wrap gap-2">
                          {schedule.employees.map(empId => {
                            const employee = employees.find(e => e.id === empId);
                            return employee ? (
                              <span key={empId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">
                                {employee.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>

                    {hasPermission('manage_schedules') && (
                      <div className="flex items-center space-x-2 ml-6">
                        {/* Estado - Toggle Switch como en categorías */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={schedule.status === 'active'}
                            onChange={() => handleToggleScheduleStatus(schedule.id)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                          <span className={`ml-3 text-sm font-medium ${
                            schedule.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {schedule.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </label>
                        
                        {/* Ver detalle */}
                        <button
                          onClick={() => handleViewScheduleDetail(schedule)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        {/* Editar */}
                        <button
                          onClick={() => handleEditSchedule(schedule)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Editar horario"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Eliminar horario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {schedules.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay horarios configurados</h3>
                  <p className="text-gray-500 mb-6">Crea el primer horario para organizar el trabajo del salón</p>
                  {hasPermission('manage_schedules') && (
                    <button
                      onClick={handleCreateSchedule}
                      className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Crear Primer Horario
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {schedules.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <SimplePagination 
                  currentPage={currentPage}
                  totalPages={Math.max(1, totalPages)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <ScheduleModal
            schedule={selectedSchedule}
            employees={employees}
            onClose={() => setShowScheduleModal(false)}
            onSave={handleSaveSchedule}
          />
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <ScheduleDetailModal
            schedule={selectedSchedule}
            employees={employees}
            onClose={() => setShowDetailModal(false)}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedSchedule && (
          <DeleteScheduleModal
            schedule={selectedSchedule}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDeleteSchedule}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Horarios y Citas</h2>
          <p className="text-gray-600">
            Visualiza y gestiona los horarios ocupados y la disponibilidad del salón
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('schedules')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
          >
            Gestionar Horarios
          </button>
          {hasPermission('manage_appointments') && (
            <button className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nueva Cita</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Navigation and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousDay}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800">
                {new Date(selectedDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-sm text-gray-600">
                {filteredAppointments.length} citas programadas
              </p>
            </div>
            
            <button
              onClick={goToNextDay}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
            >
              Hoy
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />

            {/* Employee Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="all">Todos los profesionales</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Time Slots Column */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Horarios del Día</h3>
              <p className="text-sm text-gray-600">
                Horario de atención: 8:00 AM - 8:00 PM
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-1">
                {timeSlots.map((time) => {
                  const appointment = getAppointmentForSlot(selectedDate, time);
                  const isOccupied = !!appointment;
                  
                  return (
                    <div key={time} className="flex items-center">
                      {/* Time Label */}
                      <div className="w-20 text-sm font-medium text-gray-600 pr-4">
                        {time}
                      </div>
                      
                      {/* Time Slot */}
                      <div className={`flex-1 h-12 border border-gray-200 rounded-lg transition-all ${
                        isOccupied 
                          ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-pink-300' 
                          : 'bg-gray-50 hover:bg-green-50 hover:border-green-300'
                      }`}>
                        {isOccupied ? (
                          <div className="h-full flex items-center justify-between px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {getUserName(appointment.customerId)}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {getServiceName(appointment.serviceId)} • {appointment.duration} min
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                                {appointment.status === 'confirmed' ? 'Confirmada' :
                                 appointment.status === 'pending' ? 'Pendiente' :
                                 appointment.status === 'in_progress' ? 'En Progreso' :
                                 appointment.status === 'completed' ? 'Completada' :
                                 appointment.status === 'cancelled' ? 'Cancelada' : 'No Show'}
                              </span>
                              
                              {hasPermission('update_appointments') && (
                                <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <span className="text-sm">Disponible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Summary Sidebar */}
        <div className="space-y-6">
          {/* Daily Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen del Día</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-green-600">Total Citas</div>
                  <div className="text-xl font-bold text-green-700">{appointmentsForDate.length}</div>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-600">Confirmadas</div>
                  <div className="text-xl font-bold text-blue-700">
                    {appointmentsForDate.filter(apt => apt.status === 'confirmed').length}
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="text-sm text-yellow-600">Pendientes</div>
                  <div className="text-xl font-bold text-yellow-700">
                    {appointmentsForDate.filter(apt => apt.status === 'pending').length}
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm text-purple-600">Ingresos Est.</div>
                  <div className="text-xl font-bold text-purple-700">
                    ${appointmentsForDate.reduce((sum, apt) => sum + apt.totalCost, 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-purple-600">$</div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Próximas Citas</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredAppointments
                .filter(apt => apt.time >= new Date().toTimeString().slice(0, 5))
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => (
                  <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(appointment.status)}
                        <span className="font-semibold text-gray-800">{appointment.time}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                        {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium text-gray-800">
                        {getUserName(appointment.customerId)}
                      </div>
                      <div className="text-gray-600">
                        {getServiceName(appointment.serviceId)}
                      </div>
                      <div className="text-gray-500">
                        con {getUserName(appointment.employeeId)}
                      </div>
                    </div>
                    
                    {hasPermission('update_appointments') && (
                      <div className="flex items-center space-x-2 mt-3">
                        <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors">
                          Ver Detalles
                        </button>
                        <button className="flex-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors">
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
              {filteredAppointments.filter(apt => apt.time >= new Date().toTimeString().slice(0, 5)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay más citas hoy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Schedule Modal Component
function ScheduleModal({ schedule, employees, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    days: schedule?.days || [],
    schedule: schedule?.schedule || {},
    status: schedule?.status || 'active',
    employees: schedule?.employees || []
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDayToggle = (dayKey) => {
    const newDays = formData.days.includes(dayKey)
      ? formData.days.filter(d => d !== dayKey)
      : [...formData.days, dayKey];
    
    setFormData({
      ...formData,
      days: newDays,
      schedule: newDays.reduce((acc, day) => {
        acc[day] = formData.schedule[day] || { startTime: '08:00', endTime: '18:00' };
        return acc;
      }, {})
    });
  };

  const handleScheduleChange = (dayKey, field, value) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [dayKey]: {
          ...formData.schedule[dayKey],
          [field]: value
        }
      }
    });
  };

  const handleEmployeeToggle = (employeeId) => {
    setFormData({
      ...formData,
      employees: formData.employees.includes(employeeId)
        ? formData.employees.filter(id => id !== employeeId)
        : [...formData.employees, employeeId]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {schedule ? 'Editar Horario' : 'Nuevo Horario'}
              </h3>
              <p className="text-pink-100">
                {schedule ? 'Actualiza el horario semanal' : 'Crea un nuevo horario semanal'}
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
              Nombre del Horario *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              placeholder="Ej: Horario Regular Lunes-Viernes"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Días de la Semana *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {daysOfWeek.map((day) => (
                <label key={day.key} className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.days.includes(day.key)}
                    onChange={() => handleDayToggle(day.key)}
                    className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Individual Day Schedules */}
          {formData.days.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Horarios por Día
              </label>
              <div className="space-y-4">
                {formData.days.map((dayKey) => {
                  const dayLabel = daysOfWeek.find(d => d.key === dayKey)?.label;
                  return (
                    <div key={dayKey} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">{dayLabel}</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Hora de Inicio</label>
                          <input
                            type="time"
                            value={formData.schedule[dayKey]?.startTime || '08:00'}
                            onChange={(e) => handleScheduleChange(dayKey, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Hora de Fin</label>
                          <input
                            type="time"
                            value={formData.schedule[dayKey]?.endTime || '18:00'}
                            onChange={(e) => handleScheduleChange(dayKey, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Empleados Asignados
            </label>
            <div className="space-y-2">
              {employees.map((employee) => (
                <label key={employee.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.employees.includes(employee.id)}
                    onChange={() => handleEmployeeToggle(employee.id)}
                    className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{employee.name}</div>
                    <div className="text-sm text-gray-600">{employee.role === 'admin' ? 'Administrador' : 'Asistente'}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              {schedule ? 'Actualizar Horario' : 'Crear Horario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Schedule Detail Modal Component
function ScheduleDetailModal({ schedule, employees, onClose }) {
  const getDayName = (day) => {
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return days[day] || day;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle del Horario</h3>
              <p className="text-blue-100">{schedule.name}</p>
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
          {/* General Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Información General</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Nombre:</span> <span className="font-semibold">{schedule.name}</span></div>
              <div><span className="text-gray-600">Estado:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  schedule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {schedule.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div><span className="text-gray-600">Creado:</span> <span className="font-semibold">{schedule.createdAt}</span></div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Horarios por Día</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedule.days.map((dayKey) => (
                <div key={dayKey} className="border border-gray-200 rounded-xl p-4">
                  <h5 className="font-semibold text-gray-800 mb-2">{getDayName(dayKey)}</h5>
                  {schedule.schedule[dayKey] ? (
                    <div className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Inicio:</span>
                        <span className="font-semibold">{schedule.schedule[dayKey].startTime}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Fin:</span>
                        <span className="font-semibold">{schedule.schedule[dayKey].endTime}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Sin horario configurado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Employees */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Empleados Asignados</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {schedule.employees.map(empId => {
                const employee = employees.find(e => e.id === empId);
                return employee ? (
                  <div key={empId} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{employee.name}</div>
                      <div className="text-sm text-gray-600">{employee.role === 'admin' ? 'Administrador' : 'Asistente'}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Schedule Modal Component
function DeleteScheduleModal({ schedule, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-400 to-pink-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Confirmar Eliminación</h3>
              <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
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
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              ¿Eliminar horario \"{schedule.name}\"?
            </h4>
            <p className="text-gray-600">
              Esta acción eliminará permanentemente el horario. Los empleados asignados no se eliminarán.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}