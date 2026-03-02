import React, { useState, useEffect } from "react";
import { clearAuthToken } from "./services/apiClient";
import { AlertCircle, LogOut } from "lucide-react";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { Appointments } from "./components/Appointments";
import { ClientAppointments } from "./components/ClientAppointments";
import { AppointmentBooking } from "./components/AppointmentBooking";
import { AdminPanel } from "./components/AdminPanel";
import { AuthModal } from "./components/AuthModal";
import { UserProfile } from "./components/UserProfile";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isClientView, setIsClientView] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Redirect admin users to admin panel automatically
  useEffect(() => {
    if ((currentUser?.role === "admin" || currentUser?.role === "super_admin") && !isClientView) {
      setCurrentView("admin");
    }
  }, [currentUser, isClientView]);

  // Handle navigation to appointments
  const navigateToAppointments = (selectedService = null) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Redirect clients to booking interface
    if (
      currentUser.role === "customer" ||
      ((currentUser.role === "admin" || currentUser.role === "super_admin") && isClientView)
    ) {
      setCurrentView("book-appointment");
    } else {
      // Admin and assistants go to admin appointments view
      setCurrentView("appointments");
    }
  };

  // Navigate to client appointments view
  const navigateToClientAppointments = () => {
    setCurrentView("my-appointments");
  };

  // Handle booking completion - redirect to client appointments
  const handleBookingComplete = (appointment) => {
    // Here you would typically save the appointment
    setCurrentView("my-appointments");
  };

  // Check user permissions
  const hasPermission = (permission) => {
    if (!currentUser) return false;

    // Super admin has all permissions
    if (currentUser.role === "super_admin") return true;

    const permissions = {
      admin: [
        "module_dashboard",
        "module_users",
        "module_appointments",
        "module_services",
        "module_inventory",
        "module_sales",
        "module_purchases",
        "module_suppliers",
        "module_products",
        "module_clients",
        "module_categories",
        "module_schedules",
        "module_supplies",
        "module_deliveries",
        "module_reports",
        // Legacy permissions for compatibility
        "view_dashboard",
        "manage_users",
        "manage_roles",
        "manage_appointments",
        "manage_services",
        "manage_inventory",
        "manage_sales",
        "manage_purchases",
        "manage_suppliers",
        "manage_products",
        "manage_clients",
        "manage_categories",
        "manage_schedules",
        "manage_supplies",
        "manage_deliveries",
        "view_reports"
      ],
      asistente: [
        "module_dashboard",
        "module_appointments",
        "module_services",
        "module_sales",
        "module_clients",
        "module_supplies",
        "module_deliveries",
        // Legacy
        "view_dashboard",
        "manage_appointments",
        "manage_services",
        "manage_sales",
        "manage_clients",
        "manage_supplies",
        "manage_deliveries"
      ],
      customer: [
        "module_appointments",
        "module_services",
        "module_products",
        // Legacy
        "book_appointments",
        "view_services",
        "view_products",
        "view_own_appointments"
      ],
    };

    return (
      permissions[currentUser.role]?.includes(permission) ||
      false
    );
  };

  const toggleClientView = () => {
    setIsClientView(!isClientView);
    if (!isClientView) {
      setCurrentView("home"); // Go to home when switching to client view
    } else {
      setCurrentView("admin"); // Go to admin when switching back
    }
  };

  const handleUpdateProfile = (updatedData) => {
    setCurrentUser({
      ...currentUser,
      ...updatedData,
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentView("home");
    setIsClientView(false);
    setShowLogoutModal(false);
  };

  const renderCurrentView = () => {
    // If admin is in client view, show regular client interface
    if ((currentUser?.role === "admin" || currentUser?.role === "super_admin") && isClientView) {
      switch (currentView) {
        case "services":
          return (
            <Services
              onBookAppointment={navigateToAppointments}
            />
          );
        case "my-appointments":
          return (
            <ClientAppointments
              currentUser={currentUser}
              onBookNewAppointment={() =>
                setCurrentView("book-appointment")
              }
            />
          );
        case "book-appointment":
          return (
            <AppointmentBooking
              currentUser={currentUser}
              onBookingComplete={handleBookingComplete}
              onBack={navigateToClientAppointments}
            />
          );
        default:
          return (
            <>
              <Hero
                onBookAppointment={navigateToAppointments}
              />
              <Services
                onBookAppointment={navigateToAppointments}
              />
            </>
          );
      }
    }

    // Regular view logic
    switch (currentView) {
      case "services":
        return (
          <Services
            onBookAppointment={navigateToAppointments}
          />
        );
      case "appointments":
        return (
          <Appointments
            currentUser={currentUser}
            hasPermission={hasPermission}
          />
        );
      case "my-appointments":
        return (
          <ClientAppointments
            currentUser={currentUser}
            onBookNewAppointment={() =>
              setCurrentView("book-appointment")
            }
          />
        );
      case "book-appointment":
        return (
          <AppointmentBooking
            currentUser={currentUser}
            onBookingComplete={handleBookingComplete}
            onBack={navigateToClientAppointments}
          />
        );
      case "admin":
        return hasPermission("module_dashboard") || hasPermission("view_dashboard") ? (
          <AdminPanel
            currentUser={currentUser}
            hasPermission={hasPermission}
          />
        ) : (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-red-800 mb-2">
                Acceso Denegado
              </h3>
              <p className="text-red-600">
                No tienes permisos para acceder al panel
                administrativo.
              </p>
            </div>
          </div>
        );
      default:
        // For admin users, default to admin panel unless in client view
        if ((currentUser?.role === "admin" || currentUser?.role === "super_admin") && !isClientView) {
          return (
            <AdminPanel
              currentUser={currentUser}
              hasPermission={hasPermission}
            />
          );
        }
        return (
          <>
            <Hero onBookAppointment={navigateToAppointments} />
            <Services
              onBookAppointment={navigateToAppointments}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Navigation
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        setShowAuthModal={setShowAuthModal}
        setShowUserProfile={setShowUserProfile}
        hasPermission={hasPermission}
        isClientView={isClientView}
        toggleClientView={toggleClientView}
        onLogout={handleLogout}
      />

      <main className="pt-16">{renderCurrentView()}</main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={(user) => {
            setCurrentUser(user);
            // If user was trying to book an appointment, redirect them
            if (
              currentView === "book-appointment" ||
              window.location.hash === "#book-appointment"
            ) {
              setCurrentView("book-appointment");
            } else if (currentView === "my-appointments") {
              setCurrentView("my-appointments");
            }
          }}
        />
      )}

      {showUserProfile && currentUser && (
        <UserProfile
          user={currentUser}
          onClose={() => setShowUserProfile(false)}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

      {showLogoutModal && currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Confirmar Cierre de Sesión</h3>
                  <p className="text-gray-600">Esta acción cerrará tu sesión actual</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás segura de que quieres cerrar sesión?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <LogOut className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">
                        {currentUser.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentUser.email}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        Rol: {currentUser.role}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;