import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import CustomToast, { CustomToastProps } from './custom-toast';
import { globalToastManager } from '@/lib/toast-manager';

interface Toast extends Omit<CustomToastProps, 'id' | 'onDismiss'> {
  id: string;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useCustomToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useCustomToast must be used within a CustomToastProvider');
  }
  return context;
};

interface CustomToastProviderProps {
  children: React.ReactNode;
}

export const CustomToastProvider: React.FC<CustomToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Subscribe to global toast manager
    const unsubscribe = globalToastManager.subscribe((globalToasts) => {
      setToasts(globalToasts);
    });

    return unsubscribe;
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    return globalToastManager.showToast(toast);
  }, []);

  const dismissToast = useCallback((id: string) => {
    globalToastManager.dismissToast(id);
  }, []);

  const dismissAll = useCallback(() => {
    globalToastManager.dismissAll();
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, dismissAll }}>
      {children}
      {/* Render toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <CustomToast
            key={toast.id}
            {...toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Convenience functions that use global manager directly
export const customToastUtils = {
  success: (title: string, description?: string) => {
    return globalToastManager.showToast({ title, description, type: 'success' });
  },
  
  error: (title: string, description?: string) => {
    return globalToastManager.showToast({ title, description, type: 'error' });
  },
  
  warning: (title: string, description?: string) => {
    return globalToastManager.showToast({ title, description, type: 'warning' });
  },
  
  info: (title: string, description?: string) => {
    return globalToastManager.showToast({ title, description, type: 'info' });
  },
  
  dismissAll: () => {
    return globalToastManager.dismissAll();
  }
};
