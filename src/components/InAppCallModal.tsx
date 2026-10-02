import React, { useState, useEffect, useRef } from 'react';
import { Contact, UserProfile } from '../types';
import { callSounds } from '../utils/audioTones';
import { webrtcManager, RealCallSession } from '../services/webrtcCall';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Minimize2,
  Signal,
  MapPin,
  Monitor,
} from 'lucide-react';

interface InAppCallModalProps {
  contact: Contact;
  callType: 'video' | 'audio';
  isIncoming?: boolean;
  incomingCallData?: RealCallSession;
  currentUser?: UserProfile | null;
  onEndCall: () => void;
  onMinimize: () => void;
}

export const InAppCallModal: React.FC<InAppCallModalProps> = ({
  contact,
  callType,
  isIncoming = false,
  incomingCallData,
  currentUser,
  onEndCall,
  onMinimize,
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(callType === 'audio');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(20);
  const [hasRemoteVideo, setHasRemoteVideo] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize WebRTC Call on mount
  useEffect(() => {
    let isSubscribed = true;

    const handleRemoteStream = (stream: MediaStream) => {
      console.log('Attaching remote stream to video & audio elements:', stream);
      if (!isSubscribed) return;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch((err) => console.warn('Remote video play:', err));
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch((err) => console.warn('Remote audio play:', err));
      }

      const videoTracks = stream.getVideoTracks();
      const hasLiveVideo = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
      setHasRemoteVideo(hasLiveVideo);

      videoTracks.forEach((vt) => {
        vt.onunmute = () => {
          if (isSubscribed) setHasRemoteVideo(true);
        };
        vt.onmute = () => {
          if (isSubscribed) setHasRemoteVideo(false);
        };
      });
    };

    const handleStatusChange = (status: 'calling' | 'connected' | 'ended') => {
      if (!isSubscribed) return;
      if (status === 'connected') {
        callSounds.playConnectChime();
        setCallState('connected');
      } else if (status === 'ended') {
        callSounds.playEndChime();
        onEndCall();
      }
    };

    const setupCall = async () => {
      if (isIncoming && incomingCallData) {
        // Answering incoming call
        await webrtcManager.answerCall(incomingCallData, handleRemoteStream, handleStatusChange);
      } else if (currentUser) {
        // Initiating outgoing call
        callSounds.startOutgoingRing();
        await webrtcManager.startCall(
          {
            uid: currentUser.uid,
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
          {
            id: contact.id,
            name: contact.name,
            username: contact.username,
          },
          callType,
          handleRemoteStream,
          handleStatusChange
        );
      } else {
        // Fallback local stream preview
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: true,
          });
          webrtcManager.localStream = stream;
          setCallState('connected');
        } catch (e) {
          console.warn('Local preview stream notice:', e);
        }
      }

      // Attach local stream to preview element
      if (localVideoRef.current && webrtcManager.localStream) {
        localVideoRef.current.srcObject = webrtcManager.localStream;
        localVideoRef.current.play().catch((err) => console.warn('Local video play:', err));
      }
    };

    setupCall();

    return () => {
      isSubscribed = false;
      callSounds.stopRing();
      webrtcManager.endCall();
    };
  }, []);

  // Duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
        setAudioLevel(Math.floor(Math.random() * 50) + 15);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (webrtcManager.localStream) {
      webrtcManager.localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // inverted
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Camera
  const handleToggleVideo = () => {
    if (webrtcManager.localStream) {
      webrtcManager.localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // inverted
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Screen Share
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      return;
    }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (webrtcManager.pc) {
          const sender = webrtcManager.pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        setIsScreenSharing(true);
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (webrtcManager.localStream) {
            const originalVideoTrack = webrtcManager.localStream.getVideoTracks()[0];
            const sender = webrtcManager.pc?.getSenders().find((s) => s.track?.kind === 'video');
            if (sender && originalVideoTrack) {
              sender.replaceTrack(originalVideoTrack);
            }
          }
        };
      }
    } catch (e) {
      console.warn('Screen share cancelled/denied:', e);
    }
  };

  const handleEnd = () => {
    callSounds.playEndChime();
    webrtcManager.endCall();
    onEndCall();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden animate-in fade-in">
      {/* Explicit background audio element for guaranteed remote sound */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={isSpeakerMuted} />

      {/* Top Bar */}
      <div className="p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            {callType === 'video' ? <Video className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">{contact.name}</h3>
              <span className="font-mono text-xs text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                {contact.username}
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {callType === 'video' ? 'Jonli Video' : 'Jonli Ovoz'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{contact.city}, Rossiya</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono font-bold">
                {callState === 'ringing' ? 'Ulanmoqda...' : formatSeconds(callDuration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs text-slate-300">
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebRTC Jonli Aloqa</span>
          </div>

          <button
            onClick={onMinimize}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Kichraytirish"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        <div className="w-full h-full max-w-4xl max-h-[75vh] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative flex items-center justify-center">
          {/* Remote Video Element - ALWAYS rendered with playsInline */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={isSpeakerMuted}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              hasRemoteVideo ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />

          {/* Fallback card displayed when remote video is audio-only or connecting */}
          {!hasRemoteVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-15">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-20 scale-125 pointer-events-none"
              />

              <div className="relative z-10 space-y-4">
                <div className="relative mx-auto w-32 h-32 sm:w-44 sm:h-44">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-full h-full rounded-full object-cover border-4 border-emerald-500/60 shadow-2xl"
                  />
                  {callState === 'ringing' ? (
                    <span className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-60"></span>
                  ) : (
                    <div
                      className="absolute -inset-3 rounded-full border-2 border-emerald-400/50 transition-all duration-150"
                      style={{ transform: `scale(${1 + audioLevel / 200})` }}
                    />
                  )}
                </div>

                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-white">{contact.name}</h4>
                  <p className="font-mono text-blue-400 font-semibold text-sm">{contact.username}</p>
                  <p className="text-emerald-400 text-xs font-semibold mt-1">
                    {callState === 'ringing'
                      ? `${contact.city} bilan to‘g‘ridan-to‘g‘ri bog‘lanilmoqda...`
                      : 'Jonli muloqot ulandi'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Local Camera Picture-in-Picture */}
          {callType === 'video' && (
            <div className="absolute top-4 right-4 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-500/80 shadow-2xl z-30">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isVideoOff ? 'hidden' : 'block'
                }`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 text-center">
                  <VideoOff className="w-5 h-5 text-slate-500 mb-1" />
                  <span className="text-[10px]">Kamerangiz o‘chiq</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                Siz (Jonli)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Call Controls */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-slate-950/80 to-transparent flex items-center justify-center gap-3 sm:gap-5 z-20">
        {/* Toggle Mic */}
        <button
          onClick={handleToggleMute}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all active:scale-95 ${
            isMuted
              ? 'bg-red-600/20 border-red-500/50 text-red-400'
              : 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-700'
          }`}
          title={isMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o‘chirish'}
        >
          {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Toggle Video */}
        {callType === 'video' && (
          <button
            onClick={handleToggleVideo}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all active:scale-95 ${
              isVideoOff
                ? 'bg-red-600/20 border-red-500/50 text-red-400'
                : 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Kamerani yoqish' : 'Kamerani o‘chirish'}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
        )}

        {/* Screen Share */}
        {callType === 'video' && (
          <button
            onClick={handleToggleScreenShare}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all active:scale-95 ${
              isScreenSharing
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Ekran namoyish qilish"
          >
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Speaker Volume */}
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all active:scale-95 ${
            isSpeakerMuted
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-400'
              : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
          title={isSpeakerMuted ? 'Ovozni yoqish' : 'Karnayni o‘chirish'}
        >
          {isSpeakerMuted ? (
            <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </button>

        {/* End Call */}
        <button
          onClick={handleEnd}
          className="p-3.5 sm:p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/30 transition-all active:scale-90"
          title="Qo‘ng‘iroqni yakunlash"
        >
          <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>
    </div>
  );
};
