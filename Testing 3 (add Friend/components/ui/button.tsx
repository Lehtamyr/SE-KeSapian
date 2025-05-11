import React from 'react';
import clsx from 'clsx'; // Install clsx if not already installed: npm install clsx

interface ButtonProps {
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    size?: 'icon' | 'default';
    variant?: 'outline' | 'default';
}

const Button: React.FC<ButtonProps> = ({
    onClick,
    type = 'button',
    disabled = false,
    children,
    className = '',
    size = 'default',
    variant = 'default',
}) => {
    const baseClasses = 'px-4 py-2 rounded text-white';
    const sizeClasses = size === 'icon' ? 'p-2' : '';
    const variantClasses =
        variant === 'outline'
            ? 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100'
            : 'bg-blue-500 hover:bg-blue-600';
    const disabledClasses = 'disabled:bg-gray-400 disabled:cursor-not-allowed';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={clsx(baseClasses, sizeClasses, variantClasses, disabledClasses, className)}
        >
            {children}
        </button>
    );
};

export default Button;