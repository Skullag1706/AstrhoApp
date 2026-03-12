import React, { useEffect, useState } from 'react';
import {
  Users, Plus, Edit, Trash2, Eye, Search, Filter, CheckCircle, XCircle, X, Save,
  AlertCircle, Mail, Phone, Calendar, Shield, UserCog, Download, Upload,
  FileText, Camera, MapPin, IdCard, UserCheck
} from 'lucide-react';
import { SimplePagination } from '../ui/simple-pagination';
import { userService, UsuarioListItem, UsuarioDetail } from '../../services/userService';
import { authService } from '../../services/authService';
import { roleService, RolListDto } from '../../services/roleService';
import { apiClient } from '../../services/apiClient';

interface UserManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function UserManagement({ hasPermission }: UserManagementProps) {
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

  const [users, setUsers] = useState<UsuarioListItem[]>([]);
  const [roles, setRoles] = useState<RolListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInactiveWarningModal, setShowInactiveWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UsuarioListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch users and roles from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlertMessage('Error al cargar los usuarios');
      setShowSuccessAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.rolNombre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || (user.rolNombre || '').toLowerCase() === filterRole.toLowerCase();
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.estado === true) ||
      (filterStatus === 'suspended' && user.estado === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = async (user: UsuarioListItem) => {
    try {
      const detail = await userService.getById(user.usuarioId);
      setSelectedUser(detail);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setAlertMessage('Error al cargar los datos del usuario');
      setShowSuccessAlert(true);
    }
  };

  const handleViewUser = async (user: UsuarioListItem) => {
    try {
      const detail = await userService.getById(user.usuarioId);
      setSelectedUser(detail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setAlertMessage('Error al cargar los datos del usuario');
      setShowSuccessAlert(true);
    }
  };

  const handleDeleteUser = (user: UsuarioListItem) => {
    // No permitir eliminar el super administrador
    if ((user.rolNombre || '').toLowerCase() === 'super admin') {
      setShowDeleteWarningModal(true);
      return;
    }

    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        await userService.delete(userToDelete.usuarioId);
        setShowDeleteModal(false);
        setUserToDelete(null);
        setAlertMessage('Usuario eliminado correctamente');
        setShowSuccessAlert(true);
        await fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setAlertMessage('Error al eliminar el usuario');
        setShowSuccessAlert(true);
      }
    }
  };

  const handleSaveUser = async (userData: any) => {
    if (selectedUser) {
      // ── EDIT ──
      try {
        const updatePayload = {
          rolId: userData.rolId,
          email: userData.email,
          contrasena: selectedUser.contrasena || 'placeholder',
          confirmarContrasena: selectedUser.contrasena || 'placeholder',
          estado: userData.estado !== undefined ? userData.estado : selectedUser.estado,
        };
        await userService.update(selectedUser.usuarioId, updatePayload);
        setShowUserModal(false);
        setAlertMessage('Usuario actualizado correctamente');
        setShowSuccessAlert(true);
        await fetchUsers();
      } catch (error: any) {
        console.error('Error updating user:', error);
        setAlertMessage(error?.message || 'Error al actualizar el usuario');
        setShowSuccessAlert(true);
      }
      return;
    }

    // ── CREATE ──
    try {

      // Step 1: Create temp user via auth endpoint
      const selectedRole = roles.find(r => r.rolId === userData.rolId);
      const tempUserResponse = await authService.createTempUser({
        email: userData.email.trim().toLowerCase(),
        rolId: userData.rolId,
      });

      // Get the created usuarioId
      let usuarioId = tempUserResponse?.usuarioId || tempUserResponse?.id;
      if (!usuarioId) {
        // Fallback: look up by email
        usuarioId = await authService.getUserIdByEmail(userData.email);
        if (!usuarioId) {
          throw new Error('No se pudo obtener el ID del usuario creado.');
        }
      }

      // Step 2: Create Empleado or Cliente record depending on role
      const roleName = (selectedRole?.nombre || '').toLowerCase();

      const mapDocType = (t: string): string => {
        const key = (t || '').toLowerCase();
        if (key === 'cedula' || key === 'cédula' || key === 'cedula_ciudadania') return 'CC';
        if (key === 'tarjeta_identidad' || key === 'ti') return 'TI';
        if (key === 'cedula_extranjeria' || key === 'ce') return 'CE';
        if (key === 'pasaporte' || key === 'passport') return 'PAS';
        if (key === 'nit') return 'NIT';
        return 'CC';
      };

      if (roleName === 'cliente') {
        await apiClient.post('/Clientes', {
          documentoCliente: userData.documentId,
          usuarioId: usuarioId,
          tipoDocumento: mapDocType(userData.documentType),
          nombre: userData.nombre,
          telefono: userData.phone,
          dirección: userData.direccion,
        });
      } else {
        // Empleado (Administrador, Asistente, or any other non-client role)
        await apiClient.post('/Empleados', {
          documentoEmpleado: userData.documentId,
          usuarioId: usuarioId,
          tipoDocumento: mapDocType(userData.documentType),
          nombre: userData.nombre,
          telefono: userData.phone,
          dirección: userData.direccion,
        });
      }

      setShowUserModal(false);
      setAlertMessage('Usuario registrado correctamente');
      setShowSuccessAlert(true);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setAlertMessage(err?.message || 'Error al registrar el usuario');
      setShowSuccessAlert(true);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    const user = users.find(u => u.usuarioId === userId);

    // No permitir inactivar al super administrador
    if (user && (user.rolNombre || '').toLowerCase() === 'super admin') {
      setShowInactiveWarningModal(true);
      return;
    }

    if (!user) return;

    try {
      const detail = await userService.getById(userId);
      const newEstado = !user.estado;
      await userService.update(userId, {
        rolId: detail.rol.rolId,
        email: detail.email,
        contrasena: detail.contrasena || 'placeholder',
        confirmarContrasena: detail.contrasena || 'placeholder',
        estado: newEstado,
      });
      setAlertMessage('Estado de usuario actualizado correctamente');
      setShowSuccessAlert(true);
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setAlertMessage('Error al actualizar el estado del usuario');
      setShowSuccessAlert(true);
    }
  };

  const getRoleDisplayName = (rolNombre: string) => {
    return rolNombre || 'Sin rol';
  };

  const getRoleBadgeColor = (rolNombre: string) => {
    const name = (rolNombre || '').toLowerCase();
    if (name === 'super admin') return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (name === 'administrador') return 'bg-red-100 text-red-800';
    if (name === 'asistente') return 'bg-blue-100 text-blue-800';
    if (name === 'cliente') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <p className="text-gray-600">
            Administra todos los usuarios del sistema
          </p>
        </div>

        {hasPermission('manage_users') && (
          <button
            onClick={handleCreateUser}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Usuario</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            >
              <option value="all">Todos los roles</option>
              {roles.map(role => (
                <option key={role.rolId} value={role.nombre}>{role.nombre}</option>
              ))}
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="suspended">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Lista de Usuarios</h3>
          <p className="text-gray-600">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Usuario</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Rol</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.usuarioId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.rolNombre)}`}>
                        {getRoleDisplayName(user.rolNombre)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {(user.rolNombre || '').toLowerCase() === 'super admin' ? (
                          // Super admin siempre activo, sin switch
                          <div className="flex items-center space-x-2">
                            <div className="w-11 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full relative">
                              <div className="absolute top-[2px] right-[2px] bg-white border-white border rounded-full h-5 w-5"></div>
                            </div>
                            <span className="ml-1 text-sm font-medium text-green-600">
                              Activo
                            </span>
                          </div>
                        ) : (
                          // Otros usuarios con switch
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user.estado === true}
                              onChange={() => toggleUserStatus(user.usuarioId)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                            <span className={`ml-3 text-sm font-medium ${user.estado ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {user.estado ? 'Activo' : 'Inactivo'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_users') && (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {(user.rolNombre || '').toLowerCase() !== 'super admin' && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
          roles={roles}
        />
      )}

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
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
                  ¿Estás segura de que quieres eliminar el usuario <strong>{userToDelete.email}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {userToDelete.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{userToDelete.email}</div>
                      <div className="text-sm text-gray-600">{userToDelete.rolNombre}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Warning Modal */}
      {showInactiveWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                  <p className="text-gray-600">No se puede inactivar al Super Administrador</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInactiveWarningModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                  <p className="text-gray-600">No se puede eliminar al Super Administrador del sistema</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteWarningModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

// User Modal Component
function UserModal({ user, onClose, onSave, roles }: { user: any; onClose: () => void; onSave: (data: any) => void; roles: RolListDto[] }) {
  // Filter out Super Admin from the roles available for selection
  const availableRoles = roles.filter(r => r.nombre.toLowerCase() !== 'super admin');

  const [formData, setFormData] = useState({
    rolId: user?.rol?.rolId || (availableRoles.length > 0 ? availableRoles[0].rolId : 0),
    documentType: 'cedula',
    documentId: '',
    nombre: '',
    email: user?.email || '',
    phone: '',
    direccion: '',
    estado: user?.estado !== undefined ? user.estado : true,
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validatingFields, setValidatingFields] = useState<Record<string, boolean>>({});

  // ── Centralized synchronous validation per field ──
  const validateField = (name: string, value: string, docType?: string): string => {
    const isCreate = !user;
    switch (name) {
      case 'nombre':
        if (isCreate && !value.trim()) return 'El nombre es obligatorio';
        if (isCreate && value.trim() && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value))
          return 'El nombre solo debe contener letras';
        return '';
      case 'email':
        if (!value.trim()) return 'El correo electrónico es obligatorio';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'El formato del correo no es válido';
        return '';
      case 'documentId': {
        if (isCreate && !value.trim()) return 'El número de documento es obligatorio';
        const effectiveDocType = docType || formData.documentType;
        if (isCreate && effectiveDocType === 'cedula' && value.trim() && !/^\d+$/.test(value))
          return 'El número de documento solo debe contener números, sin letras ni caracteres especiales';
        return '';
      }
      case 'phone':
        if (isCreate && !value.trim()) return 'El teléfono es obligatorio';
        if (isCreate && value.trim() && !/^\d{10}$/.test(value))
          return 'El teléfono debe tener exactamente 10 dígitos numéricos';
        return '';
      case 'direccion':
        if (isCreate && !value.trim()) return 'La dirección es obligatoria';
        return '';
      default:
        return '';
    }
  };

  // ── Blur handler: sync validation on all fields + async uniqueness checks ──
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Always run sync validation on blur (shows "required" errors when leaving empty fields)
    const syncError = validateField(name, value);
    if (syncError) {
      setFieldErrors(prev => ({ ...prev, [name]: syncError }));
      return;
    }

    if (user) return; // skip uniqueness checks on edit

    // Async uniqueness checks for email and documentId
    if (name === 'email' && value.trim()) {
      setValidatingFields(prev => ({ ...prev, email: true }));
      try {
        const { emailExists } = await authService.checkDuplicates(value);
        if (emailExists) {
          setFieldErrors(prev => ({ ...prev, email: 'El correo electrónico ya se encuentra registrado' }));
        }
      } catch { /* allow submit to re-check */ }
      setValidatingFields(prev => ({ ...prev, email: false }));
    }

    if (name === 'documentId' && value.trim()) {
      setValidatingFields(prev => ({ ...prev, documentId: true }));
      try {
        const exists = await userService.checkDocumentDuplicate(value);
        if (exists) {
          setFieldErrors(prev => ({ ...prev, documentId: 'El número de documento ya se encuentra registrado' }));
        }
      } catch { /* allow submit to re-check */ }
      setValidatingFields(prev => ({ ...prev, documentId: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Run all sync validations
    const fieldsToValidate = !user
      ? ['nombre', 'email', 'documentId', 'phone', 'direccion']
      : ['email'];

    for (const field of fieldsToValidate) {
      const err = validateField(field, (formData as any)[field]);
      if (err) errors[field] = err;
    }

    // Stop early if local validations fail
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Async uniqueness checks (only on create)
    if (!user) {
      setSaving(true);
      try {
        const [{ emailExists }, documentExists] = await Promise.all([
          authService.checkDuplicates(formData.email),
          userService.checkDocumentDuplicate(formData.documentId),
        ]);

        if (emailExists) errors.email = 'El correo electrónico ya se encuentra registrado';
        if (documentExists) errors.documentId = 'El número de documento ya se encuentra registrado';

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setSaving(false);
          return;
        }
      } catch {
        setSaving(false);
        return;
      }
    }

    setFieldErrors({});
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let sanitized = value;

    // Strip non-numeric characters for phone & limit to 10 digits
    if (name === 'phone') {
      sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
    }

    // Real-time synchronous validation
    const error = validateField(name, sanitized, name === 'documentType' ? sanitized : undefined);
    setFieldErrors(prev => ({ ...prev, [name]: error }));

    // When document type changes, re-validate the document number with the new type
    if (name === 'documentType') {
      const docError = validateField('documentId', formData.documentId, sanitized);
      setFieldErrors(prev => ({ ...prev, documentId: docError }));
    }

    setFormData({
      ...formData,
      [name]: name === 'rolId' ? parseInt(sanitized) : sanitized,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {user ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <p className="text-pink-100">
                {user ? 'Actualiza la información del usuario' : 'Crea un nuevo usuario'}
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
          {/* Form Fields */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Información del Usuario</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 1. Rol */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  name="rolId"
                  value={formData.rolId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  required
                  disabled={!!user}
                >
                  <option value="">Seleccionar rol</option>
                  {availableRoles.map(role => (
                    <option key={role.rolId} value={role.rolId}>{role.nombre}</option>
                  ))}
                </select>
              </div>

              {/* 2. Tipo de Documento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  disabled={!!user}
                >
                  <option value="cedula">Cédula de Ciudadanía</option>
                  <option value="cedula_extranjeria">Cédula de Extranjería</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
                {fieldErrors.documentType && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.documentType}</p>
                )}
              </div>

              {/* 3. Documento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  name="documentId"
                  value={formData.documentId}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${fieldErrors.documentId ? 'border-red-500' : 'border-gray-300'}`}
                  required={!user}
                  disabled={!!user}
                />
                {validatingFields.documentId && (
                  <p className="text-blue-500 text-sm mt-1">Verificando disponibilidad...</p>
                )}
                {fieldErrors.documentId && !validatingFields.documentId && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.documentId}</p>
                )}
              </div>

              {/* 4. Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${fieldErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                  required={!user}
                  disabled={!!user}
                />
                {fieldErrors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.nombre}</p>
                )}
              </div>

              {/* 5. Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {validatingFields.email && (
                  <p className="text-blue-500 text-sm mt-1">Verificando disponibilidad...</p>
                )}
                {fieldErrors.email && !validatingFields.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* 6. Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="10 dígitos"
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  required={!user}
                  disabled={!!user}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              {/* 7. Dirección */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Calle, carrera, número, barrio"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${fieldErrors.direccion ? 'border-red-500' : 'border-gray-300'}`}
                  required={!user}
                  disabled={!!user}
                />
                {fieldErrors.direccion && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.direccion}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : (user ? 'Actualizar' : 'Crear')} Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Detail Modal Component
function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Detalles del Usuario</h3>
              <p className="text-blue-100">Información completa</p>
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
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <span className="text-white font-bold text-2xl">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <h4 className="text-xl font-bold text-gray-800">{user.email}</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-800">Información del Usuario</h5>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Correo Electrónico</div>
                  <div className="font-semibold text-gray-800">{user.email}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-gray-800">Información del Sistema</h5>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <UserCheck className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Rol</div>
                  <div className="font-semibold text-gray-800">
                    {user.rol?.nombre || user.rolNombre || 'Sin rol'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600">Estado</div>
                  <div className={`font-semibold ${user.estado ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {user.estado ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
