
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract } from '@/lib/starknet';
import {
    X,
    User,
    Loader2,
    CheckCircle,
    AlertCircle,
    UserPlus,
    Shield,
    Coins,
    Activity
} from 'lucide-react';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
    const { account, address, checkRegistration, isRegistered } = useWallet();
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string } | null>(null);

    // If user is already registered, close the modal
    useEffect(() => {
        if (isRegistered) {
            console.log('User is already registered, closing modal');
            onClose();
        }
    }, [isRegistered, onClose]);

    const handleRegisterPlayer = async () => {
        if (!account || !address) {
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

            // Verify account has valid address
            if (!account.address || account.address === '0x0') {
                throw new Error('Invalid account address: ' + account.address);
            }

            const contract = getContract(account);

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
                onClose();
            }, 3000);

        } catch (error: any) {
            console.error('Registration error:', error);
            let errorMessage = 'Failed to register. Please try again.';

            if (error.message?.includes('Contract not found')) {
                errorMessage = 'Contract not found. Please check your network connection.';
            } else if (error.message?.includes('Player already registered')) {
                errorMessage = 'You are already registered! Please refresh the page.';
                setTimeout(() => {
                    checkRegistration();
                    onClose();
                }, 2000);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4">
                <div className="card-forest">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Join WalkScape</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={32} className="text-white" />
                        </div>

                        <p className="text-slate-300 text-sm mb-2">
                            Complete your registration to start exploring and collecting!
                        </p>
                        <p className="text-xs text-slate-400 mb-6">
                            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-1 gap-3 mb-6 text-left">
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <Activity className="text-green-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-white">Track Your Journey</p>
                                    <p className="text-xs text-slate-400">Build XP streaks and health scores</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <Shield className="text-blue-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-white">Collect Artifacts</p>
                                    <p className="text-xs text-slate-400">Discover rare items at real locations</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <Coins className="text-yellow-400 flex-shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-medium text-white">Grow & Stake</p>
                                    <p className="text-xs text-slate-400">Nurture pets and earn rewards</p>
                                </div>
                            </div>
                        </div>

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

                        <div className="mt-6 text-xs text-slate-400 space-y-1">
                            <p>• Registration is a one-time blockchain transaction</p>
                            <p>• This will initialize your player stats and biome</p>
                            <p>• Small gas fee required for transaction</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
