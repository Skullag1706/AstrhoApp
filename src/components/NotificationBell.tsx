import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, ShoppingBag, CheckCircle, X } from 'lucide-react';

interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success';
  message: string;
  action: string;
  time: string;
  icon: any;
  color: string;
}

interface NotificationBellProps {
  currentUser: any;
}

export function NotificationBell({ currentUser }: NotificationBellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'warning',
      message: '5 productos con stock bajo',
      action: 'Ver inventario',
      time: '5 min',
      icon: AlertTriangle,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      id: 2,
      type: 'info',
      message: '3 pedidos listos para entregar',
      action: 'Gestionar pedidos',
      time: '15 min',
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 3,
      type: 'success',
      message: 'Cita completada: María González',
      action: 'Ver detalles',
      time: '30 min',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    }
  ]);

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new notifications appearing randomly
      if (Math.random() > 0.7 && alerts.length < 8) {
        const newNotifications = [
          {
            id: Date.now(),
            type: 'info' as const,
            message: 'Nueva cita programada',
            action: 'Ver cita',
            time: 'Ahora',
            icon: CheckCircle,
            color: 'text-blue-600 bg-blue-100'
          },
          {
            id: Date.now(),
            type: 'warning' as const,
            message: 'Producto agotándose',
            action: 'Ver inventario',
            time: 'Ahora',
            icon: AlertTriangle,
            color: 'text-yellow-600 bg-yellow-100'
          }
        ];
        const randomNotification = newNotifications[Math.floor(Math.random() * newNotifications.length)];
        setAlerts(prev => [randomNotification, ...prev].slice(0, 10));
      }
    }, 45000); // Check every 45 seconds

    return () => clearInterval(interval);
  }, [alerts]);

  const handleDismiss = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const unreadCount = alerts.length;

  // Only show for admin and asistente users
  if (!currentUser || currentUser.role === 'customer') {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-lg hover:bg-pink-50 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Alertas en Tiempo Real</h3>
                <p className="text-xs text-pink-100">Notificaciones del sistema</p>
              </div>
              {alerts.length > 0 && (
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {alerts.length}
                </span>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {alerts.length > 0 ? (
              <div className="p-2">
                {alerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <div 
                      key={alert.id} 
                      className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2 group relative"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alert.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Hace {alert.time}</p>
                        <button className="text-xs bg-gradient-to-r from-pink-400 to-purple-500 text-white px-3 py-1 rounded-lg mt-2 hover:shadow-md transition-all">
                          {alert.action}
                        </button>
                      </div>
                      <button
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200"
                        title="Descartar"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No hay notificaciones</p>
                <p className="text-gray-400 text-xs mt-1">Te mantendremos informado</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setAlerts([])}
                className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Descartar todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
