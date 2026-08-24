import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils';
import { 
  X, Send, Image as ImageIcon, Phone, ShieldCheck, User, 
  Paperclip, Mic, CheckCheck, Check, Clock, Smile, Play, Pause, 
  MapPin, Navigation, Video, Camera, Sparkles, Star, AlertCircle, ShieldAlert,
  MoreVertical, Download, Trash2, ExternalLink, RefreshCw, Square, ArrowLeft
} from 'lucide-react';
import { ChatMessage, Professional } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Professional | null;
  messages: ChatMessage[];
  onSendMessage: (text: string, mediaProps?: Partial<ChatMessage>) => void;
  currentUserRole: 'customer' | 'professional';
  onMarkAsRead?: () => void;
  onUpdateMessageStatus?: (msgId: string, status: 'sent' | 'delivered' | 'read') => void;
}

const QUICK_REPLIES = [
  "Hi, can you come inspect today?",
  "What is your price quote for this?",
  "I have shared my live location below.",
  "Thanks, see you shortly!"
];

const SAMPLE_IMAGES = [
  { name: 'Pipe Leak', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Electrical Box', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' },
  { name: 'AC Fault', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80' }
];

const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  professional,
  messages,
  onSendMessage,
  currentUserRole,
  onMarkAsRead
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  // Audio Recording State & Refs
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Playing Voice Note State & Active Audio Ref
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // In-Chat Rating Modal State
  const [showChatRatingModal, setShowChatRatingModal] = useState<boolean>(false);
  const [chatRating, setChatRating] = useState<number>(5);
  const [chatHoverRating, setChatHoverRating] = useState<number>(0);
  const [chatReviewComment, setChatReviewComment] = useState<string>('');
  const [chatSelectedTags, setChatSelectedTags] = useState<string[]>([]);
  const [ratingSuccessToast, setRatingSuccessToast] = useState<string | null>(null);

  // In-Chat Complaint / Dispute Modal State
  const [showChatComplaintModal, setShowChatComplaintModal] = useState<boolean>(false);
  const [chatComplaintReason, setChatComplaintReason] = useState<string>('Unpunctual / Delayed Arrival (Lateness)');
  const [chatComplaintDetails, setChatComplaintDetails] = useState<string>('');
  const [chatComplaintTicket, setChatComplaintTicket] = useState<{ id: string; reason: string } | null>(null);

  // Location Sharing State
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Auto-scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Dynamic style viewport state for keyboard sizing and viewport locking
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      if (window.visualViewport && window.innerWidth < 640) {
        setViewportStyle({
          height: `${window.visualViewport.height}px`,
          maxHeight: `${window.visualViewport.height}px`,
          width: `${window.visualViewport.width}px`,
          top: `${window.visualViewport.offsetTop}px`,
          left: `${window.visualViewport.offsetLeft}px`,
          position: 'fixed',
        });
      } else {
        setViewportStyle({});
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
      window.visualViewport.addEventListener('scroll', updateViewport);
    }
    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', updateViewport);
    updateViewport();

    // Reset layout viewport scroll on keyboard open / modal open
    window.scrollTo(0, 0);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
        window.visualViewport.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('scroll', updateViewport);
    };
  }, [isOpen]);

  // Auto-resize textarea height as content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(36, textarea.scrollHeight), 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (isOpen && onMarkAsRead) {
      onMarkAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, professional?.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  if (!isOpen || !professional) return null;

  // Send Message with Auto Pro Response simulation
  const handleSendText = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    onSendMessage(text, {
      mediaType: 'text',
      status: 'sent'
    });

    if (!textToSend) setInputText('');
    setShowAttachmentMenu(false);

    // Simulate Pro Typing & Response
    triggerProAutoReply(text);
  };

  const triggerProAutoReply = (userQuery: string) => {
    // Show pro typing indicator and mark user's message as read when pro views/types
    setTimeout(() => {
      setIsTyping(true);
      if (onMarkAsRead) {
        onMarkAsRead();
      }
    }, 1000);

    // Send pro reply after 2400ms
    setTimeout(() => {
      setIsTyping(false);

      // Ensure any sent user messages are marked read
      if (onMarkAsRead) {
        onMarkAsRead();
      }

      let replyText = `Thanks for the update! I am reviewing your request and will arrive shortly in ${professional.neighborhood}.`;
      if (userQuery.toLowerCase().includes('location') || userQuery.toLowerCase().includes('where')) {
        replyText = `Got your location coordinates! I am about 15 minutes away in ${professional.neighborhood}.`;
      } else if (userQuery.toLowerCase().includes('price') || userQuery.toLowerCase().includes('quote')) {
        replyText = `My rate is ${formatCurrency(professional.hourlyRate)}/hr. I can give an exact quote after inspecting the setup.`;
      } else if (userQuery.toLowerCase().includes('photo') || userQuery.toLowerCase().includes('image')) {
        replyText = `Received the clear photos! I am bringing the appropriate replacement tools and spare parts.`;
      }

      onSendMessage(replyText, {
        senderId: professional.id,
        senderName: professional.name,
        senderRole: 'professional',
        recipientId: 'c1',
        mediaType: 'text'
      });
    }, 2400);
  };

  // Image File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSendMessage('Sent an image attachment', {
          mediaType: 'image',
          mediaUrl: event.target.result as string,
          status: 'sent'
        });
        setShowAttachmentMenu(false);
        triggerProAutoReply('Image uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  // Send Sample Image
  const handleSendSampleImage = (url: string) => {
    onSendMessage('Sent job photo', {
      mediaType: 'image',
      mediaUrl: url,
      status: 'sent'
    });
    setShowAttachmentMenu(false);
    triggerProAutoReply('Image uploaded');
  };

  // Video Upload / Send Video
  const handleSendVideo = (videoUrl: string = SAMPLE_VIDEO_URL) => {
    onSendMessage('Sent a video clip', {
      mediaType: 'video',
      mediaUrl: videoUrl,
      status: 'sent'
    });
    setShowAttachmentMenu(false);
    triggerProAutoReply('Video clip sent');
  };

  // Start Microphone Audio Recording
  const handleStartRecording = async () => {
    audioChunksRef.current = [];
    setRecordingSeconds(0);
    setIsRecording(true);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.log('Microphone access fallback to simulated recording', err);
      }
    }
  };

  // Voice Note Recording Finish
  const handleStopAndSendVoiceNote = () => {
    setIsRecording(false);
    const duration = recordingSeconds || 4; // fallback 4 seconds

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        onSendMessage('Voice Note Recorded', {
          mediaType: 'audio',
          mediaUrl: audioUrl,
          duration,
          status: 'sent'
        });

        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        mediaRecorderRef.current = null;
        triggerProAutoReply('Voice note received');
      };
      mediaRecorderRef.current.stop();
    } else {
      onSendMessage('Voice Note', {
        mediaType: 'audio',
        mediaUrl: 'simulated_audio_stream',
        duration,
        status: 'sent'
      });
      triggerProAutoReply('Voice note received');
    }
  };

  // Location Sharing Trigger
  const handleShareLiveLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          onSendMessage('Shared Live Location', {
            mediaType: 'location',
            locationData: {
              lat,
              lng,
              address: `${professional.neighborhood}, Oyo State Sector`,
              landmark: 'GPS Pin (7.3775, 3.9470)'
            },
            status: 'sent'
          });
          setShowAttachmentMenu(false);
          triggerProAutoReply('Location shared');
        },
        () => {
          setIsLocating(false);
          onSendMessage('Shared Live Location', {
            mediaType: 'location',
            locationData: {
              lat: 7.3775,
              lng: 3.9470,
              address: `${professional.neighborhood} Hub, Oyo State`,
              landmark: 'Main Gate / GPS Marker'
            },
            status: 'sent'
          });
          setShowAttachmentMenu(false);
          triggerProAutoReply('Location shared');
        }
      );
    } else {
      setIsLocating(false);
      onSendMessage('Shared Live Location', {
        mediaType: 'location',
        locationData: {
          lat: 7.3775,
          lng: 3.9470,
          address: `${professional.neighborhood} Hub, Oyo State`,
          landmark: 'Main Gate'
        },
        status: 'sent'
      });
      setShowAttachmentMenu(false);
      triggerProAutoReply('Location shared');
    }
  };

  // Speak / Play Audio Handler
  const togglePlayAudio = (msgId: string, mediaUrl?: string, msgText?: string) => {
    if (playingAudioId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
    } else {
      // Stop currently playing audio/speech
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setPlayingAudioId(msgId);

      // 1. Real Audio URL Playback
      if (mediaUrl && (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('data:audio') || mediaUrl.startsWith('http'))) {
        const audio = new Audio(mediaUrl);
        activeAudioRef.current = audio;
        audio.play().catch(() => {
          speakFallbackText(msgText);
        });
        audio.onended = () => {
          setPlayingAudioId(null);
          activeAudioRef.current = null;
        };
        audio.onerror = () => {
          speakFallbackText(msgText);
        };
      } else {
        // 2. Speech Synthesis Playback for Voice Notes
        speakFallbackText(msgText);
      }
    }
  };

  const speakFallbackText = (msgText?: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = msgText && msgText !== 'Voice Note' && msgText !== 'Voice Note Recorded'
        ? msgText
        : `Voice message from ${professional.name}: Hello, I am on my way to your location for repair inspection.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setPlayingAudioId(null);
      }, 3500);
    }
  };

  // Submit In-Chat Rating
  const handleSubmitChatRating = () => {
    const comment = chatReviewComment.trim() || (chatSelectedTags.length > 0 ? chatSelectedTags.join(' • ') : 'Excellent professional service.');
    onSendMessage(`Customer Review Published: Rated ${chatRating}.0 Stars — "${comment}"`, {
      mediaType: 'text',
      status: 'sent'
    });
    setRatingSuccessToast(`Your ${chatRating}-star review for ${professional.name} was published!`);
    setTimeout(() => setRatingSuccessToast(null), 4000);
    setShowChatRatingModal(false);
    setChatReviewComment('');
    setChatSelectedTags([]);
  };

  // Submit In-Chat Complaint
  const handleSubmitChatComplaint = () => {
    const ticketId = `KAZI-DISPUTE-${Math.floor(1000 + Math.random() * 9000)}`;
    setChatComplaintTicket({ id: ticketId, reason: chatComplaintReason });

    onSendMessage(`⚠️ Escalation Support Ticket #${ticketId} Filed: "${chatComplaintReason}". Issue Details: ${chatComplaintDetails || 'Lateness / Service Concern reported directly in chat.'} Escrow payout paused while support team investigates.`, {
      mediaType: 'text',
      status: 'sent'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start sm:items-center sm:justify-center p-0 sm:p-2 md:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        style={Object.keys(viewportStyle).length > 0 ? viewportStyle : undefined}
        className="bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl max-w-6xl w-full h-full sm:h-[95vh] flex flex-col shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-all"
      >
        
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <button 
              onClick={onClose}
              className="sm:hidden p-1.5 -ml-1.5 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Back" aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative shrink-0">
              <img src={professional.avatar} alt={professional.name} className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-xs border border-slate-200/80 dark:border-slate-700/80" />
              {professional.isAvailableNow && (
                <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">{professional.name}</h3>
                {professional.verified && <ShieldCheck className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 fill-navy-800/10 shrink-0 hidden sm:block" />}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 sm:gap-1.5 truncate">
                <span className="truncate">{professional.category}</span>
                <span className="shrink-0">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 hidden sm:inline">Online</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {currentUserRole === 'customer' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowChatRatingModal(true)}
                  className="px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Rate & Review Artisan" aria-label="Rate & Review Artisan"
                >
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Rate Pro</span>
                  <span className="sm:hidden">Rate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChatComplaintModal(true);
                    setChatComplaintTicket(null);
                  }}
                  className="px-2 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Report Issue or Complain (Lateness/Quality)" aria-label="Report Issue or Complain (Lateness/Quality)"
                >
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Complain</span>
                  <span className="sm:hidden">Report</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="hidden sm:block p-1.5 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-0.5 sm:ml-0"
            >
              <X className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ================= MESSAGES LIST ================= */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-4 space-y-4 bg-slate-50/60 dark:bg-slate-950/60">
          
          {/* Security Banner */}
          <div className="p-3 rounded-2xl bg-navy-800/5 dark:bg-navy-400/10 border border-navy-800/20 text-center text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto space-y-1">
            <p className="font-bold text-navy-800 dark:text-navy-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Escrow Protected Messaging
            </p>
            <p className="text-[10px]">Keep all payments and contract discussions inside KaziHub for full guarantee protection.</p>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center mx-auto shadow-xs">
                <User className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Direct Chat with {professional.name}</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Share photos, send voice notes, or broadcast your live GPS location for seamless repair coordination.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === currentUserRole;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}>
                  
                  {/* Sender Name & Timestamp */}
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{isMe ? 'You' : msg.senderName}</span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-xs transition-all ${
                    isMe
                      ? 'bg-navy-800 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                  }`}>
                    
                    {/* 1. TEXT CONTENT */}
                    {msg.message && (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    )}

                    {/* 2. IMAGE CONTENT */}
                    {msg.mediaType === 'image' && msg.mediaUrl && (
                      <div className="mt-2 space-y-2">
                        <div 
                          onClick={() => setSelectedLightboxImage(msg.mediaUrl || null)}
                          className="relative rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 cursor-pointer group max-w-sm"
                        >
                          <img src={msg.mediaUrl} alt="Attached Media" className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                            <span>Click to Expand</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. VIDEO CONTENT */}
                    {msg.mediaType === 'video' && msg.mediaUrl && (
                      <div className="mt-2 space-y-2">
                        <div className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 max-w-sm bg-black">
                          <video 
                            controls 
                            poster="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80"
                            className="w-full max-h-52 rounded-2xl"
                          >
                            <source src={msg.mediaUrl} type="video/mp4" />
                            Your browser does not support video tag.
                          </video>
                        </div>
                      </div>
                    )}

                    {/* 4. VOICE NOTE / AUDIO CONTENT */}
                    {msg.mediaType === 'audio' && (
                      <div className="mt-2 p-3 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center gap-3 min-w-[200px]">
                        <button
                          onClick={() => togglePlayAudio(msg.id, msg.mediaUrl, msg.message)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isMe ? 'bg-white text-navy-800' : 'bg-navy-800 text-white'
                          }`}
                        >
                          {playingAudioId === msg.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          {/* Animated Waveform Bars */}
                          <div className="flex items-center gap-0.5 h-6">
                            {[40, 70, 30, 90, 60, 100, 50, 80, 40, 60, 90, 30, 70, 50, 80].map((h, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all ${
                                  playingAudioId === msg.id ? 'animate-pulse' : ''
                                } ${isMe ? 'bg-white/70' : 'bg-navy-800/70'}`}
                                style={{ height: `${playingAudioId === msg.id ? Math.max(20, (h * Math.random()) + 20) : h}%` }}
                              />
                            ))}
                          </div>
                          <div className={`flex items-center justify-between text-[10px] ${isMe ? 'text-slate-200' : 'text-slate-400'}`}>
                            <span>{playingAudioId === msg.id ? 'Playing...' : 'Voice Note'}</span>
                            <span>0:0{msg.duration || 5}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. LOCATION DATA CONTENT */}
                    {msg.mediaType === 'location' && msg.locationData && (
                      <div className="mt-2 p-3 rounded-2xl bg-slate-900 text-white space-y-2.5 max-w-sm border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold text-navy-400">
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-navy-400" /> Live GPS Pin</span>
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px]">Verified</span>
                        </div>
                        <div className="relative rounded-xl overflow-hidden h-28 bg-slate-800 flex items-center justify-center text-center p-3 border border-slate-700">
                          {/* Map Pattern Overlay */}
                          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#163a5f_1px,transparent_1px)] [background-size:16px_16px]"></div>
                          <div className="relative z-10 space-y-1">
                            <MapPin className="w-6 h-6 text-navy-400 mx-auto animate-bounce" />
                            <p className="font-bold text-xs truncate max-w-[200px]">{msg.locationData.address}</p>
                            <p className="text-[10px] text-slate-400">{msg.locationData.landmark}</p>
                          </div>
                        </div>
                        <a
                          href={`https://maps.google.com/?q=${msg.locationData.lat},${msg.locationData.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 bg-navy-800 hover:bg-navy-900 rounded-xl text-center text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Open in Navigation App</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}

                    {/* READ STATUS & TICKS (ONLY FOR MESSAGES SENT BY ME) */}
                    {isMe && (
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-200">
                        <span>
                          {msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}
                        </span>
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-200 fill-sky-200" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}

          {/* SIMULATED PRO TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <img src={professional.avatar} alt={professional.name} className="w-7 h-7 rounded-full object-cover" />
              <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-navy-800 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-navy-800 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-navy-800 rounded-full animate-bounce"></span>
                <span className="text-[10px] text-slate-400 ml-1 font-semibold">{professional.name.split(' ')[0]} is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= QUICK REPLIES BAR ================= */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Quick Replies:</span>
          {QUICK_REPLIES.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSendText(reply)}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-navy-800/10 hover:text-navy-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* ================= ATTACHMENT MENU POPUP ================= */}
        {showAttachmentMenu && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Share Media Attachment</span>
              <button onClick={() => setShowAttachmentMenu(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Photo Upload */}
              <label className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-colors shadow-xs">
                <ImageIcon className="w-5 h-5 text-navy-800 dark:text-navy-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Photo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Video Clip */}
              <button
                type="button"
                onClick={() => handleSendVideo()}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-colors shadow-xs"
              >
                <Video className="w-5 h-5 text-navy-800 dark:text-navy-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Video Clip</span>
              </button>

              {/* Live Location */}
              <button
                type="button"
                onClick={handleShareLiveLocation}
                disabled={isLocating}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-colors shadow-xs"
              >
                <MapPin className={`w-5 h-5 text-navy-800 dark:text-navy-400 ${isLocating ? 'animate-bounce' : ''}`} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isLocating ? 'Locating...' : 'Live GPS Pin'}</span>
              </button>

              {/* Preset Sample Photos */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400">Sample Photos:</span>
                {SAMPLE_IMAGES.slice(0, 2).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendSampleImage(img.url)}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate hover:bg-navy-800/10 cursor-pointer"
                  >
                    + {img.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= VOICE RECORDING BAR / INPUT FORM ================= */}
        {isRecording ? (
          <div className="p-3 sm:p-4 bg-red-500/5 dark:bg-rose-950/10 border-t border-red-500/20 flex items-center justify-between gap-2 sm:gap-4 animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0"></span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400 text-xs sm:text-sm truncate">
                Rec: 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsRecording(false)}
                className="px-2.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStopAndSendVoiceNote}
                className="px-3 sm:px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer"
              >
                <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                <span>Send Note</span>
              </button>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendText(); }} 
            className="p-2 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-1.5 sm:gap-3"
          >
            
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 mb-0.5 ${
                showAttachmentMenu
                  ? 'bg-navy-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-navy-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Attach File / Photo / Location" aria-label="Attach File / Photo / Location"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={handleStartRecording}
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 mb-0.5"
              title="Record Voice Note" aria-label="Record Voice Note"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center focus-within:border-navy-800/50 dark:focus-within:border-navy-400/50 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim()) {
                      handleSendText();
                    }
                  }
                }}
                placeholder="Type message..."
                rows={1}
                className="w-full bg-transparent px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none resize-none min-h-[36px] max-h-[100px] overflow-y-auto leading-normal"
                style={{ height: '36px' }}
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 sm:p-3.5 rounded-xl bg-navy-800 hover:bg-navy-900 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

          </form>
        )}

      </div>

      {/* LIGHTBOX MODAL FOR EXPANDED IMAGES */}
      {selectedLightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={selectedLightboxImage} alt="Expanded Attachment" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* RATING SUCCESS TOAST */}
      {ratingSuccessToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-60 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCheck className="w-4 h-4" />
          <span>{ratingSuccessToast}</span>
        </div>
      )}

      {/* IN-CHAT RATE ARTISAN MODAL */}
      {showChatRatingModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowChatRatingModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <Star className="w-8 h-8 fill-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Rate & Review {professional.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share your experience to help the KaziHub community and boost {professional.name}'s artisan ranking.
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setChatRating(star)}
                  onMouseEnter={() => setChatHoverRating(star)}
                  onMouseLeave={() => setChatHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (chatHoverRating || chatRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Service Tags */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Service Highlights</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Punctual & On Time',
                  'Neat & Clean Job',
                  'Fair & Honest Price',
                  'Highly Skilled',
                  'Polite & Respectful'
                ].map((tag) => {
                  const isSelected = chatSelectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setChatSelectedTags(chatSelectedTags.filter(t => t !== tag));
                        } else {
                          setChatSelectedTags([...chatSelectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-navy-800 border-navy-800 text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Comment */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Written Review</label>
              <textarea
                rows={3}
                value={chatReviewComment}
                onChange={(e) => setChatReviewComment(e.target.value)}
                placeholder="Write a brief comment about the service quality..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setShowChatRatingModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitChatRating}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-CHAT COMPLAINT / REPORT ISSUE MODAL */}
      {showChatComplaintModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 relative">
            <button
              onClick={() => {
                setShowChatComplaintModal(false);
                setChatComplaintTicket(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {chatComplaintTicket ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 animate-bounce">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Dispute Ticket Filed!</h3>
                  <p className="text-xs font-mono font-bold text-rose-500 mt-1">Ticket ID: #{chatComplaintTicket.id}</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 text-left space-y-2">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> KaziHub Resolution Guarantee Active
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Escrow payouts to {professional.name} have been put on hold. KaziHub Resolution Officers will contact both parties within 2 hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowChatComplaintModal(false);
                    setChatComplaintTicket(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs cursor-pointer"
                >
                  Return to Chat
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Report Issue / File Complaint</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Report issues regarding <strong>{professional.name}</strong>. Escrow payout will be paused during investigation.
                  </p>
                </div>

                {/* Complaint Reasons */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nature of Complaint</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                    {[
                      'Unpunctual / Delayed Arrival (Lateness)',
                      'Poor Quality Workmanship / Incomplete Job',
                      'Price Dispute or Unexpected Overcharging',
                      'Unprofessional / Rude Behavior',
                      'Property Damage or Safety Concern',
                      'Non-responsive after accepting booking'
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setChatComplaintReason(reason)}
                        className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                          chatComplaintReason === reason
                            ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{reason}</span>
                        {chatComplaintReason === reason && <Check className="w-4 h-4 text-rose-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complaint Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Problem Explanation</label>
                  <textarea
                    rows={3}
                    value={chatComplaintDetails}
                    onChange={(e) => setChatComplaintDetails(e.target.value)}
                    placeholder="Describe how late the artisan was, what went wrong, or price discrepancies..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChatComplaintModal(false)}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitChatComplaint}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    File Complaint
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
