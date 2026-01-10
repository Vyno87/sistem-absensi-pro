import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CalendarCheck, LogOut, Clock, Calendar, FileSpreadsheet, RefreshCw, Settings, DollarSign, Moon, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    React.useEffect(() => {
        // Listen for service worker updates
        const onSWUpdate = () => {
            const toast = document.getElementById('update-toast');
            if (toast) toast.classList.remove('hidden');
        };

        // Custom event we might dispatch from index.tsx later or simple timer
        // For now, we'll just check if we can reach the server after a failure
        window.addEventListener('sw-update-available', onSWUpdate);
        return () => window.removeEventListener('sw-update-available', onSWUpdate);
    }, []);

    const allNavItems = [
        { label: t('nav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'user'] },
        { label: t('nav.employees'), path: '/employees', icon: <Users size={20} />, roles: ['admin'] },
        { label: t('nav.attendance'), path: '/attendance', icon: <CalendarCheck size={20} />, roles: ['user'] },
        { label: t('nav.shifts'), path: '/shifts', icon: <Clock size={20} />, roles: ['admin'] },
        { label: t('nav.leaves'), path: '/leaves', icon: <Calendar size={20} />, roles: ['admin', 'user'] },
        { label: 'Payroll', path: '/payroll', icon: <DollarSign size={20} />, roles: ['admin'] },
        { label: t('nav.reports'), path: '/reports', icon: <FileSpreadsheet size={20} />, roles: ['admin'] },
        { label: t('nav.settings'), path: '/settings', icon: <Settings size={20} />, roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'user'));

    return (
        <div className="flex h-screen bg-black overflow-hidden relative">
            {/* App-wide Neon Backgrounds */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[100vh] h-[100vh] bg-primary/5 rounded-full blur-[150px] animate-float-neon" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[90vh] h-[90vh] bg-secondary/5 rounded-full blur-[120px] animate-float-neon-delayed" />
            </div>

            {/* Sidebar */}
            <aside className="w-72 glass-panel m-4 rounded-3xl flex flex-col border-r-0 relative z-20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
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
                                    ? 'bg-primary/20 text-primary font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--glass-shine)] hover:text-[var(--text-main)]'
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
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full mb-3 p-3 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 rounded-xl transition-all flex items-center justify-center gap-2 group"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-white font-semibold text-sm">Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-5 h-5 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-gray-800 font-semibold text-sm">Dark Mode</span>
                            </>
                        )}
                    </button>

                    <div className="glass-morphism p-4 rounded-2xl mb-2">
                        <div className="flex items-center justify-between">
                            <div className="truncate mr-2">
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">{t('nav.loggedInAs')}</p>
                                <p className="font-bold text-[var(--text-main)] truncate text-sm">{user?.username || 'Admin'}</p>
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

            {/* Update Notification (Solusi Jangka Panjang) */}
            <div id="update-toast" className="hidden fixed bottom-4 right-4 bg-slate-800 border border-primary p-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] z-50 animate-bounce">
                <div className="flex items-center space-x-4">
                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                        <RefreshCw size={24} className="animate-spin" />
                    </div>
                    <div>
                        <p className="font-bold text-white">Update Available</p>
                        <p className="text-xs text-gray-400">New version is ready.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                            }
                            window.location.reload();
                        }}
                        className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark"
                    >
                        Reload
                    </button>
                    <button
                        onClick={() => {
                            const el = document.getElementById('update-toast');
                            if (el) el.classList.add('hidden');
                        }}
                        className="text-gray-400 hover:text-white"
                    >
                        <LogOut size={16} /> {/* Reusing LogOut icon as close for now */}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
