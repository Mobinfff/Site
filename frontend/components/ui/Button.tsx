import Link from 'next/link';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean; // For using with Radix Slot to compose with other components
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      href,
      variant = 'primary',
      size = 'md',
      asChild = false,
      className = '',
      disabled,
      loading,
      iconLeft,
      iconRight,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary',
      secondary: 'bg-secondary text-white hover:bg-secondary-dark focus-visible:ring-secondary',
      outline:
        'bg-transparent border border-primary text-primary hover:bg-primary hover:text-white focus-visible:ring-primary dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light dark:hover:text-background-dark',
      ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      link: 'bg-transparent text-primary hover:underline focus-visible:ring-primary p-0',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm', // Adjusted from previous example for better default
      lg: 'px-7 py-3 text-base',
      icon: 'p-2.5', // For icon-only buttons
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    const content = (
      <>
        {loading && (
          <svg className={`animate-spin h-5 w-5 ${iconLeft || iconRight || children ? 'mr-2' : ''} ${size === 'sm' ? 'h-4 w-4' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!loading && iconLeft && <span className={children ? "mr-2" : ""}>{iconLeft}</span>}
        {children}
        {!loading && iconRight && <span className={children ? "ml-2" : ""}>{iconRight}</span>}
      </>
    );

    if (asChild && React.isValidElement(children)) {
      // This part is for advanced composition, e.g. when using with Radix Slot
      // For now, we'll keep it simple and might not fully implement `asChild` behavior without Slot
      // return React.cloneElement(children, { className: `${combinedClassName} ${children.props.className || ''}`, ref, ...props }, content);
       console.warn("Button 'asChild' prop is used, but Slot composition is not fully implemented here.");
    }


    if (href && !disabled && !loading) {
      return (
        <Link href={href} className={combinedClassName} ref={ref as any} {...(props as any)}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedClassName} disabled={disabled || loading} {...props}>
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };
