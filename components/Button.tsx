import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
  // FIX: Add 'type' prop to allow for different button types (e.g., 'submit').
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, disabled = false, primary = false, className = '', type = 'button' }) => {
    const baseClass = "px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:cursor-not-allowed";
    const themeClass = primary 
        ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400" 
        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-500";
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            type={type}
            className={`${baseClass} ${themeClass} ${className}`}
        >
            {children}
        </button>
    );
};