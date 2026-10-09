import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Scan, UserCheck, Shield, KeyRound, Sparkles, UserPlus } from 'lucide-react';
import { loadFaceModels, detectFaceDescriptor, findBestMatchingAccount } from '@/lib/faceService';
import { EnrolledFaceAccount } from '@/types';

interface FaceLoginScannerProps {
  onLoginSuccess: (user: { email: string; full_name: string; role: string }) => void;
  onSwitchToPassword: () => void;
  onOpenEnrollModal: () => void;
}

export function FaceLoginScanner({
  onLoginSuccess,
  onSwitchToPassword,
  onOpenEnrollModal,
}: FaceLoginScannerProps) {
  const [enrolledAccounts, setEnrolledAccounts] = useState<EnrolledFaceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading biometric neural engine...');
  const [scanning, setScanning] = useState(true);
  const [matchedUser, setMatchedUser] = useState<{ name: string; role: string; matchPercent: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [noFacesEnrolled, setNoFacesEnrolled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const consecutiveMatchesRef = useRef<number>(0);
  const lastMatchedEmailRef = useRef<string | null>(null);
  const isLoggingInRef = useRef<boolean>(false);

  // 1. Fetch enrolled accounts from server
  const fetchEnrolledAccounts = async () => {
    try {
      const res = await fetch('/api/auth/face-accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
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

  // 2. Initialize models and camera
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage('');
    setMatchedUser(null);
    consecutiveMatchesRef.current = 0;
    isLoggingInRef.current = false;

    Promise.all([loadFaceModels(), fetchEnrolledAccounts()])
      .then(([, accounts]) => {
        if (!isMounted) return;
        setLoading(false);
        if (accounts.length === 0) {
          setStatusMessage('No face accounts registered yet.');
        } else {
          setStatusMessage('Camera starting...');
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
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
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
            setStatusMessage('Analyzing biometric landmarks...');

            // Match candidate face against all enrolled accounts
            const match = findBestMatchingAccount(result.descriptor, enrolledAccounts);

            if (match.isMatch && match.matchedAccount) {
              const account = match.matchedAccount;

              if (lastMatchedEmailRef.current === account.email) {
                consecutiveMatchesRef.current += 1;
              } else {
                lastMatchedEmailRef.current = account.email;
                consecutiveMatchesRef.current = 1;
              }

              // Fast-path instant verification: 1 high-confidence frame (>=68%) or 2 consecutive frames
              const isConfirmed =
                consecutiveMatchesRef.current >= 2 ||
                (consecutiveMatchesRef.current >= 1 && match.similarityPercent >= 68);

              if (isConfirmed && !isLoggingInRef.current) {
                isLoggingInRef.current = true;
                setScanning(false);
                setMatchedUser({
                  name: account.full_name,
                  role: account.role,
                  matchPercent: match.similarityPercent,
                });
                setStatusMessage(`Recognized: ${account.full_name} (${match.similarityPercent}% match)`);

                // Send verified login to server
                await executeFaceLogin(result.descriptor, account.email);
                return;
              }
            } else {
              consecutiveMatchesRef.current = 0;
              lastMatchedEmailRef.current = null;
              if (match.minDistance < 0.65) {
                setStatusMessage(`Unrecognized face (Closest: ${match.similarityPercent}%)`);
              } else {
                setStatusMessage('Align your face in the center...');
              }
            }
          } else {
            consecutiveMatchesRef.current = 0;
            setStatusMessage('Looking for face...');
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
        }, 400);
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
              <p className="text-xs font-semibold text-zinc-200">No Face Accounts Assigned</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] mx-auto">
                Assign a face to an existing user account to enable biometric instant sign-in.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenEnrollModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign Face Account
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* Scanning Overlay Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {matchedUser ? (
                <div className="w-52 h-60 rounded-2xl border-2 border-emerald-400 bg-emerald-500/10 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center mb-2 shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-white leading-tight">{matchedUser.name}</p>
                  <p className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider mt-0.5 font-semibold">
                    {matchedUser.role} • {matchedUser.matchPercent}% Match
                  </p>
                  <p className="text-[10px] text-zinc-300 mt-2 font-medium">Logging in...</p>
                </div>
              ) : (
                <div className="relative w-48 h-56">
                  {/* Subtle Corner Brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-zinc-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-zinc-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-zinc-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-zinc-400 rounded-br-lg" />

                  {/* Scanning beam line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 opacity-70" />
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

      {/* Enrolled Accounts Chips */}
      {enrolledAccounts.length > 0 && (
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px]">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="font-medium">Assigned Face Accounts:</span>
            <span className="font-mono text-[10px] text-zinc-500">{enrolledAccounts.length} active</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {enrolledAccounts.map((acc) => (
              <span
                key={acc.email}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-[10px] border border-zinc-700/60"
              >
                <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                <span className="font-medium truncate max-w-[120px]">{acc.full_name}</span>
                <span className="text-[9px] text-zinc-500 uppercase">({acc.role})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={onSwitchToPassword}
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Use Password Login
        </button>

        <button
          type="button"
          onClick={onOpenEnrollModal}
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition cursor-pointer text-[11px]"
        >
          <UserPlus className="w-3 h-3 text-emerald-400" />
          Assign / Update Face
        </button>
      </div>
    </div>
  );
}
