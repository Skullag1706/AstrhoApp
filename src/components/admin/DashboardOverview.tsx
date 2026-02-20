import React, { useState, useEffect } from 'react';
import { 
  Clock, Star, UserCheck
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface DashboardOverviewProps {
  currentUser: any;
  hasPermission: (permission: string) => boolean;
}

export function DashboardOverview({ currentUser, hasPermission }: DashboardOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [realTimeData, setRealTimeData] = useState({
    activeClients: 12,
    todayAppointments: 8,
    pendingOrders: 3,
    lowStockItems: 5
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeClients: prev.activeClients + Math.floor(Math.random() * 3) - 1,
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const dashboardStats = {
    today: {
      revenue: 850000,
      appointments: 12,
      clients: 8,
      products_sold: 25,
      services_completed: 10,
      new_clients: 2
    },
    week: {
      revenue: 4250000,
      appointments: 67,
      clients: 45,
      products_sold: 156,
      services_completed: 58,
      new_clients: 12
    },
    month: {
      revenue: 18500000,
      appointments: 289,
      clients: 189,
      products_sold: 678,
      services_completed: 245,
      new_clients: 48
    }
  };

  const currentStats = dashboardStats[selectedPeriod];

  // Data para gráfico de ingresos
  const revenueChartData = selectedPeriod === 'today' 
    ? [
        { name: '8am', value: 95000 },
        { name: '10am', value: 120000 },
        { name: '12pm', value: 185000 },
        { name: '2pm', value: 210000 },
        { name: '4pm', value: 140000 },
        { name: '6pm', value: 100000 },
      ]
    : selectedPeriod === 'week'
    ? [
        { name: 'Lun', value: 580000 },
        { name: 'Mar', value: 620000 },
        { name: 'Mié', value: 710000 },
        { name: 'Jue', value: 650000 },
        { name: 'Vie', value: 890000 },
        { name: 'Sáb', value: 800000 },
      ]
    : [
        { name: 'Sem 1', value: 3200000 },
        { name: 'Sem 2', value: 4100000 },
        { name: 'Sem 3', value: 5500000 },
        { name: 'Sem 4', value: 5700000 },
      ];

  // Data para gráfico de citas
  const appointmentsChartData = selectedPeriod === 'today'
    ? [
        { name: '8am', value: 2 },
        { name: '10am', value: 3 },
        { name: '12pm', value: 2 },
        { name: '2pm', value: 1 },
        { name: '4pm', value: 3 },
        { name: '6pm', value: 1 },
      ]
    : selectedPeriod === 'week'
    ? [
        { name: 'Lun', value: 10 },
        { name: 'Mar', value: 12 },
        { name: 'Mié', value: 11 },
        { name: 'Jue', value: 9 },
        { name: 'Vie', value: 15 },
        { name: 'Sáb', value: 10 },
      ]
    : [
        { name: 'Sem 1', value: 65 },
        { name: 'Sem 2', value: 72 },
        { name: 'Sem 3', value: 78 },
        { name: 'Sem 4', value: 74 },
      ];

  // Data para gráfico de clientes
  const clientsChartData = [
    { name: 'Nuevos', value: currentStats.new_clients, color: '#ec4899' },
    { name: 'Recurrentes', value: currentStats.clients - currentStats.new_clients, color: '#a855f7' },
  ];

  // Data para gráfico de productos vendidos
  const productsChartData = selectedPeriod === 'today'
    ? [
        { name: 'Shampoo', value: 8 },
        { name: 'Acondicionador', value: 6 },
        { name: 'Tratamiento', value: 5 },
        { name: 'Serum', value: 4 },
        { name: 'Otros', value: 2 },
      ]
    : selectedPeriod === 'week'
    ? [
        { name: 'Shampoo', value: 45 },
        { name: 'Acondicionador', value: 38 },
        { name: 'Tratamiento', value: 32 },
        { name: 'Serum', value: 25 },
        { name: 'Otros', value: 16 },
      ]
    : [
        { name: 'Shampoo', value: 195 },
        { name: 'Acondicionador', value: 168 },
        { name: 'Tratamiento', value: 142 },
        { name: 'Serum', value: 108 },
        { name: 'Otros', value: 65 },
      ];

  const upcomingAppointments = [
    {
      id: 1,
      client: 'Ana Patricia Rodríguez',
      service: 'Corte y Peinado',
      time: '10:30 AM',
      status: 'confirmed',
      employee: 'María F. Gómez'
    },
    {
      id: 2,
      client: 'Isabel Torres',
      service: 'Tratamiento Capilar',
      time: '11:00 AM',
      status: 'pending',
      employee: 'Astrid E. Hoyos'
    },
    {
      id: 3,
      client: 'Carolina Jiménez',
      service: 'Coloración',
      time: '2:00 PM',
      status: 'confirmed',
      employee: 'María F. Gómez'
    }
  ];

  const topServices = [
    { name: 'Corte y Peinado', count: 45, revenue: 1575000, percentage: 35 },
    { name: 'Tratamiento Capilar', count: 32, revenue: 1760000, percentage: 28 },
    { name: 'Coloración', count: 28, revenue: 2380000, percentage: 25 },
    { name: 'Manicure & Pedicure', count: 20, revenue: 900000, percentage: 12 }
  ];

  return (
    <div className="p-8">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard en Tiempo Real</h2>
          <p className="text-gray-600">Monitoreo operativo de AsthroApp</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>En Vivo</span>
          </div>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2 font-medium text-gray-700 focus:ring-2 focus:ring-pink-300"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
          </select>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Ingresos {selectedPeriod === 'today' ? 'Hoy' : selectedPeriod === 'week' ? 'Esta Semana' : 'Este Mes'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="value" name="Ingresos" stroke="#ec4899" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Citas {selectedPeriod === 'today' ? 'Hoy' : selectedPeriod === 'week' ? 'Esta Semana' : 'Este Mes'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={appointmentsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" name="Citas" stroke="#a855f7" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Clients Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Clientes {selectedPeriod === 'today' ? 'Hoy' : selectedPeriod === 'week' ? 'Esta Semana' : 'Este Mes'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientsChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {clientsChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Products Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Productos Vendidos {selectedPeriod === 'today' ? 'Hoy' : selectedPeriod === 'week' ? 'Esta Semana' : 'Este Mes'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Cantidad" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Próximas Citas</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Actualizado hace 2 min</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{appointment.client}</h4>
                  <p className="text-gray-600">{appointment.service}</p>
                  <p className="text-sm text-gray-500">
                    {appointment.time} • {appointment.employee}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    appointment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
            Ver Todas las Citas
          </button>
        </div>

        {/* Top Services Performance */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Servicios Más Populares</h3>
          
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{service.name}</h4>
                    <p className="text-sm text-gray-600">
                      {service.count} servicios • ${service.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-pink-600">{service.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${service.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-800">Servicio Estrella</span>
            </div>
            <p className="text-gray-700">
              <strong>Coloración</strong> genera el mayor ingreso por servicio
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Promedio: ${(2380000/28).toLocaleString()} por servicio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}