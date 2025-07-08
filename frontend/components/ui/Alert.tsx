import React from 'react';

interface AlertProps {
  message: string | null; // Allow null to easily hide
  type: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void; // Optional close button functionality
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ message, type, onClose, className = '' }) => {
  if (!message) return null;

  const baseClasses = "p-4 mb-4 text-sm rounded-lg flex items-center justify-between";
  const typeClasses: Record<typeof type, string> = {
    success: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    error: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    info: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
  };

  // Optional: Add icons based on type
  // const icons = {
  //   success: <svg>...</svg>,
  //   error: <svg>...</svg>,
  //   info: <svg>...</svg>,
  //   warning: <svg>...</svg>,
  // };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`} role="alert">
      {/* {icons[type] && <span className="mr-2">{icons[type]}</span>} */}
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-current rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8"
          aria-label="Close"
        >
          <span className="sr-only">بستن</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export { Alert };
export type { AlertProps };
