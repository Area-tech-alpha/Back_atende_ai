import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FileText, Users, 
  Menu, X, LogOut, Bell, ChevronDown, Smartphone, Phone
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/contacts', label: 'Contatos', icon: <Users size={20} /> },
    { path: '/whatsapp/connections', label: 'Conexões', icon: <Phone size={20} /> },
    { path: '/baileys', label: 'Conectar WhatsApp', icon: <Smartphone size={20} /> },
    { path: '/campaigns', label: 'Campanhas', icon: <FileText size={20} /> },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={toggleSidebar}
      >
        <div className="fixed inset-0 bg-accent/75 backdrop-blur-sm"></div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-secondary shadow-soft transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen border-r border-secondary-dark ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-6 border-b border-secondary-dark">
            <div className="flex items-center justify-center w-full">
              <img
                src="https://qbezqfbovuyiphkvvnen.supabase.co/storage/v1/object/public/alpha//logo-alpha.png"
                alt="Alpha Logo"
                className="h-24 w-24 object-contain"
              />
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-accent hover:text-primary focus:outline-none transition-colors duration-200 absolute right-6"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-primary/10 text-primary shadow-glow'
                    : 'text-accent hover:bg-primary/5 hover:text-primary'
                  }`
                }
                end={item.path === '/'}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-secondary-dark">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-accent rounded-xl hover:bg-primary/5 hover:text-primary transition-all duration-300"
            >
              <LogOut size={20} className="mr-3" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-secondary shadow-soft z-10 border-b border-secondary-dark">
          <div className="px-6 sm:px-8 lg:px-10">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="text-accent hover:text-primary focus:outline-none lg:hidden transition-colors duration-200"
                >
                  <Menu size={24} />
                </button>
              </div>
              <div className="flex items-center space-x-6">
                <button className="relative text-accent hover:text-primary focus:outline-none transition-colors duration-200">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                </button>
                <div className="relative group">
                  <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-primary/5 transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-secondary font-medium shadow-glow">
                      {user?.nome_da_instancia?.[0] || 'U'}
                    </div>
                    <div className="hidden md:block">
                      <div className="text-sm font-medium text-accent">{user?.nome_da_instancia}</div>
                      <div className="text-xs text-accent/60">{user?.email}</div>
                    </div>
                    <ChevronDown size={16} className="text-accent group-hover:text-primary transition-colors duration-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 bg-secondary">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;