import { Contract, RpcProvider, Account, CallData, constants } from 'starknet';

// Contract ABI - matching the Cairo contract interface
export const WALKSCAPE_ABI = [
    {
        type: 'interface',
        name: 'IWalkScapeCore',
        items: [
            {
                type: 'function',
                name: 'register_player',
                inputs: [],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'get_player_stats',
                inputs: [{ name: 'player', type: 'core::starknet::contract_address::ContractAddress' }],
                outputs: [{ type: 'walkscape::PlayerStats' }],
                state_mutability: 'view'
            },
            {
                type: 'function',
                name: 'update_walk_xp',
                inputs: [
                    { name: 'player', type: 'core::starknet::contract_address::ContractAddress' },
                    { name: 'xp_gained', type: 'core::integer::u256' }
                ],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'touch_grass_checkin',
                inputs: [{ name: 'location_hash', type: 'core::felt252' }],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'claim_artifact',
                inputs: [
                    { name: 'location_hash', type: 'core::felt252' },
                    { name: 'artifact_type', type: 'core::integer::u8' }
                ],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'get_player_artifacts',
                inputs: [{ name: 'player', type: 'core::starknet::contract_address::ContractAddress' }],
                outputs: [{ type: 'core::array::Array<core::integer::u256>' }],
                state_mutability: 'view'
            },
            {
                type: 'function',
                name: 'mint_pet',
                inputs: [{ name: 'pet_type', type: 'core::integer::u8' }],
                outputs: [{ type: 'core::integer::u256' }],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'feed_pet',
                inputs: [
                    { name: 'pet_id', type: 'core::integer::u256' },
                    { name: 'nutrition_score', type: 'core::integer::u256' }
                ],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'get_pet_stats',
                inputs: [{ name: 'pet_id', type: 'core::integer::u256' }],
                outputs: [{ type: 'walkscape::PetStats' }],
                state_mutability: 'view'
            },
            {
                type: 'function',
                name: 'create_colony',
                inputs: [{ name: 'name', type: 'core::felt252' }],
                outputs: [{ type: 'core::integer::u256' }],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'join_colony',
                inputs: [{ name: 'colony_id', type: 'core::integer::u256' }],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'get_colony_stats',
                inputs: [{ name: 'colony_id', type: 'core::integer::u256' }],
                outputs: [{ type: 'walkscape::ColonyStats' }],
                state_mutability: 'view'
            },
            {
                type: 'function',
                name: 'stake_for_growth',
                inputs: [{ name: 'amount', type: 'core::integer::u256' }],
                outputs: [],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'harvest_growth_reward',
                inputs: [],
                outputs: [{ type: 'core::integer::u256' }],
                state_mutability: 'external'
            },
            {
                type: 'function',
                name: 'get_stake_info',
                inputs: [{ name: 'player', type: 'core::starknet::contract_address::ContractAddress' }],
                outputs: [{ type: 'walkscape::StakeInfo' }],
                state_mutability: 'view'
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
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x03c29b71472f27ce4d5540844bb5a9ed2725d11918795aa26d65ae8bd2a2acf2';
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

export function felt252ToString(felt: string): string {
    const hex = felt.startsWith('0x') ? felt.slice(2) : felt;
    return Buffer.from(hex, 'hex').toString();
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
    const locationString = `${lat.toFixed(6)}_${lng.toFixed(6)}${artifactId ? '_' + artifactId : ''}`;
    return stringToFelt252(locationString);
}
