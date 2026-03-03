import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, Plus,
  AlertCircle, Edit, Eye, Trash2,
  Save, X, Loader2, RefreshCw
} from 'lucide-react';
import { SimplePagination } from '../ui/simple-pagination';
import {
  horarioService, horarioEmpleadoService, empleadoService,
  Horario, HorarioEmpleado, Empleado, CreateHorarioData, CreateHorarioEmpleadoData
} from '../../services/scheduleService';

interface ScheduleManagementProps {
  hasPermission: (permission: string) => boolean;
}

// ── Helpers ──

const DIAS_SEMANA_OPTIONS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export function ScheduleManagement({ hasPermission }: ScheduleManagementProps) {
  // Data states
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horarioEmpleados, setHorarioEmpleados] = useState<HorarioEmpleado[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // ── Data Loading ──

  const loadData = async () => {
    setLoading(true);
    try {
      const [horariosData, asignacionesData, empleadosData] = await Promise.all([
        horarioService.getAll(),
        horarioEmpleadoService.getAll(),
        empleadoService.getAll()
      ]);
      setHorarios(Array.isArray(horariosData) ? horariosData : []);
      setHorarioEmpleados(Array.isArray(asignacionesData) ? asignacionesData : []);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      showAlert('error', 'Error al cargar los datos de horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Alert Helper ──

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── CRUD Handlers ──

  const handleCreateSchedule = () => {
    setSelectedHorario(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (horario: Horario) => {
    setSelectedHorario(horario);
    setShowScheduleModal(true);
  };

  const handleViewDetail = (horario: Horario) => {
    setSelectedHorario(horario);
    setShowDetailModal(true);
  };

  const handleDeleteSchedule = (horario: Horario) => {
    setSelectedHorario(horario);
    setShowDeleteModal(true);
  };

  const handleAssignEmployee = (horario: Horario) => {
    setSelectedHorario(horario);
    setShowAssignModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!selectedHorario) return;
    setSaving(true);
    try {
      await horarioService.delete(selectedHorario.horarioId);
      showAlert('success', `Horario del ${selectedHorario.diaSemana} eliminado correctamente`);
      setShowDeleteModal(false);
      setSelectedHorario(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showAlert('error', 'Error al eliminar el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (horario: Horario) => {
    try {
      const updatedData: CreateHorarioData = {
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        estado: !horario.estado
      };
      await horarioService.update(horario.horarioId, updatedData);
      showAlert(
        horario.estado ? 'info' : 'success',
        `Horario del ${horario.diaSemana} ${!horario.estado ? 'activado' : 'inactivado'} correctamente`
      );
      await loadData();
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      showAlert('error', 'Error al cambiar el estado del horario');
    }
  };

  const handleSaveSchedule = async (data: CreateHorarioData) => {
    setSaving(true);
    try {
      if (selectedHorario) {
        await horarioService.update(selectedHorario.horarioId, data);
        showAlert('success', `Horario del ${data.diaSemana} actualizado correctamente`);
      } else {
        await horarioService.create(data);
        showAlert('success', `Horario del ${data.diaSemana} registrado correctamente`);
      }
      setShowScheduleModal(false);
      setSelectedHorario(null);
      await loadData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      showAlert('error', 'Error al guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignment = async (data: CreateHorarioEmpleadoData) => {
    setSaving(true);
    try {
      await horarioEmpleadoService.create(data);
      showAlert('success', 'Empleado asignado correctamente');
      setShowAssignModal(false);
      await loadData();
    } catch (error) {
      console.error('Error assigning employee:', error);
      showAlert('error', 'Error al asignar el empleado');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      await horarioEmpleadoService.delete(assignmentId);
      showAlert('info', 'Asignación eliminada correctamente');
      await loadData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      showAlert('error', 'Error al eliminar la asignación');
    }
  };

  // ── Helpers ──

  const getAssignmentsForHorario = (horarioId: number) => {
    return horarioEmpleados.filter(he => he.horarioId === horarioId);
  };

  // Pagination
  const totalPages = Math.ceil(horarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHorarios = horarios.slice(startIndex, startIndex + itemsPerPage);

  // ── Loading State ──

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* ── Alert Banner ── */}
      {alert && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 text-white font-semibold min-w-[340px] max-w-[600px] animate-fade-in ${alert.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : alert.type === 'error'
                ? 'bg-gradient-to-r from-red-500 to-pink-600'
                : 'bg-gradient-to-r from-blue-500 to-cyan-600'
            }`}
        >
          {alert.type === 'success' && <Save className="w-5 h-5 flex-shrink-0" />}
          {alert.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {alert.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1">{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Horarios</h2>
          <p className="text-gray-600">
            Administra los horarios de trabajo semanales del salón
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

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
      </div>

      {/* ── Schedules List ── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Horarios Configurados</h3>
          <p className="text-gray-600">
            {horarios.length} horario{horarios.length !== 1 ? 's' : ''} configurado{horarios.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {paginatedHorarios.map((horario) => {
              const assignments = getAssignmentsForHorario(horario.horarioId);

              return (
                <div key={horario.horarioId} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-800">{horario.diaSemana}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${horario.estado
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {horario.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 mb-1">Hora Inicio:</div>
                          <div className="font-semibold text-gray-800 flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>{horario.horaInicio}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Hora Fin:</div>
                          <div className="font-semibold text-gray-800 flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-pink-500" />
                            <span>{horario.horaFin}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 mb-1">Horario:</div>
                          <div className="font-semibold text-gray-800">
                            {horario.horaInicio} - {horario.horaFin}
                          </div>
                        </div>
                      </div>

                      {/* Assigned employees */}
                      <div className="mt-3">
                        <div className="text-gray-600 text-sm mb-1">Empleados asignados:</div>
                        <div className="flex flex-wrap gap-2">
                          {assignments.length > 0 ? (
                            assignments.map(a => (
                              <span key={a.horarioEmpleadoId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs flex items-center space-x-1">
                                <span>{a.empleadoNombre || a.documentoEmpleado}</span>
                                {hasPermission('manage_schedules') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(a.horarioEmpleadoId); }}
                                    className="ml-1 text-blue-600 hover:text-red-600 transition-colors"
                                    title="Quitar asignación"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">Sin empleados asignados</span>
                          )}
                          {hasPermission('manage_schedules') && (
                            <button
                              onClick={() => handleAssignEmployee(horario)}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200 transition-colors flex items-center space-x-1"
                              title="Asignar empleado"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Asignar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {hasPermission('manage_schedules') && (
                      <div className="flex items-center space-x-2 ml-6">
                        {/* Estado Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={horario.estado}
                            onChange={() => handleToggleStatus(horario)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                          <span className={`ml-3 text-sm font-medium ${horario.estado ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {horario.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </label>

                        {/* Ver detalle */}
                        <button
                          onClick={() => handleViewDetail(horario)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleEditSchedule(horario)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Editar horario"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteSchedule(horario)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Eliminar horario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {horarios.length === 0 && (
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
          {horarios.length > 0 && (
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

      {/* ── Modals ── */}

      {showScheduleModal && (
        <ScheduleModal
          horario={selectedHorario}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveSchedule}
          saving={saving}
        />
      )}

      {showDetailModal && selectedHorario && (
        <ScheduleDetailModal
          horario={selectedHorario}
          assignments={getAssignmentsForHorario(selectedHorario.horarioId)}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showDeleteModal && selectedHorario && (
        <DeleteScheduleModal
          horario={selectedHorario}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteSchedule}
          saving={saving}
        />
      )}

      {showAssignModal && selectedHorario && (
        <AssignEmployeeModal
          horario={selectedHorario}
          empleados={empleados}
          existingAssignments={getAssignmentsForHorario(selectedHorario.horarioId)}
          onClose={() => setShowAssignModal(false)}
          onSave={handleSaveAssignment}
          saving={saving}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ScheduleModal — Create / Edit a Horario
// ══════════════════════════════════════════

interface ScheduleModalProps {
  horario: Horario | null;
  onClose: () => void;
  onSave: (data: CreateHorarioData) => void;
  saving: boolean;
}

function ScheduleModal({ horario, onClose, onSave, saving }: ScheduleModalProps) {
  const [formData, setFormData] = useState<CreateHorarioData>({
    diaSemana: horario?.diaSemana || 'Lunes',
    horaInicio: horario?.horaInicio || '08:00',
    horaFin: horario?.horaFin || '18:00',
    estado: horario?.estado ?? true
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.diaSemana) {
      setValidationError('Selecciona un día de la semana');
      return;
    }
    if (!formData.horaInicio || !formData.horaFin) {
      setValidationError('Las horas de inicio y fin son obligatorias');
      return;
    }
    if (formData.horaInicio >= formData.horaFin) {
      setValidationError('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {horario ? 'Editar Horario' : 'Nuevo Horario'}
              </h3>
              <p className="text-pink-100">
                {horario ? 'Actualiza el horario' : 'Crea un nuevo horario'}
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
          {/* Validation error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{validationError}</span>
            </div>
          )}

          {/* Día de la Semana */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Día de la Semana *
            </label>
            <select
              value={formData.diaSemana}
              onChange={(e) => setFormData({ ...formData, diaSemana: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              required
            >
              {DIAS_SEMANA_OPTIONS.map(dia => (
                <option key={dia} value={dia}>{dia}</option>
              ))}
            </select>
          </div>

          {/* Hora Inicio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hora de Inicio *
            </label>
            <input
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              required
            />
          </div>

          {/* Hora Fin */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hora de Fin *
            </label>
            <input
              type="time"
              value={formData.horaFin}
              onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              required
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.estado ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'true' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center space-x-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{horario ? 'Actualizar Horario' : 'Crear Horario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ScheduleDetailModal
// ══════════════════════════════════════════

interface ScheduleDetailModalProps {
  horario: Horario;
  assignments: HorarioEmpleado[];
  onClose: () => void;
}

function ScheduleDetailModal({ horario, assignments, onClose }: ScheduleDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle del Horario</h3>
              <p className="text-blue-100">{horario.diaSemana}</p>
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
            <h4 className="font-semibold text-gray-800 mb-3">Información General</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ID:</span>{' '}
                <span className="font-semibold">{horario.horarioId}</span>
              </div>
              <div>
                <span className="text-gray-600">Día:</span>{' '}
                <span className="font-semibold">{horario.diaSemana}</span>
              </div>
              <div>
                <span className="text-gray-600">Hora Inicio:</span>{' '}
                <span className="font-semibold">{horario.horaInicio}</span>
              </div>
              <div>
                <span className="text-gray-600">Hora Fin:</span>{' '}
                <span className="font-semibold">{horario.horaFin}</span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>{' '}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${horario.estado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {horario.estado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Employees */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Empleados Asignados</h4>
            {assignments.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {assignments.map(a => (
                  <div key={a.horarioEmpleadoId} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{a.empleadoNombre || 'Empleado'}</div>
                      <div className="text-sm text-gray-600">Doc: {a.documentoEmpleado}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p>No hay empleados asignados a este horario</p>
              </div>
            )}
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

// ══════════════════════════════════════════
// DeleteScheduleModal
// ══════════════════════════════════════════

interface DeleteScheduleModalProps {
  horario: Horario;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}

function DeleteScheduleModal({ horario, onClose, onConfirm, saving }: DeleteScheduleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
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
              ¿Eliminar horario del {horario.diaSemana}?
            </h4>
            <p className="text-gray-600">
              Se eliminará el horario de {horario.horaInicio} a {horario.horaFin}. Los empleados asignados no serán eliminados.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// AssignEmployeeModal
// ══════════════════════════════════════════

interface AssignEmployeeModalProps {
  horario: Horario;
  empleados: Empleado[];
  existingAssignments: HorarioEmpleado[];
  onClose: () => void;
  onSave: (data: CreateHorarioEmpleadoData) => void;
  saving: boolean;
}

function AssignEmployeeModal({ horario, empleados, existingAssignments, onClose, onSave, saving }: AssignEmployeeModalProps) {
  const [selectedEmpleado, setSelectedEmpleado] = useState<string>('');

  // Filter out already-assigned employees
  const assignedDocs = existingAssignments.map(a => a.documentoEmpleado);
  const availableEmpleados = empleados.filter(
    e => e.estado && !assignedDocs.includes(e.documentoEmpleado)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpleado) return;

    onSave({
      horarioId: horario.horarioId,
      documentoEmpleado: selectedEmpleado
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-purple-400 to-indigo-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Asignar Empleado</h3>
              <p className="text-purple-100 text-sm">
                Horario: {horario.diaSemana} ({horario.horaInicio} - {horario.horaFin})
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
          {availableEmpleados.length > 0 ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccionar Empleado *
              </label>
              {availableEmpleados.map(emp => (
                <label
                  key={emp.documentoEmpleado}
                  className={`flex items-center space-x-3 p-4 border rounded-xl cursor-pointer transition-all ${selectedEmpleado === emp.documentoEmpleado
                      ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="empleado"
                    value={emp.documentoEmpleado}
                    checked={selectedEmpleado === emp.documentoEmpleado}
                    onChange={(e) => setSelectedEmpleado(e.target.value)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{emp.nombre}</div>
                    <div className="text-sm text-gray-600">Doc: {emp.documentoEmpleado}</div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hay empleados disponibles para asignar</p>
              <p className="text-sm mt-1">Todos los empleados activos ya están asignados a este horario</p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              disabled={saving}
            >
              Cancelar
            </button>
            {availableEmpleados.length > 0 && (
              <button
                type="submit"
                disabled={saving || !selectedEmpleado}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center space-x-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Asignar</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}