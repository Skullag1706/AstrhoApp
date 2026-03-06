import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Edit, Save, X, Plus, AlertCircle,
  CheckCircle, UserCheck, UserX, Settings, Eye, Trash2, Search,
  LayoutDashboard, Calendar, Scissors, Package, ShoppingCart,
  ShoppingBag, Truck, Box, UsersRound, Tag, Clock, Boxes,
  PackageCheck, FileText, Loader2
} from 'lucide-react';
import { mockRoles, mockPermissions } from '../../data/management';
import { roleService, RolListDto, RolResponseDto } from '../../services/roleService';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  isSuperUser?: boolean;
}

interface RoleManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function RoleManagement({ hasPermission }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInactiveWarningModal, setShowInactiveWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [showValidationErrorModal, setShowValidationErrorModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Mapping for permissions (Frontend Strings <-> Backend IDs)
  const PERMISSION_MAP = {
    'module_dashboard': 1,
    'module_users': 2,
    'module_appointments': 3,
    'module_services': 4,
    'module_inventory': 5,
    'module_sales': 6,
    'module_purchases': 7,
    'module_suppliers': 8,
    'module_products': 9,
    'module_clients': 10,
    'module_categories': 11,
    'module_schedules': 12,
    'module_supplies': 13,
    'module_deliveries': 14,
    'module_reports': 15
  };

  const REVERSE_PERMISSION_MAP = Object.fromEntries(
    Object.entries(PERMISSION_MAP).map(([k, v]) => [v, k])
  );

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getRoles();
      // Map API roles to internal interface
      const mappedRoles = data.map(role => ({
        id: role.rolId.toString(),
        name: role.nombre,
        description: role.descripcion,
        permissions: role.permisos || [],
        status: role.estado ? 'active' : 'inactive',
        createdAt: 'N/A', // API might not return this in the list
        updatedAt: 'N/A',
        isSuperUser: role.nombre.toLowerCase().trim() === 'super admin'
      }));
      setRoles(mappedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // New role form data
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Auto-hide success alert after 4 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  // Agrupar permisos por módulo
  const groupPermissionsByModule = () => {
    const grouped = {};
    mockPermissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  };

  // Definir nombres y orden de módulos
  const moduleNames = {
    dashboard: 'Dashboard',
    users: 'Usuarios',
    appointments: 'Agendamiento',
    services: 'Servicios',
    inventory: 'Inventario',
    sales: 'Ventas',
    purchases: 'Compras',
    suppliers: 'Proveedores',
    products: 'Productos',
    clients: 'Clientes',
    categories: 'Categoria de Insumos',
    schedules: 'Horarios',
    supplies: 'Insumos',
    deliveries: 'Entrega de Insumos',
    orders: 'Pedidos',
    reports: 'Reportes'
  };

  // Iconos para cada módulo
  const moduleIcons = {
    dashboard: LayoutDashboard,
    users: Users,
    appointments: Calendar,
    services: Scissors,
    inventory: Package,
    sales: ShoppingCart,
    purchases: ShoppingBag,
    suppliers: Truck,
    products: Box,
    clients: UsersRound,
    categories: Tag,
    schedules: Clock,
    supplies: Boxes,
    deliveries: PackageCheck,
    orders: ShoppingBag,
    reports: FileText
  };

  const getModuleIcon = (module: string) => {
    return moduleIcons[module] || Settings;
  };

  const permissionsByModule = groupPermissionsByModule();

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice(
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

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 'super_admin': return 'from-pink-500 to-purple-700';
      default: return 'from-pink-400 to-purple-500';
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'super_admin': return Shield;
      case 'admin': return Shield;
      case 'asistente': return Shield; // Use Shield as requested in the image example
      case 'customer': return Shield;  // Use Shield as requested in the image example
      default: return Settings;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const handleCreateRole = async () => {
    if (newRoleData.name.trim() === '' || newRoleData.description.trim() === '') {
      setShowValidationErrorModal(true);
      return;
    }

    const normalizedName = newRoleData.name.trim().toLowerCase();
    if (normalizedName.includes('super')) {
      setAlertMessage('No se puede crear un rol de tipo Super Admin');
      setShowSuccessAlert(true);
      return;
    }

    try {
      setLoading(true);
      // Map frontend permission string IDs to backend numeric IDs
      const permisosIds: number[] = newRoleData.permissions
        .map((pId: string) => PERMISSION_MAP[pId as keyof typeof PERMISSION_MAP])
        .filter((id): id is number => id !== undefined);

      const payload = {
        nombre: newRoleData.name.trim(),
        descripcion: newRoleData.description.trim(),
        permisosIds
      };

      console.log('[CreateRole] Sending payload:', JSON.stringify(payload));

      await roleService.createRole(payload);

      setAlertMessage('Rol creado exitosamente');
      setShowSuccessAlert(true);
      setShowCreateModal(false);
      setNewRoleData({ name: '', description: '', permissions: [] });
      await fetchRoles();
    } catch (error: any) {
      console.error('[CreateRole] Error:', error);
      const msg = error?.message || '';
      // Extract the HTTP error body from the message if present
      const bodyMatch = msg.match(/\(\d+\): (.+)$/);
      const detail = bodyMatch ? bodyMatch[1] : msg;
      setAlertMessage(`Error al crear el rol: ${detail}`);
      setShowSuccessAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = async (role) => {
    setLoading(true);
    try {
      const fullRole = await roleService.getRoleById(parseInt(role.id));
      const mappedRole = {
        id: fullRole.rolId.toString(),
        name: fullRole.nombre,
        description: fullRole.descripcion,
        permissions: (fullRole.permisosIds || []).map(id => REVERSE_PERMISSION_MAP[id]).filter(p => p),
        status: fullRole.estado ? 'active' : 'inactive',
        isSuperUser: fullRole.nombre.toLowerCase().trim() === 'super admin'
      };
      setEditingRole(mappedRole);
    } catch (error) {
      console.error('Error fetching role details:', error);
      // Fallback to basic info if API fails
      setEditingRole({ ...role });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async () => {
    try {
      setLoading(true);
      const permisosIds = editingRole.permissions.map(pId => PERMISSION_MAP[pId]).filter(id => id !== undefined);

      await roleService.updateRole(parseInt(editingRole.id), {
        nombre: editingRole.name,
        descripcion: editingRole.description,
        permisosIds,
        estado: editingRole.status === 'active'
      });

      setAlertMessage('Rol actualizado exitosamente');
      setShowSuccessAlert(true);
      setEditingRole(null);
      await fetchRoles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      const msg = error?.message || '';
      const bodyMatch = msg.match(/\(\d+\): (.+)$/);
      const detail = bodyMatch ? bodyMatch[1] : msg;
      setAlertMessage(`Error al actualizar el rol: ${detail}`);
      setShowSuccessAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRole = (role) => {
    setViewingRole(role);
  };

  const toggleRoleStatus = async (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if ((role.name.toLowerCase() === 'super admin' || role.name === 'Administrador') && role.status === 'active') {
      setShowInactiveWarningModal(true);
      return;
    }

    try {
      setLoading(true);
      const newStatus = role.status === 'active' ? 'inactive' : 'active';

      // We need more details if we had a proper getRoleById, but we can try updating with existing info
      // Fetch current details first to be safe
      const currentDetails = await roleService.getRoleById(parseInt(roleId));

      await roleService.updateRole(parseInt(roleId), {
        nombre: currentDetails.nombre,
        descripcion: currentDetails.descripcion,
        permisosIds: currentDetails.permisosIds,
        estado: newStatus === 'active'
      });

      await fetchRoles();
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = (role) => {
    if (role.name.toLowerCase() === 'super admin' || role.name === 'Administrador') {
      setShowDeleteWarningModal(true);
      return;
    }
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const confirmDeleteRole = async () => {
    try {
      setLoading(true);
      await roleService.deleteRole(parseInt(roleToDelete.id));

      setAlertMessage('Rol eliminado exitosamente');
      setShowSuccessAlert(true);
      setShowDeleteModal(false);
      setRoleToDelete(null);
      await fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      const msg = error?.message || '';
      const bodyMatch = msg.match(/\(\d+\): (.+)$/);
      const detail = bodyMatch ? bodyMatch[1] : msg;
      setAlertMessage(`Error al eliminar el rol: ${detail}`);
      setShowSuccessAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Roles</h2>
          <p className="text-gray-600">
            Administra los roles del sistema y sus permisos asociados
          </p>
        </div>

        {hasPermission('manage_roles') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Rol</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar roles por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Lista de Roles</h3>
          <p className="text-gray-600">
            {filteredRoles.length} rol{filteredRoles.length !== 1 ? 'es' : ''} encontrado{filteredRoles.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Rol</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Permisos</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRoles.map((role) => {
                const Icon = getRoleIcon(role.id);

                return (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(role.id)} rounded-full flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{role.name}</div>
                          <div className="text-sm text-gray-600">{role.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {role.id === 'super_admin' || role.isSuperUser ? (
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
                          // Otros roles con switch
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={role.status === 'active'}
                              onChange={() => toggleRoleStatus(role.id)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                            <span className={`ml - 3 text - sm font - medium ${role.status === 'active' ? 'text-green-600' : 'text-red-600'
                              } `}>
                              {role.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRole(role)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasPermission('manage_roles') && (
                          <>
                            <button
                              onClick={() => handleEditRole(role)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar rol"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar rol"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4">
          <div className="text-sm text-gray-500">
            Mostrando {filteredRoles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredRoles.length)} de {filteredRoles.length} entradas
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-8 h-8 text-sm flex items-center justify-center rounded-xl font-bold transition-all ${currentPage === pageNum
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={goToNextPage}
              disabled={totalPages <= 1 || currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (() => {
        // Módulos permitidos para crear roles
        const allowedModules = [
          'dashboard',      // Dashboard
          'users',          // Usuarios (incluye gestión de roles)
          'appointments',   // Agendamiento
          'schedules',      // Horarios
          'sales',          // Ventas
          'services',       // Servicios
          'clients',        // Clientes
          'purchases',      // Compras
          'supplies',       // Insumos
          'categories',     // Categoría de Insumos
          'suppliers',      // Proveedores
          'deliveries'      // Entrega de Insumos
        ];

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white rounded-t-3xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Crear Nuevo Rol</h3>
                    <p className="text-pink-100 opacity-90">Define un nuevo rol y selecciona los módulos de acceso</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del rol
                  </label>
                  <input
                    type="text"
                    value={newRoleData.name}
                    onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Ej: Supervisor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción del rol
                  </label>
                  <textarea
                    value={newRoleData.description}
                    onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    rows={3}
                    placeholder="Describe las responsabilidades de este rol..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Módulos de acceso
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      Selecciona los módulos a los que este rol tendrá acceso
                    </span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl">
                    {Object.keys(permissionsByModule)
                      .filter(module => allowedModules.includes(module))
                      .sort()
                      .map(module => {
                        const ModuleIcon = getModuleIcon(module);
                        const modulePermissions = permissionsByModule[module].map(p => p.id);
                        const isModuleSelected = modulePermissions.every(permId =>
                          newRoleData.permissions.includes(permId)
                        );

                        return (
                          <label
                            key={module}
                            className={`flex items-center space-x-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${isModuleSelected
                              ? 'border-pink-400 bg-gradient-to-r from-pink-50 to-purple-50 shadow-sm'
                              : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'
                              }`}
                          >
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isModuleSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewRoleData({
                                      ...newRoleData,
                                      permissions: [...new Set([...newRoleData.permissions, ...modulePermissions])]
                                    });
                                  } else {
                                    setNewRoleData({
                                      ...newRoleData,
                                      permissions: newRoleData.permissions.filter(p => !modulePermissions.includes(p))
                                    });
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-7 h-7 border-2 rounded-xl flex items-center justify-center transition-all ${isModuleSelected
                                ? 'bg-gradient-to-r from-pink-400 to-purple-500 border-transparent shadow-md'
                                : 'border-gray-300 bg-white'
                                }`}>
                                {isModuleSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                            </div>

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isModuleSelected
                              ? 'bg-gradient-to-r from-pink-400 to-purple-500 shadow-md'
                              : 'bg-gray-100'
                              }`}>
                              <ModuleIcon className={`w-6 h-6 ${isModuleSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>

                            <div className="flex-1">
                              <div className={`font-bold text-lg ${isModuleSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                                {moduleNames[module as keyof typeof moduleNames]}
                              </div>
                              <div className="text-xs text-gray-500">
                                {isModuleSelected ? 'Módulo habilitado' : 'Sin acceso'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewRoleData({ name: '', description: '', permissions: [] });
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleCreateRole}
                    className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Crear Rol</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* View Role Modal */}
      {viewingRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header con gradiente */}
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-8 text-white rounded-t-3xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex items-center space-x-4 relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                  {React.createElement(getRoleIcon(viewingRole.id), { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{viewingRole.name}</h3>
                  <p className="text-sm opacity-90 mt-1">Detalle del rol</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Información General</h4>
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">ID:</span>
                    <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg text-sm shadow-sm">{viewingRole.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Estado:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(viewingRole.status || 'active')}`}>
                      {getStatusLabel(viewingRole.status || 'active')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Fecha de creación:</span>
                    <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg text-sm shadow-sm">{viewingRole.createdAt || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Descripción</h4>
                <p className="text-gray-700 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-4">{viewingRole.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Permisos Asignados ({viewingRole.permissions.length})</h4>
                <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {viewingRole.permissions.map((permissionId) => {
                    const permission = mockPermissions.find(p => p.id === permissionId);
                    return permission ? (
                      <div key={permissionId} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingRole(null)}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (() => {
        // Verificar si es el Super Admin
        const isSuperAdmin = editingRole.id === 'super_admin' || editingRole.isSuperUser;
        // Si es super admin, asegurarse de que tenga todos los permisos
        const allPermissions = mockPermissions.map(p => p.id);
        if (isSuperAdmin && editingRole.permissions.length !== allPermissions.length) {
          editingRole.permissions = allPermissions;
        }

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-8 text-white rounded-t-3xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                    {React.createElement(getRoleIcon(editingRole.id), { className: "w-8 h-8 text-white" })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Editar Rol: {editingRole.name}</h3>
                    <p className="text-sm opacity-90 mt-1 flex items-center">
                      <span className="w-2 h-2 bg-white/40 rounded-full mr-2"></span>
                      {isSuperAdmin
                        ? 'Este rol de sistema tiene permisos totales protegidos'
                        : 'Configura las capacidades y descripción de este rol'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Mensaje informativo para Super Admin */}
                {isSuperAdmin && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-6 h-6 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">Rol Protegido</h4>
                        <p className="text-sm text-gray-700">
                          El Super Admin tiene todos los permisos del sistema habilitados de forma permanente.
                          Este rol no puede ser modificado para garantizar el acceso completo al sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del rol
                  </label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    disabled={isSuperAdmin}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${isSuperAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                      } `}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción del rol
                  </label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    disabled={isSuperAdmin}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${isSuperAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                      } `}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Módulos de acceso
                    {isSuperAdmin && (
                      <span className="ml-2 text-xs text-purple-600 font-normal">
                        (Todos los permisos están habilitados permanentemente)
                      </span>
                    )}
                    {!isSuperAdmin && (
                      <span className="block text-xs font-normal text-gray-500 mt-1">
                        Selecciona los módulos a los que este rol tendrá acceso
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl">
                    {Object.keys(permissionsByModule)
                      .sort()
                      .map(module => {
                        const ModuleIcon = getModuleIcon(module);
                        const modulePermissions = permissionsByModule[module].map(p => p.id);
                        const isModuleSelected = modulePermissions.every(permId =>
                          editingRole.permissions.includes(permId)
                        );

                        return (
                          <label
                            key={module}
                            className={`flex items-center space-x-4 p-5 border-2 rounded-2xl transition-all ${isSuperAdmin
                              ? 'bg-gray-50 cursor-not-allowed border-gray-200'
                              : isModuleSelected
                                ? 'border-pink-400 bg-gradient-to-r from-pink-50 to-purple-50 cursor-pointer shadow-sm'
                                : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50 cursor-pointer'
                              }`}
                          >
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isModuleSelected}
                                disabled={isSuperAdmin}
                                onChange={(e) => {
                                  if (!isSuperAdmin) {
                                    if (e.target.checked) {
                                      setEditingRole({
                                        ...editingRole,
                                        permissions: [...new Set([...editingRole.permissions, ...modulePermissions])]
                                      });
                                    } else {
                                      setEditingRole({
                                        ...editingRole,
                                        permissions: editingRole.permissions.filter(p => !modulePermissions.includes(p))
                                      });
                                    }
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-7 h-7 border-2 rounded-xl flex items-center justify-center transition-all ${isModuleSelected
                                ? 'bg-gradient-to-r from-pink-400 to-purple-500 border-transparent shadow-md'
                                : 'border-gray-300 bg-white'
                                } ${isSuperAdmin ? 'opacity-50' : ''}`}>
                                {isModuleSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                            </div>

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isModuleSelected
                              ? 'bg-gradient-to-r from-pink-400 to-purple-500 shadow-md'
                              : 'bg-gray-100'
                              }`}>
                              <ModuleIcon className={`w-6 h-6 ${isModuleSelected ? 'text-white' : 'text-gray-600'}`} />
                            </div>

                            <div className="flex-1">
                              <div className={`font-bold text-lg ${isModuleSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                                {moduleNames[module as keyof typeof moduleNames]}
                              </div>
                              <div className="text-xs text-gray-500">
                                {isModuleSelected ? (isSuperAdmin ? 'Rol de sistema' : 'Módulo habilitado') : 'Sin acceso'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setEditingRole(null)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>{isSuperAdmin ? 'Cerrar' : 'Cancelar'}</span>
                  </button>
                  {!isSuperAdmin && (
                    <button
                      onClick={handleSaveRole}
                      className={`flex-1 bg-gradient-to-r ${getRoleColor(editingRole.id)} text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
                    >
                      <Save className="w-5 h-5" />
                      <span>Guardar Cambios</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Role Modal */}
      {showDeleteModal && roleToDelete && (
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
                  ¿Estás segura de que quieres eliminar el rol <strong>{roleToDelete.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(roleToDelete.id)} rounded-full flex items-center justify-center`}>
                      {React.createElement(getRoleIcon(roleToDelete.id), { className: "w-5 h-5 text-white" })}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{roleToDelete.name}</div>
                      <div className="text-sm text-gray-600">{roleToDelete.permissions.length} permiso{roleToDelete.permissions.length !== 1 ? 's' : ''} asignado{roleToDelete.permissions.length !== 1 ? 's' : ''}</div>
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
                  onClick={confirmDeleteRole}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Role Warning Modal */}
      {showInactiveWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                  <p className="text-gray-600">No se puede inactivar el rol de Administrador</p>
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

      {/* Delete Role Warning Modal */}
      {showDeleteWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                  <p className="text-gray-600">No se puede eliminar un rol principal del sistema (Administrador o Super Admin)</p>
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

      {/* Validation Error Modal */}
      {showValidationErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-600">Campos Requeridos</h3>
                  <p className="text-gray-600">Por favor completa todos los campos</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-700 font-medium text-center">
                    Debes completar el nombre y la descripción del rol antes de crearlo.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowValidationErrorModal(false)}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-5 duration-300">
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white/80 p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 border border-white/50 animate-in zoom-in-95 duration-200">
            <div className="relative">
              <Loader2 className="w-14 h-14 text-pink-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-gray-800 font-bold text-lg">Procesando</p>
              <p className="text-pink-600 text-sm animate-pulse font-medium">Sincronizando con la API...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}