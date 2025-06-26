'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract, StakeInfo } from '@/lib/starknet';
import {
    TrendingUp,
    Coins,
    Clock,
    Gift,
    Loader2,
    Calendar,
    Star,
    PawPrint,
    AlertCircle
} from 'lucide-react';

export default function Staking() {
    const { account, refreshPlayerStats, isRegistered } = useWallet();
    const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStaking, setIsStaking] = useState(false);
    const [isHarvesting, setIsHarvesting] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('');

    if (!isRegistered) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Coins className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Please complete registration first</p>
                </div>
            </div>
        );
    }

    const loadStakeInfo = async () => {
        if (!account) return;

        setIsLoading(true);
        try {
            const contract = getContract();
            const info = await contract.get_stake_info(account.address);
            setStakeInfo({
                amount_staked: info.amount_staked,
                stake_timestamp: info.stake_timestamp,
                growth_multiplier: info.growth_multiplier,
                last_harvest: info.last_harvest
            });
        } catch (error) {
            console.error('Failed to load stake info:', error);
            setStakeInfo(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStakeInfo();
    }, [account]);

    const handleStake = async () => {
        if (!account || !stakeAmount.trim()) return;

        setIsStaking(true);
        try {
            const contract = getContract(account);
            await contract.stake_for_growth(BigInt(stakeAmount));

            // Refresh data after staking
            setTimeout(() => {
                loadStakeInfo();
                setIsStaking(false);
                setStakeAmount('');
            }, 3000);
        } catch (error) {
            console.error('Failed to stake:', error);
            setIsStaking(false);
        }
    };

    const handleHarvest = async () => {
        if (!account) return;

        setIsHarvesting(true);
        try {
            const contract = getContract(account);
            const rewardPetId = await contract.harvest_growth_reward();

            // Refresh data after harvesting
            setTimeout(() => {
                loadStakeInfo();
                refreshPlayerStats();
                setIsHarvesting(false);

                // Show success message with pet ID
                alert(`Harvested! New pet ID: ${rewardPetId}`);
            }, 3000);
        } catch (error) {
            console.error('Failed to harvest:', error);
            setIsHarvesting(false);
        }
    };

    const getStakeTier = (amount: bigint) => {
        const amt = Number(amount);
        if (amt >= 1000) return { tier: 'Legendary', multiplier: 300, color: 'text-gray-300' };
        if (amt >= 500) return { tier: 'Epic', multiplier: 200, color: 'text-gray-400' };
        if (amt >= 100) return { tier: 'Rare', multiplier: 150, color: 'text-green-400' };
        if (amt >= 50) return { tier: 'Common', multiplier: 100, color: 'text-gray-500' };
        return { tier: 'None', multiplier: 0, color: 'text-slate-400' };
    };

    const canHarvest = () => {
        if (!stakeInfo || Number(stakeInfo.amount_staked) === 0) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        const stakeDuration = currentTime - Number(stakeInfo.stake_timestamp);
        const harvestCooldown = currentTime - Number(stakeInfo.last_harvest);

        return stakeDuration >= 604800 && harvestCooldown >= 604800; // 1 week
    };

    const getTimeUntilHarvest = () => {
        if (!stakeInfo || Number(stakeInfo.amount_staked) === 0) return null;

        const currentTime = Math.floor(Date.now() / 1000);
        const stakeDuration = currentTime - Number(stakeInfo.stake_timestamp);
        const harvestCooldown = currentTime - Number(stakeInfo.last_harvest);

        const stakeTimeRemaining = Math.max(0, 604800 - stakeDuration);
        const cooldownTimeRemaining = Math.max(0, 604800 - harvestCooldown);
        const timeRemaining = Math.max(stakeTimeRemaining, cooldownTimeRemaining);

        if (timeRemaining === 0) return null;

        const days = Math.floor(timeRemaining / 86400);
        const hours = Math.floor((timeRemaining % 86400) / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);

        return `${days}d ${hours}h ${minutes}m`;
    };

    const formatAmount = (amount: bigint) => {
        return Number(amount).toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading staking info...</p>
                </div>
            </div>
        );
    }

    const currentTier = stakeInfo ? getStakeTier(stakeInfo.amount_staked) : null;
    const timeUntilHarvest = getTimeUntilHarvest();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <TrendingUp size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Growth Staking</h2>
                <p className="text-slate-400 text-sm">
                    Stake tokens to grow legendary pets
                </p>
            </div>

            {/* Current Stake Status */}
            {stakeInfo && Number(stakeInfo.amount_staked) > 0 ? (
                <div className="card-forest">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold">Current Stake</h3>
                            <p className="text-sm text-slate-400">
                                Staked: {new Date(Number(stakeInfo.stake_timestamp) * 1000).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-400">
                                {formatAmount(stakeInfo.amount_staked)}
                            </p>
                            <p className={`text-sm ${currentTier?.color}`}>
                                {currentTier?.tier} Tier
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="stat-card">
                            <div className="flex items-center gap-2 mb-1">
                                <Star size={14} className="text-gray-300" />
                                <span className="text-sm">Multiplier</span>
                            </div>
                            <p className="text-lg font-bold">{currentTier?.multiplier}%</p>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-sm">Status</span>
                            </div>
                            <p className="text-sm font-medium">
                                {canHarvest() ? (
                                    <span className="text-green-400">Ready!</span>
                                ) : timeUntilHarvest ? (
                                    <span className="text-gray-300">{timeUntilHarvest}</span>
                                ) : (
                                    <span className="text-slate-400">Staking...</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Harvest Button */}
                    <button
                        onClick={handleHarvest}
                        disabled={!canHarvest() || isHarvesting}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isHarvesting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Harvesting...
                            </>
                        ) : canHarvest() ? (
                            <>
                                <Gift size={16} />
                                Harvest Legendary Pet
                            </>
                        ) : (
                            <>
                                <Clock size={16} />
                                Harvest in {timeUntilHarvest}
                            </>
                        )}
                    </button>
                </div>
            ) : (
                /* New Stake */
                <div className="card">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Coins size={16} />
                        Start Staking
                    </h3>
                    <p className="text-sm text-slate-300 mb-4">
                        Stake tokens for 1 week to grow a legendary pet with special traits
                    </p>

                    <div className="space-y-4">
                        <input
                            type="number"
                            placeholder="Amount to stake..."
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                            min="1"
                        />

                        <button
                            onClick={handleStake}
                            disabled={!stakeAmount.trim() || isStaking}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isStaking ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Staking...
                                </>
                            ) : (
                                <>
                                    <TrendingUp size={16} />
                                    Stake for Growth
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Staking Tiers */}
            <div className="card">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Star size={16} className="text-gray-300" />
                    Staking Tiers
                </h3>
                <div className="space-y-3">
                    {[
                        { amount: '50+', tier: 'Common', multiplier: '100%', color: 'text-gray-500' },
                        { amount: '100+', tier: 'Rare', multiplier: '150%', color: 'text-green-400' },
                        { amount: '500+', tier: 'Epic', multiplier: '200%', color: 'text-gray-400' },
                        { amount: '1000+', tier: 'Legendary', multiplier: '300%', color: 'text-gray-300' },
                    ].map((tier) => (
                        <div key={tier.tier} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Star size={16} className={tier.color} />
                                <div>
                                    <h4 className={`font-medium text-sm ${tier.color}`}>{tier.tier}</h4>
                                    <p className="text-xs text-slate-400">{tier.amount} tokens</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">{tier.multiplier}</p>
                                <p className="text-xs text-slate-400">Growth Rate</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rewards Info */}
            <div className="card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <PawPrint size={16} className="text-green-400" />
                    Legendary Pet Rewards
                </h3>
                <div className="space-y-2 text-sm text-slate-300">
                    <p>• Special traits based on staking tier</p>
                    <p>• Enhanced evolution capabilities</p>
                    <p>• Unique visual characteristics</p>
                    <p>• Increased trading value</p>
                    <p>• Exclusive battle advantages</p>
                </div>
            </div>

            {/* Important Notes */}
            <div className="card border-gray-500/20 bg-gray-900/10">
                <h3 className="font-bold mb-3 text-gray-300 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Important
                </h3>
                <div className="space-y-2 text-sm text-slate-300">
                    <p>• Minimum staking period: 1 week</p>
                    <p>• Tokens are locked during staking period</p>
                    <p>• Harvest cooldown: 1 week between harvests</p>
                    <p>• Higher tiers guarantee better pet traits</p>
                </div>
            </div>
        </div>
    );
}
