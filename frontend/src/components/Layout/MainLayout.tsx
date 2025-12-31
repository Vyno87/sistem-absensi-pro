import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CalendarCheck, LogOut, Clock, Calendar, FileSpreadsheet } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const allNavItems = [
        { label: t('nav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'user'] },
        { label: t('nav.employees'), path: '/employees', icon: <Users size={20} />, roles: ['admin'] },
        { label: t('nav.attendance'), path: '/attendance', icon: <CalendarCheck size={20} />, roles: ['user'] },
        { label: t('nav.shifts'), path: '/shifts', icon: <Clock size={20} />, roles: ['admin'] },
        { label: t('nav.leaves'), path: '/leaves', icon: <Calendar size={20} />, roles: ['admin', 'user'] },
        { label: t('nav.reports'), path: '/reports', icon: <FileSpreadsheet size={20} />, roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'user'));

    return (
        <div className="flex h-screen bg-transparent overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 glass-panel m-4 rounded-3xl flex flex-col border-r-0 relative z-20 overflow-hidden">
                <div className="p-8 flex-shrink-0">
                    <h2 className="text-2xl font-bold tracking-tighter">
                        <span className="text-gradient">SISTEM ABSENSI PRO</span>
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                flex items-center px-6 py-4 rounded-2xl transition-all duration-300 group
                ${location.pathname === item.path
                                    ? 'bg-primary/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
              `}
                        >
                            <span className={`mr-4 ${location.pathname === item.path ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 mt-auto flex-shrink-0 border-t border-white/5 bg-white/5 backdrop-blur-md rounded-b-3xl">
                    <div className="glass-morphism p-4 rounded-2xl mb-2">
                        <div className="flex items-center justify-between">
                            <div className="truncate mr-2">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('nav.loggedInAs')}</p>
                                <p className="font-bold text-white truncate text-sm">{user?.username || 'Admin'}</p>
                                <p className="text-[10px] text-primary font-bold uppercase">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all group title='Logout'"
                                title={t('nav.logout')}
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <div className="p-8 min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
