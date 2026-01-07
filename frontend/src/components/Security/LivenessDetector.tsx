import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Eye, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Button from '../UI/Button';

interface LivenessDetectorProps {
    onComplete: (passed: boolean, score: number) => void;
    onSkip?: () => void;
    isOptional?: boolean;
}

type ChallengeType = 'blink' | 'turn_left' | 'turn_right' | 'smile';

const LivenessDetector: React.FC<LivenessDetectorProps> = ({
    onComplete,
    onSkip,
    isOptional = false
}) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previousFrameRef = useRef<ImageData | null>(null);

    const [status, setStatus] = useState<'ready' | 'detecting' | 'passed' | 'failed'>('ready');
    const [challenge, setChallenge] = useState<ChallengeType>('blink');
    const [motionScore, setMotionScore] = useState(0);
    const [countdown, setCountdown] = useState(5);
    const [message, setMessage] = useState('Siap untuk verifikasi wajah');

    // Generate random challenge
    const generateChallenge = useCallback(() => {
        const challenges: ChallengeType[] = ['blink', 'turn_left', 'turn_right'];
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        setChallenge(randomChallenge);
        return randomChallenge;
    }, []);

    // Get challenge instruction text
    const getChallengeText = (type: ChallengeType) => {
        switch (type) {
            case 'blink': return 'Kedipkan mata Anda 2x';
            case 'turn_left': return 'Putar kepala ke KIRI';
            case 'turn_right': return 'Putar kepala ke KANAN';
            case 'smile': return 'Tersenyum lebar';
            default: return 'Ikuti instruksi';
        }
    };

    // Calculate motion difference between frames
    const calculateMotion = useCallback((currentFrame: ImageData, previousFrame: ImageData): number => {
        let totalDiff = 0;
        const len = currentFrame.data.length;

        // Sample every 4th pixel for performance
        for (let i = 0; i < len; i += 16) {
            const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
            const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]);
            const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);
            totalDiff += (rDiff + gDiff + bDiff) / 3;
        }

        return totalDiff / (len / 16);
    }, []);

    // Capture frame and detect motion
    const detectMotion = useCallback(() => {
        if (!webcamRef.current || !canvasRef.current) return 0;

        const video = webcamRef.current.video;
        if (!video || video.readyState !== 4) return 0;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return 0;

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let motion = 0;
        if (previousFrameRef.current) {
            motion = calculateMotion(currentFrame, previousFrameRef.current);
        }

        previousFrameRef.current = currentFrame;
        return motion;
    }, [calculateMotion]);

    // Start detection process
    const startDetection = useCallback(() => {
        setStatus('detecting');
        generateChallenge();
        setCountdown(5);
        setMotionScore(0);
        setMessage('Ikuti instruksi di bawah...');
        previousFrameRef.current = null;
    }, [generateChallenge]);

    // Detection loop
    useEffect(() => {
        if (status !== 'detecting') return;

        const interval = setInterval(() => {
            const motion = detectMotion();

            // Accumulate motion score
            if (motion > 5) { // Threshold for significant motion
                setMotionScore(prev => Math.min(prev + motion * 2, 100));
            }

            // Countdown
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status, detectMotion]);

    // Evaluate result when countdown ends
    useEffect(() => {
        if (status === 'detecting' && countdown === 0) {
            // Motion score > 30 indicates real face movement
            const passed = motionScore > 30;
            setStatus(passed ? 'passed' : 'failed');
            setMessage(passed ? 'Verifikasi berhasil!' : 'Verifikasi gagal. Coba lagi.');

            // Delay callback to show result
            setTimeout(() => {
                onComplete(passed, motionScore);
            }, 1500);
        }
    }, [countdown, status, motionScore, onComplete]);

    return (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Eye className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Verifikasi Wajah</h3>
                    <p className="text-gray-400 text-sm">Pastikan wajah Anda terlihat jelas</p>
                </div>
            </div>

            {/* Webcam Preview */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        width: 320,
                        height: 240,
                        facingMode: 'user'
                    }}
                    className="w-full h-full object-cover"
                />

                {/* Hidden canvas for processing */}
                <canvas
                    ref={canvasRef}
                    width={160}
                    height={120}
                    className="hidden"
                />

                {/* Status Overlay */}
                {status === 'detecting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                        <div className="text-6xl font-bold text-white mb-2">{countdown}</div>
                        <div className="text-lg text-yellow-400 font-medium animate-pulse">
                            {getChallengeText(challenge)}
                        </div>
                        <div className="mt-4 w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${motionScore}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Result Overlay */}
                {status === 'passed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                        <CheckCircle className="w-20 h-20 text-green-400" />
                    </div>
                )}
                {status === 'failed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                        <XCircle className="w-20 h-20 text-red-400" />
                    </div>
                )}
            </div>

            {/* Message */}
            <p className={`text-center mb-4 font-medium ${status === 'passed' ? 'text-green-400' :
                status === 'failed' ? 'text-red-400' :
                    'text-gray-300'
                }`}>
                {message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
                {status === 'ready' && (
                    <Button
                        onClick={startDetection}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600"
                        icon={<Eye className="w-5 h-5" />}
                    >
                        Mulai Verifikasi
                    </Button>
                )}

                {status === 'detecting' && (
                    <Button
                        disabled
                        className="flex-1"
                        icon={<Loader2 className="w-5 h-5 animate-spin" />}
                    >
                        Mendeteksi...
                    </Button>
                )}

                {status === 'failed' && (
                    <Button
                        onClick={startDetection}
                        className="flex-1"
                        icon={<RefreshCw className="w-5 h-5" />}
                    >
                        Coba Lagi
                    </Button>
                )}

                {isOptional && status !== 'detecting' && (
                    <Button
                        onClick={onSkip}
                        variant="secondary"
                        className="flex-1"
                    >
                        Lewati
                    </Button>
                )}
            </div>
        </div>
    );
};

export default LivenessDetector;
