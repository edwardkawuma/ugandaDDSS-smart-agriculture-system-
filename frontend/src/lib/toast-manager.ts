// Global toast manager that doesn't rely on React hooks
// This can be used in interceptors and other non-React contexts

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

class GlobalToastManager {
  private toasts: Toast[] = [];
  private listeners: Array<(toasts: Toast[]) => void> = [];

  showToast(toast: Omit<Toast, 'id'>): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    // Remove any existing toasts to show only one at a time
    this.toasts = [newToast];
    this.notifyListeners();
    
    return id;
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  dismissAll(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  getToasts(): Toast[] {
    return this.toasts;
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

// Create global instance
const globalToastManager = new GlobalToastManager();

// Export utility functions
export const globalToastUtils = {
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

export { globalToastManager };

