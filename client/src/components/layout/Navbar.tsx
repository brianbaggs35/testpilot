import React from 'react';
import { Link } from 'wouter';

export default function Navbar() {
  // In a real implementation, this would be fetched from an authentication service
  const isAuthenticated = true;
  const user = { firstName: 'Sarah', lastName: 'Chen' };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
              TestPilot
            </span>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <a 
                  href="#" 
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Logout
                </a>
              </div>
            ) : (
              <a 
                href="#" 
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}