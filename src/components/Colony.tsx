'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract, stringToFelt252, felt252ToString } from '@/lib/starknet';
import {
    Users,
    Plus,
    Crown,
    MapPin,
    Trophy,
    Calendar,
    Loader2,
    UserPlus,
    LogOut
} from 'lucide-react';

interface Colony {
    id: string;
    name: string;
    creator: string;
    member_count: bigint;
    total_xp: bigint;
    created_at: bigint;
    weekly_challenge_score: bigint;
}

export default function Colony() {
    const { account, playerStats, refreshPlayerStats, address, isRegistered } = useWallet();
    const [activeTab, setActiveTab] = useState<'my-colony' | 'discover'>('my-colony');
    const [colony, setColony] = useState<Colony | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState<string | null>(null);
    const [newColonyName, setNewColonyName] = useState('');
    const [joinColonyId, setJoinColonyId] = useState('');

    if (!isRegistered) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Please complete registration first</p>
                </div>
            </div>
        );
    }

    const loadColonyData = useCallback(async () => {
        if (!account?.address || !playerStats) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const colonyId = Number(playerStats.current_colony);
            if (colonyId > 0) {
                const contract = getContract();
                const colonyStats = await contract.get_colony_stats(BigInt(colonyId));
                setColony({
                    id: colonyId.toString(),
                    name: felt252ToString(colonyStats.name),
                    creator: colonyStats.creator,
                    member_count: colonyStats.member_count,
                    total_xp: colonyStats.total_xp,
                    created_at: colonyStats.created_at,
                    weekly_challenge_score: colonyStats.weekly_challenge_score
                });
            } else {
                setColony(null);
            }
        } catch (error) {
            console.error('Failed to load colony data:', error);
            setColony(null);
        } finally {
            setIsLoading(false);
        }
    }, [account?.address, playerStats?.current_colony]);

    useEffect(() => {
        loadColonyData();
    }, [loadColonyData]);

    const handleCreateColony = async () => {
        if (!account || !newColonyName.trim()) return;

        setIsCreating(true);
        try {
            const contract = getContract(account);
            const colonyNameFelt = stringToFelt252(newColonyName.trim());
            await contract.create_colony(colonyNameFelt);

            // Refresh data after creation
            setTimeout(() => {
                refreshPlayerStats();
                loadColonyData();
                setIsCreating(false);
                setNewColonyName('');
            }, 3000);
        } catch (error) {
            console.error('Failed to create colony:', error);
            setIsCreating(false);
        }
    };

    const handleJoinColony = async () => {
        if (!account || !joinColonyId.trim()) return;

        setIsJoining(joinColonyId);
        try {
            const contract = getContract(account);
            await contract.join_colony(BigInt(joinColonyId));

            // Refresh data after joining
            setTimeout(() => {
                refreshPlayerStats();
                loadColonyData();
                setIsJoining(null);
                setJoinColonyId('');
                setActiveTab('my-colony');
            }, 3000);
        } catch (error) {
            console.error('Failed to join colony:', error);
            setIsJoining(null);
        }
    };

    const handleLeaveColony = async () => {
        if (!account) return;

        try {
            const contract = getContract(account);
            await contract.leave_colony();

            // Refresh data after leaving
            setTimeout(() => {
                refreshPlayerStats();
                loadColonyData();
            }, 3000);
        } catch (error) {
            console.error('Failed to leave colony:', error);
        }
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatXP = (xp: bigint) => {
        return Number(xp).toLocaleString();
    };

    const getColonyLevel = (totalXP: bigint) => {
        return Math.floor(Math.sqrt(Number(totalXP) / 1000)) + 1;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading colony data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <Users size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Colonies</h2>
                <p className="text-slate-400 text-sm">
                    Connect with fellow explorers
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('my-colony')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'my-colony'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Users size={16} className="inline mr-2" />
                    My Colony
                </button>
                <button
                    onClick={() => setActiveTab('discover')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'discover'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Plus size={16} className="inline mr-2" />
                    Join/Create
                </button>
            </div>

            {/* My Colony Tab */}
            {activeTab === 'my-colony' && (
                <div className="space-y-4">
                    {colony ? (
                        <>
                            {/* Colony Info */}
                            <div className="card-forest">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            {colony.creator === address && <Crown size={16} className="text-yellow-400" />}
                                            {colony.name}
                                        </h3>
                                        <p className="text-sm text-slate-400">Colony #{colony.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-blue-400">
                                            Level {getColonyLevel(colony.total_xp)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatXP(colony.total_xp)} XP
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="stat-card">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users size={14} className="text-blue-400" />
                                            <span className="text-sm">Members</span>
                                        </div>
                                        <p className="text-lg font-bold">{Number(colony.member_count)}</p>
                                    </div>

                                    <div className="stat-card">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Trophy size={14} className="text-yellow-400" />
                                            <span className="text-sm">Weekly Score</span>
                                        </div>
                                        <p className="text-lg font-bold">{Number(colony.weekly_challenge_score)}</p>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-400 space-y-1">
                                    <p className="flex items-center gap-1">
                                        <Crown size={12} />
                                        Creator: {formatAddress(colony.creator)}
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        Created: {new Date(Number(colony.created_at) * 1000).toLocaleDateString()}
                                    </p>
                                </div>

                                {colony.creator !== address && (
                                    <button
                                        onClick={handleLeaveColony}
                                        className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
                                    >
                                        <LogOut size={16} />
                                        Leave Colony
                                    </button>
                                )}
                            </div>

                            {/* Colony Benefits */}
                            <div className="card">
                                <h4 className="font-bold mb-3">🎁 Colony Benefits</h4>
                                <div className="space-y-2 text-sm text-slate-300">
                                    <p>• Shared XP pool boosts individual rewards</p>
                                    <p>• Weekly challenges and competitions</p>
                                    <p>• Collaborative artifact discoveries</p>
                                    <p>• Member-only events and rewards</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card text-center text-slate-400">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="mb-2">You're not in a colony yet</p>
                            <p className="text-xs mb-4">Join or create a colony to connect with other explorers!</p>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className="btn-primary"
                            >
                                Find a Colony
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Discover/Create Tab */}
            {activeTab === 'discover' && (
                <div className="space-y-4">
                    {!colony && (
                        <>
                            {/* Create Colony */}
                            <div className="card-forest">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <Plus size={16} />
                                    Create New Colony
                                </h3>
                                <p className="text-sm text-slate-300 mb-4">
                                    Start your own exploration community
                                </p>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Colony name..."
                                        value={newColonyName}
                                        onChange={(e) => setNewColonyName(e.target.value)}
                                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                                        maxLength={31} // felt252 limit
                                    />

                                    <button
                                        onClick={handleCreateColony}
                                        disabled={!newColonyName.trim() || isCreating}
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                Create Colony
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Join Colony */}
                            <div className="card">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <UserPlus size={16} />
                                    Join Existing Colony
                                </h3>
                                <p className="text-sm text-slate-300 mb-4">
                                    Enter a colony ID to join
                                </p>

                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        placeholder="Colony ID..."
                                        value={joinColonyId}
                                        onChange={(e) => setJoinColonyId(e.target.value)}
                                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                    />

                                    <button
                                        onClick={handleJoinColony}
                                        disabled={!joinColonyId.trim() || isJoining === joinColonyId}
                                        className="btn-secondary w-full flex items-center justify-center gap-2"
                                    >
                                        {isJoining === joinColonyId ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Joining...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={16} />
                                                Join Colony
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Popular Colonies (Mock data) */}
                    <div className="card">
                        <h3 className="font-bold mb-3">🔥 Popular Colonies</h3>
                        <div className="space-y-3">
                            {[
                                { id: '1', name: 'Forest Walkers', members: 42, xp: 15420 },
                                { id: '2', name: 'Urban Explorers', members: 38, xp: 12890 },
                                { id: '3', name: 'Nature Lovers', members: 35, xp: 11560 },
                            ].map((popularColony) => (
                                <div key={popularColony.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-sm">{popularColony.name}</h4>
                                        <p className="text-xs text-slate-400">
                                            {popularColony.members} members • {popularColony.xp.toLocaleString()} XP
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setJoinColonyId(popularColony.id)}
                                        className="btn-primary text-xs py-1 px-3"
                                        disabled={!!colony}
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="card">
                        <h3 className="font-bold mb-3">💡 Colony Tips</h3>
                        <div className="space-y-2 text-sm text-slate-400">
                            <p>• Colonies can have up to 50 members</p>
                            <p>• All member XP contributes to colony level</p>
                            <p>• Higher level colonies unlock better rewards</p>
                            <p>• Only colony creators can manage settings</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
