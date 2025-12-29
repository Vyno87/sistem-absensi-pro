import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">{label}</label>}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl 
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            placeholder-gray-500
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
            transition-all duration-300
            glass-morphism
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500 ml-1">{error}</p>}
        </div>
    );
};

export default Input;
