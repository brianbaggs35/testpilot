import React, { useState } from 'react';
import { Link } from 'wouter';
import { Bell, Settings, User, Menu, X, LogOut, Search } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const notifications = [
    { id: 1, message: 'Test run TC-1024 completed', time: '2 minutes ago', read: false },
    { id: 2, message: 'New test case added by Maria', time: '1 hour ago', read: false },
    { id: 3, message: 'API integration test failed', time: '3 hours ago', read: true },
    { id: 4, message: 'Weekly report is ready', time: '1 day ago', read: true },
  ];
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-full mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <button 
                className="md:hidden mr-2 p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/">
                <a className="flex items-center">
                  <span className="text-blue-600 font-bold text-xl">TestPilot</span>
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">QA</span>
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative mx-4 flex-1 min-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search for test cases, runs, etc."
                />
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex md:items-center">
              {/* Notification dropdown */}
              <div className="ml-3 relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {isNotificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2 px-3 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="py-1">
                          {notifications.map((notification) => (
                            <a
                              key={notification.id}
                              href="#"
                              className={`flex px-4 py-3 hover:bg-gray-50 ${notification.read ? 'opacity-70' : 'bg-blue-50'}`}
                            >
                              <div className="flex-shrink-0">
                                <div className={`h-2 w-2 rounded-full mt-1 ${notification.read ? 'bg-gray-300' : 'bg-blue-600'}`}></div>
                              </div>
                              <div className="ml-3 w-0 flex-1">
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-sm text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                    <div className="py-1 border-t border-gray-100">
                      <a
                        href="#"
                        className="block px-4 py-2 text-xs text-center text-gray-700 hover:bg-gray-50"
                      >
                        View all notifications
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Settings link */}
              <Link href="/settings">
                <a className="ml-3 p-2 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Settings className="h-5 w-5" />
                </a>
              </Link>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center max-w-xs rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                </button>
                
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-2 px-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500">john.doe@example.com</p>
                      <p className="text-xs text-gray-600 mt-1">Test Manager</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Your Profile
                        </a>
                      </Link>
                      <Link href="/settings">
                        <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Settings
                        </a>
                      </Link>
                      <a
                        href="/api/logout"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search for test cases, runs, etc."
              />
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600">
                  <User className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">John Doe</div>
                <div className="text-sm font-medium text-gray-500">john.doe@example.com</div>
              </div>
              <div className="ml-auto flex space-x-2">
                <button className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <Link href="/settings">
                  <a className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Settings className="h-6 w-6" />
                  </a>
                </Link>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <Link href="/profile">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Your Profile
                </a>
              </Link>
              <Link href="/settings">
                <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Settings
                </a>
              </Link>
              <a
                href="/api/logout"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign out
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;