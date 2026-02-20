import React, { useState } from 'react';
import { 
  Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, 
  CheckCircle, AlertCircle, XCircle, Edit, Eye, Filter, Trash2,
  Save, X, User, Phone, Mail, MapPin, DollarSign, Search
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockAppointments, mockUsers, mockServices } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface AppointmentManagementProps {
  hasPermission: (permission: string) => boolean;
  currentUser: any;
}

// Mock schedules for checking availability
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
    employees: [1, 2]
  },
  {
    id: 2,
    name: 'Horario Sábados',
    days: ['saturday'],
    schedule: {
      saturday: { startTime: '09:00', endTime: '16:00' }
    },
    employees: [1]
  }
];

export function AppointmentManagement({ hasPermission, currentUser }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get employees (assistants and admins)
  const employees = mockUsers.filter(user => user.role === 'asistente' || user.role === 'admin');
  const customers = mockUsers.filter(user => user.role === 'customer');

  // Filter and search logic
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = searchTerm === '' || 
      getUserName(appointment.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getServiceName(appointment.serviceId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesEmployee = filterEmployee === 'all' || appointment.employeeId === parseInt(filterEmployee);
    
    return matchesSearch && matchesStatus && matchesEmployee;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  // Helper functions
  const getUserName = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  const getServiceName = (serviceId) => {
    const service = mockServices.find(s => s.id === serviceId);
    return service ? service.name : 'Servicio desconocido';
  };

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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  // Check if employee is available at specific date/time
  const isEmployeeAvailable = (employeeId, date, time) => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if employee has a schedule for this day
    const employeeSchedule = mockSchedules.find(schedule => 
      schedule.employees.includes(employeeId) && 
      schedule.days.includes(dayOfWeek)
    );
    
    if (!employeeSchedule) return false;
    
    // Check if time is within working hours
    const daySchedule = employeeSchedule.schedule[dayOfWeek];
    if (!daySchedule) return false;
    
    if (time < daySchedule.startTime || time > daySchedule.endTime) return false;
    
    // Check if employee already has an appointment at this time
    const hasConflict = appointments.some(apt => 
      apt.employeeId === employeeId && 
      apt.date === date && 
      apt.time === time &&
      apt.status !== 'cancelled'
    );
    
    return !hasConflict;
  };

  const handleCancelAppointment = (appointmentId) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    
    // No permitir cancelar citas completadas
    if (appointment.status === 'completed') {
      toast.error('No se puede cancelar una cita que ya ha sido completada');
      return;
    }
    
    if (window.confirm(`¿Estás segura de que quieres cancelar la cita de ${getUserName(appointment.customerId)}?`)) {
      setAppointments(appointments.map(a => 
        a.id === appointmentId ? { ...a, status: 'cancelled' } : a
      ));
      toast.success(`Cita de ${getUserName(appointment.customerId)} cancelada correctamente`);
    }
  };

  const handleDeleteAppointment = (appointmentId) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    
    // No permitir eliminar citas completadas
    if (appointment.status === 'completed') {
      toast.error('No se puede eliminar una cita que ya ha sido completada');
      return;
    }
    
    setSelectedAppointment(appointment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppointment = () => {
    if (selectedAppointment) {
      const customerName = getUserName(selectedAppointment.customerId);
      setAppointments(appointments.filter(a => a.id !== selectedAppointment.id));
      setShowDeleteModal(false);
      setSelectedAppointment(null);
      toast.success(`Cita de ${customerName} eliminada correctamente`);
    }
  };

  const handleUpdateStatus = (appointmentId, newStatus) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    setAppointments(appointments.map(a => 
      a.id === appointmentId ? { ...a, status: newStatus } : a
    ));
    toast.success(`Estado de cita actualizado a: ${getStatusLabel(newStatus)}`);
  };

  const handleCreateAppointment = () => {
    setSelectedAppointment(null);
    setShowCreateModal(true);
    setShowCreateForm(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCreateModal(true);
    setShowCreateForm(true);
  };

  const handleViewAppointmentDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Citas</h2>
          <p className="text-gray-600">
            Administra las citas del salón, agenda nuevas citas y gestiona disponibilidad
          </p>
        </div>

        {hasPermission('manage_appointments') && (
          <button
            onClick={handleCreateAppointment}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Cita</span>
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="no_show">No Show</option>
          </select>

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

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Lista de Citas</h3>
          <p className="text-gray-600">
            {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-600">Cliente</th>
                <th className="text-left p-4 font-semibold text-gray-600">Fecha & Hora</th>
                <th className="text-left p-4 font-semibold text-gray-600">Servicio</th>
                <th className="text-left p-4 font-semibold text-gray-600">Profesional</th>
                <th className="text-left p-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left p-4 font-semibold text-gray-600">Total</th>
                <th className="text-left p-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {getUserName(appointment.customerId)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {new Date(appointment.date).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {appointment.time} ({appointment.duration} min)
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">
                      {getServiceName(appointment.serviceId)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">
                      {getUserName(appointment.employeeId)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">
                      ${appointment.totalCost.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewAppointmentDetail(appointment)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Editar cita"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                          title="Cancelar cita"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Eliminar cita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron citas</h3>
              <p className="text-gray-500">Ajusta los filtros o crea una nueva cita</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-100">
          <SimplePagination 
            currentPage={currentPage}
            totalPages={Math.max(1, totalPages)}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          employees={employees}
          customers={customers}
          services={mockServices}
          isEmployeeAvailable={isEmployeeAvailable}
          onClose={() => setShowCreateModal(false)}
          onSave={(appointmentData) => {
            if (selectedAppointment) {
              setAppointments(appointments.map(a => 
                a.id === selectedAppointment.id ? { ...a, ...appointmentData } : a
              ));
              toast.success(`Cita actualizada correctamente`);
            } else {
              const newAppointment = {
                id: Math.max(...appointments.map(a => a.id), 0) + 1,
                ...appointmentData,
                status: 'pending'
              };
              setAppointments([...appointments, newAppointment]);
              toast.success(`Cita registrada correctamente`);
            }
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          customers={customers}
          employees={employees}
          services={mockServices}
          getUserName={getUserName}
          getServiceName={getServiceName}
          getStatusLabel={getStatusLabel}
          getStatusColor={getStatusColor}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAppointment && (
        <DeleteAppointmentModal
          appointment={selectedAppointment}
          getUserName={getUserName}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteAppointment}
        />
      )}
    </div>
  );
}

// Appointment Modal Component
function AppointmentModal({ appointment, employees, customers, services, isEmployeeAvailable, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customerId: appointment?.customerId || '',
    employeeId: appointment?.employeeId || '',
    date: appointment?.date || new Date().toISOString().split('T')[0],
    time: appointment?.time || '09:00',
    notes: appointment?.notes || '',
    status: appointment?.status || 'pending',
    selectedServices: appointment?.selectedServices || []
  });

  const [errors, setErrors] = useState({});
  const [isCompleted, setIsCompleted] = useState(appointment?.status === 'completed');

  // Calculate total cost and duration from selected services
  const totalCost = formData.selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = formData.selectedServices.reduce((sum, service) => sum + (service.duration || 60), 0);

  // Handle status change
  const handleStatusChange = (newStatus) => {
    if (newStatus === 'completed' && !isCompleted) {
      if (window.confirm('¿Estás segura de marcar esta cita como completada? Una vez completada, no se podrá editar.')) {
        setFormData({ ...formData, status: newStatus });
        setIsCompleted(true);
      }
    } else {
      setFormData({ ...formData, status: newStatus });
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      selectedServices: [...formData.selectedServices, { serviceId: '', name: '', price: 0, duration: 60 }]
    });
  };

  const removeService = (index) => {
    const newServices = formData.selectedServices.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      selectedServices: newServices
    });
  };

  const updateService = (index, serviceId) => {
    const service = services.find(s => s.id === parseInt(serviceId));
    if (service) {
      const newServices = [...formData.selectedServices];
      newServices[index] = {
        serviceId: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration || 60
      };
      setFormData({
        ...formData,
        selectedServices: newServices
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.customerId) newErrors.customerId = 'Selecciona un cliente';
    if (!formData.employeeId) newErrors.employeeId = 'Selecciona un profesional';
    if (formData.selectedServices.length === 0) newErrors.services = 'Agrega al menos un servicio';
    if (!formData.date) newErrors.date = 'Selecciona una fecha';
    if (!formData.time) newErrors.time = 'Selecciona una hora';

    // Validate that all services are selected
    formData.selectedServices.forEach((service, index) => {
      if (!service.serviceId) {
        newErrors[`service_${index}`] = 'Selecciona un servicio';
      }
    });

    // Check availability
    if (formData.employeeId && formData.date && formData.time) {
      if (!isEmployeeAvailable(parseInt(formData.employeeId), formData.date, formData.time)) {
        newErrors.time = 'El profesional no está disponible en esta fecha y hora';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Don't allow saving if completed (this is a safety check)
      if (isCompleted && appointment) {
        return;
      }
      
      // Convert to old format for compatibility
      const appointmentData = {
        ...formData,
        serviceId: formData.selectedServices[0]?.serviceId || '',
        duration: totalDuration,
        totalCost: totalCost
      };
      onSave(appointmentData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {appointment ? 'Editar Cita' : 'Registrar Cita'}
              </h3>
              <p className="text-pink-100">
                {appointment ? 'Actualiza la información de la cita' : 'Registra una nueva cita en el sistema'}
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
          {/* Cliente y Fecha en la misma fila */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Cliente *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.customerId ? 'border-red-300' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Seleccionar cliente...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>}
            </div>

            {/* Fecha */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Fecha *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Hora */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Hora *</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              disabled={isCompleted}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                errors.time ? 'border-red-300' : 'border-gray-300'
              } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
          </div>

          {/* Services - Cart Style */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block font-semibold text-gray-700">
                Servicios *
              </label>
              <button
                type="button"
                onClick={addService}
                disabled={isCompleted}
                className={`bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all flex items-center space-x-2 ${
                  isCompleted ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Servicio</span>
              </button>
            </div>

            {formData.selectedServices.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 mb-3 pb-2 border-b-2 border-gray-300">
                  <div className="col-span-8">
                    <span className="font-semibold text-gray-700">Servicio</span>
                  </div>
                  <div className="col-span-3">
                    <span className="font-semibold text-gray-700">Precio</span>
                  </div>
                  <div className="col-span-1">
                  </div>
                </div>

                {/* Service Rows */}
                <div className="space-y-3">
                  {formData.selectedServices.map((service, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-lg border border-gray-200">
                      <div className="col-span-8">
                        <select
                          value={service.serviceId}
                          onChange={(e) => updateService(index, e.target.value)}
                          disabled={isCompleted}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-300 ${
                            errors[`service_${index}`] ? 'border-red-300' : 'border-gray-300'
                          } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          required
                        >
                          <option value="">Seleccionar servicio...</option>
                          {services.filter(s => s.status === 'active').map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.duration || 60} min)
                            </option>
                          ))}
                        </select>
                        {errors[`service_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`service_${index}`]}</p>
                        )}
                      </div>

                      <div className="col-span-3">
                        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                          ${service.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          disabled={isCompleted}
                          className={`p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ${
                            isCompleted ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="mt-4 pt-4 border-t-2 border-gray-300 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-700 font-semibold">Duración Total:</span>
                      <span className="ml-2 font-bold text-gray-800 text-lg">{totalDuration} min</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-700 font-semibold">Costo Total:</span>
                      <span className="ml-2 font-bold text-purple-700 text-xl">
                        ${totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay servicios agregados</p>
                <p className="text-sm text-gray-400">Haz clic en "Agregar Servicio" para comenzar</p>
              </div>
            )}
            {errors.services && <p className="text-red-500 text-sm mt-1">{errors.services}</p>}
          </div>

          {/* Employee Selection and Notes en la misma fila */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Employee Selection */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Profesional *</label>
              <p className="text-sm text-gray-600 mb-3">
                Solo se mostrarán los profesionales disponibles en la fecha y hora seleccionadas
              </p>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.employeeId ? 'border-red-300' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Seleccionar profesional...</option>
                {employees.map(employee => {
                  const isAvailable = formData.date && formData.time ? 
                    isEmployeeAvailable(employee.id, formData.date, formData.time) : true;
                  
                  return (
                    <option 
                      key={employee.id} 
                      value={employee.id}
                      disabled={!isAvailable}
                    >
                      {employee.name} {!isAvailable ? '(No disponible)' : ''}
                    </option>
                  );
                })}
              </select>
              {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Notas adicionales</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                rows={3}
                placeholder="Observaciones, instrucciones especiales..."
              />
            </div>
          </div>

          {/* Status - Only show when editing */}
          {appointment && (
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Estado *</label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  isCompleted ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                }`}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">No Show</option>
              </select>
              {isCompleted && (
                <p className="text-purple-600 text-sm mt-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Esta cita está completada y no se puede editar
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
            >
              {isCompleted ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isCompleted && (
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
              >
                {appointment ? 'Actualizar' : 'Crear'} Cita
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Appointment Detail Modal Component
function AppointmentDetailModal({ 
  appointment, 
  customers, 
  employees, 
  services, 
  getUserName, 
  getServiceName,
  getStatusLabel,
  getStatusColor,
  onClose 
}) {
  const customer = customers.find(c => c.id === appointment.customerId);
  const employee = employees.find(e => e.id === appointment.employeeId);
  const service = services.find(s => s.id === appointment.serviceId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle de Cita</h3>
              <p className="text-purple-100">Información completa de la cita</p>
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
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-6 py-2 rounded-full font-semibold border text-lg ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </span>
          </div>

          {/* Date and Time */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Fecha y Hora
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Fecha</div>
                <div className="font-semibold text-gray-800 text-lg">
                  {new Date(appointment.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Hora</div>
                <div className="font-semibold text-gray-800 text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  {appointment.time}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Duración</div>
              <div className="font-semibold text-gray-800">{appointment.duration} minutos</div>
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Información del Cliente
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-gray-800">{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Info */}
          {service && (
            <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-pink-600" />
                Servicio
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Servicio</div>
                  <div className="font-semibold text-gray-800 text-lg">{service.name}</div>
                </div>
                {service.description && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Descripción</div>
                    <div className="text-gray-700">{service.description}</div>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-pink-200">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Duración</div>
                    <div className="font-semibold text-gray-800">{service.duration || appointment.duration} min</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Precio</div>
                    <div className="font-semibold text-gray-800 text-lg flex items-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      ${service.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employee Info */}
          {employee && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Profesional Asignado
              </h4>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{employee.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{employee.role}</div>
                  {employee.email && (
                    <div className="text-sm text-gray-600">{employee.email}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Total Cost */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-700 mb-1">Costo Total</div>
                <div className="text-3xl font-bold text-purple-700">
                  ${appointment.totalCost.toLocaleString()}
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <h4 className="font-semibold text-gray-800 mb-2">Notas</h4>
              <p className="text-gray-700">{appointment.notes}</p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Appointment Modal Component
function DeleteAppointmentModal({ appointment, getUserName, onClose, onConfirm }) {
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
              ¿Estás segura de que quieres eliminar la cita de <strong>{getUserName(appointment.customerId)}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800">
                  {new Date(appointment.date).toLocaleDateString('es-ES')} a las {appointment.time}
                </div>
                <div className="text-sm text-gray-600">
                  Duración: {appointment.duration} minutos
                </div>
                <div className="text-sm text-gray-600">
                  Total: ${appointment.totalCost.toLocaleString()}
                </div>
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