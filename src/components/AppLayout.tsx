'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import {
    BarChart3,
    Camera,
    Leaf,
    Users,
    Coins,
    LogOut,
    TreePine
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { isConnected, isRegistered, address, disconnect, isLoading } = useWallet();
    const pathname = usePathname();
    const router = useRouter();

    // Only show layout for connected and registered users on protected routes
    const protectedRoutes = ['/dashboard', '/scanner', '/garden', '/colony', '/staking'];
    const isProtectedRoute = protectedRoutes.includes(pathname);

    // Show loading or let pages handle their own loading states
    if (isLoading || !isConnected || (isProtectedRoute && !isRegistered)) {
        return <>{children}</>;
    }

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
        { id: 'scanner', label: 'Scanner', icon: Camera, path: '/scanner' },
        { id: 'garden', label: 'Garden', icon: Leaf, path: '/garden' },
        { id: 'colony', label: 'Colony', icon: Users, path: '/colony' },
        { id: 'staking', label: 'Staking', icon: Coins, path: '/staking' }
    ];

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
                <div className="w-full px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center gap-2">
                                <TreePine className="text-green-500" size={28} />
                                <h1 className="text-2xl font-bold text-gradient-nature">
                                    WalkScape
                                </h1>
                            </div>
                            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400">
                                <span>•</span>
                                <span>Explore • Collect • Stake</span>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {tabs.map(tab => {
                                const IconComponent = tab.icon;
                                const isActive = pathname === tab.path;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleNavigate(tab.path)}
                                        className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${isActive
                                            ? 'bg-green-600 text-white'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                                            }`}
                                    >
                                        <IconComponent size={16} />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* User Info */}
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-medium text-white">Connected</div>
                                <div className="text-xs text-slate-400">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </div>
                            </div>
                            <button
                                onClick={() => disconnect()}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                                title="Disconnect Wallet"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Dashboard Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation (Mobile/Tablet) */}
                <aside className="lg:hidden w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 space-y-4">
                    {tabs.map(tab => {
                        const IconComponent = tab.icon;
                        const isActive = pathname === tab.path;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleNavigate(tab.path)}
                                className={`p-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-green-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                title={tab.label}
                            >
                                <IconComponent size={20} />
                            </button>
                        );
                    })}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
