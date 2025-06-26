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

    // Load browser-specific dependencies
    useEffect(() => {
        const loadBrowserAPIs = async () => {
            try {
                const imageCompressionModule = await import('browser-image-compression');
                setImageCompression(() => imageCompressionModule.default);
                setBrowserAPIsLoaded(true);

                // Check if media recording is available
                if (typeof navigator !== 'undefined' &&
                    navigator.mediaDevices &&
                    typeof navigator.mediaDevices.getUserMedia === 'function') {
                    setMediaRecorderEnabled(true);
                }
            } catch (error) {
                console.error('Failed to load browser APIs:', error);
            }
        };

        loadBrowserAPIs();
    }, []);

    // Initialize media recorder functionality manually
    useEffect(() => {
        if (browserAPIsLoaded && mediaRecorderEnabled) {
            let mediaRecorder: MediaRecorder | null = null;
            let stream: MediaStream | null = null;
            let chunks: Blob[] = [];
            let mediaBlobUrl: string | undefined = undefined;

            const startRecording = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                    chunks = [];

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            chunks.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        mediaBlobUrl = URL.createObjectURL(blob);
                        setMediaRecorderState(prev => ({
                            ...prev,
                            status: 'stopped',
                            mediaBlobUrl
                        }));
                    };

                    mediaRecorder.start();
                    setMediaRecorderState(prev => ({ ...prev, status: 'recording' }));
                } catch (error) {
                    console.error('Failed to start recording:', error);
                    setMediaRecorderState(prev => ({ ...prev, status: 'error' }));
                }
            };

            const stopRecording = () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                }
            };

            const clearBlobUrl = () => {
                if (mediaBlobUrl) {
                    URL.revokeObjectURL(mediaBlobUrl);
                    mediaBlobUrl = undefined;
                }
                setMediaRecorderState(prev => ({
                    ...prev,
                    mediaBlobUrl: undefined,
                    status: 'idle'
                }));
            };

            setMediaRecorderState({
                status: 'idle',
                startRecording,
                stopRecording,
                clearBlobUrl
            });

            // Cleanup function
            return () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                if (mediaBlobUrl) {
                    URL.revokeObjectURL(mediaBlobUrl);
                }
            };
        }
    }, [browserAPIsLoaded, mediaRecorderEnabled]);

    // Enhanced location request with comprehensive error handling and fallback strategies
    const requestLocation = useCallback(async () => {
        setIsLoadingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            setIsLoadingLocation(false);
            return;
        }

        // Check permission status first
        if (navigator.permissions) {
            try {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                if (status.state === 'denied') {
                    setLocationError('Location permission denied in browser settings. Please enable location access.');
                    setIsLoadingLocation(false);
                    return;
                }
            } catch (error) {
                console.log('Permission API not available:', error);
            }
        }

        // Define options for different accuracy levels
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: 20000, // Increased timeout for high accuracy
            maximumAge: 30000 // Shorter cache for high accuracy
        };

        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // Longer cache for low accuracy (5 minutes)
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

        // Enhanced error handler with specific iOS CoreLocation error handling
        const onError = (error: GeolocationPositionError) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Unable to get your location';
            let shouldRetryWithLowAccuracy = false;

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services in your device settings and refresh the page.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. This can happen indoors or in areas with poor GPS signal. Try moving to an open area or enabling Wi-Fi location services.';
                    shouldRetryWithLowAccuracy = true;
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Try moving to an area with better GPS signal or check your device settings.';
                    shouldRetryWithLowAccuracy = true;
                    break;
                default:
                    // Handle iOS CoreLocation specific errors
                    if (error.message.includes('kCLErrorLocationUnknown') ||
                        error.message.includes('Position update is unavailable')) {
                        errorMessage = 'GPS signal unavailable. Please ensure location services are enabled and try moving to an open area with better sky visibility.';
                        shouldRetryWithLowAccuracy = true;
                    } else {
                        errorMessage = `Location error: ${error.message}`;
                    }
            }

            // If this is a high accuracy request that failed, try with low accuracy
            if (shouldRetryWithLowAccuracy && highAccuracyOptions.enableHighAccuracy) {
                console.log('Retrying with low accuracy mode...');
                navigator.geolocation.getCurrentPosition(onSuccess, (lowAccError) => {
                    setLocationError(errorMessage);
                    setIsLoadingLocation(false);
                }, lowAccuracyOptions);
                return;
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

    // Alternative location method using watchPosition for better reliability
    const watchLocationWithFallback = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
        }

        setIsLoadingLocation(true);
        setLocationError(null);
        let watchId: number | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        const cleanup = () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };

        const onSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            setLocation({
                lat: latitude,
                lng: longitude
            });
            setLocationError(null);
            setIsLoadingLocation(false);
            console.log(`Location obtained via watch: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
            cleanup();
        };

        const onError = (error: GeolocationPositionError) => {
            console.error('Watch position error:', error);
            cleanup();
            // Fall back to single position request
            requestLocation();
        };

        // Set a timeout for watchPosition
        timeoutId = setTimeout(() => {
            console.log('Watch position timeout, falling back to getCurrentPosition');
            cleanup();
            requestLocation();
        }, 8000);

        // Start watching position with lower accuracy first
        try {
            watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000
            });
        } catch (error) {
            console.error('Failed to start watchPosition:', error);
            cleanup();
            requestLocation();
        }
    }, []);

    // Retry location with exponential backoff
    const [locationRetryCount, setLocationRetryCount] = useState(0);
    const maxRetries = 3;

    const retryLocation = useCallback(() => {
        if (locationRetryCount < maxRetries) {
            setLocationRetryCount(prev => prev + 1);
            console.log(`Retrying location request (attempt ${locationRetryCount + 1}/${maxRetries})`);

            // Use watchPosition for the first retry, then getCurrentPosition
            if (locationRetryCount === 0) {
                watchLocationWithFallback();
            } else {
                requestLocation();
            }
        } else {
            setLocationError('Maximum retry attempts reached. Please check your device location settings and try again manually.');
        }
    }, [locationRetryCount, requestLocation, watchLocationWithFallback]);

    // Reset retry count when location is successfully obtained
    useEffect(() => {
        if (location) {
            setLocationRetryCount(0);
        }
    }, [location]);

    // Device-specific location diagnostics
    const getLocationDiagnostics = useCallback(() => {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        const isChrome = /Chrome/.test(userAgent);

        let diagnostics = {
            platform: 'Unknown',
            browser: 'Unknown',
            suggestions: [] as string[]
        };

        if (isIOS) {
            diagnostics.platform = 'iOS';
            diagnostics.suggestions = [
                'Go to Settings → Privacy & Security → Location Services',
                'Ensure Location Services is enabled',
                'Allow location access for Safari/your browser',
                'Try switching from WiFi to cellular data or vice versa'
            ];
        } else if (isAndroid) {
            diagnostics.platform = 'Android';
            diagnostics.suggestions = [
                'Go to Settings → Location (or Privacy → Location)',
                'Turn on location services',
                'Allow location permission for your browser',
                'Ensure GPS is enabled in quick settings'
            ];
        }

        if (isSafari) {
            diagnostics.browser = 'Safari';
            diagnostics.suggestions.push('Try clearing Safari cache and cookies');
        } else if (isChrome) {
            diagnostics.browser = 'Chrome';
            diagnostics.suggestions.push('Check Chrome site permissions for location');
        }

        return diagnostics;
    }, []);

    // Improved location permission check
    const checkLocationPermission = useCallback(async () => {
        if (!navigator.permissions) {
            return 'unknown';
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.error('Permission check failed:', error);
            return 'unknown';
        }
    }, []);

    // Enhanced image processing function
    const processImageForAnalysis = async (imageDataUrl: string) => {
        try {
            // Convert base64 to blob
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();

            // Compress image if needed
            if (imageCompression) {
                const compressedFile = await imageCompression(new File([blob], 'capture.jpg'), {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                });

                console.log('Image compressed from', blob.size, 'to', compressedFile.size, 'bytes');

                // Optional: AI-powered image analysis
                analyzeImageContent(compressedFile);

                return compressedFile;
            }

            return blob;
        } catch (error) {
            console.error('Failed to process image:', error);
            return null;
        }
    };

    // AI-powered image analysis (placeholder for future implementation)
    const analyzeImageContent = async (imageFile: File) => {
        // Could integrate with:
        // - Object detection APIs (detect mushrooms, plants, etc.)
        // - Location verification (match environment with GPS)
        // - Rarity assessment based on visual features
        console.log('Analyzing image content...', imageFile.name);

        // Example analysis results
        const analysisResults = {
            detectedObjects: ['vegetation', 'natural_environment'],
            rarityScore: Math.random() * 100,
            environmentType: 'forest',
            lightingConditions: 'natural_daylight'
        };

        return analysisResults;
    };

    // Enhanced camera capture using webcam
    const capturePhoto = useCallback(async () => {
        setIsCapturing(true);

        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setCapturedImage(imageSrc);
                console.log('Photo captured successfully');

                // Process the image
                const processedImage = await processImageForAnalysis(imageSrc);
                if (processedImage) {
                    console.log('Image processed and ready for game mechanics');
                }
            }
        }

        setIsCapturing(false);
    }, [imageCompression]);

    // Enhanced camera error handling
    const handleCameraError = useCallback((error: string | DOMException) => {
        console.error('Camera error:', error);
        let errorMessage = 'Failed to access camera';

        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error instanceof DOMException) {
            switch (error.name) {
                case 'NotAllowedError':
                    errorMessage = 'Camera access denied. Please enable camera permissions and try again.';
                    break;
                case 'NotFoundError':
                    errorMessage = 'No camera found on this device. Please connect a camera or try a different device.';
                    break;
                case 'NotSupportedError':
                    errorMessage = 'Camera is not supported on this device or browser.';
                    break;
                case 'NotReadableError':
                    errorMessage = 'Camera is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    errorMessage = 'Camera constraints cannot be satisfied. Try a different camera mode.';
                    break;
                default:
                    errorMessage = `Camera error: ${error.message}`;
            }
        }

        setCameraError(errorMessage);
        setIsCameraActive(false);
    }, []);

    // Get user location on component mount with retry mechanism
    useEffect(() => {
        if (isRegistered) {
            // Start with watchPosition for better reliability
            watchLocationWithFallback();
        }
    }, [isRegistered, watchLocationWithFallback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderState.mediaBlobUrl) {
                mediaRecorderState.clearBlobUrl();
            }
        };
    }, [mediaRecorderState]);

    // Periodic location refresh for mobile users
    useEffect(() => {
        if (!location || !isRegistered) return;

        // Set up periodic location refresh every 5 minutes
        const refreshInterval = setInterval(() => {
            console.log('Performing periodic location refresh...');
            // Use low accuracy for background refresh to save battery
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };

                        // Only update if location has changed significantly (more than 100 meters)
                        const distance = Math.sqrt(
                            Math.pow((newLocation.lat - location.lat) * 111000, 2) +
                            Math.pow((newLocation.lng - location.lng) * 111000, 2)
                        );

                        if (distance > 100) {
                            console.log(`Location updated: moved ${distance.toFixed(0)}m`);
                            setLocation(newLocation);
                        }
                    },
                    (error) => {
                        console.log('Background location refresh failed:', error.message);
                        // Don't show error for background refresh failures
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(refreshInterval);
    }, [location, isRegistered]);

    if (!isRegistered) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md mx-auto p-6">
                    <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-4" />

                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                <p className="text-slate-300">Checking registration status...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-slate-400 text-lg font-medium">Registration Check Failed</p>
                                <p className="text-sm text-slate-500">
                                    We couldn't verify your registration status. This might be due to:
                                </p>
                                <ul className="text-xs text-slate-400 text-left space-y-1 mt-2">
                                    <li>• Network connectivity issues</li>
                                    <li>• Temporary RPC server problems</li>
                                    <li>• Wallet connection problems</li>
                                    <li>• You may need to complete registration</li>
                                </ul>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={retryRegistrationCheck}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    Retry Registration Check
                                </button>

                                <button
                                    onClick={() => window.location.href = '/register'}
                                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    <QrCode size={16} />
                                    Go to Registration
                                </button>
                            </div>

                            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg">
                                <p className="font-medium mb-1">💡 Troubleshooting:</p>
                                <p>If you're sure you're registered, try refreshing the page or checking your wallet connection.</p>
                            </div>
                        </div>
                    )}
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
                                {locationRetryCount > 0 && (
                                    <p className="text-xs text-gray-400 mt-1 opacity-75">
                                        Attempt {locationRetryCount}/{maxRetries}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={retryLocation}
                                disabled={locationRetryCount >= maxRetries}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${locationRetryCount >= maxRetries
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                            >
                                <RefreshCw size={16} className={locationRetryCount >= maxRetries ? '' : 'animate-pulse'} />
                                {locationRetryCount >= maxRetries ? 'Max Retries' : 'Smart Retry'}
                            </button>

                            <button
                                onClick={() => {
                                    setLocationRetryCount(0);
                                    watchLocationWithFallback();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                            >
                                <MapPin size={16} />
                                Force Retry
                            </button>
                        </div>

                        {/* Device-specific helpful tips for location issues */}
                        <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
                            <p className="font-medium mb-1">Device-specific tips:</p>
                            {(() => {
                                const diagnostics = getLocationDiagnostics();
                                return (
                                    <div className="space-y-2">
                                        <p className="text-gray-300">
                                            Platform: {diagnostics.platform} | Browser: {diagnostics.browser}
                                        </p>
                                        <ul className="space-y-1 text-gray-300">
                                            {diagnostics.suggestions.slice(0, 4).map((suggestion, index) => (
                                                <li key={index}>• {suggestion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })()}
                        </div>
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
                                        <div className="mt-2 pt-2 border-t border-gray-700">
                                            <p className="text-gray-300">General tips:</p>
                                            <ul className="space-y-1 text-gray-300 mt-1">
                                                <li>• Move to an area with clear sky view</li>
                                                <li>• Try refreshing the page</li>
                                                <li>• Restart your browser if issues persist</li>
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : location ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-900/20 rounded-lg">
                            <CheckCircle size={16} className="text-green-400" />
                            <div className="flex-1">
                                <p className="text-sm text-green-300 font-medium">Location acquired</p>
                                <p className="text-xs text-slate-400">
                                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </p>
                                {locationRetryCount > 0 && (
                                    <p className="text-xs text-green-200 opacity-75 mt-1">
                                        ✓ Success after {locationRetryCount} attempts
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setLocationRetryCount(0);
                                    watchLocationWithFallback();
                                }}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Refresh location"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                            <AlertCircle size={16} className="text-yellow-400" />
                            <p className="text-sm text-yellow-300">Location access needed for scanning</p>
                        </div>
                        <button
                            onClick={requestLocation}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <MapPin size={16} />
                            Enable Location Access
                        </button>
                    </div>
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

                        {/* Recording Status */}
                        {mediaRecorderState.status === 'recording' && (
                            <div className="absolute top-4 left-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                Recording
                            </div>
                        )}
                    </div>

                    {/* Camera Controls */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <button
                            onClick={capturePhoto}
                            disabled={isCapturing || !isCameraActive}
                            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
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
                            onClick={mediaRecorderState.status === 'recording' ? mediaRecorderState.stopRecording : mediaRecorderState.startRecording}
                            disabled={!isCameraActive}
                            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Video size={16} />
                            {mediaRecorderState.status === 'recording' ? 'Stop' : 'Record'}
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Reset
                        </button>

                        <button
                            onClick={() => {
                                setCapturedImage(null);
                                if (mediaRecorderState.mediaBlobUrl) mediaRecorderState.clearBlobUrl();
                            }}
                            className="btn-secondary flex items-center justify-center gap-2"
                        >
                            <CameraOff size={16} />
                            Clear
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

                    {/* Show recorded video */}
                    {mediaRecorderState.mediaBlobUrl && (
                        <div className="space-y-2">
                            <p className="text-sm text-green-400 font-medium">🎥 Video recorded successfully!</p>
                            <video
                                src={mediaRecorderState.mediaBlobUrl}
                                controls
                                className="w-full max-h-32 rounded-lg border border-green-500/30"
                            />
                            <div className="flex gap-2">
                                <a
                                    href={mediaRecorderState.mediaBlobUrl}
                                    download="walkscape-scan.webm"
                                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                                >
                                    <Download size={16} />
                                    Download
                                </a>
                                <button
                                    onClick={mediaRecorderState.clearBlobUrl}
                                    className="btn-secondary flex-1 text-sm"
                                >
                                    Clear Video
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Camera Error */}
                    {cameraError && (
                        <div className="flex items-start gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium">Camera Error</p>
                                <p className="text-xs text-red-300 mt-1">{cameraError}</p>
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
