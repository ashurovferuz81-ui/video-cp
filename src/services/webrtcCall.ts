import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Metered OpenRelay free public TURN (essential for Carrier-Grade NAT & mobile firewalls)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export interface RealCallSession {
  callId: string;
  callerId: string;
  callerName: string;
  callerUsername: string;
  callerAvatar: string;
  recipientId: string;
  recipientName: string;
  recipientUsername: string;
  type: 'video' | 'audio';
  status: 'calling' | 'connected' | 'ended' | 'rejected';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: string;
}

function sanitizeCandidate(cand: RTCIceCandidate) {
  return {
    candidate: cand.candidate,
    sdpMid: cand.sdpMid || '',
    sdpMLineIndex: typeof cand.sdpMLineIndex === 'number' ? cand.sdpMLineIndex : 0,
  };
}

export class WebRtcCallManager {
  public pc: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public activeCallId: string | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];
  private unsubCallDoc: (() => void) | null = null;
  private unsubCandidates: (() => void) | null = null;

  // Initialize real peer connection
  private initPeerConnection(onRemoteStream: (stream: MediaStream) => void) {
    this.pendingCandidates = [];
    this.pc = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    this.pc.ontrack = (event) => {
      console.log('WebRTC ontrack received track kind:', event.track.kind);
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream?.getTracks().find((t) => t.id === track.id)) {
            this.remoteStream?.addTrack(track);
          }
        });
        onRemoteStream(event.streams[0]);
      } else {
        if (!this.remoteStream?.getTracks().find((t) => t.id === event.track.id)) {
          this.remoteStream?.addTrack(event.track);
        }
        if (this.remoteStream) {
          onRemoteStream(this.remoteStream);
        }
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('WebRTC connectionState:', this.pc?.connectionState);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log('WebRTC iceConnectionState:', this.pc?.iceConnectionState);
    };
  }

  private async flushPendingCandidates() {
    if (!this.pc || !this.pc.remoteDescription) return;
    while (this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      if (cand) {
        try {
          await this.pc.addIceCandidate(cand);
        } catch (e) {
          console.warn('Notice flushing candidate:', e);
        }
      }
    }
  }

  // Caller starts a real call
  async startCall(
    caller: { uid: string; name: string; username: string; avatar: string },
    recipient: { id: string; name: string; username: string },
    type: 'video' | 'audio',
    onRemoteStream: (stream: MediaStream) => void,
    onStatusChange: (status: 'calling' | 'connected' | 'ended') => void
  ): Promise<string> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.activeCallId = callId;

    // 1. Get real camera & audio
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      console.warn('Initial camera/audio request:', e);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err2) {
        this.localStream = new MediaStream();
      }
    }

    // 2. Setup RTCPeerConnection
    this.initPeerConnection(onRemoteStream);

    if (this.localStream && this.pc) {
      this.localStream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });
    }

    const callDocRef = doc(db, 'calls', callId);

    // 3. Setup caller ICE candidate collector
    const callerCandidatesRef = collection(db, 'calls', callId, 'callerCandidates');
    this.pc!.onicecandidate = (event) => {
      if (event.candidate) {
        const clean = sanitizeCandidate(event.candidate);
        addDoc(callerCandidatesRef, clean).catch((err) =>
          console.warn('Error saving caller candidate:', err)
        );
      }
    };

    // 4. Create real SDP Offer FIRST
    const offer = await this.pc!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await this.pc!.setLocalDescription(offer);

    // 5. Store document with OFFER ALREADY INCLUDED so recipient never receives undefined offer!
    await setDoc(callDocRef, {
      callerId: caller.uid,
      callerName: caller.name,
      callerUsername: caller.username,
      callerAvatar: caller.avatar,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientUsername: recipient.username,
      type,
      status: 'calling',
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
      createdAt: new Date().toISOString(),
    });

    // 6. Listen for recipient's answer and status changes
    this.unsubCallDoc = onSnapshot(callDocRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.status === 'connected' && onStatusChange) {
        onStatusChange('connected');
      }

      if (data.status === 'ended' || data.status === 'rejected') {
        onStatusChange('ended');
        this.endCall();
        return;
      }

      if (data.answer && this.pc && !this.pc.currentRemoteDescription) {
        const answerDesc = new RTCSessionDescription(data.answer);
        await this.pc.setRemoteDescription(answerDesc);
        await this.flushPendingCandidates();
        onStatusChange('connected');
      }
    });

    // 7. Listen for recipient ICE candidates
    const recipientCandidatesRef = collection(db, 'calls', callId, 'recipientCandidates');
    this.unsubCandidates = onSnapshot(recipientCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          if (d && d.candidate) {
            const cand = new RTCIceCandidate({
              candidate: d.candidate,
              sdpMid: d.sdpMid,
              sdpMLineIndex: d.sdpMLineIndex,
            });
            if (this.pc && this.pc.remoteDescription) {
              try {
                await this.pc.addIceCandidate(cand);
              } catch (err) {
                console.warn('Notice adding recipient candidate:', err);
              }
            } else {
              this.pendingCandidates.push(cand);
            }
          }
        }
      });
    });

    return callId;
  }

  // Recipient answers an incoming call
  async answerCall(
    callData: RealCallSession,
    onRemoteStream: (stream: MediaStream) => void,
    onStatusChange: (status: 'calling' | 'connected' | 'ended') => void
  ) {
    this.activeCallId = callData.callId;
    const callDocRef = doc(db, 'calls', callData.callId);

    // 1. Fetch fresh offer from Firestore if missing from initial snapshot
    let offer = callData.offer;
    if (!offer) {
      try {
        const freshSnap = await getDoc(callDocRef);
        offer = freshSnap.data()?.offer;
      } catch (err) {
        console.warn('Error fetching fresh call doc offer:', err);
      }
    }

    // 2. Get recipient's real camera & audio
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callData.type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      console.warn('Recipient media devices notice:', e);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err2) {
        this.localStream = new MediaStream();
      }
    }

    // 3. Setup RTCPeerConnection
    this.initPeerConnection(onRemoteStream);

    if (this.localStream && this.pc) {
      this.localStream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });
    }

    // 4. Send recipient ICE candidates to Firestore
    const recipientCandidatesRef = collection(db, 'calls', callData.callId, 'recipientCandidates');
    this.pc!.onicecandidate = (event) => {
      if (event.candidate) {
        const clean = sanitizeCandidate(event.candidate);
        addDoc(recipientCandidatesRef, clean).catch((err) =>
          console.warn('Error saving recipient candidate:', err)
        );
      }
    };

    // 5. Set remote offer
    if (offer && this.pc) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.flushPendingCandidates();
    } else {
      console.warn('No offer available on callData yet! Waiting for offer from doc...');
    }

    // 6. Create real SDP Answer
    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);

    // 7. Save answer and mark status 'connected'
    await updateDoc(callDocRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
      status: 'connected',
    });

    onStatusChange('connected');

    // 8. Listen for caller ICE candidates
    const callerCandidatesRef = collection(db, 'calls', callData.callId, 'callerCandidates');
    this.unsubCandidates = onSnapshot(callerCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          if (d && d.candidate) {
            const cand = new RTCIceCandidate({
              candidate: d.candidate,
              sdpMid: d.sdpMid,
              sdpMLineIndex: d.sdpMLineIndex,
            });
            if (this.pc && this.pc.remoteDescription) {
              try {
                await this.pc.addIceCandidate(cand);
              } catch (err) {
                console.warn('Notice adding caller candidate:', err);
              }
            } else {
              this.pendingCandidates.push(cand);
            }
          }
        }
      });
    });

    // 9. Listen for call termination
    this.unsubCallDoc = onSnapshot(callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data && (data.status === 'ended' || data.status === 'rejected')) {
        onStatusChange('ended');
        this.endCall();
      }
    });
  }

  // End active call
  async endCall() {
    if (this.activeCallId) {
      try {
        await updateDoc(doc(db, 'calls', this.activeCallId), {
          status: 'ended',
        });
      } catch (e) {
        console.warn('Notice ending call:', e);
      }
    }

    if (this.unsubCallDoc) {
      this.unsubCallDoc();
      this.unsubCallDoc = null;
    }
    if (this.unsubCandidates) {
      this.unsubCandidates();
      this.unsubCandidates = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.activeCallId = null;
    this.remoteStream = null;
    this.pendingCandidates = [];
  }
}

export const webrtcManager = new WebRtcCallManager();

/**
 * Listens for incoming calls
 */
export function listenForIncomingCalls(
  currentUid: string,
  onIncomingCall: (callData: RealCallSession) => void
) {
  const callsRef = collection(db, 'calls');
  const q = query(
    callsRef,
    where('recipientId', '==', currentUid),
    where('status', '==', 'calling')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        onIncomingCall({
          callId: change.doc.id,
          callerId: data.callerId,
          callerName: data.callerName,
          callerUsername: data.callerUsername,
          callerAvatar: data.callerAvatar,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          recipientUsername: data.recipientUsername,
          type: data.type,
          status: data.status,
          offer: data.offer,
          createdAt: data.createdAt,
        });
      }
    });
  });
}
