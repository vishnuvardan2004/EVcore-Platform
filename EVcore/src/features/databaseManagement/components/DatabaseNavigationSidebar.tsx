import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Database, 
  Car, 
  Users, 
  UserCheck, 
  PieChart,
  Folder,
  ChevronRight
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    icon: BarChart3,
    href: '/database',
    description: 'Overview and analytics'
  },
  {
    title: 'Asset Management',
    icon: Database,
    items: [
      {
        title: 'Vehicle Management',
        icon: Car,
        href: '/database/vehicles',
        description: 'Manage fleet vehicles'
      }
    ]
  },
  {
    title: 'User Management',
    icon: Users,
    items: [
      {
        title: 'Pilot Management',
        icon: UserCheck,
        href: '/database/pilots',
        description: 'Manage drivers and pilots'
      },
      {
        title: 'Staff Management',
        icon: Users,
        href: '/database/staff',
        description: 'Manage staff members'
      },
      {
        title: 'Customer Management',
        icon: Users,
        href: '/database/customers',
        description: 'Manage customer database'
      }
    ]
  },
  {
    title: 'Analytics',
    icon: PieChart,
    href: '/database/analytics',
    description: 'Data analytics and insights'
  }
];

export const DatabaseNavigationSidebar: React.FC = () => {
  const location = useLocation();

  const renderNavItem = (item: any, level = 0) => {
    const isActive = location.pathname === item.href;
    const hasSubItems = item.items && item.items.length > 0;

    if (hasSubItems) {
      return (
        <div key={item.title} className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </div>
          <div className="ml-6 space-y-1">
            {item.items.map((subItem: any) => renderNavItem(subItem, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
          level > 0 ? 'ml-4' : '',
          isActive
            ? 'bg-blue-100 text-blue-900 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <item.icon className="h-4 w-4" />
        <div className="flex-1">
          <div className="font-medium">{item.title}</div>
          {item.description && (
            <div className="text-xs text-gray-500">{item.description}</div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <nav className="space-y-2 p-4">
      {navigationItems.map(item => renderNavItem(item))}
    </nav>
  );
};
