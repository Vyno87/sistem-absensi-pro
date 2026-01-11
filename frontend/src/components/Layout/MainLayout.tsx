import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CalendarCheck, LogOut, Clock, Calendar, FileSpreadsheet, RefreshCw, Settings, DollarSign, Moon, Sun, Menu, X, ChevronRight, Layers } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { theme, uiStyle, toggleTheme, toggleUIStyle } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed for "slide pane" feel

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
        <div className="flex h-screen bg-[var(--bg-darker)] overflow-hidden relative transition-colors duration-300">
            {/* App-wide Neon Backgrounds */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Standard Blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[100vh] h-[100vh] bg-primary/5 rounded-full blur-[150px] animate-float-neon" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[90vh] h-[90vh] bg-secondary/5 rounded-full blur-[120px] animate-float-neon-delayed" />

                {/* Extra Intensity for Neon Theme */}
                {theme === 'neon' && (
                    <>
                        <div className="absolute top-[20%] left-[10%] w-[60vh] h-[60vh] bg-accent/10 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-[10%] right-[20%] w-[50vh] h-[50vh] bg-primary/10 rounded-full blur-[100px] animate-bounce-slow" />

                        {/* 3D-like Decorative Assets (CSS Spheres/Cubes) */}
                        <div className="absolute top-[15%] left-[5%] w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(34,211,238,0.5)] opacity-40 animate-float-neon" style={{ filter: 'blur(2px)' }} />
                        <div className="absolute top-[60%] right-[10%] w-24 h-24 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-purple-800 shadow-[0_0_40px_rgba(232,121,249,0.5)] opacity-30 animate-float-neon-delayed" style={{ transform: 'rotate(25deg)', filter: 'blur(3px)' }} />
                        <div className="absolute bottom-[20%] left-[15%] w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-700 shadow-[0_0_20px_rgba(96,165,250,0.5)] opacity-50 animate-bounce-slow" />
                    </>
                )}
            </div>

            {/* Backdrop for mobile/drawer mode */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sliding Sidebar (Drawer) */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 w-72 glass-panel m-0 rounded-r-3xl border-l-0 flex flex-col 
                    transform transition-transform duration-300 ease-in-out shadow-2xl
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="p-6 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-2xl font-bold tracking-tighter">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ABSENSI PRO</span>
                    </h2>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 rounded-xl hover:bg-[var(--glass-shine)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-2">
                    <div className="glass-morphism p-4 rounded-2xl mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {user?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-[var(--text-main)] truncate text-sm">{user?.username || 'Admin'}</p>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)} // Close on navigate
                            className={`
                                flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-300 group
                                ${location.pathname === item.path
                                    ? 'bg-primary/10 text-primary font-bold border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--glass-shine)] hover:text-[var(--text-main)] border border-transparent'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`${location.pathname === item.path ? 'text-primary' : 'text-gray-400 group-hover:text-primary transition-colors'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {location.pathname === item.path && (
                                <ChevronRight size={16} className="text-primary animate-pulse" />
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-6 mt-auto flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group border border-red-500/20"
                    >
                        <LogOut size={18} />
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                {/* Top Header */}
                <header className="h-20 px-4 md:px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 rounded-2xl glass-panel text-[var(--text-main)] hover:text-primary hover:border-primary/50 transition-all shadow-lg active:scale-95"
                            aria-label="Open Menu"
                        >
                            <Menu size={24} />
                        </button>

                        {!isSidebarOpen && (
                            <h1 className="text-xl font-bold text-[var(--text-main)] hidden md:block animate-fade-in">
                                {allNavItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                            </h1>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Design System Toggle */}
                        <button
                            onClick={toggleUIStyle}
                            className="p-3 rounded-2xl glass-panel text-[var(--text-main)] hover:bg-[var(--glass-shine)] transition-all shadow-lg flex items-center gap-3 group"
                            title={uiStyle === 'glass' ? 'Switch to Neumorphic Design' : 'Switch to Glassmorphism Design'}
                        >
                            <Layers className={`w-6 h-6 ${uiStyle === 'neumorph' ? 'text-primary' : 'text-gray-400'}`} />
                            <span className="text-sm font-semibold hidden md:block">
                                {uiStyle === 'glass' ? 'Glass' : 'Neumorph'}
                            </span>
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-2xl glass-panel text-[var(--text-main)] hover:bg-[var(--glass-shine)] transition-all shadow-lg flex items-center gap-3 group"
                            aria-label="Toggle Theme"
                        >
                            <div className="relative w-6 h-6">
                                <Sun
                                    className={`absolute inset-0 w-full h-full text-yellow-500 transition-all duration-500 ${theme === 'dark' ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}
                                />
                                <Moon
                                    className={`absolute inset-0 w-full h-full text-indigo-400 transition-all duration-500 ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}
                                />
                            </div>
                            <span className="text-sm font-semibold hidden md:block">
                                {theme === 'dark' ? t('nav.mode.dark') : t('nav.mode.light')}
                            </span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8 pt-0 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Update Notification */}
            <div id="update-toast" className="hidden fixed bottom-6 right-6 bg-[var(--glass-bg)] backdrop-blur-xl border border-primary p-4 rounded-2xl shadow-2xl z-50 animate-bounce">
                <div className="flex items-center space-x-4">
                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                        <RefreshCw size={24} className="animate-spin" />
                    </div>
                    <div>
                        <p className="font-bold text-[var(--text-main)]">Update Available</p>
                        <p className="text-xs text-[var(--text-muted)]">New version is ready.</p>
                    </div>
                    <button
                        onClick={() => {
                            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                            }
                            window.location.reload();
                        }}
                        className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-primary/30"
                    >
                        Reload
                    </button>
                    <button
                        onClick={() => {
                            const el = document.getElementById('update-toast');
                            if (el) el.classList.add('hidden');
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
