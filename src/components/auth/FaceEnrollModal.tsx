import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, X, Trash2, Upload, UserCheck } from 'lucide-react';
import { detectFaceDescriptor, captureFrameThumbnail, loadFaceModels } from '@/lib/faceService';
import { UserRole } from '@/types';

interface FaceEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
  defaultName?: string;
}

interface UserOption {
  email: string;
  full_name: string;
  role: UserRole;
  has_face?: boolean;
}

export function FaceEnrollModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = '',
  defaultName = '',
}: FaceEnrollModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedEmail, setSelectedEmail] = useState(defaultEmail || 'samyaksingh1845@gmail.com');
  const [fullName, setFullName] = useState(defaultName || 'Samyak Singh');
  const [role, setRole] = useState<UserRole>('ADMIN');

  const [cameraActive, setCameraActive] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [extractedDescriptor, setExtractedDescriptor] = useState<number[] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load available users from backend
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/settings/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setUsers(data.profiles);
          if (!defaultEmail) {
            setSelectedEmail(data.profiles[0].email);
            setFullName(data.profiles[0].full_name);
            setRole(data.profiles[0].role);
          }
        } else {
          // Fallback default system accounts
          setUsers([
            { email: 'samyaksingh1845@gmail.com', full_name: 'Samyak Singh', role: 'ADMIN' },
            { email: 'owner@gorepireo.in', full_name: 'Prithibi Mandi', role: 'OWNER' },
          ]);
        }
      })
      .catch(() => {
        setUsers([
          { email: 'samyaksingh1845@gmail.com', full_name: 'Samyak Singh', role: 'ADMIN' },
          { email: 'owner@gorepireo.in', full_name: 'Prithibi Mandi', role: 'OWNER' },
        ]);
      });
  }, [isOpen, defaultEmail]);

  // Handle selected user change
  const handleUserSelect = (email: string) => {
    setSelectedEmail(email);
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setFullName(found.full_name);
      setRole(found.role);
    }
  };

  // Start camera and model loading
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setCapturedThumbnail(null);
    setExtractedDescriptor(null);
    setLoadingModels(true);

    loadFaceModels()
      .then(() => {
        setLoadingModels(false);
        startCamera();
      })
      .catch((err) => {
        setLoadingModels(false);
        setErrorMessage('Failed to load neural face detection models. Please check your connection.');
        console.error(err);
      });

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      setStatusMessage('Requesting camera access...');
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
          startDetectionLoop();
        };
      }
    } catch (err: any) {
      setCameraActive(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Could not access camera device.'
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

  const startDetectionLoop = () => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const result = await detectFaceDescriptor(videoRef.current);
        if (result && result.descriptor) {
          setFaceDetected(true);
          setStatusMessage('Face detected! Click "Capture Face" below to enroll.');
        } else {
          setFaceDetected(false);
          setStatusMessage('Face the camera to capture...');
        }
      } catch {
        // detection tick error - proceed
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  };

  // Capture face from live webcam
  const handleCaptureFromCamera = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    setErrorMessage('');

    try {
      const result = await detectFaceDescriptor(videoRef.current);
      if (!result || !result.descriptor) {
        setErrorMessage('No face detected in frame. Please position your face clearly and try again.');
        setCapturing(false);
        return;
      }

      const thumbnail = captureFrameThumbnail(videoRef.current, result.box);
      setExtractedDescriptor(result.descriptor);
      setCapturedThumbnail(thumbnail);
      setStatusMessage('Face successfully captured and converted to biometric vector.');
    } catch (err: any) {
      setErrorMessage('Error capturing face: ' + (err.message || 'Unknown error'));
    } finally {
      setCapturing(false);
    }
  };

  // Handle image file upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturing(true);
    setErrorMessage('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const result = await detectFaceDescriptor(img);
          if (!result || !result.descriptor) {
            setErrorMessage('Could not detect a clear human face in the uploaded photo.');
            setCapturing(false);
            return;
          }

          setExtractedDescriptor(result.descriptor);
          setCapturedThumbnail(img.src);
          setCapturing(false);
          setStatusMessage('Face successfully extracted from uploaded photo.');
        };
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage('Error processing image file: ' + err.message);
      setCapturing(false);
    }
  };

  // Submit enrollment to server
  const handleSaveEnrollment = async () => {
    if (!selectedEmail || !extractedDescriptor) {
      setErrorMessage('Please capture or upload a valid face first.');
      return;
    }

    setCapturing(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/face-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail,
          full_name: fullName,
          role,
          descriptor: extractedDescriptor,
          thumbnail_url: capturedThumbnail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Face successfully assigned to ${fullName} (${selectedEmail})!`);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.error || 'Failed to enroll face credential.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while saving face credential: ' + err.message);
    } finally {
      setCapturing(false);
    }
  };

  // Delete enrolled face
  const handleDeleteEnrollment = async () => {
    if (!selectedEmail) return;
    if (!confirm(`Are you sure you want to remove Face ID for ${selectedEmail}?`)) return;

    setCapturing(true);
    try {
      const res = await fetch(`/api/auth/face-enroll/${encodeURIComponent(selectedEmail)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Face ID credential removed for ${selectedEmail}.`);
        setCapturedThumbnail(null);
        setExtractedDescriptor(null);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } finally {
      setCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-zinc-100 my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Assign Face to User Account</h2>
              <p className="text-[11px] text-zinc-400">Enroll facial biometrics for instant login recognition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Account Selector */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
              Select User Account to Assign Face
            </label>
            <select
              value={selectedEmail}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
            >
              {users.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.full_name} ({u.email}) — [{u.role}]
                </option>
              ))}
            </select>
          </div>

          {/* Camera Viewport or Captured State */}
          <div className="relative aspect-4/3 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
            {capturedThumbnail ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <img
                  src={capturedThumbnail}
                  alt="Captured face"
                  className="w-32 h-32 rounded-xl object-cover border-2 border-emerald-500 shadow-lg mb-3"
                />
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Biometric Descriptor Ready
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-1">128-dimensional Deep FaceNet embedding extracted</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCapturedThumbnail(null);
                    setExtractedDescriptor(null);
                    startCamera();
                  }}
                  className="mt-3 text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Recapture Face
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

                {/* Biometric Scanning Overlay Reticle */}
                <div className="absolute inset-0 pointer-events-none rounded-xl ring-2 transition-all duration-300 ring-inset ring-white/10" />

                {/* Status Badge */}
                <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-md ${
                      faceDetected
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-900/80 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {loadingModels ? 'Loading neural models...' : statusMessage}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Controls */}
          <div className="space-y-2 pt-2">
            {!capturedThumbnail ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  disabled={capturing || loadingModels}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {capturing ? 'Extracting Face...' : 'Capture Face from Camera'}
                </button>

                <label className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEnrollment}
                  disabled={capturing}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {capturing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  Save & Assign Face to {fullName}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteEnrollment}
                  disabled={capturing}
                  title="Remove this user's face credential"
                  className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-800 hover:text-rose-400 text-zinc-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
