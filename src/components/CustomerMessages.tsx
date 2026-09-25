import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BubbleMeta, ChatBubble, ChatDaySeparator, formatChatDay } from './chat/ChatBubble';
import { useNavigate } from 'react-router-dom';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import { FrozenComposerNotice } from './ui/FrozenNotice';
import { Professional, Booking, ChatMessage } from '../types';
import { formatCurrency, isBookingArchived } from '../utils';
import { 
  Search, ArrowLeft,
  MessageSquare,
  X, MapPin, ExternalLink, Star,
  Calendar, AlertCircle
} from 'lucide-react';
import { VoiceNotePlayer } from './chat/VoiceNotePlayer';
import { ImageMessage, imageCaption } from './chat/ImageMessage';
import { PhotoPreviewSheet } from './chat/PhotoPreviewSheet';
import { AttachmentMenu } from './chat/AttachmentMenu';
import { ImageLightbox } from './chat/ImageLightbox';
import { compressImage } from '../lib/imageCompress';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { ChatComposer } from './ChatComposer';
import { VerifiedBadge } from './ui/VerifiedBadge';

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


// Shared by the desktop sidebar's search header and the chat pane's header so their bottom edges
// align in one continuous line across both panes, instead of each sizing to its own content.
const MESSAGES_HEADER_HEIGHT = 'h-[72px]';

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
  const navigate = useNavigate();

  // Sync selectedProId whenever initialProId prop changes (e.g. clicking Message from explore/booking cards)
  useEffect(() => {
    if (initialProId) {
      setSelectedProId(initialProId);
    }
  }, [initialProId]);

  // Keeps /messages/:contactId in sync with which conversation is open, whichever end
  // triggers the change -- an in-app open/close click, or the browser's own Back/Forward.
  const selectProId = (id: string | null) => {
    setSelectedProId(id);
    navigate(id ? `/messages/${id}` : '/messages');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'active_jobs'>('all');
  const [inputText, setInputText] = useState('');

  // Attachments, photos and voice notes
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  // The photo picked from the attachment menu, waiting in the preview sheet for a caption / send.
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const recorder = useVoiceRecorder();
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  // Only one voice note plays at a time across the thread.
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  // Microphone / location problems, shown above the composer.
  const [chatError, setChatError] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleStartRecording = () => {
    setChatError(null);
    setShowAttachmentMenu(false);
    recorder.start();
  };

  const handleSendVoiceNote = async () => {
    setIsSendingVoice(true);
    const note = await recorder.stop();
    setIsSendingVoice(false);
    if (!note || !selectedProId || !onSendMessage) return;
    onSendMessage(selectedProId, 'Voice note', {
      mediaType: 'audio',
      mediaUrl: note.dataUrl,
      duration: note.durationSeconds,
      waveform: note.peaks,
      status: 'sent',
    });
  };

  // Assemble conversations for professionals who have messages, active bookings, or is currently selected to chat
  const conversations = useMemo(() => {
    return professionals
      .map(pro => {
        const proMsgs = messages
          .filter(m => (m.senderId === pro.id && m.recipientId === 'c1') || (m.senderId === 'c1' && m.recipientId === pro.id))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const lastMessage = proMsgs.length > 0 ? proMsgs[proMsgs.length - 1] : null;
        const unreadCount = proMsgs.filter(m => m.senderId === pro.id && m.recipientId === 'c1' && m.status !== 'read').length;

        const relatedBooking = bookings
          .filter(b => b.artisan_id === pro.id || b.artisan_id === pro.user_id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        return {
          proId: pro.id,
          professional: pro,
          lastMessage,
          unreadCount,
          relatedBooking
        } as ConversationItem;
      })
      .filter(conv => conv.lastMessage !== null || conv.relatedBooking !== undefined || conv.proId === selectedProId)
      .sort((a, b) => {
        if (a.proId === selectedProId && b.proId !== selectedProId) return -1;
        if (b.proId === selectedProId && a.proId !== selectedProId) return 1;
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        if (a.relatedBooking && !b.relatedBooking) return -1;
        if (!a.relatedBooking && b.relatedBooking) return 1;
        return b.professional.rating_average - a.professional.rating_average;
      });
  }, [professionals, messages, bookings, selectedProId]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter(conv => {
      if (filterTab === 'unread' && conv.unreadCount === 0) return false;
      if (filterTab === 'active_jobs' && (!conv.relatedBooking || isBookingArchived(conv.relatedBooking))) {
        return false;
      }

      if (q) {
        const matchesName = conv.professional.name.toLowerCase().includes(q);
        const matchesCategory = conv.professional.category.toLowerCase().includes(q);
        const matchesNeighborhood = conv.professional.neighborhood.toLowerCase().includes(q);
        const matchesMsg = conv.lastMessage?.message.toLowerCase().includes(q);
        const matchesBooking = (conv.relatedBooking?.title || '').toLowerCase().includes(q);
        return matchesName || matchesCategory || matchesNeighborhood || matchesMsg || matchesBooking;
      }
      return true;
    });
  }, [conversations, filterTab, searchQuery]);

  const activePro = useMemo(() => {
    if (!selectedProId) return null;
    return professionals.find(p => p.id === selectedProId) || null;
  }, [professionals, selectedProId]);

  const activeConversation = useMemo(() => {
    if (!selectedProId) return null;
    const found = conversations.find(c => c.proId === selectedProId);
    if (found) return found;
    if (activePro) {
      const relatedBooking = bookings
        .filter(b => b.artisan_id === activePro.id || b.artisan_id === activePro.user_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      return {
        proId: activePro.id,
        professional: activePro,
        lastMessage: null,
        unreadCount: 0,
        relatedBooking
      } as ConversationItem;
    }
    return null;
  }, [conversations, selectedProId, activePro, bookings]);

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

  // Esc closes the open chat (WhatsApp Web behavior) -- this only deselects the conversation, it
  // never touches the list pane's own state or scroll position.
  useEffect(() => {
    if (!selectedProId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectProId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProId]);

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


  const handlePickPhoto = async (file: File) => {
    setShowAttachmentMenu(false);
    if (!file.type.startsWith('image/')) {
      setChatError('Choose a photo to send.');
      return;
    }
    setPendingPhoto(await compressImage(file));
  };

  const handleSendPhoto = (caption: string) => {
    if (!pendingPhoto || !selectedProId || !onSendMessage) return;
    onSendMessage(selectedProId, caption || 'Photo', { mediaType: 'image', mediaUrl: pendingPhoto, status: 'sent' });
    setPendingPhoto(null);
  };

  // Shares the phone's real position. No fallback pin: a made-up location would send the artisan
  // to the wrong place.
  const handleShareLocation = () => {
    if (!selectedProId || !onSendMessage) return;
    if (!('geolocation' in navigator)) {
      setChatError('This device can’t share its location.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onSendMessage(selectedProId, 'Shared my location', {
          mediaType: 'location',
          locationData: { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` },
          status: 'sent'
        });
        setShowAttachmentMenu(false);
      },
      () => {
        setIsLocating(false);
        setChatError('Couldn’t get your location. Allow location access and try again.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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

  // Chat header -- shared between the mobile full-screen chat and the desktop pane, except the
  // leading control: mobile gets a back arrow (there's a separate list page to return to), desktop
  // gets a close button in that same slot (the list pane is already visible alongside, so this
  // just deselects the conversation rather than navigating anywhere). Both call the same handler.
  const renderChatHeader = (isMobile: boolean) => {
    if (!activeConversation) return null;
    return (
      <div className={`${MESSAGES_HEADER_HEIGHT} px-3 sm:px-3.5 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 sm:gap-3 shrink-0`}>
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => selectProId(null)}
            className="-ml-1 p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={isMobile ? 'Back to all messages' : 'Close chat'}
            aria-label={isMobile ? 'Back to all messages' : 'Close chat'}
          >
            {isMobile ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          {/* Clickable Artisan Info -> Opens Profile */}
          <div
            onClick={() => onSelectProForProfile && onSelectProForProfile(activeConversation.professional)}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
            title="Click to view artisan profile"
          >
            <div className="relative shrink-0">
              <img
                src={activeConversation.professional.profile_picture}
                alt={activeConversation.professional.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80 group-hover:ring-2 group-hover:ring-brand-orange-500/60 transition-all"
              />
              {activeConversation.professional.is_available_now && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-orange-600 dark:group-hover:text-brand-orange-400 transition-colors">
                  {activeConversation.professional.name}
                </h2>
                {activeConversation.professional.is_verified && (
                  <VerifiedBadge label="Verified" title="Verified Artisan" iconClassName="w-3 h-3" labelClassName="hidden sm:inline" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{activeConversation.professional.category}</span>
                <span>•</span>
                <span className="truncate max-w-[110px] sm:max-w-none">{activeConversation.professional.neighborhood}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {activeConversation.professional.rating_average}
                </span>
              </div>
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
              <span className="hidden sm:inline">Book Job</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Job context strip -- identical between mobile and desktop chat views.
  const jobContextStripBody = activeConversation?.relatedBooking ? (
    <div className="px-3.5 py-2 bg-navy-50/90 dark:bg-navy-950/70 border-b border-navy-100 dark:border-navy-900/60 flex items-center justify-between gap-3 text-xs shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="px-1.5 py-0.5 rounded-md bg-navy-900 text-white text-[9px] font-black shrink-0">
          ACTIVE JOB
        </span>
        <span className="font-bold text-navy-900 dark:text-navy-100 truncate">
          {activeConversation.relatedBooking.title || activeConversation.relatedBooking.category}
        </span>
      </div>
      {activeConversation.relatedBooking.amount && (
        <span className="font-black text-navy-800 dark:text-navy-300 shrink-0">
          {formatCurrency(activeConversation.relatedBooking.amount)}
        </span>
      )}
    </div>
  ) : null;

  // Message feed -- identical between mobile and desktop chat views.
  const messagesFeedBody = (
    <div className="flex-1 min-h-0 px-3 py-3 sm:px-5 sm:py-4 overflow-y-auto overscroll-contain space-y-2 bg-slate-50/40 dark:bg-slate-950/40">
      {activeMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-2xs">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="max-w-sm space-y-1">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Start the conversation</h4>
            <p className="text-xs text-slate-500">
              Message {activeConversation?.professional.name} to confirm diagnosis, ask for quotes, or share photos of the issue.
            </p>
          </div>
        </div>
      ) : (
        activeMessages.map((msg, index) => {
          const isCustomer = msg.senderRole === 'customer';
          const day = formatChatDay(msg.timestamp);
          const showDay = index === 0 || day !== formatChatDay(activeMessages[index - 1].timestamp);
          const isMedia = msg.mediaType === 'image' || msg.mediaType === 'audio' || msg.mediaType === 'location';

          return (
            <React.Fragment key={msg.id}>
              {showDay && <ChatDaySeparator label={day} />}
              <ChatBubble
                isMine={isCustomer}
                timestamp={msg.timestamp}
                status={msg.status}
                onRetry={msg.retry}
                media={isMedia && msg.mediaType !== 'audio'}
                hideFooter={msg.mediaType === 'audio'}
                overlayFooter={msg.mediaType === 'image' && !imageCaption(msg.message)}
              >
                {msg.mediaType === 'image' && msg.mediaUrl && (
                  <ImageMessage
                    src={msg.mediaUrl}
                    caption={imageCaption(msg.message)}
                    sending={msg.status === 'sending'}
                    onOpen={() => setSelectedLightboxImage(msg.mediaUrl || null)}
                  />
                )}

                {msg.mediaType === 'audio' && (
                  <VoiceNotePlayer
                    msgId={msg.id}
                    src={msg.mediaUrl}
                    duration={msg.duration}
                    peaks={msg.waveform}
                    isMine={isCustomer}
                    activeId={playingAudioId}
                    onActiveChange={setPlayingAudioId}
                    meta={<BubbleMeta isMine={isCustomer} timestamp={msg.timestamp} status={msg.status} />}
                  />
                )}

                {msg.mediaType === 'location' && msg.locationData && (
                  <div className={`p-2.5 rounded-xl space-y-1 ${isCustomer ? 'bg-navy-950/40 text-white' : 'bg-slate-50 dark:bg-slate-900'}`}>
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" />
                      <span>Service location</span>
                    </div>
                    <p className="text-xs opacity-90">{msg.locationData.address}</p>
                    {msg.locationData.landmark && (
                      <p className="text-[11px] opacity-75">Landmark: {msg.locationData.landmark}</p>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${msg.locationData.lat},${msg.locationData.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 hover:underline ${isCustomer ? 'text-brand-orange-400' : 'text-navy-700 dark:text-navy-400'}`}
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {msg.message && !isMedia && (
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                )}
              </ChatBubble>
            </React.Fragment>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );


  // Composer / attachment menu / voice recorder -- identical between mobile and desktop chat views.
  // Bottom padding adds the home-indicator safe-area inset on top of the normal spacing (0px on
  // desktop/non-notched phones, so this is a no-op everywhere except a notched phone in portrait).
  const { isFrozen } = useAccountFrozen();
  const composerBody = (
    <div className="bg-white dark:bg-slate-900 shrink-0 relative">
      <AttachmentMenu
        open={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onPickPhoto={handlePickPhoto}
        onShareLocation={handleShareLocation}
        locating={isLocating}
      />

      {(chatError || recorder.error) && (
        <div role="alert" className="mx-3 sm:mx-4 mt-2.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-300">
          <span className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{chatError || recorder.error}</span>
          </span>
          <button
            type="button"
            onClick={() => { setChatError(null); recorder.clearError(); }}
            aria-label="Dismiss"
            className="p-1 -m-1 text-rose-500 hover:text-rose-800 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <ChatComposer
          value={inputText}
          onChange={setInputText}
          onSend={() => handleSendText()}
          placeholder={activeConversation ? `Message ${activeConversation.professional.name.split(/\s+/)[0]}` : 'Type a message'}
          quickReplies={QUICK_REPLIES}
          onQuickReply={handleSendQuickReply}
          onAttach={() => setShowAttachmentMenu(!showAttachmentMenu)}
          attachActive={showAttachmentMenu}
          onMic={handleStartRecording}
          recording={recorder.isRecording ? {
            seconds: recorder.seconds,
            levels: recorder.levels,
            paused: recorder.isPaused,
            sending: isSendingVoice,
            onPause: recorder.pause,
            onResume: recorder.resume,
            onDiscard: recorder.cancel,
            onSend: handleSendVoiceNote,
          } : null}
          onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)}
        />
    </div>
  );

  const emptyStateBody = (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
        <MessageSquare className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Your Messages</h3>
      <p className="text-sm text-slate-500 max-w-sm">
        Select a conversation from the left to read messages and reply to your booked artisans.
      </p>
    </div>
  );

  const hasActiveChat = Boolean(selectedProId && activeConversation);

  // Mobile inbox list body -- the client app's existing pattern (title + count pill, description,
  // search + filter card, then a list of card-style conversation rows). Unchanged from before,
  // just no longer the component's only possible view -- it's now specifically the < lg state.
  const mobileConversationListBody = (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      <h1 className="sr-only">Messages</h1>
      {/* AppShell's own header already shows the "Messages" title + unread badge from md: up
          (768px), but this whole body only switches to the desktop split-view at lg: (1024px) --
          so md:hidden here (not lg:hidden) is what actually avoids a duplicate title+badge in the
          768-1023px range, instead of leaving the page with two "Messages" headings stacked. */}
      <div className="md:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
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
                  ? 'bg-navy-900 text-white shadow-xs border border-navy-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-navy-900 text-white shadow-xs border border-navy-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-orange-700 text-white text-[10px] flex items-center justify-center font-black">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('active_jobs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === 'active_jobs'
                  ? 'bg-navy-900 text-white shadow-xs border border-navy-900'
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
                onClick={() => selectProId(conv.proId)}
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
                      src={conv.professional.profile_picture}
                      alt={conv.professional.name}
                      className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                    />
                    {conv.professional.is_available_now && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className={`text-sm sm:text-base truncate ${hasUnread ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-200'}`}>
                          {conv.professional.name}
                        </h3>
                        {conv.professional.is_verified && <VerifiedBadge iconClassName="w-4 h-4" />}
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
                            Job: {conv.relatedBooking.title || conv.relatedBooking.category}
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
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-orange-700 text-white text-[11px] font-black shrink-0 shadow-2xs flex items-center justify-center">
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

  // Desktop sidebar list -- a compact row style (the mobile list's card-per-row treatment is too
  // heavy for a ~320-384px sidebar), following the same pattern already used for this on the
  // artisan side's desktop pane.
  const desktopConversationListBody = (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {filteredConversations.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-500">No conversations found.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.map((conv) => {
            const hasUnread = conv.unreadCount > 0;
            const lastMsg = conv.lastMessage;
            const isYou = lastMsg?.senderRole === 'customer';
            return (
              <div
                key={conv.proId}
                onClick={() => selectProId(conv.proId)}
                className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedProId === conv.proId ? 'bg-navy-50 dark:bg-navy-900/20' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={conv.professional.profile_picture}
                      alt={conv.professional.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/80"
                    />
                    {conv.professional.is_available_now && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <h4 className={`text-sm truncate ${hasUnread ? 'font-black text-slate-950 dark:text-white' : 'font-bold text-slate-900 dark:text-slate-100'}`}>
                          {conv.professional.name}
                        </h4>
                        {conv.professional.is_verified && <VerifiedBadge iconClassName="w-3.5 h-3.5" labelClassName="hidden" />}
                      </div>
                      {lastMsg && (
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {formatMessageTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>
                    {conv.relatedBooking && (
                      <div className="text-[10px] font-semibold text-navy-600 dark:text-navy-400 mb-0.5 truncate">
                        Job: {conv.relatedBooking.title || conv.relatedBooking.category}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${hasUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {lastMsg ? (
                          <>
                            {isYou && 'You: '}
                            {lastMsg.mediaType === 'image' ? 'Photo attached'
                              : lastMsg.mediaType === 'audio' ? 'Voice Note'
                              : lastMsg.mediaType === 'location' ? 'Shared location'
                              : lastMsg.message}
                          </>
                        ) : (
                          <span className="italic text-slate-400">No messages yet</span>
                        )}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 min-w-4 h-4 px-1 rounded-full bg-brand-orange-700 flex items-center justify-center text-center text-[9px] font-bold text-white leading-none shadow-xs">
                          {conv.unreadCount}
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

  return (
    <>
      {/* ============================================================
          MOBILE / TABLET (< lg): no split-screen -- two separate
          full-screen states (list page, then a dedicated chat page),
          not the desktop's simultaneous two-pane layout.
          ============================================================ */}
      <div className="lg:hidden">
        {hasActiveChat ? (
          // Full-screen chat -- breaks out of the page's padding so it's a true full page (not a
          // card floating in the gutter), WhatsApp-mobile style: back arrow lives in its own header.
          <div className="-m-3.5 sm:-m-4 -mb-4 h-[calc(var(--vvh,100dvh)-65px)] md:h-[calc(var(--vvh,100dvh)-73px)] flex flex-col bg-white dark:bg-slate-900">
            {renderChatHeader(true)}
            {jobContextStripBody}
            {messagesFeedBody}
            {isFrozen ? <FrozenComposerNotice /> : composerBody}
          </div>
        ) : mobileConversationListBody}
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
          {/* Search row -- shares MESSAGES_HEADER_HEIGHT with the chat pane's header so both
              panes' header bottoms align in one continuous line. */}
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

          {/* Filter tabs + conversation-count label -- restored below the search row, same
              position and style as the mobile inbox's toolbar (this was dropped when the desktop
              split-screen was rebuilt, not an intentional removal). */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-navy-900 text-white shadow-xs border border-navy-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-navy-900 text-white shadow-xs border border-navy-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-orange-700 text-white text-[10px] flex items-center justify-center font-black">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('active_jobs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === 'active_jobs'
                  ? 'bg-navy-900 text-white shadow-xs border border-navy-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Active Bookings
            </button>
          </div>

          {desktopConversationListBody}
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-white dark:bg-slate-900">
          {hasActiveChat ? (
            <>
              {renderChatHeader(false)}
              {jobContextStripBody}
              {messagesFeedBody}
                {isFrozen ? <FrozenComposerNotice /> : composerBody}
            </>
          ) : emptyStateBody}
        </div>
      </div>

      <ImageLightbox src={selectedLightboxImage} onClose={() => setSelectedLightboxImage(null)} />
      <PhotoPreviewSheet
        photo={pendingPhoto}
        recipientName={activeConversation?.professional.name.split(/\s+/)[0] || 'artisan'}
        onCancel={() => setPendingPhoto(null)}
        onSend={handleSendPhoto}
      />
    </>
  );
};
