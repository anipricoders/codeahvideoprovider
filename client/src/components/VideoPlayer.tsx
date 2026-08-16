import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, AlertOctagon } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoId: string;
  initialSecondsWatched: number;
  onProgressUpdate: (seconds: number, completed: boolean) => void;
  onVideoEnded: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoId,
  initialSecondsWatched,
  onProgressUpdate,
  onVideoEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(initialSecondsWatched);
  
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const progressTimer = useRef<number | null>(null);
  const lastVideoIdRef = useRef<string | null>(null);

  // Sync state when video changes
  useEffect(() => {
    if (lastVideoIdRef.current === videoId) {
      return;
    }
    lastVideoIdRef.current = videoId;

    setIsPlaying(false);
    setCurrentTime(initialSecondsWatched);
    setMaxWatchedTime(initialSecondsWatched);
    setSecurityAlert(null);
    
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.currentTime = initialSecondsWatched;
    }
  }, [videoId, initialSecondsWatched]);

  // Periodic progress saving (every 2 seconds)
  useEffect(() => {
    if (isPlaying) {
      progressTimer.current = window.setInterval(() => {
        if (videoRef.current) {
          const current = videoRef.current.currentTime;
          const completed = current >= duration - 1 && duration > 0;
          onProgressUpdate(Math.round(current), completed);
        }
      }, 2000);
    } else {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    }
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, [isPlaying, duration, onProgressUpdate]);

  // DevTools and Right-click security monitoring
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerSecurityAlert('Right-click is disabled to protect course content.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Block inspect shortcut keys
      const isF12 = e.key === 'F12';
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (
        isF12 ||
        (isCmdOrCtrl && isShift && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (isCmdOrCtrl && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('Developer tools, inspect element, and file saving are restricted.');
      }

      // 2. Block keyboard seek-forward shortcuts
      if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        triggerSecurityAlert('Fast-forward seeking is locked. You must watch the course sequentially.');
      }

      // 3. Play/Pause with spacebar
      if (e.key === ' ' && document.activeElement === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };

    // Listeners
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [maxWatchedTime]);

  const triggerSecurityAlert = (message: string) => {
    setSecurityAlert(message);
    if (isPlaying) {
      pauseVideo();
    }
    // Auto clear warning after 4 seconds
    setTimeout(() => {
      setSecurityAlert(null);
    }, 4500);
  };

  const playVideo = () => {
    if (securityAlert) return;
    videoRef.current?.play().then(() => {
      setIsPlaying(true);
    }).catch(err => console.log('Playback error:', err));
  };

  const pauseVideo = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    
    // Check if user is attempting to seek forward
    // If the playhead goes past maxWatchedTime with a margin of 1.2s, snap back!
    if (v.currentTime > maxWatchedTime + 1.2) {
      v.currentTime = maxWatchedTime;
      setCurrentTime(maxWatchedTime);
      triggerSecurityAlert('Skip forward is locked. Please view the full topic content.');
      return;
    }

    // Normal progression: update current and expand maximum watched playhead
    setCurrentTime(v.currentTime);
    if (v.currentTime > maxWatchedTime) {
      setMaxWatchedTime(v.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.currentTime = initialSecondsWatched;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickRatio = clickX / width;
    const targetSeconds = clickRatio * duration;

    // SECURITY CHECK: Limit seeking to maxWatchedTime
    if (targetSeconds > maxWatchedTime) {
      triggerSecurityAlert('Seeking forward beyond your watched position is disabled.');
      return;
    }

    videoRef.current.currentTime = targetSeconds;
    setCurrentTime(targetSeconds);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onProgressUpdate(Math.round(duration), true);
    onVideoEnded();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="custom-player" ref={containerRef}>
      <video
        ref={videoRef}
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onClick={togglePlay}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
      />

      {/* Invisible overlay cover to block dragging/clicks/inspect on the video frame */}
      <div 
        className="player-mouse-overlay" 
        onClick={togglePlay}
        onContextMenu={(e) => {
          e.preventDefault();
          triggerSecurityAlert('Right-click is disabled to protect course content.');
        }}
      />

      {/* Security alert screen */}
      {securityAlert && (
        <div className="security-alert-overlay">
          <AlertOctagon size={48} className="shake-anim" />
          <h3>Access Policy Verification</h3>
          <p>{securityAlert}</p>
          <button className="btn-secondary" onClick={() => setSecurityAlert(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="player-controls">
        <div className="timeline-container" onClick={handleSeek}>
          <div className="timeline-track">
            {/* Dark green/cyan background representing maximum watched limit */}
            <div 
              className="timeline-max-watched"
              style={{ width: `${duration > 0 ? (maxWatchedTime / duration) * 100 : 0}%` }}
            />
            {/* Red/purple fill representing current playhead */}
            <div 
              className="timeline-fill"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div 
              className="timeline-handle"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="player-controls-row">
          <div className="controls-left">
            <button className="btn-player" onClick={togglePlay} aria-label="Toggle Play">
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            
            <button className="btn-player" onClick={() => {
              if (videoRef.current) videoRef.current.currentTime = 0;
            }} aria-label="Replay">
              <RotateCcw size={16} />
            </button>

            <span className="player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            <div className="volume-popover">
              <button className="btn-player" onClick={toggleMute} aria-label="Toggle Mute">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume Slider"
              />
            </div>

            <button className="btn-player" onClick={toggleFullscreen} aria-label="Fullscreen">
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
