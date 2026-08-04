import React, { createContext, useContext, useState } from 'react';
import { ToastMessage, ToastType } from '../types/common.types';
import { Toast } from '../components/ui/molecules/Toast';
import { View } from 'react-native';

interface ToastContextProps {
  showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View className="absolute top-12 left-0 right-0 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} title={toast.title} description={toast.description} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
