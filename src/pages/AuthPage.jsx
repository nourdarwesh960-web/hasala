import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
export function AuthPage({ onSuccess }) {
  const [mode, setMode] = useState('login');
  if (mode === 'register') {
    return <RegisterPage onSwitchToLogin={() => setMode('login')} onSuccess={onSuccess} />;
  }
  return <LoginPage onSwitchToRegister={() => setMode('register')} onSuccess={onSuccess} />;
}