import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import { DecibelAudioPlayer } from './DecibelAudioPlayer';
import { ChatComposer } from './ChatComposer';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

const ARTISAN_QUICK_REPLIES = [
  'Thanks, I’ve received your request.',
  'What time works best for you?',
  'Can you send a photo of the problem?',
  'I’m on my way.',
  'The job is done. Please check and confirm.',
];
import { FrozenComposerNotice } from './ui/FrozenNotice';
import { Professional, Booking, ChatMessage } from '../types';
import { 
  Search, Image as ImageIcon, ArrowLeft, 
  CheckCheck, Check, MessageSquare,
  X, MapPin, Navigation, 
  ExternalLink } from 'lucide-react';

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



// Shared by the desktop sidebar's search header and the chat pane's header so their bottom edges
// align in one continuous line across both panes, instead of each sizing to its own content.
const MESSAGES_HEADER_HEIGHT = 'h-[72px]';

export const ProfessionalMessages: React.FC<ProfessionalMessagesProps> = ({
  professional,
  messages,
  bookings,
  onSendMessage,
  onMarkAsRead,
  initialCustomerId
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const navigate = useNavigate();

  // Sync selectedCustomerId whenever initialCustomerId prop changes (e.g. navigating directly
  // between two /messages/:contactId URLs, which is the same Route match and so
  // doesn't remount this component on its own).
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Keeps /messages/:contactId in sync with which conversation is open, whichever
  // end triggers the change -- an in-app open/close click, or the browser's own Back/Forward.
  const selectCustomerId = (id: string | null) => {
    setSelectedCustomerId(id);
    navigate(id ? `/messages/${id}` : '/messages');
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recorder = useVoiceRecorder();

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  // Stays mounted ~150ms past showAttachmentMenu going false so the panel can animate its own
  // exit -- it's a normal in-flow block (not an overlay), so an instant unmount would also yank
  // its height out from under the composer instead of collapsing smoothly.
  const [renderAttachmentMenu, setRenderAttachmentMenu] = useState(false);
  useEffect(() => {
    if (showAttachmentMenu) {
      setRenderAttachmentMenu(true);
      return;
    }
    if (!renderAttachmentMenu) return;
    const timeout = setTimeout(() => setRenderAttachmentMenu(false), 150);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAttachmentMenu]);
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
        .filter(b => b.client_id === customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

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
    (c.relatedBooking?.title || c.relatedBooking?.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

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

  // Esc closes the open chat (WhatsApp Web behavior) -- this only deselects the conversation, it
  // never touches the list pane's own state or scroll position.
  useEffect(() => {
    if (!selectedCustomerId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectCustomerId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomerId]);

  const handleSend = () => {
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



  const handleStopAndSendVoiceNote = async () => {
    const note = await recorder.stop();
    if (!note || !selectedCustomerId || !onSendMessage) return;
    onSendMessage(selectedCustomerId, 'Voice note', {
      mediaType: 'audio',
      mediaUrl: note.dataUrl,
      duration: note.durationSeconds,
      status: 'sent'
    });
  };

  // Shares the phone's real position -- no fallback pin, which would point the client somewhere wrong.
  const handleShareLiveLocation = () => {
    if (!selectedCustomerId || !onSendMessage) return;
    if (!('geolocation' in navigator)) {
      toast.error('This device can’t share its location.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onSendMessage(selectedCustomerId, 'Shared my location', {
          mediaType: 'location',
          locationData: { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` },
          status: 'sent'
        });
        setShowAttachmentMenu(false);
      },
      () => {
        setIsLocating(false);
        toast.error('Couldn’t get your location. Allow location access and try again.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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

  // Conversation List body -- identical content used in both the mobile drill-down page and the
  // desktop sidebar pane, so it exists exactly once.
  const conversationListBody = (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {filteredConversations.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-500">No conversations found.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.map(conv => (
            <div
              key={conv.customerId}
              onClick={() => selectCustomerId(conv.customerId)}
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
                      Job: {conv.relatedBooking.title || conv.relatedBooking.category}
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
                      <span className="shrink-0 min-w-4 h-4 px-1 rounded-full bg-brand-orange-700 flex items-center justify-center text-center text-[9px] font-bold text-white leading-none shadow-xs">
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
  );

  // Chat header -- shared between the mobile full-screen chat and the desktop pane, except the
  // leading control: mobile gets a back arrow (there's a separate list page to return to), desktop
  // gets a close button in that same slot (the list pane is already visible alongside, so this
  // just deselects the conversation rather than navigating anywhere). Both call the same handler.
  // Shares MESSAGES_HEADER_HEIGHT with the desktop sidebar's search header below it, so their
  // bottom edges line up across both panes instead of each sizing to its own content.
  const renderChatHeader = (isMobile: boolean) => (
    <div className={`${MESSAGES_HEADER_HEIGHT} px-3.5 sm:px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => selectCustomerId(null)}
          className="-ml-1.5 p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title={isMobile ? 'Back to all messages' : 'Close chat'}
          aria-label={isMobile ? 'Back to all messages' : 'Close chat'}
        >
          {isMobile ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200/80 dark:border-slate-700/80 shrink-0">
          {activeConversation?.customerName.charAt(0)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {activeConversation?.customerName}
          </h3>
          {activeConversation?.relatedBooking && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Job Context: {activeConversation.relatedBooking.title || activeConversation.relatedBooking.category}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Message feed -- identical between mobile and desktop chat views.
  const messagesFeedBody = (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
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

                        {/* Render Audio / Voice Note -- the real recording, via the same player as the client's chat */}
                        {msg.mediaType === 'audio' && (
                          <div className="mt-2">
                            <DecibelAudioPlayer
                              msgId={msg.id}
                              mediaUrl={msg.mediaUrl}
                              duration={msg.duration || 5}
                              isCustomer={isMe}
                              activePlayingId={playingAudioId}
                              onPlayStateChange={(id) => setPlayingAudioId(id)}
                            />
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
  );

  // Attachment menu -- identical between mobile and desktop chat views. Stays mounted through its
  // own exit (see renderAttachmentMenu above); showAttachmentMenu drives the actual transition so
  // it retargets smoothly if toggled again mid-animation, instead of restarting from a keyframe.
  const attachmentMenuBody = (
    renderAttachmentMenu && (
              <div className={`p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-3 transition-all duration-150 ease-out ${
                showAttachmentMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Share Media Attachment</span>
                  <button onClick={() => setShowAttachmentMenu(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Photo Upload */}
                  <label className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-navy-800 transition-all shadow-xs">
                    <ImageIcon className="w-5 h-5 text-navy-800 dark:text-navy-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

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

                </div>
              </div>
    )
  );

  // Composer / voice recorder -- identical between mobile and desktop chat views. Bottom padding
  // adds the home-indicator safe-area inset on top of the normal spacing (0px on desktop/
  // non-notched phones, so this is a no-op everywhere except a notched phone in portrait).
  const { isFrozen } = useAccountFrozen();
  const composerBody = recorder.isRecording ? (
    <div className="px-3 sm:px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 flex items-center gap-3">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0" aria-hidden="true" />
      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
        {Math.floor(recorder.seconds / 60)}:{String(recorder.seconds % 60).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-[2px] h-7 overflow-hidden" aria-hidden="true">
        {recorder.waveform.map((h, i) => (
          <span key={i} className="w-[3px] shrink-0 rounded-full bg-rose-500/70" style={{ height: h }} />
        ))}
      </div>
      <button
        type="button"
        onClick={recorder.cancel}
        className="px-3 h-11 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/60 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleStopAndSendVoiceNote}
        className="px-4 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shrink-0 active:scale-[0.97] transition-transform"
      >
        Send
      </button>
    </div>
  ) : (
    <>
      {recorder.error && (
        <p className="px-4 py-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 border-t border-slate-200/90 dark:border-slate-800" role="alert">
          {recorder.error}
        </p>
      )}
      <ChatComposer
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        placeholder={activeConversation ? `Message ${activeConversation.customerName.split(' · ')[0]}…` : 'Type your message…'}
        quickReplies={ARTISAN_QUICK_REPLIES}
        onQuickReply={(text) => {
          if (selectedCustomerId && onSendMessage) onSendMessage(selectedCustomerId, text, { mediaType: 'text', status: 'sent' });
        }}
        onAttach={() => setShowAttachmentMenu(!showAttachmentMenu)}
        attachActive={showAttachmentMenu}
        onMic={() => { recorder.clearError(); recorder.start(); }}
        onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)}
      />
    </>
  );

  const emptyStateBody = (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
        <MessageSquare className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Your Messages</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Select a conversation from the left to read messages and reply to your customers.
      </p>
    </div>
  );

  const hasActiveChat = Boolean(selectedCustomerId && activeConversation);

  return (
    <>
      {/* ============================================================
          MOBILE / TABLET (< lg): no split-screen -- two separate
          full-screen states, matching the client app's existing
          drill-down (list page, then a dedicated chat page), not the
          desktop's simultaneous two-pane layout.
          ============================================================ */}
      <div className="lg:hidden">
        {hasActiveChat ? (
          // Full-screen chat -- breaks out of the page's padding so it's a true full page (not a
          // card floating in the gutter), WhatsApp-mobile style: back arrow lives in its own header.
          <div className="-m-3.5 sm:-m-4 -mb-4 h-[calc(var(--vvh,100dvh)-65px)] md:h-[calc(var(--vvh,100dvh)-73px)] flex flex-col bg-white dark:bg-slate-900">
            {renderChatHeader(true)}
            {messagesFeedBody}
            {attachmentMenuBody}
            {isFrozen ? <FrozenComposerNotice /> : composerBody}
          </div>
        ) : (
          // Conversation list page -- normal page flow (the page itself scrolls), matching the
          // client app's existing mobile inbox: title + count pill, then a search card, then rows.
          <div className="space-y-5">
            <div className="space-y-0.5">
              <p className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>Messages</span>
                {totalUnreadCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-orange-700 text-white text-xs font-bold shadow-xs">
                    {totalUnreadCount} New
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                    {conversations.length} {conversations.length === 1 ? 'Conversation' : 'Conversations'}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct communications, quotes, and updates with your customers.
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              {conversationListBody}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          DESKTOP (lg+): two-pane split, edge-to-edge -- breaks out of
          the page's padding so the pair spans the full viewport below
          the sticky header with no outer card/rounding/margin framing
          it as a unit, WhatsApp Web / Claude style. A single border-r
          divider separates the panes instead of two card outlines.
          ============================================================ */}
      <div className="hidden lg:flex -m-3.5 sm:-m-4 -mb-4 h-[calc(100dvh-73px)] overflow-hidden">
        <div className="w-80 xl:w-96 min-h-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <div className={`${MESSAGES_HEADER_HEIGHT} px-4 border-b border-slate-200 dark:border-slate-800 flex items-center shrink-0`}>
            <div className="relative w-full">
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
          {conversationListBody}
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-white dark:bg-slate-900">
          {hasActiveChat ? (
            <>
              {renderChatHeader(false)}
              {messagesFeedBody}
              {attachmentMenuBody}
              {isFrozen ? <FrozenComposerNotice /> : composerBody}
            </>
          ) : emptyStateBody}
        </div>
      </div>

      {/* LIGHTBOX FOR ZOOMING IMAGES */}
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
    </>
  );
};
