
import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({ children, ...props }) => {
  return (
    <button
      type="button"
      className="p-2 rounded-full bg-black/40 text-gray-300 hover:bg-black/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
      {...props}
    >
      {children}
    </button>
  );
};
