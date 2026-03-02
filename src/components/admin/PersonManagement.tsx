import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Filter, Eye, Edit, Calendar,
    Phone, Mail, MapPin, Heart, Scissors, ShoppingBag,
    X, Save, AlertCircle, Star, TrendingUp, Clock, Trash2, CheckCircle,
    Briefcase
} from 'lucide-react';
import { SimplePagination } from '../ui/simple-pagination';
import { personService, Person, CreatePersonData } from '../../services/personService';
import { authService } from '../../services/authService';

interface PersonManagementProps {
    hasPermission: (permission: string) => boolean;
}

export function PersonManagement({ hasPermission }: PersonManagementProps) {
    const [personType, setPersonType] = useState<'client' | 'employee'>('client');
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [showPersonModal, setShowPersonModal] = useState(false);
    const [showNewPersonModal, setShowNewPersonModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // Fetch data when personType changes
    useEffect(() => {
        fetchPersons();
        setCurrentPage(1); // Reset page on tab change
    }, [personType]);

    const fetchPersons = async () => {
        try {
            setLoading(true);
            const data = await personService.getPersons(personType);
            setPersons(data);
        } catch (error) {
            console.error('Error fetching persons:', error);
            // Fallback to empty list or handle error UI
            setPersons([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-hide success alert after 4 seconds
    useEffect(() => {
        if (showSuccessAlert) {
            const timer = setTimeout(() => {
                setShowSuccessAlert(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showSuccessAlert]);

    // Filter persons
    const filteredPersons = persons.filter(person => {
        const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            person.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || person.status === filterStatus;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        // Super admin always first
        if (a.documentId === '8729451090') return -1;
        if (b.documentId === '8729451090') return 1;
        return 0;
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredPersons.length / itemsPerPage));
    const paginatedPersons = filteredPersons.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const getDocumentTypeLabel = (person: Person) => {
        return person.documentType || 'CC';
    };

    const handleViewPerson = (person: Person) => {
        setSelectedPerson(person);
        setShowPersonModal(true);
    };

    const handleEditPerson = (person: Person) => {
        setEditingPerson(person);
        setShowNewPersonModal(true);
    };

    const handleDeletePerson = (person: Person) => {
        setPersonToDelete(person);
        setShowDeleteModal(true);
    };

    const confirmDeletePerson = async () => {
        if (personToDelete) {
            try {
                await personService.deletePerson(personToDelete.documentId, personType);
                setPersons(persons.filter(p => p.documentId !== personToDelete.documentId));
                setShowSuccessAlert(true);
                setAlertMessage(`${personType === 'client' ? 'Cliente' : 'Empleado'} eliminado exitosamente`);
            } catch (error) {
                console.error('Error deleting person:', error);
                alert('Error al eliminar');
            } finally {
                setShowDeleteModal(false);
                setPersonToDelete(null);
            }
        }
    };

    const handleSavePerson = async (personData: CreatePersonData & { authData?: any }) => {
        try {
            const { authData, ...personOnlyData } = personData;

            // If creating a NEW person AND they asked to create an account
            if (!editingPerson && authData && authData.createAccount) {
                // 1. Check duplicates
                const { emailExists } = await authService.checkDuplicates(authData.email);
                if (emailExists) {
                    alert('Error: El correo electrónico ya está registrado.');
                    return;
                }

                if (authData.contrasena !== authData.confirmarContrasena) {
                    alert('Error: Las contraseñas no coinciden.');
                    return;
                }

                // 2. Register user
                const rolId = personType === 'client' ? 2 : 3; // 2: Cliente, 3: Asistente
                await authService.register({
                    rolId,
                    email: authData.email,
                    contrasena: authData.contrasena,
                    confirmarContrasena: authData.confirmarContrasena
                });
            }

            if (editingPerson) {
                // Edit
                const updatedRaw = await personService.updatePerson(editingPerson.documentId, {
                    ...editingPerson,
                    ...personOnlyData,
                    type: personType
                } as Person);

                setPersons(persons.map(p =>
                    p.documentId === editingPerson.documentId ? { ...updatedRaw, status: editingPerson.status } : p // Merge status back if API response lacks it based on spec
                ));
                setShowSuccessAlert(true);
                setAlertMessage(`${personType === 'client' ? 'Cliente' : 'Empleado'} actualizado exitosamente`);
            } else {
                // Create
                personOnlyData.type = personType;
                const newPerson = await personService.createPerson(personOnlyData);
                setPersons([...persons, newPerson]);
                setShowSuccessAlert(true);
                setAlertMessage(`${personType === 'client' ? 'Cliente' : 'Empleado'} registrado exitosamente`);
            }
        } catch (error) {
            console.error('Error saving person:', error);
            alert('Error al guardar datos. Por favor revise la consola.');
        } finally {
            setShowNewPersonModal(false);
            setEditingPerson(null);
            fetchPersons(); // Refresh just in case mapping missed something
        }
    };

    const handleTogglePersonStatus = async (personId: string, currentStatus: string) => {
        const personToUpdate = persons.find(p => p.documentId === personId);
        if (!personToUpdate) return;

        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await personService.updatePerson(personToUpdate.documentId, {
                ...personToUpdate,
                status: newStatus
            });

            setPersons(persons.map(p =>
                p.documentId === personId ? { ...p, status: newStatus } : p
            ));
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Error al cambiar el estado');
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Gestión de Personas</h2>
                    <p className="text-gray-600">
                        Administra la información de clientes y empleados
                    </p>
                </div>

                {hasPermission('manage_clients') && (
                    <button
                        onClick={() => {
                            setEditingPerson(null);
                            setShowNewPersonModal(true);
                        }}
                        className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Registrar {personType === 'client' ? 'Cliente' : 'Empleado'}</span>
                    </button>
                )}
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex space-x-4 mb-8">
                <button
                    onClick={() => setPersonType('client')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${personType === 'client'
                        ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-600 shadow-sm border border-gray-100'
                        }`}
                >
                    <Users className={`w-5 h-5 ${personType === 'client' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Clientes</span>
                </button>
                <button
                    onClick={() => setPersonType('employee')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${personType === 'employee'
                        ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-600 shadow-sm border border-gray-100'
                        }`}
                >
                    <Briefcase className={`w-5 h-5 ${personType === 'employee' ? 'text-white' : 'text-gray-400'}`} />
                    <span>Empleados</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, documento o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Persons Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className={`bg-gradient-to-r ${personType === 'client' ? 'from-pink-50 to-purple-50' : 'from-purple-50 to-blue-50'} p-6 border-b border-gray-100`}>
                    <h3 className="text-xl font-bold text-gray-800">
                        Lista de {personType === 'client' ? 'Clientes' : 'Empleados'}
                    </h3>
                    <p className="text-gray-600">
                        {filteredPersons.length} registro{filteredPersons.length !== 1 ? 's' : ''} encontrado{filteredPersons.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="overflow-x-auto relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                        </div>
                    )}
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-gray-800">Tipo Doc.</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-800">Documento</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-800">Teléfono</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedPersons.map((person) => (
                                <tr key={person.documentId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                                            {getDocumentTypeLabel(person)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-800">{person.documentId}</div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800 line-clamp-1">{person.name}</div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-700">{person.phone || 'N/A'}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            {hasPermission('manage_clients') && (
                                                <label className={`relative inline-flex items-center ${person.documentId === '8729451090' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={person.status === 'active'}
                                                        onChange={() => person.documentId !== '8729451090' && handleTogglePersonStatus(person.documentId, person.status)}
                                                        disabled={person.documentId === '8729451090'}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                                                    <span className={`ml-3 text-sm font-medium ${person.status === 'active' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {person.status === 'active' ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewPerson(person)}
                                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                                title="Ver perfil"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {hasPermission('manage_clients') && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditPerson(person)}
                                                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Editar registro"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {person.documentId !== '8729451090' && (
                                                        <button
                                                            onClick={() => handleDeletePerson(person)}
                                                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                            title="Eliminar registro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {paginatedPersons.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <Users className="w-12 h-12 mb-4 text-gray-300" />
                                            <p className="text-lg font-medium">No se encontraron registros</p>
                                            <p className="text-sm mt-1">Intenta ajustando los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredPersons.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="text-sm text-gray-600">
                            Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPersons.length)} de {filteredPersons.length} registros
                        </div>
                        <SimplePagination
                            totalPages={totalPages}
                            currentPage={currentPage}
                            onPageChange={goToPage}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && personToDelete && (
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
                                    ¿Estás seguro de que quieres eliminar a <strong>{personToDelete.name}</strong>?
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {personToDelete.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800">{personToDelete.name}</div>
                                            <div className="text-sm text-gray-600">Doc: {personToDelete.documentId}</div>
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
                                    onClick={confirmDeletePerson}
                                    className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Person Profile Modal */}
            {showPersonModal && selectedPerson && (
                <PersonProfileModal
                    person={selectedPerson}
                    onClose={() => setShowPersonModal(false)}
                    personType={personType}
                />
            )}

            {/* New/Edit Person Modal */}
            {showNewPersonModal && (
                <NewPersonModal
                    onClose={() => {
                        setShowNewPersonModal(false);
                        setEditingPerson(null);
                    }}
                    onSave={handleSavePerson}
                    editingPerson={editingPerson}
                    personType={personType}
                />
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
        </div>
    );
}

// Person Profile Modal Component
function PersonProfileModal({ person, onClose, personType }: { person: Person, onClose: () => void, personType: string }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className={`bg-gradient-to-r ${personType === 'client' ? 'from-pink-400 to-purple-500' : 'from-purple-500 to-blue-500'} p-6 text-white rounded-t-3xl`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold">Detalles de {personType === 'client' ? 'Cliente' : 'Empleado'}</h3>
                            <p className="text-white/80">Información completa</p>
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
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                            <Users className={`w-5 h-5 ${personType === 'client' ? 'text-pink-500' : 'text-purple-500'}`} />
                            <span>Información Personal</span>
                        </h4>

                        <div className="grid md:grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-1">Nombre Completo</label>
                                <p className="font-semibold text-gray-800">{person.name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-1">Tipo de Documento</label>
                                <p className="font-semibold text-gray-800">{person.documentType || 'CC'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-1">Número de Documento</label>
                                <p className="font-semibold text-gray-800">{person.documentId}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-1">Teléfono</label>
                                <p className="font-semibold text-gray-800 flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                    {person.phone || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 block mb-1">Estado</label>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${person.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    {person.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// New/Edit Person Modal Component
function NewPersonModal({ onClose, onSave, editingPerson, personType }: { onClose: () => void, onSave: (data: any) => void, editingPerson: Person | null, personType: string }) {
    const [formData, setFormData] = useState({
        documentType: editingPerson?.documentType || 'CC',
        documentId: editingPerson?.documentId || '',
        name: editingPerson?.name || '',
        phone: editingPerson?.phone || '',
        type: personType as 'client' | 'employee',
        authData: {
            createAccount: false,
            email: '',
            contrasena: '',
            confirmarContrasena: ''
        }
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
        if (!formData.documentId.trim()) newErrors.documentId = 'Documento requerido';
        if (!formData.phone.trim()) newErrors.phone = 'Teléfono requerido';

        if (!editingPerson && formData.authData.createAccount) {
            if (!formData.authData.email.trim()) newErrors.email = 'Correo requerido';
            if (!formData.authData.contrasena.trim()) newErrors.contrasena = 'Contraseña requerida';
            if (formData.authData.contrasena !== formData.authData.confirmarContrasena) {
                newErrors.confirmarContrasena = 'Las contraseñas no coinciden';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleAuthChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            authData: { ...prev.authData, [field]: value }
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className={`bg-gradient-to-r ${personType === 'client' ? 'from-pink-400 to-purple-500' : 'from-purple-500 to-blue-500'} p-6 text-white rounded-t-3xl`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold">
                                {editingPerson ? `Editar ${personType === 'client' ? 'Cliente' : 'Empleado'}` : `Registrar ${personType === 'client' ? 'Cliente' : 'Empleado'}`}
                            </h3>
                            <p className="text-white/80">
                                {editingPerson ? 'Actualiza la información en el sistema' : 'Ingresa los datos para un nuevo registro'}
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

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Tipo y Número de Documento */}
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tipo de Documento <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.documentType}
                                onChange={(e) => handleChange('documentType', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white"
                                disabled={!!editingPerson}
                            >
                                <option value="TI">Tarjeta de Identidad (TI)</option>
                                <option value="CC">Cédula de Ciudadanía (CC)</option>
                                <option value="CE">Cédula de Extranjería (CE)</option>
                                <option value="NIT">NIT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Número de Documento <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.documentId}
                                onChange={(e) => handleChange('documentId', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.documentId ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: 1234567890"
                                disabled={!!editingPerson}
                            />
                            {errors.documentId && (
                                <div className="flex items-center space-x-1 mt-1.5 text-red-500">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{errors.documentId}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                            placeholder="Nombres y Apellidos"
                        />
                        {errors.name && (
                            <div className="flex items-center space-x-1 mt-1.5 text-red-500">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{errors.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Teléfono */}
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Teléfono <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: 300 123 4567"
                            />
                            {errors.phone && (
                                <div className="flex items-center space-x-1 mt-1.5 text-red-500">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{errors.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección Credenciales (Opcional) solo en creación */}
                    {!editingPerson && (
                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Users className={`w-5 h-5 mr-2 ${personType === 'client' ? 'text-pink-500' : 'text-purple-500'}`} />
                                    Credenciales de Acceso
                                </h4>
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.authData.createAccount}
                                            onChange={(e) => handleAuthChange('createAccount', e.target.checked)}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${formData.authData.createAccount ? (personType === 'client' ? 'bg-pink-500' : 'bg-purple-500') : 'bg-gray-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.authData.createAccount ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-sm font-medium text-gray-700">Crear cuenta</div>
                                </label>
                            </div>

                            {formData.authData.createAccount && (
                                <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            value={formData.authData.email}
                                            onChange={(e) => handleAuthChange('email', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-1 bg-white focus:outline-none ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-pink-300'}`}
                                        />
                                        {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña <span className="text-red-500">*</span></label>
                                            <input
                                                type="password"
                                                value={formData.authData.contrasena}
                                                onChange={(e) => handleAuthChange('contrasena', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-1 bg-white focus:outline-none ${errors.contrasena ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-pink-300'}`}
                                            />
                                            {errors.contrasena && <span className="text-xs text-red-500 mt-1">{errors.contrasena}</span>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña <span className="text-red-500">*</span></label>
                                            <input
                                                type="password"
                                                value={formData.authData.confirmarContrasena}
                                                onChange={(e) => handleAuthChange('confirmarContrasena', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-1 bg-white focus:outline-none ${errors.confirmarContrasena ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-pink-300'}`}
                                            />
                                            {errors.confirmarContrasena && <span className="text-xs text-red-500 mt-1">{errors.confirmarContrasena}</span>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center mt-2">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Se asignará rol {personType === 'client' ? 'Cliente' : 'Asistente'} por defecto.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex space-x-3 pt-6 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 ${personType === 'client' ? 'bg-gradient-to-r from-pink-400 to-purple-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                                }`}
                        >
                            <Save className="w-5 h-5" />
                            <span>{editingPerson ? 'Actualizar' : 'Guardar'} Datos</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
