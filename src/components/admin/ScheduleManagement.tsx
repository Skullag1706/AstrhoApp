import React, { useState, useEffect } from 'react';
import { CheckCircle,
  Calendar, Clock, Users, Plus,
  AlertCircle, Edit, Eye, Trash2,
  Save, X, Loader2, RefreshCw, Copy, UserPlus, UserMinus
} from 'lucide-react';
import { SimplePagination } from '../ui/simple-pagination';
import {
  horarioService, horarioEmpleadoService, empleadoService,
  Horario, HorarioEmpleado, Empleado, CreateHorarioData, CreateHorarioEmpleadoData,
  ScheduleGroup, DaySchedule, scheduleGroupService
} from '../../services/scheduleService';

interface ScheduleManagementProps {
  hasPermission: (permission: string) => boolean;
}

// ── Helpers ──

const DIAS_SEMANA_OPTIONS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

const DIAS_SHORT: Record<string, string> = {
  'Lunes': 'Lun', 'Martes': 'Mar', 'Miércoles': 'Mié',
  'Jueves': 'Jue', 'Viernes': 'Vie', 'Sábado': 'Sáb', 'Domingo': 'Dom'
};

export function ScheduleManagement({ hasPermission }: ScheduleManagementProps) {
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

  // Data states
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horarioEmpleados, setHorarioEmpleados] = useState<HorarioEmpleado[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [groups, setGroups] = useState<ScheduleGroup[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ScheduleGroup | null>(null);
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
      const extract = (data: any) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.$values)) return data.$values;
        return [];
      };

      const hData = extract(horariosData);
      setHorarios(hData);
      setHorarioEmpleados(extract(asignacionesData));
      setEmpleados(extract(empleadosData));

      // Load groups from localStorage and reconcile with API data
      const savedGroups = scheduleGroupService.getAll();
      const apiHorarios = hData;

      // Filter out horarioIds that no longer exist in API
      const validIds = new Set(apiHorarios.map(h => h.horarioId));
      const reconciledGroups = savedGroups.map(g => ({
        ...g,
        horarioIds: g.horarioIds.filter(id => validIds.has(id))
      })).filter(g => g.horarioIds.length > 0);

      // Check for orphan horarios (exist in API but not in any group)
      const groupedIds = new Set(reconciledGroups.flatMap(g => g.horarioIds));
      const orphans = apiHorarios.filter(h => !groupedIds.has(h.horarioId) && h.estado === true);

      // Group ALL orphans into a single "Horario General" block instead of one per day
      if (orphans.length > 0) {
        reconciledGroups.push({
          id: scheduleGroupService.generateId(),
          nombre: 'Horario General',
          horarioIds: orphans.map(o => o.horarioId),
          estado: true
        });
      }

      scheduleGroupService.save(reconciledGroups);
      setGroups(reconciledGroups);
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
    setSelectedGroup(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (group: ScheduleGroup) => {
    setSelectedGroup(group);
    setShowScheduleModal(true);
  };

  const handleViewDetail = (group: ScheduleGroup) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleDeleteSchedule = (group: ScheduleGroup) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const handleAssignEmployee = (group: ScheduleGroup) => {
    setSelectedGroup(group);
    setShowAssignModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      // Deactivate each horario via PUT (API may not support DELETE)
      const groupHorarios = horarios.filter(h => selectedGroup.horarioIds.includes(h.horarioId));
      for (const h of groupHorarios) {
        try {
          await horarioService.update(h.horarioId, {
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            estado: false
          });
        } catch (err) {
          console.warn(`Could not deactivate horario ${h.horarioId}:`, err);
        }
      }
      // Also try to delete from API (best effort)
      for (const id of selectedGroup.horarioIds) {
        try {
          await horarioService.delete(id);
        } catch { /* ignore */ }
      }
      scheduleGroupService.delete(selectedGroup.id);
      showAlert('success', `Horario "${selectedGroup.nombre}" eliminado correctamente`);
      setShowDeleteModal(false);
      setSelectedGroup(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showAlert('error', 'Error al eliminar el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (group: ScheduleGroup) => {
    try {
      const newEstado = !group.estado;
      const groupHorarios = horarios.filter(h => group.horarioIds.includes(h.horarioId));
      await Promise.all(
        groupHorarios.map(h => {
          const updatedData: CreateHorarioData = {
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            estado: newEstado
          };
          return horarioService.update(h.horarioId, updatedData);
        })
      );
      // Update group in localStorage
      scheduleGroupService.upsert({ ...group, estado: newEstado });
      showAlert(
        newEstado ? 'success' : 'info',
        `Horario "${group.nombre}" ${newEstado ? 'activado' : 'inactivado'} correctamente`
      );
      await loadData();
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      showAlert('error', 'Error al cambiar el estado del horario');
    }
  };

  const handleSaveSchedule = async (
    nombre: string,
    days: DaySchedule[],
    assignmentsToCreate: CreateHorarioEmpleadoData[],
    assignmentsToDelete: number[],
    groupId?: string
  ) => {
    setSaving(true);
    try {
      const enabledDays = days.filter(d => d.enabled);
      const existingGroup = groupId ? groups.find(g => g.id === groupId) : null;
      const existingHorarios = existingGroup
        ? horarios.filter(h => existingGroup.horarioIds.includes(h.horarioId))
        : [];

      // 1. Delete removed days first (existed before but not in enabledDays now)
      if (existingGroup) {
        const enabledDayNames = enabledDays.map(d => d.dia);
        const toDelete = existingHorarios.filter(h => !enabledDayNames.includes(h.diaSemana));
        for (const h of toDelete) {
          try {
            await horarioService.delete(h.horarioId);
          } catch (err) {
            console.warn(`Could not delete horario ${h.horarioId}:`, err);
          }
        }
      }

      // 2. Create or update each enabled day
      const knownIds: number[] = [];
      const createdDayNames: string[] = [];

      for (const day of enabledDays) {
        const existing = existingHorarios.find(h => h.diaSemana === day.dia);
        const payload = {
          diaSemana: day.dia,
          horaInicio: day.horaInicio,
          horaFin: day.horaFin,
          estado: existingGroup?.estado ?? true
        };

        try {
          if (existing) {
            await horarioService.update(existing.horarioId, payload);
            knownIds.push(existing.horarioId);
          } else {
            const created = await horarioService.create(payload);
            if (created?.horarioId) {
              knownIds.push(created.horarioId);
            } else {
              // API returned null — we'll resolve IDs after refresh
              createdDayNames.push(day.dia);
            }
          }
        } catch (err) {
          console.error(`Error saving day ${day.dia}:`, err);
          // If the API rejects (e.g. duplicate day), still try remaining days
          createdDayNames.push(day.dia);
        }
      }

      // 3. If any creates didn't return an ID, fetch all horarios and match by diaSemana
      let finalIds = [...knownIds];
      if (createdDayNames.length > 0) {
        try {
          const allHorarios: any[] = await horarioService.getAll();
          if (Array.isArray(allHorarios)) {
            for (const dayName of createdDayNames) {
              const match = allHorarios.find(
                (h: any) => h.diaSemana === dayName && !finalIds.includes(h.horarioId)
              );
              if (match) {
                finalIds.push(match.horarioId);
              }
            }
          }
        } catch {
          console.warn('Could not refresh horarios to resolve IDs');
        }
      }

      // 4. Save group to localStorage
      const group: ScheduleGroup = {
        id: groupId || scheduleGroupService.generateId(),
        nombre,
        horarioIds: finalIds,
        estado: existingGroup?.estado ?? true
      };
      scheduleGroupService.upsert(group);

      // 5. Process pending employee assignments and deletions
      for (const assignmentId of assignmentsToDelete) {
        try {
          await horarioEmpleadoService.delete(assignmentId);
        } catch (err) {
          console.error('Error deleting assignment:', err);
        }
      }

      for (const data of assignmentsToCreate) {
        try {
          await horarioEmpleadoService.create(data);
        } catch (err) {
          console.error('Error creating assignment:', err);
        }
      }

      showAlert('success', existingGroup
        ? `Horario "${nombre}" actualizado correctamente`
        : `Horario "${nombre}" registrado correctamente`
      );
      setShowScheduleModal(false);
      setSelectedGroup(null);
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

  const getHorariosForGroup = (group: ScheduleGroup) => {
    return horarios.filter(h => group.horarioIds.includes(h.horarioId));
  };

  const getAssignmentsForGroup = (group: ScheduleGroup) => {
    return horarioEmpleados.filter(he => group.horarioIds.includes(he.horarioId));
  };

  // Pagination
  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + itemsPerPage);

  // ── Loading State ──

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Cargando horarios...</p>
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
            Los horarios son semanales recurrentes — aplican todos los días de la semana a lo largo del año
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
            {groups.length} horario{groups.length !== 1 ? 's' : ''} configurado{groups.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {paginatedGroups.map((group) => {
              const groupHorarios = getHorariosForGroup(group);
              const assignments = getAssignmentsForGroup(group);

              return (
                <div key={group.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Group Name & Status */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800">{group.nombre}</h4>
                          <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${group.estado
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {group.estado ? 'Activo' : 'Inactivo'}
                            </span>
                            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                              🔁 Recurrente — aplica todo el año
                            </span>
                            <span className="text-xs text-gray-500">
                              {groupHorarios.length} día{groupHorarios.length !== 1 ? 's' : ''} por semana
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Days chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {groupHorarios.map(h => (
                          <div key={h.horarioId} className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-semibold">{DIAS_SHORT[h.diaSemana] || h.diaSemana}</span>
                          </div>
                        ))}
                      </div>

                      {/* Assigned employees */}
                      <div>
                        <div className="text-gray-600 text-sm mb-1">Empleados asignados:</div>
                        <div className="flex flex-wrap gap-2">
                          {assignments.length > 0 ? (
                            <>
                              {assignments.slice(0, 3).map(a => (
                                <span key={a.horarioEmpleadoId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">
                                  {a.empleadoNombre || a.documentoEmpleado}
                                </span>
                              ))}
                              {assignments.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                  +{assignments.length - 3} más
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin empleados asignados</span>
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
                            checked={group.estado}
                            onChange={() => handleToggleStatus(group)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                          <span className={`ml-3 text-sm font-medium ${group.estado ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {group.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </label>

                        {/* Ver detalle */}
                        <button
                          onClick={() => handleViewDetail(group)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleEditSchedule(group)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="Editar horario"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteSchedule(group)}
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

            {groups.length === 0 && (
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
          {groups.length > 0 && (
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
          group={selectedGroup}
          horarios={selectedGroup ? getHorariosForGroup(selectedGroup) : []}
          empleados={empleados}
          existingAssignments={selectedGroup ? getAssignmentsForGroup(selectedGroup) : []}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveSchedule}
          saving={saving}
        />
      )}

      {showDetailModal && selectedGroup && (
        <ScheduleDetailModal
          group={selectedGroup}
          horarios={getHorariosForGroup(selectedGroup)}
          assignments={getAssignmentsForGroup(selectedGroup)}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showDeleteModal && selectedGroup && (
        <DeleteScheduleModal
          group={selectedGroup}
          horarios={getHorariosForGroup(selectedGroup)}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteSchedule}
          saving={saving}
        />
      )}

      {showAssignModal && selectedGroup && (
        <AssignEmployeeModal
          group={selectedGroup}
          horarios={getHorariosForGroup(selectedGroup)}
          empleados={empleados}
          existingAssignments={getAssignmentsForGroup(selectedGroup)}
          onClose={() => setShowAssignModal(false)}
          onSave={handleSaveAssignment}
          saving={saving}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ScheduleModal — Create / Edit a Schedule Group
// ══════════════════════════════════════════

interface ScheduleModalProps {
  group: ScheduleGroup | null;
  horarios: Horario[];
  empleados: Empleado[];
  existingAssignments: HorarioEmpleado[];
  onClose: () => void;
  onSave: (nombre: string, days: DaySchedule[], assignmentsToCreate: CreateHorarioEmpleadoData[], assignmentsToDelete: number[], groupId?: string) => void;
  saving: boolean;
}

function ScheduleModal({ group, horarios, empleados, existingAssignments, onClose, onSave, saving }: ScheduleModalProps) {
  const [nombre, setNombre] = useState(group?.nombre || '');

  // Build initial days state
  const buildInitialDays = (): DaySchedule[] => {
    return DIAS_SEMANA_OPTIONS.map(dia => {
      const existing = horarios.find(h => h.diaSemana === dia);
      return {
        dia,
        horaInicio: existing?.horaInicio || '08:00',
        horaFin: existing?.horaFin || '18:00',
        enabled: !!existing
      };
    });
  };

  const [days, setDays] = useState<DaySchedule[]>(buildInitialDays);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Employee assignment state
  const [selectedDayForAssign, setSelectedDayForAssign] = useState<number>(horarios[0]?.horarioId || 0);

  // Local pending assignments
  const [pendingCreates, setPendingCreates] = useState<CreateHorarioEmpleadoData[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);

  const toggleDay = (dia: string) => {
    setDays(prev => prev.map(d =>
      d.dia === dia ? { ...d, enabled: !d.enabled } : d
    ));
  };

  const updateDayTime = (dia: string, field: 'horaInicio' | 'horaFin', value: string) => {
    setDays(prev => prev.map(d =>
      d.dia === dia ? { ...d, [field]: value } : d
    ));
  };

  const applyToAllEnabled = () => {
    const firstEnabled = days.find(d => d.enabled);
    if (!firstEnabled) return;
    setDays(prev => prev.map(d =>
      d.enabled ? { ...d, horaInicio: firstEnabled.horaInicio, horaFin: firstEnabled.horaFin } : d
    ));
  };

  const handleLocalAssign = (data: CreateHorarioEmpleadoData) => {
    setPendingCreates(prev => [...prev, data]);
  };

  const handleLocalRemove = (assignmentId: number) => {
    setPendingDeletes(prev => [...prev, assignmentId]);
  };

  const handleLocalRemovePendingCreate = (doc: string, horarioId: number) => {
    setPendingCreates(prev => prev.filter(p => !(p.documentoEmpleado === doc && p.horarioId === horarioId)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!nombre.trim()) {
      setValidationError('El nombre del horario es obligatorio');
      return;
    }

    const enabledDays = days.filter(d => d.enabled);
    if (enabledDays.length === 0) {
      setValidationError('Debes seleccionar al menos un día');
      return;
    }

    for (const day of enabledDays) {
      if (!day.horaInicio || !day.horaFin) {
        setValidationError(`Las horas son obligatorias para ${day.dia}`);
        return;
      }
      if (day.horaInicio >= day.horaFin) {
        setValidationError(`La hora de inicio debe ser menor que la hora de fin en ${day.dia}`);
        return;
      }
    }

    onSave(nombre.trim(), days, pendingCreates, pendingDeletes, group?.id);
  };

  const enabledCount = days.filter(d => d.enabled).length;

  // Employee helpers combining existing + pending UI state

  // Existing assignments not locally deleted
  const activeExistingAssignments = existingAssignments.filter(a => !pendingDeletes.includes(a.horarioEmpleadoId));

  const assignedDocsForDay = [
    ...activeExistingAssignments
      .filter(a => a.horarioId === selectedDayForAssign)
      .map(a => a.documentoEmpleado),
    ...pendingCreates
      .filter(p => p.horarioId === selectedDayForAssign)
      .map(p => p.documentoEmpleado)
  ];

  const availableEmpleados = empleados.filter(
    e => e.estado && !assignedDocsForDay.includes(e.documentoEmpleado)
  );

  const existingAssignmentsForDay = activeExistingAssignments.filter(a => a.horarioId === selectedDayForAssign);
  const pendingAssignmentsForDay = pendingCreates.filter(p => p.horarioId === selectedDayForAssign);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {group ? 'Editar Horario' : 'Nuevo Horario'}
              </h3>
              <p className="text-pink-100">
                {group ? 'Actualiza el horario, días y empleados' : 'Configura nombre, días, horas y empleados'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Validation error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{validationError}</span>
            </div>
          )}

          {/* Nombre del Horario */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Horario *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Horario Matutino, Turno Completo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-gray-800"
              required
            />
          </div>

          {/* Selector de Días */}
          <div>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start space-x-2">
              <span className="text-base mt-0.5">🔁</span>
              <span>Este horario aplica <strong>todo el año</strong>. Los días seleccionados se repiten cada semana de forma recurrente — no son fechas específicas.</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Días de la Semana * <span className="text-gray-400 font-normal">({enabledCount} seleccionado{enabledCount !== 1 ? 's' : ''})</span>
              </label>
              {enabledCount > 1 && (
                <button
                  type="button"
                  onClick={applyToAllEnabled}
                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center space-x-1 font-medium"
                  title="Aplicar las horas del primer día a todos los días seleccionados"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar horas a todos</span>
                </button>
              )}
            </div>

            {/* Day chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {days.map(day => (
                <button
                  key={day.dia}
                  type="button"
                  onClick={() => toggleDay(day.dia)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${day.enabled
                    ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {day.dia}
                </button>
              ))}
            </div>

            {/* Hours per enabled day */}
            <div className="space-y-3">
              {days.filter(d => d.enabled).map(day => (
                <div key={day.dia} className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold text-purple-800">{day.dia}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hora Inicio</label>
                      <input
                        type="time"
                        value={day.horaInicio}
                        onChange={(e) => updateDayTime(day.dia, 'horaInicio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hora Fin</label>
                      <input
                        type="time"
                        value={day.horaFin}
                        onChange={(e) => updateDayTime(day.dia, 'horaFin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {enabledCount === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Selecciona los días de la semana para configurar las horas
                </div>
              )}
            </div>
          </div>

          {/* ── Sección de Empleados (solo en modo edición, cuando ya existen horarios) ── */}
          {group && horarios.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-700">Empleados Asignados</h4>
              </div>

              {/* Day selector for assignment */}
              {horarios.length > 1 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Seleccionar día:</label>
                  <div className="flex flex-wrap gap-2">
                    {horarios.map(h => (
                      <button
                        key={h.horarioId}
                        type="button"
                        onClick={() => setSelectedDayForAssign(h.horarioId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedDayForAssign === h.horarioId
                          ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {h.diaSemana} ({h.horaInicio} - {h.horaFin})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Currently assigned employees */}
              {(existingAssignmentsForDay.length > 0 || pendingAssignmentsForDay.length > 0) && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Asignados a este día:</label>
                  <div className="flex flex-wrap gap-2">
                    {/* Existing, not deleted */}
                    {existingAssignmentsForDay.map(a => (
                      <span
                        key={a.horarioEmpleadoId}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-xs border border-blue-200"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-medium">{a.empleadoNombre || a.documentoEmpleado}</span>
                        <button
                          type="button"
                          onClick={() => handleLocalRemove(a.horarioEmpleadoId)}
                          className="ml-1 text-blue-600 hover:text-red-600 transition-colors"
                          title="Quitar asignación"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}

                    {/* Pending adds */}
                    {pendingAssignmentsForDay.map(p => {
                      const empName = empleados.find(e => e.documentoEmpleado === p.documentoEmpleado)?.nombre || p.documentoEmpleado;
                      return (
                        <span
                          key={`pending-${p.documentoEmpleado}`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 text-green-800 rounded-lg text-xs border border-green-200"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium">{empName}</span>
                          <span className="text-xs text-green-600 font-bold ml-1">(nuevo)</span>
                          <button
                            type="button"
                            onClick={() => handleLocalRemovePendingCreate(p.documentoEmpleado, p.horarioId)}
                            className="ml-1 text-green-600 hover:text-red-600 transition-colors"
                            title="Deshacer asignación"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available employees to assign */}
              {availableEmpleados.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Empleados disponibles:</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableEmpleados.map(emp => (
                      <div
                        key={emp.documentoEmpleado}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{emp.nombre}</div>
                            <div className="text-xs text-gray-500">Doc: {emp.documentoEmpleado}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLocalAssign({ horarioId: selectedDayForAssign, documentoEmpleado: emp.documentoEmpleado })}
                          disabled={!selectedDayForAssign}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all flex items-center space-x-1 disabled:opacity-60"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Asignar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  <Users className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                  {existingAssignmentsForDay.length > 0 || pendingAssignmentsForDay.length > 0
                    ? 'Todos los empleados activos ya están asignados a este día'
                    : 'No hay empleados disponibles para asignar'
                  }
                </div>
              )}
            </div>
          )}

          {/* Info message for new schedules */}
          {!group && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl flex items-center space-x-2">
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Podrás asignar empleados después de crear el horario, al editarlo.</span>
            </div>
          )}

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
              <span>{group ? 'Actualizar Horario' : 'Crear Horario'}</span>
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
  group: ScheduleGroup;
  horarios: Horario[];
  assignments: HorarioEmpleado[];
  onClose: () => void;
}

function ScheduleDetailModal({ group, horarios, assignments, onClose }: ScheduleDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalle del Horario</h3>
              <p className="text-blue-100">{group.nombre}</p>
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
          {/* General Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Información General</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>{' '}
                <span className="font-semibold">{group.nombre}</span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>{' '}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${group.estado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {group.estado ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Días configurados:</span>{' '}
                <span className="font-semibold">{horarios.length}</span>
              </div>
            </div>
          </div>

          {/* Days Table */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Días y Horarios</h4>
            {horarios.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-purple-800">Día</th>
                      <th className="text-left px-4 py-3 font-semibold text-purple-800">Hora Inicio</th>
                      <th className="text-left px-4 py-3 font-semibold text-purple-800">Hora Fin</th>
                      <th className="text-left px-4 py-3 font-semibold text-purple-800">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map(h => (
                      <tr key={h.horarioId} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{h.diaSemana}</td>
                        <td className="px-4 py-3 text-gray-700 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span>{h.horaInicio}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-pink-500" />
                            <span>{h.horaFin}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.estado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {h.estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p>No hay días configurados</p>
              </div>
            )}
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
  group: ScheduleGroup;
  horarios: Horario[];
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}

function DeleteScheduleModal({ group, horarios, onClose, onConfirm, saving }: DeleteScheduleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-red-400 to-pink-500 p-6 text-white rounded-t-3xl shrink-0">
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
              ¿Eliminar horario "{group.nombre}"?
            </h4>
            <p className="text-gray-600">
              Se eliminarán {horarios.length} día{horarios.length !== 1 ? 's' : ''} configurado{horarios.length !== 1 ? 's' : ''} ({horarios.map(h => DIAS_SHORT[h.diaSemana] || h.diaSemana).join(', ')}). Los empleados asignados no serán eliminados.
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
  group: ScheduleGroup;
  horarios: Horario[];
  empleados: Empleado[];
  existingAssignments: HorarioEmpleado[];
  onClose: () => void;
  onSave: (data: CreateHorarioEmpleadoData) => void;
  saving: boolean;
}

function AssignEmployeeModal({ group, horarios, empleados, existingAssignments, onClose, onSave, saving }: AssignEmployeeModalProps) {
  const [selectedEmpleado, setSelectedEmpleado] = useState<string>('');
  const [selectedHorarioId, setSelectedHorarioId] = useState<number>(horarios[0]?.horarioId || 0);

  // Filter out already-assigned employees for the selected horarioId
  const assignedDocs = existingAssignments
    .filter(a => a.horarioId === selectedHorarioId)
    .map(a => a.documentoEmpleado);
  const availableEmpleados = empleados.filter(
    e => e.estado && !assignedDocs.includes(e.documentoEmpleado)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpleado || !selectedHorarioId) return;

    onSave({
      horarioId: selectedHorarioId,
      documentoEmpleado: selectedEmpleado
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-purple-400 to-indigo-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Asignar Empleado</h3>
              <p className="text-purple-100 text-sm">
                Horario: {group.nombre}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Day selector for assignment */}
          {horarios.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccionar Día *
              </label>
              <div className="flex flex-wrap gap-2">
                {horarios.map(h => (
                  <button
                    key={h.horarioId}
                    type="button"
                    onClick={() => { setSelectedHorarioId(h.horarioId); setSelectedEmpleado(''); }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedHorarioId === h.horarioId
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {h.diaSemana} ({h.horaInicio} - {h.horaFin})
                  </button>
                ))}
              </div>
            </div>
          )}

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
              <p className="text-sm mt-1">Todos los empleados activos ya están asignados a este día</p>
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