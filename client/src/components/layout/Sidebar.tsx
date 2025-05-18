import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  ListChecks, 
  FolderKanban, 
  ClipboardCheck, 
  PlayCircle, 
  FileCheck, 
  AlertTriangle, 
  FileBarChart2, 
  PieChart, 
  Settings, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  current?: boolean;
  items?: NavItem[];
}

const Sidebar = () => {
  const [location] = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Test Management': true,
    'Test Execution': true,
    'Analysis': true,
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const navigation: { name: string; items: NavItem[] }[] = [
    {
      name: 'Overview',
      items: [
        {
          name: 'Dashboard',
          href: '/',
          icon: <LayoutDashboard className="h-5 w-5" />,
          current: location === '/',
        },
      ],
    },
    {
      name: 'Test Management',
      items: [
        {
          name: 'Test Cases',
          href: '/test-cases',
          icon: <ListChecks className="h-5 w-5" />,
          current: location === '/test-cases',
          badge: 124,
        },
        {
          name: 'Test Suites',
          href: '/test-suites',
          icon: <FolderKanban className="h-5 w-5" />,
          current: location === '/test-suites',
          badge: 15,
        },
        {
          name: 'Test Plans',
          href: '/test-plans',
          icon: <ClipboardCheck className="h-5 w-5" />,
          current: location === '/test-plans',
          badge: 8,
        },
      ],
    },
    {
      name: 'Test Execution',
      items: [
        {
          name: 'Test Runs',
          href: '/test-runs',
          icon: <PlayCircle className="h-5 w-5" />,
          current: location === '/test-runs',
          badge: 32,
        },
        {
          name: 'Manual Execution',
          href: '/manual-execution',
          icon: <ClipboardCheck className="h-5 w-5" />,
          current: location === '/manual-execution',
        },
        {
          name: 'Automated Results',
          href: '/automated-results',
          icon: <FileCheck className="h-5 w-5" />,
          current: location === '/automated-results',
        },
      ],
    },
    {
      name: 'Analysis',
      items: [
        {
          name: 'Failure Tracking',
          href: '/failures',
          icon: <AlertTriangle className="h-5 w-5" />,
          current: location === '/failures',
          badge: '12',
        },
        {
          name: 'Reports',
          href: '/reports',
          icon: <FileBarChart2 className="h-5 w-5" />,
          current: location === '/reports',
        },
        {
          name: 'Metrics',
          href: '/metrics',
          icon: <PieChart className="h-5 w-5" />,
          current: location === '/metrics',
        },
      ],
    },
    {
      name: 'Settings',
      items: [
        {
          name: 'Settings',
          href: '/settings',
          icon: <Settings className="h-5 w-5" />,
          current: location === '/settings',
        },
      ],
    },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-2 space-y-6">
            {navigation.map((group) => (
              <div key={group.name}>
                {group.name !== 'Overview' && (
                  <button
                    className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    onClick={() => toggleGroup(group.name)}
                  >
                    {group.name}
                    {expandedGroups[group.name] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                <div className={expandedGroups[group.name] ? '' : 'hidden'}>
                  {group.items?.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`${
                          item.current
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md my-1`}
                      >
                        <div className="flex items-center">
                          <span className={`${
                            item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          } mr-3`}>
                            {item.icon}
                          </span>
                          {item.name}
                        </div>
                        {item.badge && (
                          <span className={`${
                            item.current
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                          } px-2 py-0.5 text-xs rounded-full`}>
                            {item.badge}
                          </span>
                        )}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-700">
                TestPilot v1.0.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;