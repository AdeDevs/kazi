import React, { useState, useRef, useEffect } from 'react';
import { Professional, Booking, ChatMessage } from '../types';
import { 
  Search, Send, Image as ImageIcon, ArrowLeft, 
  CheckCheck, Check, Clock, User, MessageSquare,
  X, Paperclip, Mic, Play, Pause, MapPin, Navigation, 
  Video, ExternalLink, Square
} from 'lucide-react';

interface ProfessionalMessagesProps {
  professional: Professional;
  messages: ChatMessage[];
  bookings: Booking[];
  onSendMessage?: (customerId: string, text: string, mediaProps?: Partial<ChatMessage>) => void;
  onMarkAsRead?: (customerId: string) => void;
  initialCustomerId?: string;
}

interface Conversation {
  customerId: string;
  customerName: string;
  lastMessage: ChatMessage;
  unreadCount: number;
  relatedBooking?: Booking;
}

const SAMPLE_IMAGES = [
  { name: 'Pipe Repair', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Breaker Box', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Compressor', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80' }
];

const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export const ProfessionalMessages: React.FC<ProfessionalMessagesProps> = ({
  professional,
  messages,
  bookings,
  onSendMessage,
  onMarkAsRead,
  initialCustomerId
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea height as content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(36, textarea.scrollHeight), 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Expanded Rich Attachments State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Group messages into conversations
  const conversationsMap = new Map<string, Conversation>();
  
  messages.forEach(msg => {
    const isCustomerSender = msg.senderRole === 'customer';
    const customerId = isCustomerSender ? msg.senderId : msg.recipientId;
    const customerName = isCustomerSender ? msg.senderName : (messages.find(m => m.senderId === customerId)?.senderName || 'Customer');
    
    const existing = conversationsMap.get(customerId);
    const msgTime = new Date(msg.timestamp).getTime();
    
    if (!existing || new Date(existing.lastMessage.timestamp).getTime() < msgTime) {
      let unreadCount = existing ? existing.unreadCount : 0;
      if (isCustomerSender && msg.status !== 'read') {
        unreadCount += 1;
      }
      
      // Find related booking (most recent one for this customer)
      const relatedBooking = bookings
        .filter(b => b.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      conversationsMap.set(customerId, {
        customerId,
        customerName,
        lastMessage: msg,
        unreadCount,
        relatedBooking
      });
    } else if (isCustomerSender && msg.status !== 'read') {
      existing.unreadCount += 1;
    }
  });

  const conversations = Array.from(conversationsMap.values())
    .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

  const filteredConversations = conversations.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.relatedBooking?.selectedService || c.relatedBooking?.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.customerId === selectedCustomerId);
  const activeMessages = messages
    .filter(m => (m.senderId === selectedCustomerId && m.recipientId === professional.id) || 
                 (m.senderId === professional.id && m.recipientId === selectedCustomerId))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Mark as Read
  useEffect(() => {
    if (selectedCustomerId && onMarkAsRead) {
      onMarkAsRead(selectedCustomerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    if (selectedCustomerId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedCustomerId, activeMessages.length]);

  // Recording Timer
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedCustomerId || !onSendMessage) return;
    
    onSendMessage(selectedCustomerId, inputText.trim(), {
      mediaType: 'text',
      status: 'sent'
    });
    setInputText('');
    setShowAttachmentMenu(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCustomerId || !onSendMessage) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSendMessage(selectedCustomerId, 'Photo attachment', {
          mediaType: 'image',
          mediaUrl: event.target.result as string,
          status: 'sent'
        });
        setShowAttachmentMenu(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendSampleImage = (url: string) => {
    if (!selectedCustomerId || !onSendMessage) return;
    onSendMessage(selectedCustomerId, 'Sent photo', {
      mediaType: 'image',
      mediaUrl: url,
      status: 'sent'
    });
    setShowAttachmentMenu(false);
  };

  const handleSendVideo = (videoUrl: string = SAMPLE_VIDEO_URL) => {
    if (!selectedCustomerId || !onSendMessage) return;
    onSendMessage(selectedCustomerId, 'Sent a video clip', {
      mediaType: 'video',
      mediaUrl: videoUrl,
      status: 'sent'
    });
    setShowAttachmentMenu(false);
  };

  const handleStopAndSendVoiceNote = () => {
    if (!selectedCustomerId || !onSendMessage) return;
    setIsRecording(false);
    const duration = recordingSeconds || 4;

    onSendMessage(selectedCustomerId, 'Voice Note', {
      mediaType: 'audio',
      mediaUrl: 'simulated_audio_stream',
      duration,
      status: 'sent'
    });
  };

  const handleShareLiveLocation = () => {
    if (!selectedCustomerId || !onSendMessage) return;
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          onSendMessage(selectedCustomerId, 'Shared Live Location', {
            mediaType: 'location',
            locationData: {
              lat,
              lng,
              address: `${professional.neighborhood || 'Bodija'}, Oyo State`,
              landmark: 'Partner Real-Time GPS'
            },
            status: 'sent'
          });
          setShowAttachmentMenu(false);
        },
        () => {
          setIsLocating(false);
          onSendMessage(selectedCustomerId, 'Shared Live Location', {
            mediaType: 'location',
            locationData: {
              lat: 7.3775,
              lng: 3.9470,
              address: `${professional.neighborhood || 'Bodija'}, Oyo State`,
              landmark: 'Partner Station'
            },
            status: 'sent'
          });
          setShowAttachmentMenu(false);
        }
      );
    } else {
      setIsLocating(false);
      onSendMessage(selectedCustomerId, 'Shared Live Location', {
        mediaType: 'location',
        locationData: {
          lat: 7.3775,
          lng: 3.9470,
          address: `${professional.neighborhood || 'Bodija'}, Oyo State`,
          landmark: 'GPS Pin'
        },
        status: 'sent'
      });
      setShowAttachmentMenu(false);
    }
  };

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

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
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      setPlayingAudioId(msgId);

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
        speakFallbackText(msgText);
      }
    }
  };

  const speakFallbackText = (msgText?: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = msgText && msgText !== 'Voice Note'
        ? msgText
        : "Voice message: Hello, I have reviewed your request and will arrive shortly.";
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingAudioId(null), 3500);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full max-w-none h-[calc(100vh-85px)] md:h-[calc(100vh-100px)] min-h-[450px] flex gap-4 lg:gap-6 animate-in fade-in duration-300">
      
      {/* Left Panel: Conversation List */}
      <div className={`w-full lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${selectedCustomerId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex md:hidden items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No conversations found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredConversations.map(conv => (
                <div 
                  key={conv.customerId}
                  onClick={() => setSelectedCustomerId(conv.customerId)}
                  className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedCustomerId === conv.customerId ? 'bg-navy-50 dark:bg-navy-900/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200/80 dark:border-slate-700/80">
                      {conv.customerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                          {conv.customerName}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {formatDateLabel(conv.lastMessage.timestamp) === 'Today' 
                            ? formatTime(conv.lastMessage.timestamp)
                            : formatDateLabel(conv.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      {conv.relatedBooking && (
                        <div className="text-[10px] font-semibold text-navy-600 dark:text-navy-400 mb-0.5 truncate">
                          Job: {conv.relatedBooking.selectedService || conv.relatedBooking.category}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {conv.lastMessage.senderId === professional.id ? 'You: ' : ''}
                          {conv.lastMessage.mediaType === 'image' ? 'Photo attached' 
                            : conv.lastMessage.mediaType === 'audio' ? 'Voice Note'
                            : conv.lastMessage.mediaType === 'location' ? 'GPS Location'
                            : conv.lastMessage.mediaType === 'video' ? 'Video clip'
                            : conv.lastMessage.message}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 min-w-4 h-4 px-1 rounded-full bg-brand-orange-500 flex items-center justify-center text-center text-[9px] font-bold text-white leading-none shadow-xs">
                            <span className="flex items-center justify-center text-center">{conv.unreadCount}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Active Conversation */}
      <div className={`w-full lg:flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden ${selectedCustomerId ? 'flex' : 'hidden lg:flex'}`}>
        {selectedCustomerId && activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedCustomerId(null)}
                  className="lg:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0">
                  {activeConversation.customerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {activeConversation.customerName}
                  </h3>
                  {activeConversation.relatedBooking && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      Job Context: {activeConversation.relatedBooking.selectedService || activeConversation.relatedBooking.category}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
              {activeMessages.map((msg, index) => {
                const isMe = msg.senderId === professional.id;
                const showDate = index === 0 || formatDateLabel(msg.timestamp) !== formatDateLabel(activeMessages[index - 1].timestamp);

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                          {formatDateLabel(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-xs transition-all ${
                        isMe 
                          ? 'bg-navy-800 text-white rounded-tr-xs' 
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                      }`}>
                        {/* Render Text Message if exists */}
                        {msg.message && (
                          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                        )}

                        {/* Render Image Attachments */}
                        {(msg.mediaType === 'image' || msg.imageUrl) && (
                          <div className="mt-2 space-y-2">
                            <div 
                              onClick={() => setSelectedLightboxImage(msg.mediaUrl || msg.imageUrl || null)}
                              className="relative rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 cursor-pointer group max-w-sm"
                            >
                              <img 
                                src={msg.mediaUrl || msg.imageUrl} 
                                alt="Attached Media" 
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform" 
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                                <span>Click to Expand</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Render Video Clips */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="mt-2 space-y-2">
                            <div className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 max-w-sm bg-black">
                              <video 
                                controls 
                                className="w-full max-h-52 rounded-2xl"
                              >
                                <source src={msg.mediaUrl} type="video/mp4" />
                                Your browser does not support video playback.
                              </video>
                            </div>
                          </div>
                        )}

                        {/* Render Audio / Voice Note */}
                        {msg.mediaType === 'audio' && (
                          <div className="mt-2 p-3 rounded-2xl bg-black/15 dark:bg-white/10 flex items-center gap-3 min-w-[200px]">
                            <button
                              onClick={() => togglePlayAudio(msg.id, msg.mediaUrl, msg.message)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                isMe ? 'bg-white text-navy-800' : 'bg-navy-800 text-white'
                              }`}
                            >
                              {playingAudioId === msg.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>

                            <div className="flex-1 space-y-1">
                              {/* Waveform Bars */}
                              <div className="flex items-center gap-0.5 h-6">
                                {[40, 70, 30, 90, 60, 100, 50, 80, 40, 60, 90, 30, 70, 50, 80].map((h, i) => (
                                  <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all ${
                                      playingAudioId === msg.id ? 'animate-pulse' : ''
                                    } ${isMe ? 'bg-white/70' : 'bg-navy-850/70 dark:bg-white/40'}`}
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

                        {/* Render Location Card */}
                        {msg.mediaType === 'location' && msg.locationData && (
                          <div className="mt-2 p-3 rounded-2xl bg-slate-900 text-white space-y-2.5 max-w-sm border border-slate-800">
                            <div className="flex items-center justify-between text-xs font-bold text-navy-400">
                              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-navy-400" /> GPS Live Pin</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px]">Active</span>
                            </div>
                            <div className="relative rounded-xl overflow-hidden h-28 bg-slate-800 flex items-center justify-center text-center p-3 border border-slate-700">
                              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#2b5f93_1px,transparent_1px)] [background-size:16px_16px]"></div>
                              <div className="relative z-10 space-y-1">
                                <MapPin className="w-6 h-6 text-navy-400 mx-auto animate-bounce" />
                                <p className="font-bold text-xs truncate max-w-[200px]">{msg.locationData.address}</p>
                                <p className="text-[10px] text-slate-400">{msg.locationData.landmark || 'GPS Coordinates'}</p>
                              </div>
                            </div>
                            <a
                              href={`https://maps.google.com/?q=${msg.locationData.lat},${msg.locationData.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-2 bg-navy-800 hover:bg-navy-900 rounded-xl text-center text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Navigate with Map</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Msg Ticks & Timestamp */}
                      <div className="flex items-center gap-1.5 mt-1 mx-1">
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatTime(msg.timestamp)}
                        </span>
                        {isMe && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400" />
                          )
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment Menu Popup */}
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
                  <label className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-all shadow-xs">
                    <ImageIcon className="w-5 h-5 text-navy-800 dark:text-navy-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  {/* Video Clip */}
                  <button
                    type="button"
                    onClick={() => handleSendVideo()}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-all shadow-xs"
                  >
                    <Video className="w-5 h-5 text-navy-800 dark:text-navy-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Video Clip</span>
                  </button>

                  {/* GPS Location Pin */}
                  <button
                    type="button"
                    onClick={handleShareLiveLocation}
                    disabled={isLocating}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-all shadow-xs"
                  >
                    <MapPin className={`w-5 h-5 text-navy-800 dark:text-navy-400 ${isLocating ? 'animate-bounce' : ''}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{isLocating ? 'Locating...' : 'Live GPS Pin'}</span>
                  </button>

                  {/* Sample presets */}
                  <div className="flex flex-col gap-1 justify-center">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Sample Presets:</span>
                    {SAMPLE_IMAGES.slice(0, 2).map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendSampleImage(img.url)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate hover:bg-navy-800/10 cursor-pointer text-left"
                      >
                        + {img.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Composer / Voice Recorder */}
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
              <div className="p-2 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleSend} className="flex items-end gap-1.5 sm:gap-3">
                  
                  {/* Attach Paperclip button */}
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 mb-0.5 ${
                      showAttachmentMenu
                        ? 'bg-navy-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-navy-800 dark:hover:text-navy-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Attach File / Photo / Location" aria-label="Attach File / Photo / Location"
                  >
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={() => setIsRecording(true)}
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0 cursor-pointer mb-0.5"
                    title="Record Voice Note" aria-label="Record Voice Note"
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Main Input Textarea */}
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-brand-orange-500 focus-within:ring-2 focus-within:ring-brand-orange-500/50 overflow-hidden">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full bg-transparent px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none resize-none min-h-[36px] max-h-[100px] overflow-y-auto leading-normal"
                      style={{ height: '36px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (inputText.trim()) {
                            handleSend(e);
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Submit Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 sm:p-3.5 bg-navy-800 text-white rounded-xl hover:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer mb-0.5"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Your Messages</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Select a conversation from the left to read messages and reply to your customers.
            </p>
          </div>
        )}
      </div>

      {/* LIGHTBOX FOR ZOOMING IMAGES */}
      {selectedLightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedLightboxImage} 
              alt="Expanded Attachment" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" 
            />
          </div>
        </div>
      )}

    </div>
  );
};
