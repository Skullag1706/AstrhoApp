import {
  Calendar, Clock, Users, Plus,
  CheckCircle, AlertCircle, XCircle, Edit, Eye, Trash2,
  Save, X, User, Phone, DollarSign, Search, Loader2, RefreshCw, Scissors, TrendingUp,
  Check, ChevronsUpDown
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SimplePagination } from '../ui/simple-pagination';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '../ui/utils';
import {
  agendaService, metodoPagoService, empleadoAgendaService,
  clienteService, servicioAgendaService, estadoAgendaService, isEmployeeOccupied,
  AgendaItem, MetodoPago, EmpleadoAPI, ClienteAPI, ServicioAPI, EstadoAgenda
} from '../../services/agendaService';
import { horarioEmpleadoService, horarioService, HorarioEmpleado } from '../../services/scheduleService';
// processImageSource and handleImageError removed as they are no longer needed here

interface AppointmentManagementProps {
  hasPermission: (permission: string) => boolean;
  currentUser: any;
}

// getEstadoId now resolved dynamically inside the component using loaded estados

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
  const [baseHorarios, setBaseHorarios] = useState<any[]>([]);
  const [estadosAgenda, setEstadosAgenda] = useState<EstadoAgenda[]>([
    { estadoId: 1, nombre: 'Pendiente' },
    { estadoId: 2, nombre: 'Confirmado' },
    { estadoId: 3, nombre: 'Cancelado' },
    { estadoId: 4, nombre: 'Completado' },
    { estadoId: 5, nombre: 'Sin Agendar' },
  ]);

  // ── UI state ──
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AgendaItem | null>(null);
  const [appointmentToChangeStatus, setAppointmentToChangeStatus] = useState<{apt: AgendaItem, newStatusId: number} | null>(null);
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
        estadoAgendaService.getAll(), // fetch real estados from API
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
      setBaseHorarios(rawHorarios.filter((h: any) => h.estado));
      // Load real estados from API (results[7]), fall back to defaults if failed
      const rawEstados = extract(results[7]).filter((e: any) => e.estadoId > 0 && e.nombre);
      if (rawEstados.length > 0) setEstadosAgenda(rawEstados);

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
    const s = (status || '').toLowerCase();
    if (s === 'confirmado' || s === 'confirmed') return 'bg-green-100 text-green-800 border-green-200';
    if (s === 'pendiente' || s === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (s === 'sin agendar') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (s === 'completado' || s === 'completed') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (s === 'cancelado' || s === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Helper: get estadoId from label using loaded estados
  const getEstadoId = (estadoLabel: string): number => {
    const found = estadosAgenda.find(
      (e) => e.nombre.toLowerCase() === estadoLabel.toLowerCase()
    );
    return found ? found.estadoId : 1;
  };

  // ID for 'Completado' (used to trigger sale creation)
  const completadoId = estadosAgenda.find((e) => e.nombre.toLowerCase() === 'completado')?.estadoId ?? 4;

  // Build servicios name → duration map
  const serviciosMap = new Map<string, number>();
  servicios.forEach((s) => serviciosMap.set(s.nombre, s.duracion));

  // Build servicios name → price map
  const preciosMap = new Map<string, number>();
  servicios.forEach((s) => preciosMap.set(s.nombre, s.precio));

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
        if (data?.estadoId === completadoId) {
          setAlertMessage('Venta creada automáticamente a partir de la cita completada');
          setShowSuccessAlert(true);
        }
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

  const handleStatusChangeClick = (apt: AgendaItem, newStatusId: number) => {
    setAppointmentToChangeStatus({ apt, newStatusId });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!appointmentToChangeStatus) return;
    const { apt, newStatusId } = appointmentToChangeStatus;
    
    try {
      const servicioIds = apt.servicios.map((name) => {
         const svc = servicios.find((s) => s.nombre.trim().toLowerCase() === name.trim().toLowerCase());
         return svc ? svc.servicioId : 0;
      }).filter(id => id > 0);

      const mp = metodosPago.find(m => m.nombre.trim().toLowerCase() === apt.metodoPago.trim().toLowerCase());
      const metodoPagoId = mp ? mp.metodopagoId : (metodosPago.length > 0 ? metodosPago[0].metodopagoId : 0);

      const observaciones = (apt as any).observaciones || 'Cambio de estado manual';
      const hora = apt.horaInicio.length === 5 ? apt.horaInicio + ':00' : apt.horaInicio;
      const fecha = apt.fechaCita.split('T')[0];

      const payload = {
        agendaId: apt.agendaId,
        AgendaId: apt.agendaId,
        documentoCliente: apt.documentoCliente,
        DocumentoCliente: apt.documentoCliente,
        documentoEmpleado: apt.documentoEmpleado,
        DocumentoEmpleado: apt.documentoEmpleado,
        fechaCita: fecha,
        FechaCita: fecha,
        horaInicio: hora,
        HoraInicio: hora,
        metodoPagoId: metodoPagoId,
        MetodoPagoId: metodoPagoId,
        observaciones: observaciones,
        Observaciones: observaciones,
        serviciosIds: servicioIds,
        ServiciosIds: servicioIds,
        estadoId: newStatusId,
        EstadoId: newStatusId
      };

      await handleSaveAppointment(payload, true, apt.agendaId);
      setShowStatusModal(false);
      setAppointmentToChangeStatus(null);
    } catch (error) {
       console.error("Error changing status", error);
       toast.error('Error al cambiar el estado');
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
            {estadosAgenda.map((est) => (
              <option key={est.estadoId} value={est.nombre.toLowerCase()}>
                {est.nombre}
              </option>
            ))}
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
              {paginatedAppointments.map((apt) => {
                const estadoLower = apt.estado.toLowerCase();
                const isLocked = estadoLower === 'completado' || estadoLower === 'completed' || estadoLower === 'cancelado' || estadoLower === 'cancelled';
                
                return (
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
                    {isLocked || !hasPermission('manage_appointments') ? (
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border inline-block ${getStatusColor(apt.estado)}`}>
                        {apt.estado}
                      </span>
                    ) : (
                      <select
                        value={getEstadoId(apt.estado)}
                        onChange={(e) => handleStatusChangeClick(apt, Number(e.target.value))}
                        className={`px-3 py-1 rounded-full text-sm font-bold border-2 cursor-pointer transition-all duration-200 focus:outline-none ${getStatusColor(apt.estado)}`}
                      >
                        {estadosAgenda.map((est) => (
                          <option key={est.estadoId} value={est.estadoId}>
                            {est.nombre}
                          </option>
                        ))}
                      </select>
                    )}
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
                        disabled={isLocked}
                        className={`p-2 rounded-lg transition-colors ${isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
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
              )})}
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
          estadosAgenda={estadosAgenda}
          baseHorarios={baseHorarios}
          initialEmployee={filterEmployee}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveAppointment}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          servicios={servicios}
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

      {/* Status Change Modal */}
      {showStatusModal && appointmentToChangeStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Confirmar Cambio de Estado</h3>
                <p className="text-gray-600">¿Estás seguro de cambiar el estado?</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Se cambiará el estado de la cita de <strong>{appointmentToChangeStatus.apt.cliente}</strong> a{' '}
              <strong>{estadosAgenda.find(e => e.estadoId === appointmentToChangeStatus.newStatusId)?.nombre}</strong>.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setAppointmentToChangeStatus(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
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
  estadosAgenda: EstadoAgenda[];
  baseHorarios: any[];
  initialEmployee: string;
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
  estadosAgenda,
  baseHorarios,
  initialEmployee,
  onClose,
  onSave,
}: AppointmentModalProps) {
  const isEdit = !!appointment;

  // Resolve estadoId from label using the loaded estados
  const resolveEstadoId = (label: string): number => {
    const found = estadosAgenda.find(
      (e) => e.nombre.toLowerCase() === label.toLowerCase()
    );
    return found ? found.estadoId : 1;
  };

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
    documentoEmpleado: appointment?.documentoEmpleado || (initialEmployee !== 'all' ? initialEmployee : ''),
    fechaCita: appointment?.fechaCita || new Date().toISOString().split('T')[0],
    horaInicio: appointment ? appointment.horaInicio.substring(0, 5) : '09:00',
    metodoPagoId: getInitialMetodoPagoId(),
    observaciones: '',
    serviciosIds: getInitialServiceIds(),
    estadoId: appointment ? resolveEstadoId(appointment.estado) : 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [openClientSelect, setOpenClientSelect] = useState(false);
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
    // Check if this ID is already selected in ANOTHER slot
    if (servicioId > 0 && formData.serviciosIds.some((id, i) => id === servicioId && i !== index)) {
      toast.error('Este servicio ya ha sido seleccionado');
      return;
    }
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

    // If no specific schedule records found for this employee on this day, 
    // they are considered unavailable (no fallback to salon hours).
    if (schedules.length === 0) return false;

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


  const generateAvailableSlots = useCallback(() => {
    if (!formData.fechaCita || !formData.documentoEmpleado || totalDuration <= 0) {
      setAvailableSlots([]);
      return;
    }

    const dateObj = new Date(formData.fechaCita + 'T00:00:00');
    const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayName = dayNames[dateObj.getDay()];

    const empSchedules = horariosEmpleado.filter(
      (h) => String(h.documentoEmpleado) === String(formData.documentoEmpleado) && normDay(h.diaSemana || '') === dayName
    );

    let effectiveSchedules = empSchedules;
    if (effectiveSchedules.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots: string[] = [];
    const interval = 15; // 15-minute granularity for slots

    effectiveSchedules.forEach((sched) => {
      const startMin = timeStrToMinutes(sched.horaInicio);
      const endMin = timeStrToMinutes(sched.horaFin);

      // Generate possible start times within this schedule
      for (let current = startMin; current + totalDuration <= endMin; current += interval) {
        const hh = Math.floor(current / 60);
        const mm = current % 60;
        const timeStr = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

        const occupied = isEmployeeOccupied(
          formData.documentoEmpleado,
          formData.fechaCita,
          timeStr,
          totalDuration,
          allAppointments,
          serviciosMap,
          isEdit ? appointment!.agendaId : undefined
        );

        if (!occupied) {
          slots.push(timeStr);
        }
      }
    });

    setAvailableSlots(slots);
  }, [
    formData.fechaCita,
    formData.documentoEmpleado,
    totalDuration,
    horariosEmpleado,
    baseHorarios,
    allAppointments,
    serviciosMap,
    isEdit,
    appointment
  ]);

  useEffect(() => {
    generateAvailableSlots();
  }, [generateAvailableSlots]);

  // Ensure current selected time is valid reset if not in available slots (unless editing and no changes yet)
  useEffect(() => {
    if (availableSlots.length > 0 && formData.horaInicio) {
      if (!availableSlots.includes(formData.horaInicio)) {
        // If editing, only reset if something affecting availability changed
        // For simplicity, we'll keep the value if it's the original one
        const isOriginalTime = isEdit && appointment?.horaInicio.substring(0, 5) === formData.horaInicio;
        if (!isOriginalTime) {
          // Do not auto-reset to index 0 immediately to avoid UX jump, but maybe show error
        }
      }
    }
  }, [availableSlots, formData.horaInicio, isEdit, appointment]);

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
        agendaId: isEdit && appointment ? appointment.agendaId : 0,
        AgendaId: isEdit && appointment ? appointment.agendaId : 0,
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
          {/* Cliente con Búsqueda Integrada (Custom Style) */}
          <div className="bg-pink-50/30 p-4 rounded-2xl border border-pink-100">
            <label className="block font-semibold text-gray-700 mb-2">Cliente *</label>
            <ClientSearchSelect
              clients={clientes}
              selectedDocument={formData.documentoCliente}
              onSelect={(cli: ClienteAPI) => setFormData({ ...formData, documentoCliente: cli.documentoCliente })}
              error={errors.documentoCliente}
              disabled={isCompleted}
            />
            {errors.documentoCliente && (
              <p className="text-red-500 text-sm mt-1">{errors.documentoCliente}</p>
            )}
          </div>

          {/* Fecha y Método de Pago */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Fecha *</label>
              <input
                type="date"
                value={formData.fechaCita}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, fechaCita: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.fechaCita ? 'border-red-300' : 'border-gray-300'
                } ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.fechaCita && (
                <p className="text-red-500 text-sm mt-1">{errors.fechaCita}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Método de Pago *</label>
              <select
                value={formData.metodoPagoId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, metodoPagoId: parseInt(e.target.value) })
                }
                disabled={isCompleted}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.metodoPagoId ? 'border-red-300' : 'border-gray-300'
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

          {/* Profesional y Hora Inicio */}
          <div className="grid md:grid-cols-2 gap-4">
             <div className="relative">
              <label className="block font-semibold text-gray-700 mb-2">Profesional *</label>
              <ProfessionalSearchSelect
                empleados={empleados}
                selectedDocument={formData.documentoEmpleado}
                onSelect={(emp) => setFormData({ ...formData, documentoEmpleado: emp.documentoEmpleado })}
                checkEmployeeOccupied={checkEmployeeOccupied}
                checkEmployeeHasSchedule={checkEmployeeHasSchedule}
                disabled={isCompleted}
                error={!!errors.documentoEmpleado}
              />
              {errors.documentoEmpleado && (
                <p className="text-red-500 text-sm mt-1">{errors.documentoEmpleado}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">Hora de Inicio *</label>
              <select
                value={formData.horaInicio}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, horaInicio: e.target.value })}
                disabled={isCompleted || availableSlots.length === 0}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.horaInicio ? 'border-red-300' : 'border-gray-300'
                } ${isCompleted || availableSlots.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                {availableSlots.length === 0 ? (
                  <option value="">No hay horas disponibles</option>
                ) : (
                  <>
                    {!availableSlots.includes(formData.horaInicio) && (
                      <option value="">Selecciona una hora...</option>
                    )}
                    {availableSlots.map((slot: string) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.horaInicio && (
                <p className="text-red-500 text-sm mt-1">{errors.horaInicio}</p>
              )}
              {totalDuration > 0 && formData.horaInicio && (
                <p className="text-sm text-purple-600 mt-1">
                  Hora fin estimada: <strong>{getEndTimeDisplay()}</strong>
                </p>
              )}
              {availableSlots.length === 0 && formData.documentoEmpleado && formData.fechaCita && (
                <p className="text-xs text-red-500 mt-1">
                  Primero debe seleccionar un servicio.
                </p>
              )}
            </div>
          </div>

          {/* Servicios */}
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <label className="block font-bold text-gray-800 text-lg">Servicios Seleccionados</label>
                <p className="text-sm text-gray-500">Agrega los servicios que se realizarán en la cita</p>
              </div>
              <button
                type="button"
                onClick={addServiceSlot}
                disabled={isCompleted || formData.serviciosIds.length >= serviciosAPI.length}
                className={`bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 ${isCompleted || formData.serviciosIds.length >= serviciosAPI.length ? 'opacity-50 cursor-not-allowed' : ''
                   }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Servicio</span>
              </button>
            </div>

            {formData.serviciosIds.length > 0 ? (
              <div className="space-y-4">
                {/* Service Cards */}
                <div className="grid gap-4">
                  {formData.serviciosIds.map((svcId, index) => {
                    const svcObj = serviciosAPI.find((s) => s.servicioId === svcId);
                    return (
                      <div
                        key={index}
                        className="group relative bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-pink-200 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:border-pink-200 transition-colors">
                            <Scissors className="w-5 h-5 text-pink-400" />
                          </div>

                          {/* Select Service */}
                          <div className="flex-1 min-w-0">
                            <select
                              value={svcId}
                              onChange={(e) => updateServiceSlot(index, parseInt(e.target.value))}
                              disabled={isCompleted}
                              className={`w-full bg-transparent font-bold text-gray-800 border-none p-0 focus:ring-0 text-sm ${isCompleted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <option value={0}>Selecciona un servicio...</option>
                              {serviciosAPI.map((s) => {
                                const isSelectedElsewhere = formData.serviciosIds.some(id => id === s.servicioId && id !== svcId);
                                return (
                                  <option 
                                    key={s.servicioId} 
                                    value={s.servicioId}
                                    disabled={isSelectedElsewhere}
                                  >
                                    {s.nombre} {isSelectedElsewhere ? '(Ya seleccionado)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Info: Duration & Price */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {svcObj ? `${svcObj.duracion}m` : '-'}
                            </div>
                            <div className="flex items-center text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg text-xs">
                              <DollarSign className="w-3 h-3 mr-0.5" />
                              {svcObj ? svcObj.precio.toLocaleString() : '0'}
                            </div>
                          </div>

                          {/* Delete Action */}
                          <div className="flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={() => removeServiceSlot(index)}
                              disabled={isCompleted}
                              className={`p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all ${isCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                              title="Eliminar servicio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {errors[`service_${index}`] && (
                          <p className="text-red-500 text-xs mt-2 ml-16">{errors[`service_${index}`]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals Section */}
                <div className="mt-8 relative overflow-hidden bg-pink-50/50 p-6 rounded-3xl text-gray-900 border border-pink-100 shadow-sm">
                  {/* Decorative blobs - softened for light background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/20 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-black text-xs font-bold uppercase tracking-wider mb-1">Duración Total</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">{totalDuration}</span>
                          <span className="text-black font-medium">minutos</span>
                        </div>
                      </div>
                      <div className="w-px h-10 bg-pink-200/50 hidden md:block" />
                      <div className="flex flex-col">
                        <span className="text-black text-xs font-bold uppercase tracking-wider mb-1">Items</span>
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">{formData.serviciosIds.length}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end">
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Monto Total a Pagar</span>
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                          ${totalCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(
                "text-center py-10 border-2 border-dashed rounded-3xl transition-all duration-300",
                errors.services 
                  ? "border-red-300 bg-red-50/30" 
                  : "border-gray-200 bg-white/50"
              )}>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors",
                  errors.services ? "bg-red-100" : "bg-pink-50"
                )}>
                  <Plus className={cn(
                    "w-8 h-8",
                    errors.services ? "text-red-400" : "text-pink-300"
                  )} />
                </div>
                <h4 className={cn(
                  "font-bold mb-1",
                  errors.services ? "text-red-600" : "text-gray-600"
                )}>
                  {errors.services ? "Se debe agregar al menos un servicio" : "No hay servicios agregados"}
                </h4>
                <p className={cn(
                  "text-sm mb-4",
                  errors.services ? "text-red-400" : "text-gray-400"
                )}>
                  Haz clic en el botón superior para comenzar
                </p>
                {errors.services && (
                  <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold animate-bounce">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Campo requerido
                  </div>
                )}
              </div>
            )}
            {errors.services && <p className="text-red-500 text-sm mt-2 text-center font-medium">{errors.services}</p>}
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
                {estadosAgenda.map((est) => (
                  <option key={est.estadoId} value={est.estadoId}>
                    {est.nombre}
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
  servicios: ServicioAPI[];
  getStatusColor: (status: string) => string;
  onClose: () => void;
}

function AppointmentDetailModal({ appointment, servicios, getStatusColor, onClose }: DetailModalProps) {
  // Find full service objects for the selected names
  const appointmentServices = appointment.servicios.map(name => {
    return servicios.find(s => s.nombre.toLowerCase().trim() === name.toLowerCase().trim());
  });

  const totalDuration = appointmentServices.reduce(
    (sum, svc) => sum + (svc?.duracion ?? 30),
    0
  );

  const totalAmount = appointmentServices.reduce(
    (sum, svc) => sum + (svc?.precio ?? 0),
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

        <div className="p-6 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
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
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-3 text-purple-600" />
              Fecha y Hora
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/60 p-3 rounded-2xl border border-white/80">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Fecha</div>
                <div className="font-bold text-gray-800">
                  {new Date(appointment.fechaCita + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl border border-white/80">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Hora de Inicio</div>
                <div className="font-bold text-gray-800 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-purple-600" />
                  {appointment.horaInicio.substring(0, 5)}
                </div>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl border border-white/80">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Duración Total</div>
                <div className="font-bold text-gray-800 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-pink-500" />
                  {totalDuration} minutos
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
              <User className="w-5 h-5 mr-3 text-blue-600" />
              Información del Cliente
            </h4>
            <div className="flex items-center bg-white p-4 rounded-2xl border border-blue-100/50">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mr-4 shadow-md rotate-3">
                <User className="w-7 h-7 text-white -rotate-3" />
              </div>
              <div>
                <div className="font-black text-gray-800 text-lg leading-tight">{appointment.cliente}</div>
                <div className="text-blue-600 font-bold text-xs uppercase tracking-wider mt-0.5">Documento: {appointment.documentoCliente}</div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-200/50 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-gray-800 flex items-center text-lg">
                <Scissors className="w-5 h-5 mr-3 text-pink-500" />
                Servicios Contratados
              </h4>
              <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {appointmentServices.length} ITEMS
              </span>
            </div>
            
            <div className="grid gap-3">
              {appointmentServices.map((svc, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 hover:border-pink-200 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0 border border-gray-50">
                    <Scissors className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate text-sm">{svc?.nombre || String(appointment.servicios[i])}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg flex items-center uppercase">
                      <Clock className="w-3 h-3 mr-1" />
                      {svc?.duracion ?? '?'}m
                    </span>
                    <div className="font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm">
                      ${(svc?.precio ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-gray-300 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Método de Pago</span>
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-xl font-bold">
                  <DollarSign className="w-4 h-4" />
                  {appointment.metodoPago}
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total a Pagar</span>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  ${totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="bg-green-50/50 rounded-xl p-6 border border-green-100 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
              <Users className="w-5 h-5 mr-3 text-green-600" />
              Profesional Asignado
            </h4>
            <div className="flex items-center bg-white p-4 rounded-2xl border border-green-100/50">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-md -rotate-3">
                <Users className="w-7 h-7 text-white rotate-3" />
              </div>
              <div>
                <div className="font-black text-gray-800 text-lg leading-tight">{appointment.empleado}</div>
                <div className="text-green-600 font-bold text-xs uppercase tracking-wider mt-0.5">Documento: {appointment.documentoEmpleado}</div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest shadow-lg"
            >
              Cerrar Detalle
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

// Custom Client Search and Select Component (matches ProductSearchSelect style)
function ClientSearchSelect({ clients, onSelect, selectedDocument, error, disabled }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find((c: any) => c.documentoCliente === selectedDocument);

  const filteredClients = clients.filter((c: any) => {
    if (!c) return false;
    const nombre = (c.nombre || '').toLowerCase();
    const doc = (c.documentoCliente || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return nombre.includes(search) || doc.includes(search);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''}`} ref={dropdownRef}>
      <div
        className={cn(
          "w-full px-4 py-3 min-h-[48px] border rounded-xl flex items-center justify-between cursor-pointer bg-white transition-all",
          error ? 'border-red-300' : 'border-gray-300',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-100'
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {!isOpen && !selectedClient ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            <span className="text-gray-500">Seleccionar cliente...</span>
          </div>
        ) : !isOpen && selectedClient ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            <span className="text-gray-800 font-medium">{selectedClient.nombre}</span>
          </div>
        ) : (
          <div className="flex-1 flex items-center">
            <Search className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </div>
        )}
        <ChevronsUpDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform",
          isOpen && 'rotate-180'
        )} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No se encontraron clientes</div>
            ) : (
              filteredClients.map((client: any) => (
                <div
                  key={client.documentoCliente}
                  className={cn(
                    "px-4 py-3 hover:bg-pink-50 cursor-pointer text-sm flex justify-between items-center transition-colors",
                    client.documentoCliente === selectedDocument ? 'bg-pink-100 text-pink-700 font-semibold' : 'text-gray-800'
                  )}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onSelect(client);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Check
                      className={cn(
                        "h-4 w-4 text-pink-500",
                        client.documentoCliente === selectedDocument ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{client.nombre}</span>
                      <span className="text-xs text-gray-500">{client.documentoCliente}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProfessionalSearchSelectProps {
  empleados: any[];
  selectedDocument: string;
  onSelect: (emp: any) => void;
  checkEmployeeOccupied: (doc: string) => boolean;
  checkEmployeeHasSchedule: (doc: string) => boolean;
  disabled?: boolean;
  error?: boolean;
}

function ProfessionalSearchSelect({
  empleados,
  selectedDocument,
  onSelect,
  checkEmployeeOccupied,
  checkEmployeeHasSchedule,
  disabled,
  error
}: ProfessionalSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEmployee = empleados.find((e) => e.documentoEmpleado === selectedDocument);

  const filteredEmployees = empleados.filter((emp) =>
    emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.documentoEmpleado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 border rounded-xl transition-all cursor-pointer bg-white",
          error ? "border-red-300 ring-red-100" : "border-gray-300 ring-pink-100",
          !disabled && "hover:border-pink-300 focus-within:ring-2",
          disabled && "bg-gray-100 cursor-not-allowed opacity-75"
        )}
      >
        {!isOpen && !selectedEmployee ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            <span className="text-gray-500">Seleccionar profesional...</span>
          </div>
        ) : !isOpen && selectedEmployee ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            <span className="text-gray-800 font-medium">{selectedEmployee.nombre}</span>
          </div>
        ) : (
          <div className="flex-1 flex items-center">
            <Search className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Buscar profesional..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </div>
        )}
        <ChevronsUpDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform",
          isOpen && 'rotate-180'
        )} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[280px] overflow-y-auto py-1">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">No se encontraron profesionales</div>
            ) : (
              filteredEmployees.map((emp: any) => {
                const occupied = checkEmployeeOccupied(emp.documentoEmpleado);
                const isWithinSchedule = checkEmployeeHasSchedule(emp.documentoEmpleado);
                const isDisabled = occupied || !isWithinSchedule;
                const statusText = occupied
                  ? 'Ocupado'
                  : !isWithinSchedule
                  ? 'Fuera de horario'
                  : '';

                return (
                  <div
                    key={emp.documentoEmpleado}
                    className={cn(
                      "px-4 py-3 text-sm flex justify-between items-center transition-colors",
                      emp.documentoEmpleado === selectedDocument ? 'bg-pink-100 text-pink-700 font-semibold' : 'text-gray-800',
                      isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-pink-50 cursor-pointer"
                    )}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (isDisabled) return;
                      onSelect(emp);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Check
                        className={cn(
                          "h-4 w-4 text-pink-500",
                          emp.documentoEmpleado === selectedDocument ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{emp.nombre}</span>
                        {statusText && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                            {statusText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
