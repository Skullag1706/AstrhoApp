import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Edit, Trash2, Eye, Search, Phone, Mail, 
  MapPin, Package, X, Save, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockSuppliers } from '../../data/management';
import { SimplePagination } from '../ui/simple-pagination';

interface SupplierManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function SupplierManagement({ hasPermission }: SupplierManagementProps) {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = supplierTypeFilter === 'all' || supplier.supplierType === supplierTypeFilter;
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

  const handleDeleteSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };

  const confirmDeleteSupplier = () => {
    const supplierName = selectedSupplier.name;
    setSuppliers(suppliers.filter(s => s.id !== selectedSupplier.id));
    setShowDeleteModal(false);
    setSelectedSupplier(null);
    
    toast.success(`Proveedor "${supplierName}" eliminado correctamente`);
  };

  const handleToggleSupplierStatus = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
    
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
  };

  const handleSaveSupplier = (supplierData) => {
    if (selectedSupplier) {
      // Edit existing supplier
      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplier.id 
          ? { ...s, ...supplierData, updatedAt: new Date().toISOString().split('T')[0] }
          : s
      ));
      toast.success(`Proveedor "${supplierData.name}" actualizado correctamente`);
    } else {
      // Create new supplier
      const newSupplier = {
        id: Math.max(...suppliers.map(s => s.id), 0) + 1,
        ...supplierData,
        status: 'active',
        totalOrders: 0,
        rating: 0,
        products: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setSuppliers([...suppliers, newSupplier]);
      toast.success(`Proveedor "${supplierData.name}" registrado correctamente`);
    }
    setShowEditModal(false);
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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      supplier.supplierType === 'juridica' 
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
                          <span className={`ml-3 text-sm font-medium ${
                            supplier.status === 'active' ? 'text-green-600' : 'text-red-600'
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
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveSupplier}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          supplier={selectedSupplier}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteSupplier}
        />
      )}
    </div>
  );
}

// Supplier Detail Modal Component
function SupplierDetailModal({ supplier, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{supplier.name}</h3>
              <p className="text-blue-100 text-lg">{supplier.supplierType === 'juridica' ? supplier.contactPerson : supplier.taxId}</p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  supplier.status === 'active' 
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
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    supplier.supplierType === 'juridica' 
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
function SupplierEditModal({ supplier, onClose, onSave }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Si es tipo natural, asegurar que contactPerson esté vacío o sea igual al nombre
    const dataToSave = {
      ...formData,
      contactPerson: formData.supplierType === 'natural' ? formData.name : formData.contactPerson
    };
    
    onSave(dataToSave);
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
  };

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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                required
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                required
              />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  required={formData.supplierType === 'juridica'}
                />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                required
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                required
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                required
              />
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
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              {supplier ? 'Actualizar' : 'Crear'} Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ supplier, onClose, onConfirm }) {
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
              ¿Estás segura de que quieres eliminar el proveedor <strong>{supplier.name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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