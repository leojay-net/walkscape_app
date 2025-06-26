'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
    MapPin,
    Trophy,
    Heart,
    Zap,
    Calendar,
    PawPrint,
    Users,
    Coins,
    User,
    Flame,
    Star,
    Sparkles,
    Leaf,
    Target,
    Clock,
    TrendingUp,
    Award,
    ChevronRight,
    Activity
} from 'lucide-react';

export default function Dashboard() {
    const { playerStats, refreshPlayerStats, address, isRegistered, isLoading } = useWallet();
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // Debug log
    console.log('Dashboard state:', {
        isRegistered,
        isLoading,
        hasPlayerStats: !!playerStats,
        address: address?.slice(0, 8)
    });

    useEffect(() => {
        // Refresh stats when component mounts if user is registered
        if (isRegistered && !playerStats && !isLoading) {
            console.log('Attempting to refresh player stats...');
            refreshPlayerStats();
        }
    }, [isRegistered, playerStats, refreshPlayerStats, isLoading]);

    useEffect(() => {
        // Refresh stats every 30 seconds if user is registered
        if (isRegistered) {
            const interval = setInterval(() => {
                refreshPlayerStats();
                setLastRefresh(Date.now());
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [refreshPlayerStats, isRegistered]);

    // Show loading if wallet context is still loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-slate-400 mt-4 text-lg">Loading wallet status...</p>
                </div>
            </div>
        );
    }

    // Show loading if not registered or stats not loaded yet
    if (!isRegistered) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Please complete registration first</p>
                </div>
            </div>
        );
    }

    // Check if playerStats is actually null/undefined (not just 0n)
    if (playerStats === null || playerStats === undefined) {
        // Show skeleton loader
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-slate-800 rounded w-2/3 mx-auto" />
                        <div className="h-6 bg-slate-800 rounded w-1/2 mx-auto" />
                        <div className="h-40 bg-slate-800 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    // Handle the case where playerStats is 0n (registered but no activity)
    let actualStats;
    if (typeof playerStats === 'bigint' && playerStats === BigInt(0)) {
        // Create default stats for a new player
        actualStats = {
            walks_xp: BigInt(0),
            grass_touch_streak: BigInt(0),
            total_artifacts: BigInt(0),
            pets_owned: BigInt(0),
            health_score: BigInt(0),
            last_checkin: BigInt(0),
            current_biome: BigInt(0),
            current_colony: BigInt(0)
        };
    } else {
        actualStats = playerStats;
    }

    const formatXP = (xp: bigint) => {
        return Number(xp).toLocaleString();
    };

    const getStreakIcon = (streak: bigint) => {
        const streakNum = Number(streak);
        if (streakNum >= 30) return <Flame className="w-6 h-6 text-orange-400" />;
        if (streakNum >= 14) return <Star className="w-6 h-6 text-yellow-400" />;
        if (streakNum >= 7) return <Sparkles className="w-6 h-6 text-purple-400" />;
        if (streakNum >= 3) return <Leaf className="w-6 h-6 text-green-400" />;
        return <Leaf className="w-6 h-6 text-green-300" />;
    };

    const calculateLevel = (xp: bigint) => {
        return Math.floor(Math.sqrt(Number(xp) / 100)) + 1;
    };

    const calculateNextLevelXP = (xp: bigint) => {
        const currentLevel = calculateLevel(xp);
        return Math.pow(currentLevel, 2) * 100;
    };

    const xpProgress = () => {
        const currentXP = Number(actualStats.walks_xp);
        const currentLevel = calculateLevel(actualStats.walks_xp);
        const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
        const nextLevelXP = Math.pow(currentLevel, 2) * 100;

        return ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    };

    // Check if this is a new player (all stats are zero)
    const isNewPlayer = Object.values(actualStats).every(
        v => typeof v === 'bigint' ? v === BigInt(0) : v === 0
    );

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-2xl p-8 border border-green-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome back, Explorer!
                        </h1>
                        <p className="text-slate-300 text-lg">
                            Level {calculateLevel(actualStats.walks_xp)} • {formatXP(actualStats.walks_xp)} XP
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {address?.slice(0, 8)}...{address?.slice(-6)}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl mb-2">
                            <Zap className="text-orange-400 w-10 h-10" />
                        </div>
                        <p className="text-green-400 font-bold text-xl">
                            {Number(actualStats.grass_touch_streak)} Day Streak
                        </p>
                    </div>
                </div>

                {/* XP Progress */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Level Progress</span>
                        <span>{Math.round(xpProgress())}% to Level {calculateLevel(actualStats.walks_xp) + 1}</span>
                    </div>
                    <div className="progress-bar h-3">
                        <div
                            className="progress-fill h-3"
                            style={{ width: `${xpProgress()}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <MapPin size={24} className="text-green-400" />
                        </div>
                        <span className="text-2xl">{getStreakIcon(actualStats.grass_touch_streak)}</span>
                    </div>
                    <h3 className="text-green-400 font-semibold mb-1">Touch Grass Streak</h3>
                    <p className="text-3xl font-bold text-white">{Number(actualStats.grass_touch_streak)}</p>
                    <p className="text-slate-400 text-sm mt-1">consecutive days</p>
                </div>

                <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-xl p-6 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                            <Trophy size={24} className="text-amber-400" />
                        </div>
                        <span className="text-2xl"><Trophy className="w-6 h-6 text-amber-300" /></span>
                    </div>
                    <h3 className="text-amber-400 font-semibold mb-1">Artifacts Found</h3>
                    <p className="text-3xl font-bold text-white">{Number(actualStats.total_artifacts)}</p>
                    <p className="text-slate-400 text-sm mt-1">unique discoveries</p>
                </div>

                <div className="bg-gradient-to-br from-pink-900/30 to-pink-800/20 rounded-xl p-6 border border-pink-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-pink-500/20 rounded-lg">
                            <PawPrint size={24} className="text-pink-400" />
                        </div>
                        <span className="text-2xl"><PawPrint className="w-6 h-6 text-pink-300" /></span>
                    </div>
                    <h3 className="text-pink-400 font-semibold mb-1">Pets Owned</h3>
                    <p className="text-3xl font-bold text-white">{Number(actualStats.pets_owned)}</p>
                    <p className="text-slate-400 text-sm mt-1">faithful companions</p>
                </div>

                <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-xl p-6 border border-red-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <Heart size={24} className="text-red-400" />
                        </div>
                        <span className="text-2xl"><Heart className="w-6 h-6 text-red-300" /></span>
                    </div>
                    <h3 className="text-red-400 font-semibold mb-1">Health Score</h3>
                    <p className="text-3xl font-bold text-white">{Number(actualStats.health_score)}%</p>
                    <p className="text-slate-400 text-sm mt-1">wellness rating</p>
                </div>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Actions */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Calendar size={20} className="text-blue-400" />
                        </div>
                        Daily Actions
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <MapPin size={16} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Touch Grass</p>
                                    <p className="text-xs text-slate-400">Daily check-in with nature</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-green-400 font-bold">+15 XP</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-amber-900/20 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Trophy size={16} className="text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Scan Location</p>
                                    <p className="text-xs text-slate-400">Discover hidden artifacts</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-amber-400 font-bold">Artifact</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-pink-900/20 rounded-lg border border-pink-500/20 hover:border-pink-500/40 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/20 rounded-lg">
                                    <PawPrint size={16} className="text-pink-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Care for Pets</p>
                                    <p className="text-xs text-slate-400">Feed and nurture companions</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-pink-400 font-bold">Happiness</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Overview */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Zap size={20} className="text-purple-400" />
                        </div>
                        Activity Overview
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300">Last Check-in</span>
                                <span className="text-white font-medium">
                                    {actualStats.last_checkin
                                        ? new Date(Number(actualStats.last_checkin) * 1000).toLocaleDateString()
                                        : 'Never'
                                    }
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300">Explorer Status</span>
                                <span className={`font-medium ${Number(actualStats.grass_touch_streak) > 0
                                    ? 'text-green-400'
                                    : 'text-amber-400'
                                    }`}>
                                    {Number(actualStats.grass_touch_streak) > 0 ? 'Active Explorer' : 'Getting Started'}
                                </span>
                            </div>
                        </div>

                        {Number(actualStats.current_colony) > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-300">Colony Member</span>
                                    <span className="text-blue-400 font-medium">
                                        Colony #{Number(actualStats.current_colony)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-700">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-400">{calculateLevel(actualStats.walks_xp)}</p>
                                    <p className="text-xs text-slate-400">Explorer Level</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-400">{formatXP(actualStats.walks_xp)}</p>
                                    <p className="text-xs text-slate-400">Total XP</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="text-blue-400" size={20} />
                    Quick Actions
                </h3>
                <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                        <MapPin size={16} />
                        <span>Touch Grass</span>
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                        <Trophy size={16} />
                        <span>Scan Area</span>
                    </button>
                    <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                        <PawPrint size={16} />
                        <span>Visit Garden</span>
                    </button>
                    <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
                        <Coins size={16} />
                        <span>Stake Tokens</span>
                    </button>
                </div>
            </div>

            {/* Achievements & Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Achievements */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Award size={20} className="text-amber-400" />
                        </div>
                        Achievements
                    </h3>

                    <div className="space-y-4">
                        {/* First Steps Achievement */}
                        <div className={`p-4 rounded-lg border transition-all ${Number(actualStats.grass_touch_streak) > 0
                                ? 'bg-green-900/20 border-green-500/30'
                                : 'bg-slate-700/20 border-slate-600/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${Number(actualStats.grass_touch_streak) > 0
                                            ? 'bg-green-500/20'
                                            : 'bg-slate-500/20'
                                        }`}>
                                        <Leaf size={16} className={
                                            Number(actualStats.grass_touch_streak) > 0
                                                ? 'text-green-400'
                                                : 'text-slate-400'
                                        } />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">First Steps</p>
                                        <p className="text-xs text-slate-400">Touch grass for the first time</p>
                                    </div>
                                </div>
                                {Number(actualStats.grass_touch_streak) > 0 && (
                                    <div className="text-green-400">
                                        <Trophy size={16} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Explorer Achievement */}
                        <div className={`p-4 rounded-lg border transition-all ${Number(actualStats.total_artifacts) > 0
                                ? 'bg-amber-900/20 border-amber-500/30'
                                : 'bg-slate-700/20 border-slate-600/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${Number(actualStats.total_artifacts) > 0
                                            ? 'bg-amber-500/20'
                                            : 'bg-slate-500/20'
                                        }`}>
                                        <Trophy size={16} className={
                                            Number(actualStats.total_artifacts) > 0
                                                ? 'text-amber-400'
                                                : 'text-slate-400'
                                        } />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Explorer</p>
                                        <p className="text-xs text-slate-400">Find your first artifact</p>
                                    </div>
                                </div>
                                {Number(actualStats.total_artifacts) > 0 && (
                                    <div className="text-amber-400">
                                        <Trophy size={16} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Streak Master Achievement */}
                        <div className={`p-4 rounded-lg border transition-all ${Number(actualStats.grass_touch_streak) >= 7
                                ? 'bg-purple-900/20 border-purple-500/30'
                                : 'bg-slate-700/20 border-slate-600/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${Number(actualStats.grass_touch_streak) >= 7
                                            ? 'bg-purple-500/20'
                                            : 'bg-slate-500/20'
                                        }`}>
                                        <Flame size={16} className={
                                            Number(actualStats.grass_touch_streak) >= 7
                                                ? 'text-purple-400'
                                                : 'text-slate-400'
                                        } />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Streak Master</p>
                                        <p className="text-xs text-slate-400">Maintain a 7-day streak</p>
                                    </div>
                                </div>
                                {Number(actualStats.grass_touch_streak) >= 7 && (
                                    <div className="text-purple-400">
                                        <Trophy size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>{Number(actualStats.grass_touch_streak)}/7 days</span>
                                    <span>{Math.min(Math.round((Number(actualStats.grass_touch_streak) / 7) * 100), 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((Number(actualStats.grass_touch_streak) / 7) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Goals */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Target size={20} className="text-blue-400" />
                        </div>
                        Daily Goals
                    </h3>

                    <div className="space-y-4">
                        {/* Touch Grass Goal */}
                        <div className="p-4 bg-green-900/10 rounded-lg border border-green-500/20">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <MapPin size={16} className="text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Daily Touch Grass</p>
                                        <p className="text-xs text-slate-400">Stay connected with nature</p>
                                    </div>
                                </div>
                                <div className="text-green-400 font-bold">
                                    +15 XP
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Today's progress</span>
                                <span>{Number(actualStats.grass_touch_streak) > 0 ? 'Complete!' : 'Pending'}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${Number(actualStats.grass_touch_streak) > 0 ? 'bg-green-400' : 'bg-slate-600'
                                        }`}
                                    style={{ width: Number(actualStats.grass_touch_streak) > 0 ? '100%' : '0%' }}
                                />
                            </div>
                        </div>

                        {/* Exploration Goal */}
                        <div className="p-4 bg-amber-900/10 rounded-lg border border-amber-500/20">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                        <Trophy size={16} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Explore & Discover</p>
                                        <p className="text-xs text-slate-400">Find hidden artifacts</p>
                                    </div>
                                </div>
                                <div className="text-amber-400 font-bold">
                                    Artifact
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Weekly goal: 3 artifacts</span>
                                <span>{Number(actualStats.total_artifacts)}/3</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min((Number(actualStats.total_artifacts) / 3) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Health Goal */}
                        <div className="p-4 bg-red-900/10 rounded-lg border border-red-500/20">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <Heart size={16} className="text-red-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Health & Wellness</p>
                                        <p className="text-xs text-slate-400">Maintain good health score</p>
                                    </div>
                                </div>
                                <div className="text-red-400 font-bold">
                                    {Number(actualStats.health_score)}%
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Target: 80% health</span>
                                <span>{Number(actualStats.health_score) >= 80 ? 'Achieved!' : 'In Progress'}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${Number(actualStats.health_score) >= 80 ? 'bg-green-400' : 'bg-red-400'
                                        }`}
                                    style={{ width: `${Math.min(Number(actualStats.health_score), 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 bg-slate-500/20 rounded-lg">
                        <Clock size={20} className="text-slate-400" />
                    </div>
                    Recent Activity
                </h3>

                {isNewPlayer ? (
                    <div className="text-center py-8">
                        <div className="p-4 bg-slate-700/30 rounded-lg inline-block mb-4">
                            <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                        </div>
                        <p className="text-slate-400 mb-2">No activity yet</p>
                        <p className="text-sm text-slate-500">Start your WalkScape journey by touching grass!</p>
                        <button className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto">
                            <MapPin size={16} />
                            <span>Touch Grass Now</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-green-900/10 rounded-lg border border-green-500/20">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <MapPin size={16} className="text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">Touched grass</p>
                                <p className="text-xs text-slate-400">
                                    {actualStats.last_checkin
                                        ? new Date(Number(actualStats.last_checkin) * 1000).toLocaleDateString()
                                        : 'Recently'
                                    }
                                </p>
                            </div>
                            <div className="text-green-400 font-bold text-sm">+15 XP</div>
                        </div>

                        {Number(actualStats.total_artifacts) > 0 && (
                            <div className="flex items-center gap-4 p-3 bg-amber-900/10 rounded-lg border border-amber-500/20">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Trophy size={16} className="text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">Found artifacts</p>
                                    <p className="text-xs text-slate-400">Total: {Number(actualStats.total_artifacts)}</p>
                                </div>
                                <div className="text-amber-400 font-bold text-sm">Rare</div>
                            </div>
                        )}

                        <div className="text-center py-4">
                            <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto transition-colors">
                                View All Activity
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
