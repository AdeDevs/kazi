import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Professional, Booking, ChatMessage, Category } from '../types';
import { formatCurrency } from '../utils';
import { 
  Search, SendHorizontal, Image as ImageIcon, ArrowLeft, 
  CheckCheck, Check, Clock, User, MessageSquare,
  X, Paperclip, Mic, Play, Pause, MapPin, Navigation, 
  Video, ExternalLink, Square, ShieldCheck, Star, 
  Calendar, Briefcase, Phone, AlertCircle,
  Trash2
} from 'lucide-react';

interface CustomerMessagesProps {
  professionals: Professional[];
  bookings: Booking[];
  messages: ChatMessage[];
  onSendMessage?: (proId: string, text: string, mediaProps?: Partial<ChatMessage>) => void;
  onMarkAsRead?: (proId: string) => void;
  onOpenBooking?: (pro: Professional) => void;
  onSelectProForProfile?: (pro: Professional) => void;
  initialProId?: string;
}

interface ConversationItem {
  proId: string;
  professional: Professional;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  relatedBooking?: Booking;
}

const QUICK_REPLIES = [
  "Are you available for inspection today?",
  "Can you please send an estimate for this job?",
  "I've shared my location address.",
  "Thank you, see you at the scheduled time."
];

const SAMPLE_JOB_PHOTOS = [
  { name: 'Electrical Box', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Plumbing Pipe', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80' },
  { name: 'AC Compressor', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80' }
];

export const CustomerMessages: React.FC<CustomerMessagesProps> = ({
  professionals,
  bookings,
  messages,
  onSendMessage,
  onMarkAsRead,
  onOpenBooking,
  onSelectProForProfile,
  initialProId
}) => {
  // Selected conversation (null = Inbox list view, string = dedicated Full-Screen Chat page)
  const [selectedProId, setSelectedProId] = useState<string | null>(initialProId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'active_jobs'>('all');
  const [inputText, setInputText] = useState('');

  // Rich Attachments & Audio
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(40, textarea.scrollHeight), 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Voice recording timer
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

  // Assemble conversations for professionals who actually have messages or active bookings
  const conversations = useMemo(() => {
    return professionals
      .map(pro => {
        const proMsgs = messages
          .filter(m => (m.senderId === pro.id && m.recipientId === 'c1') || (m.senderId === 'c1' && m.recipientId === pro.id))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const lastMessage = proMsgs.length > 0 ? proMsgs[proMsgs.length - 1] : null;
        const unreadCount = proMsgs.filter(m => m.senderId === pro.id && m.recipientId === 'c1' && m.status !== 'read').length;

        const relatedBooking = bookings
          .filter(b => b.professionalId === pro.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        return {
          proId: pro.id,
          professional: pro,
          lastMessage,
          unreadCount,
          relatedBooking
        } as ConversationItem;
      })
      .filter(conv => conv.lastMessage !== null || conv.relatedBooking !== undefined)
      .sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        if (a.relatedBooking && !b.relatedBooking) return -1;
        if (!a.relatedBooking && b.relatedBooking) return 1;
        return b.professional.rating - a.professional.rating;
      });
  }, [professionals, messages, bookings]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter(conv => {
      if (filterTab === 'unread' && conv.unreadCount === 0) return false;
      if (filterTab === 'active_jobs' && (!conv.relatedBooking || ['completed', 'cancelled', 'closed'].includes(conv.relatedBooking.status))) {
        return false;
      }

      if (q) {
        const matchesName = conv.professional.name.toLowerCase().includes(q);
        const matchesCategory = conv.professional.category.toLowerCase().includes(q);
        const matchesNeighborhood = conv.professional.neighborhood.toLowerCase().includes(q);
        const matchesMsg = conv.lastMessage?.message.toLowerCase().includes(q);
        const matchesBooking = (conv.relatedBooking?.selectedService || '').toLowerCase().includes(q);
        return matchesName || matchesCategory || matchesNeighborhood || matchesMsg || matchesBooking;
      }
      return true;
    });
  }, [conversations, filterTab, searchQuery]);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.proId === selectedProId) || null;
  }, [conversations, selectedProId]);

  const activeMessages = useMemo(() => {
    if (!selectedProId) return [];
    return messages
      .filter(m => (m.senderId === selectedProId && m.recipientId === 'c1') || (m.senderId === 'c1' && m.recipientId === selectedProId))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedProId]);

  // Mark as read when active conversation opens
  useEffect(() => {
    if (selectedProId && onMarkAsRead) {
      onMarkAsRead(selectedProId);
    }
  }, [selectedProId, messages.length, onMarkAsRead]);

  // Scroll to bottom on new messages or when entering chat
  useEffect(() => {
    if (selectedProId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedProId, activeMessages.length]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedProId || !onSendMessage) return;

    onSendMessage(selectedProId, inputText.trim(), {
      mediaType: 'text',
      status: 'sent'
    });
    setInputText('');
    setShowAttachmentMenu(false);
  };

  const handleSendQuickReply = (text: string) => {
    if (!selectedProId || !onSendMessage) return;
    onSendMessage(selectedProId, text, {
      mediaType: 'text',
      status: 'sent'
    });
  };

  const handleSendSampleImage = (url: string) => {
    if (!selectedProId || !onSendMessage) return;
    onSendMessage(selectedProId, 'Photo attachment', {
      mediaType: 'image',
      mediaUrl: url,
      status: 'sent'
    });
    setShowAttachmentMenu(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProId || !onSendMessage) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onSendMessage(selectedProId, 'Photo attachment', {
          mediaType: 'image',
          mediaUrl: event.target.result as string,
          status: 'sent'
        });
        setShowAttachmentMenu(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendVoiceNote = () => {
    if (!selectedProId || !onSendMessage) return;
    const duration = Math.max(1, recordingSeconds);
    setIsRecording(false);
    onSendMessage(selectedProId, 'Voice Note', {
      mediaType: 'audio',
      mediaUrl: 'simulated_audio_url',
      duration,
      status: 'sent'
    });
    setShowAttachmentMenu(false);
  };

  const handleShareLocation = () => {
    if (!selectedProId || !onSendMessage) return;
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      onSendMessage(selectedProId, 'Shared current service address', {
        mediaType: 'location',
        locationData: {
          lat: 7.4243,
          lng: 3.9056,
          address: 'Bodija Market Road, Old Bodija, Ibadan',
          landmark: 'Opposite Total Energy Station'
        },
        status: 'sent'
      });
      setShowAttachmentMenu(false);
    }, 600);
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  // Decibel waveform sample heights for WhatsApp style full-width wave
  const waveformBars = [8, 14, 22, 12, 28, 18, 10, 24, 30, 16, 26, 12, 20, 28, 14, 8, 22, 16, 24, 10, 14, 26, 18, 30, 12, 20, 28, 14, 22, 16, 24, 12, 18, 26, 10, 22, 14, 28, 16, 20];

  // =========================================================================
  // VIEW 2: DEDICATED FULL CHAT SCREEN (DRILL-DOWN LEVEL 2)
  // =========================================================================
  if (selectedProId && activeConversation) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-112px)] space-y-2 animate-in fade-in duration-200 overflow-hidden">
        {/* Navigation Breadcrumb / Back Action */}
        <div className="flex items-center justify-between shrink-0">
          <button
            onClick={() => setSelectedProId(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-orange-500" />
            <span>Back to All Messages</span>
          </button>
        </div>

        {/* Dedicated Chat Container with internal scrolling only */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
            {/* Clickable Artisan Info -> Opens Profile */}
            <div 
              onClick={() => onSelectProForProfile && onSelectProForProfile(activeConversation.professional)}
              className="flex items-center gap-3 min-w-0 cursor-pointer group"
              title="Click to view artisan profile"
            >
              <div className="relative shrink-0">
                <img
                  src={activeConversation.professional.avatar}
                  alt={activeConversation.professional.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80 group-hover:ring-2 group-hover:ring-brand-orange-500/60 transition-all"
                />
                {activeConversation.professional.isAvailableNow && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-orange-600 dark:group-hover:text-brand-orange-400 transition-colors">
                    {activeConversation.professional.name}
                  </h2>
                  {activeConversation.professional.verified && (
                    <span 
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0"
                      title="Verified Artisan"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden sm:inline">Verified</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{activeConversation.professional.category}</span>
                  <span>•</span>
                  <span className="truncate max-w-[110px] sm:max-w-none">{activeConversation.professional.neighborhood}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {activeConversation.professional.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Book Job */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenBooking && (
                <button
                  onClick={() => onOpenBooking(activeConversation.professional)}
                  className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Job</span>
                </button>
              )}
            </div>
          </div>

          {/* Job Context Strip (if linked booking exists) with Escrow Icon */}
          {activeConversation.relatedBooking && (
            <div className="px-3.5 py-2 bg-navy-50/90 dark:bg-navy-950/70 border-b border-navy-100 dark:border-navy-900/60 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded-md bg-navy-900 text-white text-[9px] font-black shrink-0">
                  ACTIVE JOB
                </span>
                <span className="font-bold text-navy-900 dark:text-navy-100 truncate">
                  {activeConversation.relatedBooking.selectedService || activeConversation.relatedBooking.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeConversation.relatedBooking.totalPrice && (
                  <span className="font-black text-brand-orange-600 dark:text-brand-orange-400">
                    {formatCurrency(activeConversation.relatedBooking.totalPrice)}
                  </span>
                )}
                <span 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60"
                  title="Escrow Protected Payment"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Escrow Protected</span>
                </span>
              </div>
            </div>
          )}

          {/* Message Stream (Internal Scrolling Only) */}
          <div className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/40 dark:bg-slate-950/40">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-2xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="max-w-sm space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Start the conversation</h4>
                  <p className="text-xs text-slate-500">
                    Message {activeConversation.professional.name} to confirm diagnosis, ask for quotes, or share photos of the issue.
                  </p>
                </div>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isCustomer = msg.senderRole === 'customer';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[65%] p-3 rounded-2xl text-xs sm:text-sm space-y-2 shadow-2xs ${
                        isCustomer
                          ? 'bg-navy-900 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                      }`}
                    >
                      {/* Photo Attachment */}
                      {msg.mediaType === 'image' && msg.mediaUrl && (
                        <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedLightboxImage(msg.mediaUrl || null)}>
                          <img
                            src={msg.mediaUrl}
                            alt="Job attachment"
                            className="w-full max-h-60 object-cover hover:opacity-95 transition-opacity rounded-lg"
                          />
                        </div>
                      )}

                      {/* Voice Note */}
                      {msg.mediaType === 'audio' && (
                        <div className="flex items-center gap-3 py-1">
                          <button
                            type="button"
                            onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-xs shrink-0 ${
                              isCustomer ? 'bg-white text-navy-900' : 'bg-navy-900 text-white'
                            }`}
                          >
                            {playingAudioId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 rounded-full bg-slate-300/40 overflow-hidden">
                              <div className={`h-full ${isCustomer ? 'bg-white' : 'bg-navy-800'} ${playingAudioId === msg.id ? 'w-3/4 animate-pulse' : 'w-1/3'}`} />
                            </div>
                            <div className="flex justify-between text-[10px] opacity-80 font-mono">
                              <span>0:{msg.duration ? String(msg.duration).padStart(2, '0') : '05'}</span>
                              <span>Voice Note</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location Pin */}
                      {msg.mediaType === 'location' && msg.locationData && (
                        <div className={`p-2.5 rounded-xl border space-y-1 ${
                          isCustomer
                            ? 'bg-navy-950/40 border-navy-700 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <MapPin className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" />
                            <span>Service Location Pin</span>
                          </div>
                          <p className="text-xs opacity-90">{msg.locationData.address}</p>
                          {msg.locationData.landmark && (
                            <p className="text-[11px] opacity-75">Landmark: {msg.locationData.landmark}</p>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${msg.locationData.lat},${msg.locationData.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 ${
                              isCustomer ? 'text-brand-orange-400 hover:underline' : 'text-navy-700 dark:text-navy-400 hover:underline'
                            }`}
                          >
                            <span>Open in Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Regular Text Content */}
                      {msg.message && msg.mediaType !== 'image' && msg.mediaType !== 'audio' && msg.mediaType !== 'location' && (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      )}

                      {/* Timestamp & Status */}
                      <div className={`flex items-center justify-end gap-1.5 text-[10px] pt-0.5 ${
                        isCustomer ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isCustomer && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-300" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies (Auto-hide when user starts typing) */}
          {!inputText.trim() && (
            <div className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 animate-in fade-in duration-150">
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendQuickReply(reply)}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap transition-colors cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-700/60"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Composer - Aligned Elements */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shrink-0 relative">
            {showAttachmentMenu && (
              <div className="absolute bottom-full left-3.5 mb-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 z-20 w-72 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Share Media</span>
                  <button onClick={() => setShowAttachmentMenu(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <ImageIcon className="w-4 h-4 text-brand-orange-500" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    disabled={isLocating}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>{isLocating ? 'Locating...' : 'Share Location'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sample Issue Photos</p>
                  <div className="flex gap-2">
                    {SAMPLE_JOB_PHOTOS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendSampleImage(sample.url)}
                        className="flex-1 p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-colors cursor-pointer text-center"
                      >
                        <img src={sample.url} alt={sample.name} className="w-full h-10 object-cover rounded-md mb-1" />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate block">{sample.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Voice Recording Bar with WhatsApp-style Full-Width Waveform */}
            {isRecording ? (
              <div className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                {/* Timer */}
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 pl-1">
                  0:{String(recordingSeconds).padStart(2, '0')}
                </span>

                {/* WhatsApp-Style Full Width Waveform Bar */}
                <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 h-7 px-1.5 overflow-hidden">
                  {waveformBars.map((height, i) => (
                    <span
                      key={i}
                      className="w-1 min-w-[2px] bg-emerald-500 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.max(4, ((height + (recordingSeconds * 7) + (i * 3)) % 22) + 4)}px`,
                        opacity: 0.45 + (((i + recordingSeconds) % 6) * 0.1)
                      }}
                    />
                  ))}
                </div>

                {/* Cancel (Red Trash/Cancel) & Send (Green) */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRecording(false)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Cancel recording"
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendVoiceNote}
                    className="p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Send audio"
                  >
                    <SendHorizontal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Vertically Aligned Single Baseline Composer Controls */
              <form onSubmit={handleSendText} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    showAttachmentMenu
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="Attach Photo or Location"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRecording(true)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  title="Record Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                    placeholder={`Message ${activeConversation.professional.name.length > 14 ? activeConversation.professional.name.slice(0, 12) + '...' : activeConversation.professional.name}...`}
                    className="w-full pl-3.5 pr-3.5 py-2.5 min-h-[40px] max-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800 dark:focus:ring-brand-orange-500/40 resize-none leading-snug"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    inputText.trim()
                      ? 'bg-navy-900 hover:bg-navy-950 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {selectedLightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedLightboxImage(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={selectedLightboxImage} alt="Enlarged preview" className="w-full h-full object-contain" />
              <button
                onClick={() => setSelectedLightboxImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: DEDICATED FULL-WIDTH INBOX LIST (LEVEL 1)
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <span>Messages</span>
            {totalUnreadCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-orange-500 text-white text-xs font-bold shadow-xs">
                {totalUnreadCount} New
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                {conversations.length} {conversations.length === 1 ? 'Conversation' : 'Conversations'}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Direct communications, quotes, and updates with your booked artisans.
          </p>
        </div>
      </div>

      {/* Unified Search & Filter Toolbar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artisan name, trade, location, or message text..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800 dark:focus:ring-brand-orange-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-orange-500 text-white text-[10px] flex items-center justify-center font-black">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('active_jobs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === 'active_jobs'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Active Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Conversation Cards List */}
      {filteredConversations.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No messages found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active conversations match your query. Clear search or check other filter categories.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredConversations.map((conv) => {
            const hasUnread = conv.unreadCount > 0;
            const lastMsg = conv.lastMessage;
            const isYou = lastMsg?.senderRole === 'customer';

            return (
              <div
                key={conv.proId}
                onClick={() => setSelectedProId(conv.proId)}
                className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer shadow-xs active:scale-[0.99] flex items-start justify-between gap-3 sm:gap-4 hover:shadow-sm ${
                  hasUnread
                    ? 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left: Top-Aligned Avatar & Info */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0 mt-0.5">
                    <img
                      src={conv.professional.avatar}
                      alt={conv.professional.name}
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                    />
                    {conv.professional.isAvailableNow && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className={`text-sm sm:text-base truncate ${hasUnread ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                          {conv.professional.name}
                        </h3>
                        {conv.professional.verified && (
                          <ShieldCheck className="w-4 h-4 text-navy-800 dark:text-navy-400 fill-navy-800/10 shrink-0" />
                        )}
                      </div>

                      {lastMsg && (
                        <span className="text-xs shrink-0 text-slate-400 font-medium">
                          {formatMessageTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>

                    {/* Trade / Connected Job Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 truncate">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{conv.professional.category}</span>
                      <span>•</span>
                      <span>{conv.professional.neighborhood}</span>
                      {conv.relatedBooking && (
                        <>
                          <span>•</span>
                          <span className="text-navy-700 dark:text-navy-300 font-bold truncate">
                            Job: {conv.relatedBooking.selectedService || conv.relatedBooking.category}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Message Preview & Scalable Unread Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs sm:text-sm truncate ${hasUnread ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {lastMsg ? (
                          <>
                            {isYou && <span className="text-slate-400 font-normal">You: </span>}
                            {lastMsg.mediaType === 'image' ? '📷 Photo attachment' :
                             lastMsg.mediaType === 'audio' ? '🎤 Voice message' :
                             lastMsg.mediaType === 'location' ? '📍 Shared location pin' :
                             lastMsg.message}
                          </>
                        ) : (
                          <span className="italic text-slate-400">No messages yet</span>
                        )}
                      </p>

                      {hasUnread && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-orange-500 text-white text-[11px] font-black shrink-0 shadow-2xs flex items-center justify-center">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
