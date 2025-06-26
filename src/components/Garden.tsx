'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract, PetType } from '@/lib/starknet';
import {
    Flower2,
    PawPrint,
    Trophy,
    Plus,
    Heart,
    Loader2,
    Star,
    Calendar
} from 'lucide-react';

interface Pet {
    id: string;
    owner: string;
    pet_type: number;
    level: bigint;
    happiness: bigint;
    evolution_stage: number;
    last_fed: bigint;
    special_traits: bigint;
}

export default function Garden() {
    const { account, playerStats, refreshPlayerStats, isRegistered } = useWallet();
    const [activeTab, setActiveTab] = useState<'pets' | 'artifacts'>('pets');
    const [pets, setPets] = useState<Pet[]>([]);
    const [artifacts, setArtifacts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMinting, setIsMinting] = useState(false);
    const [isFeeding, setIsFeeding] = useState<string | null>(null);

    if (!isRegistered) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Flower2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Please complete registration first</p>
                </div>
            </div>
        );
    }

    const loadGardenData = useCallback(async () => {
        if (!account?.address || !playerStats) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const contract = getContract();

            // Load artifacts
            const artifactIds = await contract.get_player_artifacts(account.address);
            setArtifacts(artifactIds);

            // Load pets (we'll need to implement this based on pet count)
            const petCount = Number(playerStats.pets_owned);
            const petData: Pet[] = [];

            // Note: In a real implementation, we'd need a way to get pet IDs
            // For now, we'll simulate based on the pet count
            for (let i = 0; i < petCount; i++) {
                try {
                    // This is a simplified approach - in reality you'd track pet IDs
                    const petStats = await contract.get_pet_stats(BigInt(i + 1));
                    if (petStats.owner === account.address) {
                        petData.push({
                            id: (i + 1).toString(),
                            ...petStats
                        });
                    }
                } catch (error) {
                    // Pet doesn't exist or not owned by user
                    continue;
                }
            }

            setPets(petData);
        } catch (error) {
            console.error('Failed to load garden data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [account?.address, playerStats?.pets_owned]);

    useEffect(() => {
        loadGardenData();
    }, [loadGardenData]);

    const handleMintPet = async (petType: PetType) => {
        if (!account) return;

        setIsMinting(true);
        try {
            const contract = getContract(account);
            await contract.mint_pet(petType);

            // Refresh data after minting
            setTimeout(() => {
                refreshPlayerStats();
                loadGardenData();
                setIsMinting(false);
            }, 3000);
        } catch (error) {
            console.error('Failed to mint pet:', error);
            setIsMinting(false);
        }
    };

    const handleFeedPet = async (petId: string) => {
        if (!account) return;

        setIsFeeding(petId);
        try {
            const contract = getContract(account);
            // Simulate good nutrition (80-100)
            const nutritionScore = Math.floor(Math.random() * 21) + 80;
            await contract.feed_pet(BigInt(petId), BigInt(nutritionScore));

            // Refresh data after feeding
            setTimeout(() => {
                loadGardenData();
                setIsFeeding(null);
            }, 2000);
        } catch (error) {
            console.error('Failed to feed pet:', error);
            setIsFeeding(null);
        }
    };

    const getPetTypeInfo = (petType: number) => {
        const types = [
            { name: 'Plant', emoji: '🌱', color: 'green' },
            { name: 'Creature', emoji: '🐾', color: 'blue' },
            { name: 'Digital Companion', emoji: '🤖', color: 'purple' }
        ];
        return types[petType] || types[0];
    };

    const getArtifactInfo = (artifactId: string) => {
        // Simulate artifact data based on ID
        const types = ['🍄 Mushroom', '🦴 Fossil', '🎨 Graffiti', '🌱 Pixel Plant'];
        const typeIndex = parseInt(artifactId) % 4;
        const rarity = Math.floor(Math.random() * 5) + 1;

        return {
            name: types[typeIndex],
            rarity,
            id: artifactId
        };
    };

    const getRarityClass = (rarity: number) => {
        const classes = ['rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary'];
        return classes[rarity - 1] || classes[0];
    };

    const canMintPet = () => {
        return playerStats && Number(playerStats.walks_xp) >= 100;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-slate-400 mt-2">Loading your garden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <Flower2 size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">My Garden</h2>
                <p className="text-slate-400 text-sm">
                    Your digital biome of pets and artifacts
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('pets')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'pets'
                        ? 'bg-green-600 text-white'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <PawPrint size={16} className="inline mr-2" />
                    Pets ({pets.length})
                </button>
                <button
                    onClick={() => setActiveTab('artifacts')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'artifacts'
                        ? 'bg-green-600 text-white'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <Trophy size={16} className="inline mr-2" />
                    Artifacts ({artifacts.length})
                </button>
            </div>

            {/* Pets Tab */}
            {activeTab === 'pets' && (
                <div className="space-y-4">
                    {/* Mint New Pet */}
                    <div className="card-forest">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                            <Plus size={16} />
                            Mint New Pet
                        </h3>
                        <p className="text-sm text-slate-300 mb-4">
                            Cost: 100 XP • Current XP: {playerStats ? Number(playerStats.walks_xp) : 0}
                        </p>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { type: PetType.PLANT, name: 'Plant', emoji: '🌱' },
                                { type: PetType.CREATURE, name: 'Creature', emoji: '🐾' },
                                { type: PetType.DIGITAL_COMPANION, name: 'Digital', emoji: '🤖' }
                            ].map((pet) => (
                                <button
                                    key={pet.type}
                                    onClick={() => handleMintPet(pet.type)}
                                    disabled={!canMintPet() || isMinting}
                                    className="pet-card p-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="text-2xl mb-1">{pet.emoji}</div>
                                    <div className="text-xs">{pet.name}</div>
                                </button>
                            ))}
                        </div>

                        {!canMintPet() && (
                            <p className="text-xs text-amber-400 text-center">
                                Need {100 - (playerStats ? Number(playerStats.walks_xp) : 0)} more XP to mint
                            </p>
                        )}
                    </div>

                    {/* Pet List */}
                    {pets.length > 0 ? (
                        <div className="space-y-3">
                            {pets.map((pet) => {
                                const petInfo = getPetTypeInfo(pet.pet_type);
                                const daysSinceLastFed = Math.floor(
                                    (Date.now() / 1000 - Number(pet.last_fed)) / 86400
                                );

                                return (
                                    <div key={pet.id} className="pet-card">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">{petInfo.emoji}</div>
                                                <div>
                                                    <h4 className="font-medium">{petInfo.name} #{pet.id}</h4>
                                                    <p className="text-xs text-slate-400">Level {Number(pet.level)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Heart size={12} className="text-red-400" />
                                                    <span className="text-sm">{Number(pet.happiness)}%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star size={12} className="text-yellow-400" />
                                                    <span className="text-xs">Stage {pet.evolution_stage}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-slate-400">
                                                <Calendar size={12} className="inline mr-1" />
                                                Fed {daysSinceLastFed}d ago
                                            </div>
                                            <button
                                                onClick={() => handleFeedPet(pet.id)}
                                                disabled={isFeeding === pet.id}
                                                className="btn-primary text-xs py-1 px-3"
                                            >
                                                {isFeeding === pet.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    'Feed'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card text-center text-slate-400">
                            <PawPrint size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No pets yet</p>
                            <p className="text-xs">Mint your first pet above!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Artifacts Tab */}
            {activeTab === 'artifacts' && (
                <div className="space-y-4">
                    {artifacts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {artifacts.map((artifactId) => {
                                const artifact = getArtifactInfo(artifactId);

                                return (
                                    <div key={artifactId} className="artifact-card artifact-mushroom p-4">
                                        <div className="text-center">
                                            <div className="text-2xl mb-2">{artifact.name.split(' ')[0]}</div>
                                            <h4 className="font-medium text-sm mb-1">{artifact.name}</h4>
                                            <div className="flex items-center justify-center gap-1">
                                                {[...Array(artifact.rarity)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={getRarityClass(artifact.rarity)}
                                                        fill="currentColor"
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">#{artifactId}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card text-center text-slate-400">
                            <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No artifacts yet</p>
                            <p className="text-xs">Scan locations to find artifacts!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
