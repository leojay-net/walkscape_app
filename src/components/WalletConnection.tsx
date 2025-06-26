'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract } from '@/lib/starknet';
import {
    Wallet,
    User,
    Loader2,
    CheckCircle,
    AlertCircle,
    UserPlus,
    Flower2
} from 'lucide-react';

interface WalletConnectionProps {
    showRegistration?: boolean;
}

export default function WalletConnection({ showRegistration = false }: WalletConnectionProps) {
    const { connect, account, isConnected, checkRegistration, address } = useWallet();
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleRegisterPlayer = async () => {
        if (!account || !address) {
            console.error('No account or address available');
            setRegistrationResult({
                success: false,
                message: 'Wallet not properly connected. Please reconnect.'
            });
            return;
        }

        setIsRegistering(true);
        setRegistrationResult(null);

        try {
            console.log('Starting registration with account:', account.address);
            console.log('Account object:', account);
            console.log('Address from context:', address);

            // Verify account has valid address
            if (!account.address || account.address === '0x0') {
                throw new Error('Invalid account address: ' + account.address);
            }

            const contract = getContract(account);
            console.log('Contract address:', contract.address);
            console.log('Contract provider:', contract.providerOrAccount);

            // Call the register_player function with explicit calldata (empty array for no parameters)
            const result = await account.execute([{
                contractAddress: contract.address,
                entrypoint: 'register_player',
                calldata: []
            }]);

            console.log('Registration transaction:', result);

            setRegistrationResult({
                success: true,
                message: 'Welcome to WalkScape! Your adventure begins now.'
            });

            // Check registration status after a delay
            setTimeout(() => {
                checkRegistration();
                setIsRegistering(false);
            }, 3000);

        } catch (error: any) {
            console.error('Registration error:', error);
            let errorMessage = 'Failed to register. Please try again.';

            if (error.message?.includes('Contract not found')) {
                errorMessage = 'Contract not found. Please check your network connection.';
            } else if (error.message?.includes('Player already registered')) {
                errorMessage = 'You are already registered! Please refresh the page.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setRegistrationResult({
                success: false,
                message: errorMessage
            });
            setIsRegistering(false);
        }
    };

    if (showRegistration && isConnected) {
        return (
            <div className="max-w-md mx-auto">
                <div className="card-forest text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-white" />
                    </div>

                    <h2 className="text-xl font-bold mb-2">Join WalkScape</h2>
                    <p className="text-slate-300 text-sm mb-2">
                        Complete your registration to start exploring and collecting!
                    </p>
                    <p className="text-xs text-slate-400 mb-6">
                        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>

                    <button
                        onClick={handleRegisterPlayer}
                        disabled={isRegistering}
                        className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
                    >
                        {isRegistering ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Registering...
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} />
                                Register Player
                            </>
                        )}
                    </button>

                    {registrationResult && (
                        <div className={`p-3 rounded-lg border ${registrationResult.success ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {registrationResult.success ? (
                                    <CheckCircle size={16} className="text-green-400" />
                                ) : (
                                    <AlertCircle size={16} className="text-red-400" />
                                )}
                                <span className={`font-medium ${registrationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {registrationResult.success ? 'Success!' : 'Error'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-300">
                                {registrationResult.message}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 text-xs text-slate-400">
                        <p>• Registration is a one-time blockchain transaction</p>
                        <p>• This will initialize your player stats and biome</p>
                        <p>• Small gas fee required for transaction</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="card-forest text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <Wallet size={32} className="text-white" />
                </div>

                <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-slate-300 text-sm mb-6">
                    Connect your Starknet wallet to start your exploration journey
                </p>

                <button
                    onClick={connect}
                    className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
                >
                    <Wallet size={16} />
                    Connect Wallet
                </button>

                <div className="space-y-3 text-xs text-slate-400">
                    <p className="font-medium">Supported Wallets:</p>
                    <div className="flex justify-center space-x-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">A</span>
                            </div>
                            <span>ArgentX</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">B</span>
                            </div>
                            <span>Braavos</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-3 bg-slate-800/50 rounded-lg">
                    <h3 className="font-medium mb-2 text-green-400 flex items-center gap-2">
                        <Flower2 size={16} />
                        What is WalkScape?
                    </h3>
                    <div className="space-y-1 text-xs text-slate-300">
                        <p>• Explore real-world locations and claim artifacts</p>
                        <p>• Touch grass daily to build XP streaks</p>
                        <p>• Grow and care for digital pets in your biome</p>
                        <p>• Join colonies with other explorers</p>
                        <p>• Stake tokens to grow legendary companions</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
