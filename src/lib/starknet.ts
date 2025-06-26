import { Contract, RpcProvider, Account, CallData, constants } from 'starknet';

// Contract ABI - matching the Cairo contract interface
export const WALKSCAPE_ABI = [
    {
        "name": "WalkScapeCoreImpl",
        "type": "impl",
        "interface_name": "walkscape::IWalkScapeCore"
    },
    {
        "name": "core::integer::u256",
        "type": "struct",
        "members": [
            {
                "name": "low",
                "type": "core::integer::u128"
            },
            {
                "name": "high",
                "type": "core::integer::u128"
            }
        ]
    },
    {
        "name": "walkscape::PlayerStats",
        "type": "struct",
        "members": [
            {
                "name": "walks_xp",
                "type": "core::integer::u256"
            },
            {
                "name": "health_score",
                "type": "core::integer::u256"
            },
            {
                "name": "last_checkin",
                "type": "core::integer::u64"
            },
            {
                "name": "total_artifacts",
                "type": "core::integer::u256"
            },
            {
                "name": "current_colony",
                "type": "core::integer::u256"
            },
            {
                "name": "pets_owned",
                "type": "core::integer::u256"
            },
            {
                "name": "grass_touch_streak",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "name": "walkscape::PetStats",
        "type": "struct",
        "members": [
            {
                "name": "owner",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "pet_type",
                "type": "core::integer::u8"
            },
            {
                "name": "level",
                "type": "core::integer::u256"
            },
            {
                "name": "happiness",
                "type": "core::integer::u256"
            },
            {
                "name": "evolution_stage",
                "type": "core::integer::u8"
            },
            {
                "name": "last_fed",
                "type": "core::integer::u64"
            },
            {
                "name": "special_traits",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "name": "walkscape::ColonyStats",
        "type": "struct",
        "members": [
            {
                "name": "name",
                "type": "core::felt252"
            },
            {
                "name": "creator",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "name": "member_count",
                "type": "core::integer::u256"
            },
            {
                "name": "total_xp",
                "type": "core::integer::u256"
            },
            {
                "name": "created_at",
                "type": "core::integer::u64"
            },
            {
                "name": "weekly_challenge_score",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "name": "walkscape::StakeInfo",
        "type": "struct",
        "members": [
            {
                "name": "amount_staked",
                "type": "core::integer::u256"
            },
            {
                "name": "stake_timestamp",
                "type": "core::integer::u64"
            },
            {
                "name": "growth_multiplier",
                "type": "core::integer::u256"
            },
            {
                "name": "last_harvest",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "name": "walkscape::IWalkScapeCore",
        "type": "interface",
        "items": [
            {
                "name": "register_player",
                "type": "function",
                "inputs": [],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get_player_stats",
                "type": "function",
                "inputs": [
                    {
                        "name": "player",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "walkscape::PlayerStats"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "update_walk_xp",
                "type": "function",
                "inputs": [
                    {
                        "name": "player",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "xp_gained",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "update_health_score",
                "type": "function",
                "inputs": [
                    {
                        "name": "player",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "health_score",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "touch_grass_checkin",
                "type": "function",
                "inputs": [
                    {
                        "name": "location_hash",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "claim_artifact",
                "type": "function",
                "inputs": [
                    {
                        "name": "location_hash",
                        "type": "core::felt252"
                    },
                    {
                        "name": "artifact_type",
                        "type": "core::integer::u8"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get_artifact_owner",
                "type": "function",
                "inputs": [
                    {
                        "name": "artifact_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "get_player_artifacts",
                "type": "function",
                "inputs": [
                    {
                        "name": "player",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::array::Array::<core::integer::u256>"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "transfer_artifact",
                "type": "function",
                "inputs": [
                    {
                        "name": "to",
                        "type": "core::starknet::contract_address::ContractAddress"
                    },
                    {
                        "name": "artifact_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "mint_pet",
                "type": "function",
                "inputs": [
                    {
                        "name": "pet_type",
                        "type": "core::integer::u8"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "name": "feed_pet",
                "type": "function",
                "inputs": [
                    {
                        "name": "pet_id",
                        "type": "core::integer::u256"
                    },
                    {
                        "name": "nutrition_score",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "evolve_pet",
                "type": "function",
                "inputs": [
                    {
                        "name": "pet_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get_pet_stats",
                "type": "function",
                "inputs": [
                    {
                        "name": "pet_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "walkscape::PetStats"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "get_player_pets",
                "type": "function",
                "inputs": [
                    {
                        "name": "player",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::array::Array::<core::integer::u256>"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "create_colony",
                "type": "function",
                "inputs": [
                    {
                        "name": "name",
                        "type": "core::felt252"
                    }
                ],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "name": "join_colony",
                "type": "function",
                "inputs": [
                    {
                        "name": "colony_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "leave_colony",
                "type": "function",
                "inputs": [],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "get_colony_stats",
                "type": "function",
                "inputs": [
                    {
                        "name": "colony_id",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [
                    {
                        "type": "walkscape::ColonyStats"
                    }
                ],
                "state_mutability": "view"
            },
            {
                "name": "stake_for_growth",
                "type": "function",
                "inputs": [
                    {
                        "name": "amount",
                        "type": "core::integer::u256"
                    }
                ],
                "outputs": [],
                "state_mutability": "external"
            },
            {
                "name": "harvest_growth_reward",
                "type": "function",
                "inputs": [],
                "outputs": [
                    {
                        "type": "core::integer::u256"
                    }
                ],
                "state_mutability": "external"
            },
            {
                "name": "get_stake_info",
                "type": "function",
                "inputs": [
                    {
                        "name": "player",
                        "type": "core::starknet::contract_address::ContractAddress"
                    }
                ],
                "outputs": [
                    {
                        "type": "walkscape::StakeInfo"
                    }
                ],
                "state_mutability": "view"
            }
        ]
    },
    {
        "name": "constructor",
        "type": "constructor",
        "inputs": [
            {
                "name": "admin",
                "type": "core::starknet::contract_address::ContractAddress"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::PlayerRegistered",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "player",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "timestamp",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::ArtifactClaimed",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "player",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "artifact_id",
                "type": "core::integer::u256"
            },
            {
                "kind": "data",
                "name": "location_hash",
                "type": "core::felt252"
            },
            {
                "kind": "data",
                "name": "artifact_type",
                "type": "core::integer::u8"
            },
            {
                "kind": "data",
                "name": "rarity",
                "type": "core::integer::u8"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::PetMinted",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "owner",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "pet_id",
                "type": "core::integer::u256"
            },
            {
                "kind": "data",
                "name": "pet_type",
                "type": "core::integer::u8"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::PetEvolved",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "pet_id",
                "type": "core::integer::u256"
            },
            {
                "kind": "data",
                "name": "new_evolution_stage",
                "type": "core::integer::u8"
            },
            {
                "kind": "data",
                "name": "special_traits_unlocked",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::ColonyCreated",
        "type": "event",
        "members": [
            {
                "kind": "data",
                "name": "colony_id",
                "type": "core::integer::u256"
            },
            {
                "kind": "key",
                "name": "creator",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "name",
                "type": "core::felt252"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::PlayerJoinedColony",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "player",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "colony_id",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::GrassTouched",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "player",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "location_hash",
                "type": "core::felt252"
            },
            {
                "kind": "data",
                "name": "streak",
                "type": "core::integer::u256"
            },
            {
                "kind": "data",
                "name": "xp_gained",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::StakeUpdated",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "player",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "amount",
                "type": "core::integer::u256"
            },
            {
                "kind": "data",
                "name": "new_total",
                "type": "core::integer::u256"
            }
        ]
    },
    {
        "kind": "struct",
        "name": "walkscape::WalkScapeCore::RewardHarvested",
        "type": "event",
        "members": [
            {
                "kind": "key",
                "name": "player",
                "type": "core::starknet::contract_address::ContractAddress"
            },
            {
                "kind": "data",
                "name": "reward_id",
                "type": "core::integer::u256"
            },
            {
                "kind": "data",
                "name": "stake_duration",
                "type": "core::integer::u64"
            }
        ]
    },
    {
        "kind": "enum",
        "name": "walkscape::WalkScapeCore::Event",
        "type": "event",
        "variants": [
            {
                "kind": "nested",
                "name": "PlayerRegistered",
                "type": "walkscape::WalkScapeCore::PlayerRegistered"
            },
            {
                "kind": "nested",
                "name": "ArtifactClaimed",
                "type": "walkscape::WalkScapeCore::ArtifactClaimed"
            },
            {
                "kind": "nested",
                "name": "PetMinted",
                "type": "walkscape::WalkScapeCore::PetMinted"
            },
            {
                "kind": "nested",
                "name": "PetEvolved",
                "type": "walkscape::WalkScapeCore::PetEvolved"
            },
            {
                "kind": "nested",
                "name": "ColonyCreated",
                "type": "walkscape::WalkScapeCore::ColonyCreated"
            },
            {
                "kind": "nested",
                "name": "PlayerJoinedColony",
                "type": "walkscape::WalkScapeCore::PlayerJoinedColony"
            },
            {
                "kind": "nested",
                "name": "GrassTouched",
                "type": "walkscape::WalkScapeCore::GrassTouched"
            },
            {
                "kind": "nested",
                "name": "StakeUpdated",
                "type": "walkscape::WalkScapeCore::StakeUpdated"
            },
            {
                "kind": "nested",
                "name": "RewardHarvested",
                "type": "walkscape::WalkScapeCore::RewardHarvested"
            }
        ]
    }
];

// Types matching the Cairo contract
export interface PlayerStats {
    walks_xp: bigint;
    health_score: bigint;
    last_checkin: bigint;
    total_artifacts: bigint;
    current_colony: bigint;
    pets_owned: bigint;
    grass_touch_streak: bigint;
}

export interface PetStats {
    owner: string;
    pet_type: number;
    level: bigint;
    happiness: bigint;
    evolution_stage: number;
    last_fed: bigint;
    special_traits: bigint;
}

export interface ColonyStats {
    name: string;
    creator: string;
    member_count: bigint;
    total_xp: bigint;
    created_at: bigint;
    weekly_challenge_score: bigint;
}

export interface StakeInfo {
    amount_staked: bigint;
    stake_timestamp: bigint;
    growth_multiplier: bigint;
    last_harvest: bigint;
}

// Contract configuration
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x006a65f237b636fe5e2fc8c4f470309582312a24bd3cbd5be288aa32ed8b4f9a';
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/kwgGr9GGk4YyLXuGfEvpITv1jpvn3PgP';

export const provider = new RpcProvider({
    nodeUrl: RPC_URL,
    chainId: constants.StarknetChainId.SN_SEPOLIA
});

export function getContract(account?: Account) {
    return new Contract(WALKSCAPE_ABI, CONTRACT_ADDRESS, account || provider);
}

// Utility functions
export function stringToFelt252(str: string): string {
    const encoded = Buffer.from(str).toString('hex');
    return '0x' + encoded;
}

export function felt252ToString(felt: string | bigint): string {
    let hex: string;

    if (typeof felt === 'bigint') {
        // Convert BigInt to hex string
        hex = felt.toString(16);
    } else if (typeof felt === 'string') {
        // Handle string input
        hex = felt.startsWith('0x') ? felt.slice(2) : felt;
    } else {
        console.warn('felt252ToString received unexpected type:', typeof felt, felt);
        return 'Invalid felt252';
    }

    try {
        // Ensure hex has even length for proper byte conversion
        if (hex.length % 2 !== 0) {
            hex = '0' + hex;
        }

        // Convert hex to buffer and then to string
        const buffer = Buffer.from(hex, 'hex');
        const result = buffer.toString('utf8');

        // Filter out null bytes and non-printable characters
        return result.replace(/\0+/g, '').replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    } catch (error) {
        console.warn('Error converting felt252 to string:', error, 'hex:', hex);
        return 'Conversion error';
    }
}

// Artifact types
export enum ArtifactType {
    MUSHROOM = 0,
    FOSSIL = 1,
    GRAFFITI = 2,
    PIXEL_PLANT = 3
}

// Pet types  
export enum PetType {
    PLANT = 0,
    CREATURE = 1,
    DIGITAL_COMPANION = 2
}

// Location hash generator
export function generateLocationHash(lat: number, lng: number, artifactId?: string): string {
    // Create a more compact representation that fits in felt252 (252 bits = ~31 bytes)
    // Round to 4 decimal places to reduce precision while maintaining uniqueness
    const latRounded = Math.round(lat * 10000) / 10000;
    const lngRounded = Math.round(lng * 10000) / 10000;

    // Create a shorter string representation
    const locationString = `${latRounded}_${lngRounded}${artifactId ? '_' + artifactId.substring(0, 10) : ''}`;

    // Convert to a hash that fits in felt252
    const encoder = new TextEncoder();
    const data = encoder.encode(locationString);

    // Create a simple hash by combining bytes (keeping it under 31 bytes)
    let hash = BigInt(0);
    for (let i = 0; i < Math.min(data.length, 30); i++) {
        hash = (hash * BigInt(256) + BigInt(data[i])) % (BigInt(2) ** BigInt(252));
    }

    return '0x' + hash.toString(16);
}
