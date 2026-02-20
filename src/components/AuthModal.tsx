import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, IdCard, Phone, ArrowLeft, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: any) => void;
  onPasswordRecoveryDemo?: (email: string) => void;
}

export function AuthModal({ onClose, onLogin, onPasswordRecoveryDemo }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate authentication
    let role = 'customer';
    let userName = '';
    
    if (formData.email === 'astrid@asthroapp.com') {
      role = 'admin';
      userName = 'Astrid Eugenia Hoyos';
    } else if (formData.email === 'maria@asthroapp.com') {
      role = 'asistente';
      userName = 'María Fernanda Gómez';
    } else if (formData.email === 'carmen@asthroapp.com') {
      role = 'asistente';
      userName = 'Carmen Rosa Jiménez';
    } else {
      userName = isLogin ? 'Usuario' : `${formData.firstName} ${formData.lastName}`;
    }
    
    const user = {
      id: role === 'admin' ? 1 : role === 'asistente' ? 2 : 999,
      name: userName,
      firstName: formData.firstName || (role === 'admin' ? 'Astrid Eugenia' : role === 'asistente' ? 'María Fernanda' : ''),
      lastName: formData.lastName || (role === 'admin' ? 'Hoyos' : role === 'asistente' ? 'Gómez' : ''),
      documentId: formData.documentId || '12345678',
      email: formData.email,
      phone: formData.phone || '+57 304 123 4567',
      role: role
    };
    
    onLogin(user);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    
    // Mostrar modal de código de recuperación
    setShowForgotPassword(false);
    setShowCodeModal(true);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar el código (por defecto 123456)
    if (recoveryCode === '123456') {
      setCodeError('');
      setShowCodeModal(false);
      setShowResetPasswordForm(true);
    } else {
      setCodeError('Código de recuperación incorrecto');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Resetear todos los estados y mostrar mensaje de éxito
    setPasswordError('');
    setShowResetPasswordForm(false);
    setShowSuccessMessage(true);
    
    // Después de 2 segundos, volver al login
    setTimeout(() => {
      setShowSuccessMessage(false);
      setForgotEmail('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }, 2000);
  };

  const handleViewPasswordRecovery = () => {
    if (onPasswordRecoveryDemo) {
      onPasswordRecoveryDemo(forgotEmail);
      onClose();
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setShowCodeModal(false);
    setShowResetPasswordForm(false);
    setShowSuccessMessage(false);
    setForgotEmail('');
    setRecoveryCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setCodeError('');
    setPasswordError('');
  };

  // Handle view title and subtitle
  const getHeaderContent = () => {
    if (showSuccessMessage) {
      return {
        title: 'Cambio Exitoso',
        subtitle: 'Tu contraseña ha sido restablecida correctamente'
      };
    } else if (showResetPasswordForm) {
      return {
        title: 'Nueva Contraseña',
        subtitle: 'Ingresa tu nueva contraseña para restablecer tu cuenta'
      };
    } else if (showCodeModal) {
      return {
        title: 'Código de Recuperación',
        subtitle: 'Verifica el código que enviamos a tu correo'
      };
    } else if (showForgotPassword) {
      return {
        title: 'Recuperar Contraseña',
        subtitle: 'Ingresa tu email para recibir el código de recuperación'
      };
    } else if (resetEmailSent) {
      return {
        title: 'Email Enviado',
        subtitle: 'Revisa tu correo para restablecer tu contraseña'
      };
    } else {
      return {
        title: isLogin ? 'Iniciar Sesión' : 'Crear Cuenta',
        subtitle: isLogin 
          ? 'Accede a tu cuenta de AsthroApp' 
          : 'Únete a nuestra comunidad de belleza'
      };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {(showForgotPassword || resetEmailSent || showCodeModal || showResetPasswordForm) && (
                <button
                  onClick={resetForgotPasswordState}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold">
                {headerContent.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-pink-100 mt-1 text-sm">
            {headerContent.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Success Message for Reset Email */}
          {resetEmailSent ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800">
                  ¡Email enviado exitosamente!
                </h3>
                <p className="text-gray-600">
                  Hemos enviado un enlace para restablecer tu contraseña a:
                </p>
                <p className="font-semibold text-pink-600 bg-pink-50 rounded-lg p-3">
                  {forgotEmail}
                </p>
                <p className="text-sm text-gray-500">
                  Si no ves el correo en tu bandeja de entrada, revisa tu carpeta de spam.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleViewPasswordRecovery}
                  className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Ver proceso de recuperación
                </button>
                <button
                  type="button"
                  onClick={resetForgotPasswordState}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          ) : showForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-gray-600">
                  Ingresa el correo electrónico asociado a tu cuenta y te enviaremos 
                  un enlace para restablecer tu contraseña.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Enviar enlace de recuperación
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetForgotPasswordState}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          ) : showCodeModal ? (
            /* Code Verification Form */
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-gray-600">
                  Ingresa el código de recuperación que te enviamos a:
                </p>
                <p className="font-semibold text-pink-600 bg-pink-50 rounded-lg p-3">
                  {forgotEmail}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código de Recuperación *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="123456"
                  />
                </div>
                {codeError && <p className="text-red-500 text-sm mt-1">{codeError}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Verificar Código
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetForgotPasswordState}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          ) : showResetPasswordForm ? (
            /* Reset Password Form */
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-gray-600">
                  Ingresa tu nueva contraseña:
                </p>
                <p className="font-semibold text-pink-600 bg-pink-50 rounded-lg p-3">
                  {forgotEmail}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Restablecer Contraseña
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetForgotPasswordState}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          ) : showSuccessMessage ? (
            /* Success Message for Reset Password */
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800">
                  ¡Contraseña restablecida exitosamente!
                </h3>
                <p className="text-gray-600">
                  Tu contraseña ha sido restablecida con éxito. Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={resetForgotPasswordState}
                  className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          ) : (
            /* Login/Register Form */
            <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Names Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nombres *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                      placeholder="Tus nombres"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Apellidos *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                      placeholder="Tus apellidos"
                    />
                  </div>
                </div>
              </div>

              {/* Document ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Documento de Identidad *
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="documentId"
                    value={formData.documentId}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    placeholder="Número de documento"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                  placeholder="Confirma tu contraseña"
                />
              </div>
            </div>
          )}

              {/* Forgot Password Link - Only show on login */}
              {isLogin && (
                <div className="text-center -mt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-pink-600 font-semibold hover:text-pink-700 transition-colors text-sm"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
              >
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>

              {/* Toggle Mode */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-pink-600 font-semibold hover:text-pink-700 transition-colors text-sm"
                >
                  {isLogin ? 'Crear cuenta gratis' : 'Iniciar sesión'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}