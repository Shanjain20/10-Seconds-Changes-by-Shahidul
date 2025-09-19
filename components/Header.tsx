
import React from 'react';
import { IconButton } from './IconButton';

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
}

const SIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11.9,2.7C6.4,2.7,2,7.2,2,12.6s4.4,9.9,9.9,9.9s9.9-4.4,9.9-9.9S17.4,2.7,11.9,2.7z M14.3,17.8c-1.3,0.8-2.9,1.3-4.5,1.3 c-3.3,0-6-2.7-6-6c0-3.3,2.7-6,6-6c1.6,0,3.1,0.6,4.2,1.8h-2.1c-0.8-0.8-1.9-1.3-3.1-1.3c-2.5,0-4.5,2-4.5,4.5s2,4.5,4.5,4.5 c1.2,0,2.3-0.5,3.1-1.3v-2.1h-3.3V14h5.3V17.8z" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ onReset, showReset }) => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SIcon className="w-8 h-8 text-indigo-400"/>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            10 Seconds Changes <span className="text-indigo-400">by Shahidul</span>
          </h1>
        </div>
        {showReset && (
          <IconButton onClick={onReset} title="Start Over">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181-3.183a8.25 8.25 0 00-11.664 0l3.181 3.183" />
            </svg>
          </IconButton>
        )}
      </div>
    </header>
  );
};

export default Header;