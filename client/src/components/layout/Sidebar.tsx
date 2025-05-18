import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BarChart, 
  Upload, 
  CheckSquare, 
  AlertTriangle, 
  ClipboardList, 
  FileText, 
  Users, 
  Settings, 
  Terminal
} from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <BarChart className="w-5 h-5" />
    },
    {
      name: 'Demo Features',
      path: '/demo',
      icon: <Terminal className="w-5 h-5" />
    },
    {
      section: 'Automated Testing',
      items: [
        {
          name: 'Upload Results',
          path: '/automated/upload',
          icon: <Upload className="w-5 h-5" />
        },
        {
          name: 'Test Cases',
          path: '/automated/test-cases',
          icon: <CheckSquare className="w-5 h-5" />
        },
        {
          name: 'Failure Analysis',
          path: '/automated/failure-analysis',
          icon: <AlertTriangle className="w-5 h-5" />
        }
      ]
    },
    {
      section: 'Manual Testing',
      items: [
        {
          name: 'Test Plans',
          path: '/manual/test-plans',
          icon: <ClipboardList className="w-5 h-5" />
        },
        {
          name: 'Test Execution',
          path: '/manual/execution',
          icon: <CheckSquare className="w-5 h-5" />
        },
        {
          name: 'Reports',
          path: '/manual/reports',
          icon: <FileText className="w-5 h-5" />
        }
      ]
    },
    {
      section: 'Administration',
      items: [
        {
          name: 'User Management',
          path: '/admin/users',
          icon: <Users className="w-5 h-5" />
        },
        {
          name: 'Settings',
          path: '/admin/settings',
          icon: <Settings className="w-5 h-5" />
        }
      ]
    }
  ];

  return (
    <aside id="logo-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0" aria-label="Sidebar">
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
        <ul className="space-y-2 font-medium">
          {menuItems.map((item, idx) => {
            if ('section' in item) {
              return (
                <li key={idx} className="mt-5 first:mt-0">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    {item.section}
                  </div>
                  <ul className="space-y-1">
                    {item.items?.map((subItem, subIdx) => (
                      <li key={`${idx}-${subIdx}`}>
                        <Link href={subItem.path}>
                          <a className={`flex items-center p-2 rounded-lg group ${
                            isActive(subItem.path) 
                              ? 'bg-gray-100 text-primary' 
                              : 'text-gray-900 hover:bg-gray-100'
                          }`}>
                            {subItem.icon}
                            <span className="ml-3">{subItem.name}</span>
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            } else {
              return (
                <li key={idx}>
                  <Link href={item.path}>
                    <a className={`flex items-center p-2 rounded-lg group ${
                      isActive(item.path) 
                        ? 'bg-gray-100 text-primary' 
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}>
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </a>
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      </div>
    </aside>
  );
}