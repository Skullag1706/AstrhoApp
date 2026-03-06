import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Users, Plus,
  CheckCircle, AlertCircle, XCircle, Edit, Eye, Trash2,
  Save, X, User, Phone, DollarSign, Search, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { SimplePagination } from '../ui/simple-pagination';
import {
  agendaService, metodoPagoService, empleadoAgendaService,
  clienteService, servicioAgendaService, isEmployeeOccupied,
  AgendaItem, MetodoPago, EmpleadoAPI, ClienteAPI, ServicioAPI
} from '../../services/agendaService';
import { horarioEmpleadoService, horarioService, HorarioEmpleado } from '../../services/scheduleService';

interface AppointmentManagementProps {
  hasPermission: (permission: string) => boolean;
  currentUser: any;
}

// ── Estado IDs (matching typical backend values) ──
const ESTADO_OPTIONS = [
  { id: 1, label: 'Pendiente', key: 'Pendiente' },
  { id: 2, label: 'Confirmado', key: 'Confirmado' },
  { id: 3, label: 'En Progreso', key: 'En Progreso' },
  { id: 4, label: 'Completado', key: 'Completado' },
  { id: 5, label: 'Cancelado', key: 'Cancelado' },
  { id: 6, label: 'No Show', key: 'No Show' },
];

function getEstadoId(estadoLabel: string): number {
  const found = ESTADO_OPTIONS.find(
    (e) => e.key.toLowerCase() === estadoLabel.toLowerCase()
  );
  return found ? found.id : 1;
}

export function AppointmentManagement({ hasPermission }: AppointmentManagementProps) {
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

  // ── Data from API ──
  const [appointments, setAppointments] = useState<AgendaItem[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoAPI[]>([]);
  const [clientes, setClientes] = useState<ClienteAPI[]>([]);
  const [servicios, setServicios] = useState<ServicioAPI[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [horariosEmpleado, setHorariosEmpleado] = useState<HorarioEmpleado[]>([]);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AgendaItem | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // ── Load all data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        agendaService.getAll(),
        empleadoAgendaService.getAll(),
        clienteService.getAll(),
        servicioAgendaService.getAll(),
        metodoPagoService.getAll(),
        horarioEmpleadoService.getAll(),
        horarioService.getAll(), // fetch base Horario records for the join
      ]);

      const extract = (r: PromiseSettledResult<any>) => {
        if (r.status === 'fulfilled' && r.value) {
          if (Array.isArray(r.value)) return r.value;
          if (Array.isArray(r.value.data)) return r.value.data;
          if (Array.isArray(r.value.$values)) return r.value.$values;
        }
        return [];
      };

      const rawHorariosEmpleado: any[] = extract(results[5]);
      const rawHorarios: any[]         = extract(results[6]);

      // Build a quick lookup: horarioId → Horario
      const horarioMap = new Map<number, any>();
      rawHorarios.forEach((h: any) => horarioMap.set(h.horarioId, h));

      // Enrich each HorarioEmpleado with the day/time data from its parent Horario
      const enrichedHorariosEmpleado: HorarioEmpleado[] = rawHorariosEmpleado.map((he: any) => {
        const base = horarioMap.get(he.horarioId) || {};
        return {
          horarioEmpleadoId: he.horarioEmpleadoId,
          horarioId:         he.horarioId,
          documentoEmpleado: he.documentoEmpleado,
          empleadoNombre:    he.empleadoNombre || '',
          // Prefer fields already in the response; fall back to the joined Horario
          diaSemana:  he.diaSemana  || base.diaSemana  || '',
          horaInicio: he.horaInicio || base.horaInicio || '',
          horaFin:    he.horaFin    || base.horaFin    || '',
        };
      });

      setAppointments(extract(results[0]));
      setEmpleados(extract(results[1]).filter((e: any) => e.estado));
      setClientes(extract(results[2]).filter((c: any) => c.estado));
      setServicios(extract(results[3]).filter((s: any) => s.estado));
      setMetodosPago(extract(results[4]));
      setHorariosEmpleado(enrichedHorariosEmpleado);

      const anyFailed = results.some((r) => r.status === 'rejected');
      if (anyFailed) {
        console.warn('Some agenda endpoints failed:', results);
        toast.error('Algunos datos no se pudieron cargar. Verifica la conexión.');
      }
    } catch (err) {
      console.error('Error loading agenda data:', err);
      toast.error('Error al cargar los datos del agendamiento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Helpers ──
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmado' || s === 'confirmed') return 'bg-green-100 text-green-800 border-green-200';
    if (s === 'pendiente' || s === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (s === 'en progreso' || s === 'in_progress') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'completado' || s === 'completed') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (s === 'cancelado' || s === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
    if (s === 'no show') return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Build servicios name → duration map
  const serviciosMap = new Map<string, number>();
  servicios.forEach((s) => serviciosMap.set(s.nombre, s.duracion));

  // Calculate total duration for an appointment
  const getAppointmentDuration = (apt: AgendaItem) => {
    let total = 0;
    for (const svcName of apt.servicios) {
      total += serviciosMap.get(svcName) ?? 30;
    }
    return total || 30;
  };

  // Format time for display
  const formatTime = (time: string) => {
    return time ? time.substring(0, 5) : '';
  };

  // ── Filters ──
  const filteredAppointments = appointments.filter((apt) => {
    const aptCliente = apt.cliente || '';
    const aptServicios = apt.servicios || [];
    const aptEstado = apt.estado || '';

    const matchesSearch =
      searchTerm === '' ||
      aptCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aptServicios.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' || aptEstado.toLowerCase() === filterStatus.toLowerCase();

    const matchesEmployee =
      filterEmployee === 'all' || apt.documentoEmpleado === filterEmployee;

    return matchesSearch && matchesStatus && matchesEmployee;
  });

  const totalPages = Math.ceil((filteredAppointments.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  // ── Handlers ──
  const handleCreateAppointment = () => {
    setSelectedAppointment(null);
    setShowCreateModal(true);
  };

  const handleEditAppointment = (apt: AgendaItem) => {
    setSelectedAppointment(apt);
    setShowCreateModal(true);
  };

  const handleViewDetail = (apt: AgendaItem) => {
    setSelectedAppointment(apt);
    setShowDetailModal(true);
  };

  const handleDeleteAppointment = (apt: AgendaItem) => {
    const estadoLower = apt.estado.toLowerCase();
    if (estadoLower === 'completado' || estadoLower === 'completed') {
      toast.error('No se puede eliminar una cita que ya ha sido completada');
      return;
    }
    setSelectedAppointment(apt);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      await agendaService.delete(selectedAppointment.agendaId);
      toast.success(`Cita de ${selectedAppointment.cliente} eliminada correctamente`);
      setShowDeleteModal(false);
      setSelectedAppointment(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      toast.error('Error al eliminar la cita');
    }
  };

  const handleSaveAppointment = async (data: any, isEdit: boolean, agendaId?: number) => {
    try {
      if (isEdit && agendaId != null) {
        await agendaService.update(agendaId, data);
        toast.success('Cita actualizada correctamente');
      } else {
        await agendaService.create(data);
        toast.success('Cita registrada correctamente');
      }
      setShowCreateModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving appointment:', err);
      toast.error('Error al guardar la cita');
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando agendamiento...</p>
        </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 duration-300">
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
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmadas</option>
            <option value="en progreso">En Progreso</option>
            <option value="completado">Completadas</option>
            <option value="cancelado">Canceladas</option>
            <option value="no show">No Show</option>
          </select>

          <select
            value={filterEmployee}
            onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los profesionales</option>
            {empleados.map((emp) => (
              <option key={emp.documentoEmpleado} value={emp.documentoEmpleado}>
                {emp.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterEmployee('all'); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 font-medium"
          >
            Limpiar filtros
          </button>
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
                <th className="text-left p-4 font-semibold text-gray-600">Servicios</th>
                <th className="text-left p-4 font-semibold text-gray-600">Profesional</th>
                <th className="text-left p-4 font-semibold text-gray-600">Estado</th>
                <th className="text-left p-4 font-semibold text-gray-600">Método Pago</th>
                <th className="text-left p-4 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map((apt) => (
                <tr key={apt.agendaId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{apt.cliente}</div>
                        <div className="text-xs text-gray-500">{apt.documentoCliente}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {new Date(apt.fechaCita + 'T00:00:00').toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(apt.horaInicio)} ({getAppointmentDuration(apt)} min)
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {apt.servicios.map((svc, i) => (
                        <span
                          key={i}
                          className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full mr-1"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{apt.empleado}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(apt.estado)}`}>
                      {apt.estado}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-700">{apt.metodoPago}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetail(apt)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditAppointment(apt)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Editar cita"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(apt)}
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
          empleados={empleados}
          clientes={clientes}
          serviciosAPI={servicios}
          metodosPago={metodosPago}
          horariosEmpleado={horariosEmpleado}
          allAppointments={appointments}
          serviciosMap={serviciosMap}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveAppointment}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          serviciosMap={serviciosMap}
          getStatusColor={getStatusColor}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAppointment && (
        <DeleteAppointmentModal
          appointment={selectedAppointment}
          serviciosMap={serviciosMap}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteAppointment}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// AppointmentModal — Create / Edit
// ══════════════════════════════════════════

interface AppointmentModalProps {
  appointment: AgendaItem | null;
  empleados: EmpleadoAPI[];
  clientes: ClienteAPI[];
  serviciosAPI: ServicioAPI[];
  metodosPago: MetodoPago[];
  horariosEmpleado: HorarioEmpleado[];
  allAppointments: AgendaItem[];
  serviciosMap: Map<string, number>;
  onClose: () => void;
  onSave: (data: any, isEdit: boolean, agendaId?: number) => Promise<void>;
}

function timeStrToMinutes(time: string): number {
  if (!time) return 0;
  const parts = time.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function AppointmentModal({
  appointment,
  empleados,
  clientes,
  serviciosAPI,
  metodosPago,
  horariosEmpleado,
  allAppointments,
  serviciosMap,
  onClose,
  onSave,
}: AppointmentModalProps) {
  const isEdit = !!appointment;

  // Find initial IDs from the appointment for editing
  const getInitialServiceIds = (): number[] => {
    if (!appointment) return [];
    return appointment.servicios
      .map((name) => {
        const svc = serviciosAPI.find((s) => s.nombre === name);
        return svc ? svc.servicioId : null;
      })
      .filter((id): id is number => id !== null);
  };

  const getInitialMetodoPagoId = (): number => {
    if (!appointment) return metodosPago.length > 0 ? metodosPago[0].metodopagoId : 0;
    const mp = metodosPago.find((m) => m.nombre === appointment.metodoPago);
    return mp ? mp.metodopagoId : (metodosPago.length > 0 ? metodosPago[0].metodopagoId : 0);
  };

  const [formData, setFormData] = useState({
    documentoCliente: appointment?.documentoCliente || '',
    documentoEmpleado: appointment?.documentoEmpleado || '',
    fechaCita: appointment?.fechaCita || new Date().toISOString().split('T')[0],
    horaInicio: appointment ? appointment.horaInicio.substring(0, 5) : '09:00',
    metodoPagoId: getInitialMetodoPagoId(),
    observaciones: '',
    serviciosIds: getInitialServiceIds(),
    estadoId: appointment ? getEstadoId(appointment.estado) : 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isCompleted = appointment?.estado.toLowerCase() === 'completado';

  // ── Computed values ──
  const selectedServiceObjects = formData.serviciosIds
    .map((id) => serviciosAPI.find((s) => s.servicioId === id))
    .filter((s): s is ServicioAPI => s !== undefined);

  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duracion, 0);
  const totalCost = selectedServiceObjects.reduce((sum, s) => sum + s.precio, 0);

  // ── Service management ──
  const addServiceSlot = () => {
    setFormData({ ...formData, serviciosIds: [...formData.serviciosIds, 0] });
  };

  const removeServiceSlot = (index: number) => {
    const newIds = formData.serviciosIds.filter((_, i) => i !== index);
    setFormData({ ...formData, serviciosIds: newIds });
  };

  const updateServiceSlot = (index: number, servicioId: number) => {
    const newIds = [...formData.serviciosIds];
    newIds[index] = servicioId;
    setFormData({ ...formData, serviciosIds: newIds });
  };

  // ── Employee availability ──
  const checkEmployeeOccupied = (empDoc: string): boolean => {
    if (!formData.fechaCita || !formData.horaInicio || totalDuration <= 0) return false;
    return isEmployeeOccupied(
      empDoc,
      formData.fechaCita,
      formData.horaInicio,
      totalDuration,
      allAppointments,
      serviciosMap,
      isEdit ? appointment!.agendaId : undefined
    );
  };

  // Normalize a string for comparison: lower case + remove common accented chars
  const normDay = (s: string) =>
    s.toLowerCase()
      .replace(/\u00e9/g, 'e').replace(/\u00e1/g, 'a')
      .replace(/\u00ed/g, 'i').replace(/\u00f3/g, 'o')
      .replace(/\u00fa/g, 'u').replace(/\u00e0/g, 'a')
      .replace(/\u00e8/g, 'e').replace(/\u00ec/g, 'i')
      .replace(/\u00f2/g, 'o').replace(/\u00f9/g, 'u');

  // Check if an employee has a schedule covering the selected day & time window
  const checkEmployeeHasSchedule = (empDoc: string): boolean => {
    // If no date selected yet, show all as available
    if (!formData.fechaCita) return true;
    // If horariosEmpleado hasn't loaded yet, don't block
    if (horariosEmpleado.length === 0) return true;

    const dateObj = new Date(formData.fechaCita + 'T00:00:00');
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayName = dayNames[dateObj.getDay()];

    // Filter schedules for this employee on this weekday (accent-insensitive)
    const schedules = horariosEmpleado.filter(
      (h) => String(h.documentoEmpleado) === String(empDoc) && normDay(h.diaSemana || '') === dayName
    );

    if (schedules.length === 0) return false; // no schedule for that weekday

    // If no time/services yet, just confirm the employee works that day
    if (!formData.horaInicio || totalDuration <= 0) return true;

    const proposedStart = timeStrToMinutes(formData.horaInicio);
    const proposedEnd = proposedStart + totalDuration;

    return schedules.some((sched) => {
      const schedStart = timeStrToMinutes(sched.horaInicio);
      const schedEnd = timeStrToMinutes(sched.horaFin);
      return proposedStart >= schedStart && proposedEnd <= schedEnd;
    });
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) return;

    const newErrors: Record<string, string> = {};
    if (!formData.documentoCliente) newErrors.documentoCliente = 'Selecciona un cliente';
    if (!formData.documentoEmpleado) newErrors.documentoEmpleado = 'Selecciona un profesional';
    if (formData.serviciosIds.length === 0) newErrors.services = 'Agrega al menos un servicio';
    if (!formData.fechaCita) newErrors.fechaCita = 'Selecciona una fecha';
    if (!formData.horaInicio) newErrors.horaInicio = 'Selecciona una hora';
    if (!formData.metodoPagoId) newErrors.metodoPagoId = 'Selecciona un método de pago';

    // Validate all services are selected
    formData.serviciosIds.forEach((id, index) => {
      if (!id || id === 0) {
        newErrors[`service_${index}`] = 'Selecciona un servicio';
      }
    });

    // Check availability
    if (formData.documentoEmpleado && formData.fechaCita && formData.horaInicio && totalDuration > 0) {
      if (checkEmployeeOccupied(formData.documentoEmpleado)) {
        newErrors.horaInicio = 'El profesional ya tiene una cita en este horario. Los horarios se solapan.';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const hora = formData.horaInicio.length === 5 ? formData.horaInicio + ':00' : formData.horaInicio;
      const obs = formData.observaciones || 'Sin observaciones';

      const payload: any = {
        documentoCliente: formData.documentoCliente,
        DocumentoCliente: formData.documentoCliente,
        documentoEmpleado: formData.documentoEmpleado,
        DocumentoEmpleado: formData.documentoEmpleado,
        fechaCita: formData.fechaCita,
        FechaCita: formData.fechaCita,
        horaInicio: hora,
        HoraInicio: hora,
        metodoPagoId: formData.metodoPagoId,
        MetodoPagoId: formData.metodoPagoId,
        observaciones: obs,
        Observaciones: obs,
        serviciosIds: formData.serviciosIds.filter((id) => id > 0),
        ServiciosIds: formData.serviciosIds.filter((id) => id > 0),
        estadoId: formData.estadoId, // Add this just in case backend expects it
        EstadoId: formData.estadoId, // Add this just in case backend expects it
      };

      if (isEdit) {
        await onSave(payload, true, appointment!.agendaId);
      } else {
        await onSave(payload, false);
      }
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  // ── Calculate end time display ──
  const getEndTimeDisplay = () => {
    if (!formData.horaInicio || totalDuration <= 0) return '';
    const [h, m] = formData.horaInicio.split(':').map(Number);
    const totalMin = h * 60 + m + totalDuration;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {isEdit ? 'Editar Cita' : 'Registrar Cita'}
              </h3>
              <p className="text-pink-100">
                {isEdit
                  ? 'Actualiza la información de la cita'
                  : 'Registra una nueva cita en el sistema'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Cliente y Fecha */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Cliente *</label>
              <select
                value={formData.documentoCliente}
                onChange={(e) => setFormData({ ...formData, documentoCliente: e.target.value })}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.documentoCliente ? 'border-red-300' : 'border-gray-300'
                  } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map((cli) => (
                  <option key={cli.documentoCliente} value={cli.documentoCliente}>
                    {cli.nombre} - {cli.documentoCliente}
                  </option>
                ))}
              </select>
              {errors.documentoCliente && (
                <p className="text-red-500 text-sm mt-1">{errors.documentoCliente}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Fecha *</label>
              <input
                type="date"
                value={formData.fechaCita}
                onChange={(e) => setFormData({ ...formData, fechaCita: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.fechaCita ? 'border-red-300' : 'border-gray-300'
                  } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.fechaCita && (
                <p className="text-red-500 text-sm mt-1">{errors.fechaCita}</p>
              )}
            </div>
          </div>

          {/* Hora y Método de Pago */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Hora de Inicio *</label>
              <input
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.horaInicio ? 'border-red-300' : 'border-gray-300'
                  } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.horaInicio && (
                <p className="text-red-500 text-sm mt-1">{errors.horaInicio}</p>
              )}
              {totalDuration > 0 && formData.horaInicio && (
                <p className="text-sm text-purple-600 mt-1">
                  Hora fin estimada: <strong>{getEndTimeDisplay()}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Método de Pago *</label>
              <select
                value={formData.metodoPagoId}
                onChange={(e) =>
                  setFormData({ ...formData, metodoPagoId: parseInt(e.target.value) })
                }
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.metodoPagoId ? 'border-red-300' : 'border-gray-300'
                  } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value={0}>Seleccionar método...</option>
                {metodosPago.map((mp) => (
                  <option key={mp.metodopagoId} value={mp.metodopagoId}>
                    {mp.nombre}
                  </option>
                ))}
              </select>
              {errors.metodoPagoId && (
                <p className="text-red-500 text-sm mt-1">{errors.metodoPagoId}</p>
              )}
            </div>
          </div>

          {/* Servicios */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block font-semibold text-gray-700">Servicios *</label>
              <button
                type="button"
                onClick={addServiceSlot}
                disabled={isCompleted}
                className={`bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all flex items-center space-x-2 ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Servicio</span>
              </button>
            </div>

            {formData.serviciosIds.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 mb-3 pb-2 border-b-2 border-gray-300">
                  <div className="col-span-6">
                    <span className="font-semibold text-gray-700">Servicio</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Duración</span>
                  </div>
                  <div className="col-span-3">
                    <span className="font-semibold text-gray-700">Precio</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Service Rows */}
                <div className="space-y-3">
                  {formData.serviciosIds.map((svcId, index) => {
                    const svcObj = serviciosAPI.find((s) => s.servicioId === svcId);
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div className="col-span-6">
                          <select
                            value={svcId}
                            onChange={(e) => updateServiceSlot(index, parseInt(e.target.value))}
                            disabled={isCompleted}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-300 ${errors[`service_${index}`] ? 'border-red-300' : 'border-gray-300'
                              } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          >
                            <option value={0}>Seleccionar servicio...</option>
                            {serviciosAPI.map((s) => (
                              <option key={s.servicioId} value={s.servicioId}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                          {errors[`service_${index}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`service_${index}`]}</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-700">
                            {svcObj ? `${svcObj.duracion} min` : '-'}
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                            ${svcObj ? svcObj.precio.toLocaleString() : '0'}
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeServiceSlot(index)}
                            disabled={isCompleted}
                            className={`p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
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

          {/* Profesional */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Profesional *</label>
            {formData.fechaCita && horariosEmpleado.length === 0 && (
              <div className="mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                ⚠️ No se pudieron cargar los horarios de empleados. Todos aparecen como disponibles.
              </div>
            )}
            {formData.fechaCita && horariosEmpleado.length > 0 && (
              <p className="text-sm text-gray-500 mb-2">
                Profesionales sin horario ese d\u00eda o que est\u00e9n ocupados aparecer\u00e1n en gris y no podr\u00e1n seleccionarse.
              </p>
            )}
            <select
              value={formData.documentoEmpleado}
              onChange={(e) => setFormData({ ...formData, documentoEmpleado: e.target.value })}
              disabled={isCompleted}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.documentoEmpleado ? 'border-red-300' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">Seleccionar profesional...</option>
              {empleados.map((emp) => {
                const occupied = checkEmployeeOccupied(emp.documentoEmpleado);
                const hasSchedule = checkEmployeeHasSchedule(emp.documentoEmpleado);

                const isDisabled = occupied || !hasSchedule;
                const suffix = !hasSchedule
                  ? ' — Sin horario ese d\u00eda'
                  : occupied
                  ? ' — Ocupado'
                  : '';
                return (
                  <option
                    key={emp.documentoEmpleado}
                    value={emp.documentoEmpleado}
                    disabled={isDisabled}
                    style={isDisabled ? { color: '#9ca3af', backgroundColor: '#f3f4f6' } : {}}
                  >
                    {emp.nombre}{suffix}
                  </option>
                );
              })}
            </select>
            {errors.documentoEmpleado && (
              <p className="text-red-500 text-sm mt-1">{errors.documentoEmpleado}</p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              disabled={isCompleted}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              rows={3}
              placeholder="Observaciones, instrucciones especiales..."
            />
          </div>

          {/* Estado - Only when editing */}
          {isEdit && (
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Estado *</label>
              <select
                value={formData.estadoId}
                onChange={(e) => setFormData({ ...formData, estadoId: parseInt(e.target.value) })}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${isCompleted ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300'
                  }`}
              >
                {ESTADO_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
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
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl hover:shadow-lg font-semibold transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEdit ? 'Actualizar' : 'Crear'} Cita</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// AppointmentDetailModal
// ══════════════════════════════════════════

interface DetailModalProps {
  appointment: AgendaItem;
  serviciosMap: Map<string, number>;
  getStatusColor: (status: string) => string;
  onClose: () => void;
}

function AppointmentDetailModal({ appointment, serviciosMap, getStatusColor, onClose }: DetailModalProps) {
  const totalDuration = appointment.servicios.reduce(
    (sum, svc) => sum + (serviciosMap.get(svc) ?? 30),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white rounded-t-3xl shrink-0">
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

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Badge */}
          <div className="flex justify-center">
            <span
              className={`px-6 py-2 rounded-full font-semibold border text-lg ${getStatusColor(
                appointment.estado
              )}`}
            >
              {appointment.estado}
            </span>
          </div>

          {/* Date, Time & Duration */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Fecha y Hora
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Fecha</div>
                <div className="font-semibold text-gray-800 text-lg">
                  {new Date(appointment.fechaCita + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Hora de Inicio</div>
                <div className="font-semibold text-gray-800 text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  {appointment.horaInicio.substring(0, 5)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Duración Estimada</div>
                <div className="font-semibold text-gray-800">{totalDuration} minutos</div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Cliente
            </h4>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">{appointment.cliente}</div>
                <div className="text-sm text-gray-600">Doc: {appointment.documentoCliente}</div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-pink-600" />
              Servicios
            </h4>
            <div className="space-y-2">
              {appointment.servicios.map((svc, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-pink-100">
                  <span className="font-semibold text-gray-800">{svc}</span>
                  <span className="text-sm text-gray-600">{serviciosMap.get(svc) ?? '?'} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Info */}
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
                <div className="font-semibold text-gray-800">{appointment.empleado}</div>
                <div className="text-sm text-gray-600">Doc: {appointment.documentoEmpleado}</div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
              Método de Pago
            </h4>
            <div className="font-semibold text-gray-800 text-lg">{appointment.metodoPago}</div>
          </div>

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

// ══════════════════════════════════════════
// DeleteAppointmentModal
// ══════════════════════════════════════════

interface DeleteModalProps {
  appointment: AgendaItem;
  serviciosMap: Map<string, number>;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteAppointmentModal({ appointment, serviciosMap, onClose, onConfirm }: DeleteModalProps) {
  const totalDuration = appointment.servicios.reduce(
    (sum, svc) => sum + (serviciosMap.get(svc) ?? 30),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
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
              ¿Estás segura de que quieres eliminar la cita de{' '}
              <strong>{appointment.cliente}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="font-semibold text-gray-800">
                  {new Date(appointment.fechaCita + 'T00:00:00').toLocaleDateString('es-ES')} a las{' '}
                  {appointment.horaInicio.substring(0, 5)}
                </div>
                <div className="text-sm text-gray-600">Duración: {totalDuration} minutos</div>
                <div className="text-sm text-gray-600">
                  Servicios: {appointment.servicios.join(', ')}
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