import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      name,
      label,
      type = 'text',
      error,
      containerClassName = '',
      labelClassName = '',
      inputClassName = '',
      errorClassName = '',
      iconLeft,
      iconRight,
      ...props
    },
    ref,
  ) => {
    const baseInputStyle =
      'w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200';
    const errorStyle = 'border-red-500 focus:ring-red-400 dark:focus:ring-red-500';
    const defaultStyle = 'border-gray-300 dark:border-gray-600 focus:ring-primary dark:focus:ring-primary-light bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200';

    const finalInputClassName = `${baseInputStyle} ${error ? errorStyle : defaultStyle} ${iconLeft ? 'pr-10' : ''} ${iconRight ? 'pl-10' : ''} ${inputClassName}`;

    return (
      <div className={`mb-4 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={id || name}
            className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {iconLeft}
            </div>
          )}
           {iconRight && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {iconRight}
            </div>
          )}
          <input
            id={id || name}
            name={name}
            type={type}
            ref={ref}
            className={finalInputClassName}
            {...props}
          />
        </div>
        {error && (
          <p className={`mt-1 text-xs text-red-600 dark:text-red-400 ${errorClassName}`}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };
export type { InputProps };
