import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Scan, KeyRound, Sparkles, VideoOff } from 'lucide-react';
import { loadFaceModels, detectFaceDescriptor, findBestMatchingAccount } from '@/lib/faceService';
import { EnrolledFaceAccount } from '@/types';

interface FaceLoginScannerProps {
  onLoginSuccess: (user: { email: string; full_name: string; role: string }) => void;
  onSwitchToPassword: () => void;
}

export function FaceLoginScanner({
  onLoginSuccess,
  onSwitchToPassword,
}: FaceLoginScannerProps) {
  const [enrolledAccounts, setEnrolledAccounts] = useState<EnrolledFaceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Starting Face Biometrics...');
  const [scanning, setScanning] = useState(true);
  const [matchedUser, setMatchedUser] = useState<{ name: string; role: string; matchPercent: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [noFacesEnrolled, setNoFacesEnrolled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isLoggingInRef = useRef<boolean>(false);
  const enrolledAccountsRef = useRef<EnrolledFaceAccount[]>([]);

  // 1. Fetch enrolled accounts from server
  const fetchEnrolledAccounts = async () => {
    try {
      const res = await fetch('/api/auth/face-accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        enrolledAccountsRef.current = data.accounts;
        setEnrolledAccounts(data.accounts);
        if (data.accounts.length === 0) {
          setNoFacesEnrolled(true);
        } else {
          setNoFacesEnrolled(false);
        }
        return data.accounts;
      }
    } catch (err) {
      console.warn('Could not load enrolled face accounts:', err);
    }
    return [];
  };

  // 2. Preload face models and automatically start camera
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage('');
    setMatchedUser(null);
    isLoggingInRef.current = false;

    Promise.all([loadFaceModels(), fetchEnrolledAccounts()])
      .then(([, accounts]) => {
        if (!isMounted) return;
        setLoading(false);
        if (accounts.length === 0) {
          setStatusMessage('No face accounts enrolled.');
        } else {
          // Automatically start camera without requiring any manual clicks
          startCamera();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoading(false);
        setErrorMessage('Failed to load face detection engine: ' + err.message);
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setErrorMessage('');
      setMatchedUser(null);
      isLoggingInRef.current = false;
      setScanning(true);
      setStatusMessage('Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startRecognitionLoop();
        };
      }
    } catch (err: any) {
      setCameraActive(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow webcam permissions in your browser or use password login.'
          : 'Unable to access camera.'
      );
    }
  };

  // Ensure video element gets stream if mounted after state update
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        startRecognitionLoop();
      };
    }
  }, [cameraActive]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStatusMessage('Camera stopped');
  };

  // 3. Real-time recognition loop
  const startRecognitionLoop = () => {
    let tickCount = 0;

    const loop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || isLoggingInRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      tickCount++;
      // Process every 2nd frame for rapid recognition and minimal input latency
      if (tickCount % 2 === 0) {
        try {
          const result = await detectFaceDescriptor(videoRef.current);
          if (result && result.descriptor) {
            const currentEnrolled = enrolledAccountsRef.current;
            if (currentEnrolled.length === 0) {
              setStatusMessage('Loading biometric profiles...');
              animFrameRef.current = requestAnimationFrame(loop);
              return;
            }

            // Match candidate face against enrolled accounts
            const match = findBestMatchingAccount(result.descriptor, currentEnrolled, 0.55);

            if (match.isMatch && match.matchedAccount) {
              const account = match.matchedAccount;

              if (!isLoggingInRef.current) {
                isLoggingInRef.current = true;
                setScanning(false);
                setMatchedUser({
                  name: account.full_name,
                  role: account.role,
                  matchPercent: match.similarityPercent,
                });
                setStatusMessage(`Identified: ${account.full_name} (${match.similarityPercent}% match)`);

                // Send verified login to server
                await executeFaceLogin(result.descriptor, account.email);
                return;
              }
            } else {
              setStatusMessage(`Scanning face... (${match.similarityPercent}% match)`);
            }
          } else {
            setStatusMessage('Ready • Look at the camera to log in');
          }
        } catch (e) {
          // ignore transient frame error
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // 4. Server-side session authentication
  const executeFaceLogin = async (descriptor: number[], preferredEmail: string) => {
    try {
      const res = await fetch('/api/auth/face-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor, preferredEmail }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setStatusMessage(`Authentication Verified! Welcome, ${data.user.full_name}.`);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        isLoggingInRef.current = false;
        setScanning(true);
        setMatchedUser(null);
        setErrorMessage(data.error || 'Server face verification rejected.');
      }
    } catch (err: any) {
      isLoggingInRef.current = false;
      setScanning(true);
      setMatchedUser(null);
      setErrorMessage('Login request failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Viewport */}
      <div className="relative aspect-4/3 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
        {loading ? (
          <div className="text-center p-6 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">Starting Face Biometrics...</p>
          </div>
        ) : noFacesEnrolled ? (
          <div className="text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">No Face Accounts Registered</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] mx-auto">
                No biometric profiles found. Please sign in using your password credentials.
              </p>
            </div>
          </div>
        ) : !cameraActive ? (
          /* Camera Inactive / Denied State */
          <div className="text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-cyan-400 mx-auto flex items-center justify-center shadow-lg">
              <Scan className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">Camera Paused</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-[260px] mx-auto">
                Camera is currently turned off. Click below to resume face scanning.
              </p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer shadow-md active:scale-98"
            >
              <Camera className="w-4 h-4 text-zinc-950" />
              Turn On Camera
            </button>
          </div>
        ) : (
          /* Active Camera Feed */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* Active Recognition Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {matchedUser && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div className="w-56 rounded-2xl border-2 border-emerald-400 bg-zinc-900/95 flex flex-col items-center justify-center p-5 text-center shadow-[0_0_40px_rgba(52,211,153,0.35)]">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center mb-2.5 shadow-md">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-white leading-tight">{matchedUser.name}</p>
                    <p className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider mt-1 font-semibold">
                      {matchedUser.role} • {matchedUser.matchPercent}% Match
                    </p>
                    <p className="text-xs text-zinc-300 mt-2.5 font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                      Logging in...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Status Pill */}
            <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-md shadow-xs ${
                  matchedUser
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-700'
                }`}
              >
                {matchedUser ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                )}
                {statusMessage}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onSwitchToPassword();
          }}
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Use Password Login
        </button>

        {cameraActive && (
          <button
            type="button"
            onClick={stopCamera}
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-rose-400 transition cursor-pointer text-xs"
          >
            <VideoOff className="w-3.5 h-3.5" />
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
}
