import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomToastProps {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: (id: string) => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  id,
  title,
  description,
  type,
  duration = 4000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss?.(id);
    }, 200);
  }, [id, onDismiss]);

  useEffect(() => {
    // Show toast with animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, handleDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-foreground" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive-foreground" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-foreground" />;
      case 'info':
        return <Info className="h-4 w-4 text-primary-foreground" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success text-success-foreground border-success';
      case 'error':
        return 'bg-destructive text-destructive-foreground border-destructive';
      case 'warning':
        return 'bg-warning text-warning-foreground border-warning';
      case 'info':
        return 'bg-primary text-primary-foreground border-primary';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-200 ease-in-out',
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-[var(--radius)] border shadow-md',
          getToastStyles()
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{title}</div>
          {description && (
            <div className="text-xs opacity-90 mt-1">{description}</div>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-foreground/10 rounded transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default CustomToast;
