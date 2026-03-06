import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Edit, Trash2, Eye, Search, Phone, Mail,
  MapPin, Package, X, Save, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supplierService } from '../../services/supplierService';
import { purchaseService } from '../../services/purchaseService';
import { SimplePagination } from '../ui/simple-pagination';

const mapApiToFrontend = (apiData: any) => {
  if (!apiData) return null;
  return {
    id: apiData.proveedorId || Math.floor(Math.random() * 10000),
    supplierType: apiData.tipoProveedor === 'Juridico' ? 'juridica' : 'natural',
    name: apiData.nombre || '',
    documentType: apiData.tipoDocumento || (apiData.tipoProveedor === 'Juridico' ? 'NIT' : 'CC'),
    taxId: apiData.documento || '',
    contactPerson: apiData.personaContacto || apiData.persona_Contacto || apiData.nombre || '',
    email: apiData.correo || '',
    phone: apiData.telefono || '',
    address: apiData.direccion || '',
    department: apiData.departamento || '',
    city: apiData.ciudad || '',
    status: apiData.estado === false ? 'inactive' : 'active',
    totalOrders: 0,
    rating: 0,
    products: []
  };
};

const mapFrontendToApi = (frontendData: any, isPost = false) => ({
  ...(isPost ? {} : { proveedorId: frontendData.id }),
  tipoProveedor: frontendData.supplierType === 'juridica' ? 'Juridico' : 'Natural',
  nombre: frontendData.name,
  tipoDocumento: frontendData.documentType || (frontendData.supplierType === 'juridica' ? 'NIT' : 'CC'),
  documento: frontendData.taxId,
  persona_Contacto: frontendData.contactPerson || frontendData.name,
  correo: frontendData.email,
  telefono: frontendData.phone,
  direccion: frontendData.address,
  departamento: frontendData.department,
  ciudad: frontendData.city,
  estado: frontendData.status === 'active' || frontendData.status === true
});

interface SupplierManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function SupplierManagement({ hasPermission }: SupplierManagementProps) {
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

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [isLoading, setIsLoading] = useState(true);
  const [checkingPurchases, setCheckingPurchases] = useState(false);
  const [supplierHasPurchases, setSupplierHasPurchases] = useState(false);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getAll();
      console.log('Loaded suppliers API response:', data);

      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && Array.isArray(data.$values)) {
        items = data.$values;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data && Array.isArray(data.result)) {
        items = data.result;
      }

      // Load ALL suppliers (active + inactive) — soft-deleted ones are shown on reload
      setSuppliers(items.map(mapApiToFrontend).filter(Boolean));
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const nameStr = supplier?.name || '';
    const contactStr = supplier?.contactPerson || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = supplierTypeFilter === 'all' || supplier?.supplierType === supplierTypeFilter;
    return matchesSearch && matchesType;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const handleViewDetail = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleDeleteSupplier = async (supplier) => {
    setSelectedSupplier(supplier);
    setCheckingPurchases(true);
    setSupplierHasPurchases(false);
    setShowDeleteModal(true);

    try {
      // Fetch real purchases from API to check association
      const raw = await purchaseService.getAll();
      let purchases: any[] = [];
      if (Array.isArray(raw)) {
        purchases = raw;
      } else if (raw && Array.isArray(raw.$values)) {
        purchases = raw.$values;
      } else if (raw && Array.isArray(raw.data)) {
        purchases = raw.data;
      } else if (raw && Array.isArray(raw.result)) {
        purchases = raw.result;
      }

      // Check if any active purchase references this supplier
      const hasActivePurchases = purchases.some(
        (p: any) => p.proveedorId === supplier.id && p.estado !== false
      );
      setSupplierHasPurchases(hasActivePurchases);
    } catch (err) {
      console.error('Error checking purchases for supplier:', err);
      // On error, allow deletion (don't block based on failed check)
      setSupplierHasPurchases(false);
    } finally {
      setCheckingPurchases(false);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    const supplierName = selectedSupplier.name;
    const supplierId = selectedSupplier.id;

    // Close modal immediately for responsiveness
    setShowDeleteModal(false);
    setSelectedSupplier(null);

    try {
      await supplierService.delete(supplierId);
      // Remove from local state immediately after successful API call
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      toast.success(`Proveedor "${supplierName}" eliminado correctamente`);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error(`No se pudo eliminar a "${supplierName}". Es posible que tenga registros asociados (ej. Compras) en la base de datos.`);
      // Re-sync from API to restore consistent state
      await loadSuppliers();
    }
  };

  const handleToggleSupplierStatus = async (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';

    try {
      const apiPayload = mapFrontendToApi({ ...supplier, status: newStatus }, false);
      await supplierService.update(supplier.id, apiPayload);

      setSuppliers(suppliers.map(s =>
        s.id === supplierId
          ? { ...s, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
          : s
      ));

      if (newStatus === 'active') {
        toast.success(`Proveedor "${supplier.name}" activado correctamente`);
      } else {
        toast.info(`Proveedor "${supplier.name}" inactivado correctamente`);
      }
    } catch (error) {
      console.error('Error updating supplier status:', error);
      toast.error('Error al cambiar el estado del proveedor');
    }
  };

  const handleSaveSupplier = async (supplierData: any) => {
    try {
      if (selectedSupplier) {
        // Edit existing supplier
        const apiPayload = mapFrontendToApi({ ...selectedSupplier, ...supplierData }, false);
        await supplierService.update(selectedSupplier.id, apiPayload);

        setSuppliers(suppliers.map(s =>
          s.id === selectedSupplier.id
            ? { ...s, ...supplierData, updatedAt: new Date().toISOString().split('T')[0] }
            : s
        ));
        toast.success(`Proveedor "${supplierData.name}" actualizado correctamente`);
      } else {
        // Create new supplier
        const apiPayload = mapFrontendToApi({ ...supplierData, status: 'active' }, true);
        const createdApiData = await supplierService.create(apiPayload);
        console.log('Created supplier response:', createdApiData);

        let apiItem = createdApiData;
        if (createdApiData && createdApiData.data) apiItem = createdApiData.data;
        else if (createdApiData && createdApiData.result) apiItem = createdApiData.result;

        // If apiItem is a string or empty, fallback to the requested payload to update view optimistically
        if (!apiItem || typeof apiItem !== 'object') {
          apiItem = apiPayload;
          apiItem.proveedorId = Math.floor(Math.random() * 10000); // optimistic ID
        }

        const newSupplier = mapApiToFrontend(apiItem);
        if (newSupplier) {
          const mergedSupplier = {
            ...newSupplier,
            id: newSupplier.id || Math.max(...(suppliers.map(s => s?.id || 0)), 0) + 1,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          };

          setSuppliers([...suppliers, mergedSupplier]);
          toast.success(`Proveedor "${supplierData.name}" registrado correctamente`);
        }

        // Fully sync from server to ensure correct DB ID
        loadSuppliers();
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Error al guardar el proveedor. Verifica los datos o conexión.');
      throw error; // Rethrow to let the modal know it failed
    }
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setShowEditModal(true);
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'blacklisted': return 'Lista Negra';
      default: return status;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Proveedores</h2>
          <p className="text-gray-600">
            Administra la información de proveedores y sus productos
          </p>
        </div>

        {hasPermission('manage_suppliers') && (
          <button
            onClick={handleCreateSupplier}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Proveedor</span>
          </button>
        )}
      </div>



      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proveedores por nombre o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>

          <select
            value={supplierTypeFilter}
            onChange={(e) => setSupplierTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="juridica">Personas Jurídicas</option>
            <option value="natural">Personas Naturales</option>
          </select>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Tipo</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">NIT/Cédula</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Teléfono</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">{supplier.name}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${supplier.supplierType === 'juridica'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {supplier.supplierType === 'juridica' ? 'Jurídica' : 'Natural'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{supplier.taxId}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{supplier.phone}</div>
                  </td>

                  <td className="px-6 py-4">
                    {hasPermission('manage_suppliers') ? (
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={supplier.status === 'active'}
                            onChange={() => handleToggleSupplierStatus(supplier.id)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                          <span className={`ml-3 text-sm font-medium ${supplier.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(supplier.status)}`}>
                        {getStatusLabel(supplier.status)}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetail(supplier)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Ver Detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {hasPermission('manage_suppliers') && (
                        <>
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSupplier(supplier)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentSuppliers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron proveedores que coincidan con los filtros.</p>
            </div>
          )}
        </div>

        {/* Pagination - Always visible */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredSuppliers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} de {filteredSuppliers.length} registros
          </div>
          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
          />
        </div>
      </div>

      {/* Supplier Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Supplier Edit Modal */}
      {showEditModal && (
        <SupplierEditModal
          supplier={selectedSupplier}
          existingSuppliers={suppliers}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveSupplier}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          supplier={selectedSupplier}
          hasPurchases={supplierHasPurchases}
          isChecking={checkingPurchases}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteSupplier}
        />
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

// Supplier Detail Modal Component
function SupplierDetailModal({ supplier, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 text-white rounded-t-3xl shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{supplier.name}</h3>
              <p className="text-blue-100 text-lg">{supplier.supplierType === 'juridica' ? supplier.contactPerson : supplier.taxId}</p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${supplier.status === 'active'
                  ? 'bg-green-400 text-white'
                  : 'bg-gray-400 text-white'
                  }`}>
                  {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
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
          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información de Contacto</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{supplier.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{supplier.email}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-700">{supplier.address}</div>
                    <div className="text-gray-600">{supplier.city}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-4">Información Comercial</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de Proveedor:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${supplier.supplierType === 'juridica'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {supplier.supplierType === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{supplier.supplierType === 'juridica' ? 'NIT:' : 'Cédula:'}</span>
                  <span className="text-gray-800">{supplier.taxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Departamento:</span>
                  <span className="text-gray-800">{supplier.department || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Órdenes:</span>
                  <span className="text-gray-800">{supplier.totalOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Supplier Edit Modal Component (sin campo productos suministrados)
function SupplierEditModal({ supplier, existingSuppliers = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    supplierType: supplier?.supplierType || 'juridica',
    documentType: supplier?.documentType || 'NIT',
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    taxId: supplier?.taxId || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    department: supplier?.department || 'Antioquia',
    city: supplier?.city || 'Medellín',
    status: supplier?.status || 'active',
    image: supplier?.image || ''
  });

  // Estado para errores de validación por campo
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Regex de validación ──
  const ONLY_LETTERS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  const PHONE_REGEX = /^\d{10}$/;

  const REQUIRED_MSG = 'Este campo es obligatorio';

  // ── Funciones de validación individuales ──
  const validateName = (value: string): string | null => {
    if (!value.trim()) return REQUIRED_MSG;
    if (!ONLY_LETTERS_REGEX.test(value)) {
      return 'El campo Nombre solo permite letras';
    }
    return null;
  };

  const validateContactPerson = (value: string): string | null => {
    if (!value.trim()) return REQUIRED_MSG;
    if (!ONLY_LETTERS_REGEX.test(value)) {
      return 'El campo Persona de contacto solo permite letras';
    }
    return null;
  };

  const validatePhone = (value: string): string | null => {
    if (!value.trim()) return REQUIRED_MSG;
    if (!PHONE_REGEX.test(value)) {
      return 'El teléfono debe contener exactamente 10 dígitos numéricos';
    }
    return null;
  };

  const validateTaxId = (value: string): string | null => {
    if (!value.trim()) return REQUIRED_MSG;
    // Verificar unicidad contra proveedores existentes (excluir el proveedor actual si se está editando)
    const isDuplicate = existingSuppliers.some(
      (s) => s.taxId === value && (!supplier || s.id !== supplier.id)
    );
    if (isDuplicate) {
      return 'El número de documento ya se encuentra registrado';
    }
    return null;
  };

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return REQUIRED_MSG;
    // Verificar unicidad contra proveedores existentes (excluir el proveedor actual si se está editando)
    const isDuplicate = existingSuppliers.some(
      (s) => s.email?.toLowerCase() === value.trim().toLowerCase() && (!supplier || s.id !== supplier.id)
    );
    if (isDuplicate) {
      return 'El email ya se encuentra registrado';
    }
    return null;
  };

  const validateAddress = (value: string): string | null => {
    if (!value.trim()) return REQUIRED_MSG;
    return null;
  };

  // ── Validación completa del formulario ──
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    const taxIdErr = validateTaxId(formData.taxId);
    if (taxIdErr) newErrors.taxId = taxIdErr;

    const nameErr = validateName(formData.name);
    if (nameErr) newErrors.name = nameErr;

    if (formData.supplierType === 'juridica') {
      const contactErr = validateContactPerson(formData.contactPerson);
      if (contactErr) newErrors.contactPerson = contactErr;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const addressErr = validateAddress(formData.address);
    if (addressErr) newErrors.address = addressErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Departamentos de Colombia
  const departments = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas',
    'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
    'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
    'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
    'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
  ];

  // Ciudades principales por departamento
  const citiesByDepartment = {
    'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro', 'Sabaneta', 'La Estrella', 'Caldas'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia'],
    'Bogotá D.C.': ['Bogotá'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona'],
    'Boyacá': ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá'],
    'Caldas': ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría'],
    'Caquetá': ['Florencia', 'San Vicente del Caguán'],
    'Cauca': ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'],
    'Cesar': ['Valledupar', 'Aguachica', 'Bosconia'],
    'Córdoba': ['Montería', 'Cereté', 'Lorica', 'Sahagún'],
    'Cundinamarca': ['Soacha', 'Fusagasugá', 'Chía', 'Zipaquirá', 'Facatativá', 'Girardot'],
    'Huila': ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
    'La Guajira': ['Riohacha', 'Maicao', 'Uribia'],
    'Magdalena': ['Santa Marta', 'Ciénaga', 'Fundación'],
    'Meta': ['Villavicencio', 'Acacías', 'Granada'],
    'Nariño': ['Pasto', 'Tumaco', 'Ipiales'],
    'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
    'Quindío': ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro'],
    'Risaralda': ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'],
    'Sucre': ['Sincelejo', 'Corozal', 'San Marcos'],
    'Tolima': ['Ibagué', 'Espinal', 'Melgar', 'Honda'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga', 'Jamundí', 'Yumbo']
  };

  // Obtener ciudades según el departamento seleccionado
  const availableCities = citiesByDepartment[formData.department] || ['Otra'];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ejecutar todas las validaciones antes del envío
    if (!validateAll()) {
      toast.error('Por favor corrige los errores en el formulario antes de continuar.');
      return;
    }

    // Si es tipo natural, asegurar que contactPerson esté vacío o sea igual al nombre
    const dataToSave = {
      ...formData,
      contactPerson: formData.supplierType === 'natural' ? formData.name : formData.contactPerson
    };

    try {
      setIsSubmitting(true);
      await onSave(dataToSave);
    } catch (err) {
      // Error handled by parent toast, keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value
    };

    // Si cambia a tipo natural, limpiar el campo de persona de contacto
    if (name === 'supplierType' && value === 'natural') {
      updatedData.contactPerson = '';
    }

    // Si cambia el departamento, resetear la ciudad a la primera del departamento
    if (name === 'department') {
      const newCities = citiesByDepartment[value] || ['Otra'];
      updatedData.city = newCities[0];
    }

    setFormData(updatedData);

    // Validación en tiempo real: limpiar error del campo al escribir
    const newErrors = { ...errors };

    if (name === 'name') {
      const err = validateName(value);
      if (err) newErrors.name = err; else delete newErrors.name;
    }
    if (name === 'contactPerson') {
      const err = validateContactPerson(value);
      if (err) newErrors.contactPerson = err; else delete newErrors.contactPerson;
    }
    if (name === 'phone') {
      const err = validatePhone(value);
      if (err) newErrors.phone = err; else delete newErrors.phone;
    }
    if (name === 'taxId') {
      const err = validateTaxId(value);
      if (err) newErrors.taxId = err; else delete newErrors.taxId;
    }
    if (name === 'email') {
      const err = validateEmail(value);
      if (err) newErrors.email = err; else delete newErrors.email;
    }
    if (name === 'address') {
      const err = validateAddress(value);
      if (err) newErrors.address = err; else delete newErrors.address;
    }

    setErrors(newErrors);
  };

  // Helper para clases de input con error
  const inputClass = (field: string) =>
    `w-full px-4 py-3 border ${errors[field] ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'
    } rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent`;

  // Comprobar si el formulario tiene errores activos
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">
                {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <p className="text-pink-100">
                {supplier ? 'Actualiza la información del proveedor' : 'Agrega un nuevo proveedor'}
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {/* Campos en dos columnas */}
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Tipo de Proveedor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Proveedor *
              </label>
              <select
                name="supplierType"
                value={formData.supplierType}
                onChange={handleInputChange}
                disabled={supplier !== null}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="juridica">Persona Jurídica</option>
                <option value="natural">Persona Natural</option>
              </select>
              {supplier !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  No se puede modificar después de la creación
                </p>
              )}
            </div>

            {/* Tipo de Documento - Solo si es Persona Natural */}
            {formData.supplierType === 'natural' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
            )}

            {/* Documento (Cédula o NIT) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.supplierType === 'juridica' ? 'NIT *' : 'Documento *'}
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                className={inputClass('taxId')}
              />
              {errors.taxId && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.taxId}
                </p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.supplierType === 'juridica' ? 'Nombre de la Empresa *' : 'Nombre Completo *'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={inputClass('name')}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Persona de Contacto - Solo si es Jurídica */}
            {formData.supplierType === 'juridica' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Persona de Contacto *
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className={inputClass('contactPerson')}
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.contactPerson}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputClass('email')}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={inputClass('phone')}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={inputClass('address')}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.address}
                </p>
              )}
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                {departments.map(department => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ciudad *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || hasErrors}
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Procesando...' : (supplier ? 'Actualizar' : 'Crear')} Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ supplier, hasPurchases, isChecking, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {isChecking ? 'Verificando...' : hasPurchases ? 'Operación No Permitida' : 'Confirmar Eliminación'}
              </h3>
              <p className="text-gray-600">
                {isChecking ? 'Comprobando compras asociadas' : hasPurchases ? 'El proveedor tiene registros asociados' : 'Esta acción no se puede deshacer'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{supplier.name}</div>
                  <div className="text-sm text-gray-600">
                    {supplier.supplierType === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'} • {supplier.taxId}
                  </div>
                </div>
              </div>
            </div>

            {hasPurchases ? (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl text-sm font-medium">
                No se puede eliminar este proveedor porque está asociado a una o más órdenes de compra en el historial. Para eliminarlo, primero se deben anular o reasignar sus compras.
              </div>
            ) : (
              <p className="text-gray-700">
                ¿Estás segura de que quieres eliminar el proveedor <strong>{supplier.name}</strong>?
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            {!isChecking && !hasPurchases && (
              <button
                onClick={onConfirm}
                className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}