'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getContract, generateLocationHash, ArtifactType } from '@/lib/starknet';
import Webcam from 'react-webcam';
import {
    QrCode,
    MapPin,
    Camera,
    Loader2,
    CheckCircle,
    AlertCircle,
    Zap,
    Gem,
    Palette,
    Bone,
    Sprout,
    CameraOff,
    RefreshCw,
    Image as ImageIcon,
    Video,
    Download
} from 'lucide-react';

// Types for dynamic imports
type UseReactMediaRecorderReturn = {
    status: 'idle' | 'acquiring_media' | 'recording' | 'paused' | 'stopped' | 'error';
    startRecording: () => void;
    stopRecording: () => void;
    mediaBlobUrl?: string;
    clearBlobUrl: () => void;
};

type ImageCompressionFunction = (file: File, options: any) => Promise<File>;

export default function ArtifactScanner() {
    const { account, refreshPlayerStats, isRegistered, isLoading, retryRegistrationCheck } = useWallet();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [selectedArtifactType, setSelectedArtifactType] = useState<ArtifactType>(ArtifactType.MUSHROOM);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const webcamRef = useRef<any>(null);

    // Dynamic imports for browser-specific functionality
    const [imageCompression, setImageCompression] = useState<ImageCompressionFunction | null>(null);
    const [browserAPIsLoaded, setBrowserAPIsLoaded] = useState(false);
    const [mediaRecorderEnabled, setMediaRecorderEnabled] = useState(false);

    // Media recorder state - we'll manage this manually to avoid hook rule violations
    const [mediaRecorderState, setMediaRecorderState] = useState<UseReactMediaRecorderReturn>({
        status: 'idle',
        startRecording: () => { },
        stopRecording: () => { },
        clearBlobUrl: () => { }
    });

    // Enhanced location request with comprehensive error handling and fallback strategies
    const requestLocation = useCallback(async () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            setIsLoadingLocation(false);
            return;
        }

        // Define options for different accuracy levels
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 30000
        };

        // Success handler
        const onSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            setLocation({
                lat: latitude,
                lng: longitude
            });
            setLocationError(null);
            setIsLoadingLocation(false);
            console.log(`Location obtained: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        };

        // Enhanced error handler
        const onError = (error: GeolocationPositionError) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Unable to get your location';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services in your device settings and refresh the page.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. This can happen indoors or in areas with poor GPS signal. Try moving to an open area or enabling Wi-Fi location services.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
                default:
                    errorMessage = 'Failed to get location. Please check your device settings and try again.';
            }

            setLocationError(errorMessage);
            setIsLoadingLocation(false);
        };

        // Try high accuracy first
        try {
            navigator.geolocation.getCurrentPosition(onSuccess, onError, highAccuracyOptions);
        } catch (syncError) {
            console.error('Synchronous geolocation error:', syncError);
            setLocationError('Failed to initialize location services. Please check your browser settings.');
            setIsLoadingLocation(false);
        }
    }, []);

    // Enhanced camera capture using webcam
    const capturePhoto = useCallback(async () => {
        setIsCapturing(true);

        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setCapturedImage(imageSrc);
                console.log('Photo captured successfully');
            }
        }

        setIsCapturing(false);
    }, []);

    // Enhanced camera error handling
    const handleCameraError = useCallback((error: string | DOMException) => {
        console.error('Camera error:', error);
        let errorMessage = 'Failed to access camera';

        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error instanceof DOMException) {
            switch (error.name) {
                case 'NotAllowedError':
                    errorMessage = 'Camera access denied. Please allow camera permissions and refresh the page.';
                    break;
                case 'NotFoundError':
                    errorMessage = 'No camera found. Please connect a camera device.';
                    break;
                case 'NotSupportedError':
                    errorMessage = 'Camera not supported by this browser.';
                    break;
                case 'NotReadableError':
                    errorMessage = 'Camera is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    errorMessage = 'Camera constraints cannot be satisfied.';
                    break;
                default:
                    errorMessage = `Camera error: ${error.message}`;
            }
        }

        setCameraError(errorMessage);
        setIsCameraActive(false);
    }, []);

    // Get user location on component mount
    useEffect(() => {
        if (isRegistered) {
            requestLocation();
        }
    }, [isRegistered, requestLocation]);

    if (!isRegistered) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md mx-auto p-6">
                    <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">Registration Required</h3>
                    <p className="text-slate-400">Please complete registration to access scanning features.</p>
                </div>
            </div>
        );
    }

    const handleTouchGrass = async () => {
        if (!account || !location) return;

        setIsScanning(true);
        setScanResult(null);

        try {
            // If camera is active, simulate scanning process
            if (isCameraActive) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const contract = getContract(account);
            const locationHash = generateLocationHash(location.lat, location.lng, 'grass_touch');

            await contract.touch_grass_checkin(locationHash);

            setScanResult({
                success: true,
                message: 'Grass touched! +15 XP earned'
            });

            setTimeout(() => {
                refreshPlayerStats();
            }, 2000);

        } catch (error: any) {
            setScanResult({
                success: false,
                message: error.message || 'Failed to touch grass. Try again!'
            });
        } finally {
            setIsScanning(false);
        }
    };

    const handleClaimArtifact = async () => {
        if (!account || !location) return;

        setIsScanning(true);
        setScanResult(null);

        try {
            // If camera is active, simulate scanning process
            if (isCameraActive) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            const contract = getContract(account);
            const locationHash = generateLocationHash(
                location.lat,
                location.lng,
                `artifact_${selectedArtifactType}_${Date.now()}`
            );

            await contract.claim_artifact(locationHash, selectedArtifactType);

            const artifactNames = ['Mushroom', 'Fossil', 'Graffiti', 'Pixel Plant'];
            setScanResult({
                success: true,
                message: `${artifactNames[selectedArtifactType]} claimed! Check your garden.`
            });

            setTimeout(() => {
                refreshPlayerStats();
            }, 2000);
        } catch (error: any) {
            setScanResult({
                success: false,
                message: error.message || 'Failed to claim artifact. Location may already be claimed!'
            });
        } finally {
            setIsScanning(false);
        }
    };

    const artifactTypes = [
        { type: ArtifactType.MUSHROOM, name: 'Mushroom', color: 'green', icon: Sprout },
        { type: ArtifactType.FOSSIL, name: 'Fossil', color: 'gray', icon: Bone },
        { type: ArtifactType.GRAFFITI, name: 'Graffiti', color: 'gray', icon: Palette },
        { type: ArtifactType.PIXEL_PLANT, name: 'Pixel Plant', color: 'green', icon: Gem },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                    <QrCode size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Enhanced Scan & Discover</h2>
                <p className="text-slate-400 text-sm">
                    Advanced camera scanning with media recording capabilities
                </p>
            </div>

            {/* Location Status */}
            <div className="card">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-gray-300" />
                    <span className="font-medium">Current Location</span>
                    {!isLoadingLocation && !locationError && !location && (
                        <span className="text-xs text-gray-300 bg-gray-800/20 px-2 py-1 rounded">Required</span>
                    )}
                </div>

                {isLoadingLocation ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-800/20 rounded-lg">
                        <Loader2 size={16} className="animate-spin text-gray-300" />
                        <p className="text-sm text-gray-300">Getting your location...</p>
                    </div>
                ) : locationError ? (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 text-gray-300 bg-gray-800/20 p-3 rounded-lg">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Location Error</p>
                                <p className="text-xs text-gray-400 mt-1">{locationError}</p>
                            </div>
                        </div>
                        <button
                            onClick={requestLocation}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                            <RefreshCw size={16} />
                            Retry Location
                        </button>
                    </div>
                ) : location ? (
                    <div className="flex items-center gap-2 p-3 bg-green-900/20 rounded-lg">
                        <CheckCircle size={16} className="text-green-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-400">Location acquired</p>
                            <p className="text-xs text-gray-400">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={requestLocation}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <MapPin size={16} />
                        Get Location
                    </button>
                )}
            </div>

            {/* Enhanced Camera Scanner */}
            <div className="card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Camera size={16} className="text-gray-300" />
                    Enhanced Camera Scanner
                </h3>

                <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                facingMode: "environment",
                                width: { ideal: 1280 },
                                height: { ideal: 720 }
                            }}
                            className="w-full h-full object-cover"
                            onUserMedia={() => {
                                setIsCameraActive(true);
                                setCameraError(null);
                                console.log('Camera activated successfully');
                            }}
                            onUserMediaError={handleCameraError}
                        />

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`w-48 h-48 border-2 rounded-lg transition-all duration-500 ${isScanning
                                ? 'border-green-400 animate-pulse scale-110 shadow-lg shadow-green-400/50'
                                : 'border-white/70 shadow-lg shadow-white/20'
                                }`}>
                                {/* Corner indicators */}
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>

                                {/* Center dot */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-400 animate-ping' : 'bg-white/50'
                                        }`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Instructions */}
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                            <div className="bg-black/70 rounded-lg p-3 text-center backdrop-blur-sm">
                                <p className="text-white text-sm">
                                    {isScanning
                                        ? 'Scanning environment...'
                                        : 'Point camera at surroundings • Use controls below'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Camera Controls */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={capturePhoto}
                            disabled={isCapturing || !isCameraActive}
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            {isCapturing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={16} />
                                    Capture
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Reset
                        </button>
                    </div>

                    {/* Show captured image */}
                    {capturedImage && (
                        <div className="space-y-2">
                            <p className="text-sm text-green-400 font-medium">Photo captured successfully!</p>
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full max-h-32 object-cover rounded-lg border border-green-500/30"
                            />
                            <div className="flex gap-2">
                                <a
                                    href={capturedImage}
                                    download="walkscape-capture.jpg"
                                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                                >
                                    <Download size={16} />
                                    Download
                                </a>
                                <button
                                    onClick={() => setCapturedImage(null)}
                                    className="btn-secondary flex-1 text-sm"
                                >
                                    Clear Photo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Camera Error */}
                    {cameraError && (
                        <div className="flex items-start gap-2 text-gray-300 bg-gray-800/20 p-3 rounded-lg">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Camera Error</p>
                                <p className="text-xs text-gray-400 mt-1">{cameraError}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Touch Grass Action */}
            <div className="card-forest">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-green-400" />
                    Touch Grass
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                    Verify your outdoor presence to earn XP and maintain your streak!
                </p>

                <button
                    onClick={handleTouchGrass}
                    disabled={isScanning || !location}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isScanning ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {isCameraActive ? 'Scanning...' : 'Touching Grass...'}
                        </>
                    ) : (
                        <>
                            <Camera size={16} />
                            Touch Grass (+15 XP)
                        </>
                    )}
                </button>

                {!location && (
                    <p className="text-xs text-gray-300 text-center mt-2">
                        Location access required for this action
                    </p>
                )}
            </div>

            {/* Artifact Claiming */}
            <div className="card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <QrCode size={16} className="text-gray-300" />
                    Claim Artifact
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                    Scan your surroundings to discover unique location-based collectibles
                </p>

                {/* Artifact Type Selection */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {artifactTypes.map((artifact) => {
                        const IconComponent = artifact.icon;
                        return (
                            <button
                                key={artifact.type}
                                onClick={() => setSelectedArtifactType(artifact.type)}
                                className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex items-center gap-2 ${selectedArtifactType === artifact.type
                                    ? `artifact-${artifact.color} border-opacity-100`
                                    : `artifact-${artifact.color} border-opacity-30`
                                    }`}
                            >
                                <IconComponent size={16} />
                                {artifact.name}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={handleClaimArtifact}
                    disabled={isScanning || !location}
                    className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isScanning ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {isCameraActive ? 'Scanning...' : 'Claiming...'}
                        </>
                    ) : (
                        <>
                            <QrCode size={16} />
                            Claim {artifactTypes[selectedArtifactType].name}
                        </>
                    )}
                </button>
            </div>

            {/* Scan Result */}
            {scanResult && (
                <div className={`card ${scanResult.success ? 'border-green-500/50' : 'border-gray-500/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        {scanResult.success ? (
                            <CheckCircle size={16} className="text-green-400" />
                        ) : (
                            <AlertCircle size={16} className="text-gray-300" />
                        )}
                        <span className={`font-medium ${scanResult.success ? 'text-green-400' : 'text-gray-300'}`}>
                            {scanResult.success ? 'Success!' : 'Error'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-300">
                        {scanResult.message}
                    </p>
                </div>
            )}

            {/* Enhanced Tips */}
            <div className="card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-gray-300" />
                    Enhanced Features
                </h3>
                <div className="space-y-2 text-sm text-slate-400">
                    <p><strong>Camera Controls:</strong> Capture photos and record videos of your discoveries</p>
                    <p><strong>Location Tracking:</strong> Enhanced GPS accuracy for better artifact detection</p>
                    <p><strong>Media Recording:</strong> Document your adventures with video recording</p>
                    <p><strong>Auto-retry:</strong> Automatic fallback for camera and location access</p>
                    <p><strong>Performance:</strong> Image compression and optimized media handling</p>
                </div>
            </div>
        </div>
    );
}
