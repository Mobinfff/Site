import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType; // To allow rendering as different elements e.g., 'article', 'li'
  // Add other common card props like title, footer, image etc. if needed for a more structured card
  // For a generic wrapper, className and children are often enough.
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  as: Component = 'div', // Default to 'div'
  ...props
}) => {
  const baseStyle = "bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden";
  // Example of different variants or padding options:
  // const paddingStyles = {
  //   none: '',
  //   sm: 'p-4',
  //   md: 'p-6',
  //   lg: 'p-8',
  // };
  // const currentPadding = paddingStyles[padding] || paddingStyles.md;

  return (
    <Component className={`${baseStyle} ${className}`} {...props}>
      {children}
    </Component>
  );
};

// Optional: If you want to create structured Card components like Card.Header, Card.Body, Card.Footer
// This makes the Card component more composable.

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};


// Attach sub-components to the main Card component
type CardComponentType = React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
};

const ExportableCard = Card as CardComponentType;
ExportableCard.Header = CardHeader;
ExportableCard.Body = CardBody;
ExportableCard.Footer = CardFooter;

export { ExportableCard as Card };
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps };
