import { NavLink, useLocation } from 'react-router-dom';
import { memo } from 'react';

// Memoize the NavItem component to prevent unnecessary re-renders
const NavItem = memo(({ to, children, isActive }: { to: string; children: React.ReactNode; isActive: boolean }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive
        ? 'border-blue-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`}
  >
    {children}
  </NavLink>
));

const Navigation = () => {
  const { pathname } = useLocation();

  return (
    <div className="bg-white shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">MyDigiPin</h1>
            </div>
          </div>
          <nav className="flex space-x-8 h-full">
            <NavItem to="/" isActive={pathname === '/'}>Home</NavItem>
            <NavItem to="/from-address" isActive={pathname === '/from-address'}>From Address</NavItem>
            <NavItem to="/to-address" isActive={pathname === '/to-address'}>To Address</NavItem>
            <NavItem to="/print" isActive={pathname === '/print'}>Print</NavItem>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
