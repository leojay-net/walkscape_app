'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { constants, RpcProvider, AccountInterface } from 'starknet';
import { getContract, PlayerStats } from '@/lib/starknet';

// Avoid SSR issues
type SessionAccountInterface = any;
type StarknetWindowObject = any;
type ConnectedStarknetWindowObject = any;

// Import browser-only modules
let getStarknet: any = null;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x03c29b71472f27ce4d5540844bb5a9ed2725d11918795aa26d65ae8bd2a2acf2";

interface WalletContextType {
    isLoading: boolean;
    account: SessionAccountInterface | null;
    address: string | null;
    isConnected: boolean;
    isRegistered: boolean;
    playerStats: PlayerStats | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    checkRegistration: () => Promise<void>;
    refreshPlayerStats: () => Promise<void>;
    retryRegistrationCheck: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<SessionAccountInterface | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isClient, setIsClient] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [initializationTimeout, setInitializationTimeout] = useState<NodeJS.Timeout | null>(null);

    // Add retry mechanism for registration checks
    const [registrationRetryCount, setRegistrationRetryCount] = useState(0);
    const maxRegistrationRetries = 3;

    // Initialize client-side only modules
    useEffect(() => {
        setIsClient(true);

        const initStarknet = async () => {
            try {
                setIsLoading(true);
                // Check if starknet is available in the browser window
                if (typeof window !== 'undefined' && (window as any).starknet) {
                    getStarknet = (window as any).starknet;
                    console.log('Starknet wallet detected:', getStarknet);
                    // Try to auto-connect if already connected
                    await tryConnect();
                } else {
                    console.log('No Starknet wallet detected. User needs to install ArgentX or Braavos.');
                }
            } catch (error) {
                console.error("Failed to initialize Starknet:", error);
            } finally {
                setIsInitialized(true);
                setIsLoading(false);
            }
        };

        // Set a timeout to ensure loading doesn't get stuck
        const timeout = setTimeout(() => {
            console.warn('Wallet initialization timeout - forcing loading to false');
            setIsInitialized(true);
            setIsLoading(false);
        }, 10000); // 10 second timeout

        setInitializationTimeout(timeout);
        initStarknet();

        // Cleanup timeout on component unmount
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (initializationTimeout) {
                clearTimeout(initializationTimeout);
            }
        };
    }, []);

    // Initialize provider in client environment
    const provider = isClient
        ? new RpcProvider({
            nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/kwgGr9GGk4YyLXuGfEvpITv1jpvn3PgP",
            chainId: constants.StarknetChainId.SN_SEPOLIA,
        })
        : null;

    const tryConnect = async () => {
        if (!getStarknet || !isInitialized) return;

        try {
            // Check if wallet is already connected
            if (getStarknet.isConnected) {
                const account = getStarknet.account;
                if (account && account.address) {
                    console.log('Auto-connecting to:', account.address);
                    setAccount(account);
                    setAddress(account.address);
                    setIsConnected(true);
                    await checkPlayerRegistration(account.address);
                }
            }
        } catch (error) {
            console.error('Auto-connect failed:', error);
        }
    };

    const connectWallet = async () => {
        if (!getStarknet || !provider) {
            alert("Please install ArgentX or Braavos wallet extension first!");
            return;
        }

        setIsLoading(true);
        try {
            // Request connection to the wallet
            const result = await getStarknet.enable({ starknetVersion: "v5" });

            if (result && result.length > 0) {
                const account = getStarknet.account;

                // Ensure the account is properly configured with the provider
                if (account && account.address) {
                    console.log('Wallet connected:', {
                        address: account.address,
                        chainId: await account.getChainId?.() || 'unknown'
                    });

                    setAccount(account);
                    setAddress(account.address);
                    setIsConnected(true);
                    await checkPlayerRegistration(account.address);
                } else {
                    throw new Error('No account found after wallet connection');
                }
            } else {
                throw new Error('Wallet connection was rejected or failed');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet. Please make sure you have ArgentX or Braavos installed and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = async () => {
        if (!getStarknet) return;

        try {
            // Clear the connection
            setAccount(null);
            setAddress(null);
            setIsConnected(false);
            setIsRegistered(false);
            setPlayerStats(null);
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    const checkPlayerRegistration = async (playerAddress: string) => {
        console.log('Checking registration for address:', playerAddress);
        try {
            // Use provider for read-only call
            const contract = getContract(); // This uses provider for read calls
            const stats = await contract.get_player_stats(playerAddress);
            console.log('Player stats retrieved:', stats);

            // If we get any response (including 0n), player is registered
            // The contract only returns data for registered players
            if (stats !== null && stats !== undefined) {
                setPlayerStats(stats as PlayerStats);
                setIsRegistered(true);
                console.log('Player is registered with stats:', stats);
            } else {
                // If we get null/undefined, player is not registered
                console.log('Player not registered - no stats returned');
                setIsRegistered(false);
                setPlayerStats(null);
            }
        } catch (error: any) {
            console.error('Error checking player registration:', error);

            // Check if this is a network/RPC error vs a "player not found" error
            const errorMessage = error?.message?.toLowerCase() || '';
            const isNetworkError =
                errorMessage.includes('network') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('rpc') ||
                errorMessage.includes('fetch') ||
                error?.code === 'NETWORK_ERROR' ||
                error?.name === 'NetworkError';

            if (isNetworkError) {
                console.log('Network error detected - maintaining previous registration state');
                // Don't change registration status on network errors
                // Keep the user logged in if they were previously registered
                if (!isRegistered && !playerStats) {
                    // Only set to false if we have no previous successful state
                    console.log('No previous registration state - setting to false due to network error');
                    setIsRegistered(false);
                    setPlayerStats(null);
                }
            } else {
                // This is likely a "player not found" error from the contract
                console.log('Player not registered - contract returned player not found error');
                setIsRegistered(false);
                setPlayerStats(null);
            }
        }
    };

    const retryRegistrationCheck = async () => {
        if (!address || registrationRetryCount >= maxRegistrationRetries) return;

        setRegistrationRetryCount(prev => prev + 1);
        console.log(`Retrying registration check (attempt ${registrationRetryCount + 1}/${maxRegistrationRetries})`);

        // Add a small delay before retry
        setTimeout(async () => {
            await checkPlayerRegistration(address);
        }, 1000 * registrationRetryCount); // Exponential backoff
    };

    // Reset retry count when registration succeeds
    useEffect(() => {
        if (isRegistered) {
            setRegistrationRetryCount(0);
        }
    }, [isRegistered]);

    const checkRegistration = async () => {
        if (address) {
            await checkPlayerRegistration(address);
        }
    };

    const refreshPlayerStats = async () => {
        if (address) {
            console.log('Refreshing player stats for:', address);
            try {
                const contract = getContract(); // Use provider for read calls
                const stats = await contract.get_player_stats(address);
                console.log('Refreshed stats:', stats);
                setPlayerStats(stats as PlayerStats);
            } catch (error) {
                console.error('Failed to refresh player stats:', error);
                // Don't reset registration status on error
            }
        }
    };

    return (
        <WalletContext.Provider
            value={{
                isLoading,
                account,
                address,
                isConnected,
                isRegistered,
                playerStats,
                connect: connectWallet,
                disconnect: disconnectWallet,
                checkRegistration,
                refreshPlayerStats,
                retryRegistrationCheck,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}