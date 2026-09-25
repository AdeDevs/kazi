import React, { useState, useRef, useEffect } from 'react';
import { BubbleMeta, ChatBubble, ChatDaySeparator, formatChatDay } from './chat/ChatBubble';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import { VoiceNotePlayer } from './chat/VoiceNotePlayer';
import { ImageMessage, imageCaption } from './chat/ImageMessage';
import { PhotoPreviewSheet } from './chat/PhotoPreviewSheet';
import { AttachmentMenu } from './chat/AttachmentMenu';
import { ImageLightbox } from './chat/ImageLightbox';
import { compressImage } from '../lib/imageCompress';
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
  Search, ArrowLeft, 
  MessageSquare,
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
  // The photo picked from the attachment menu, waiting in the preview sheet for a caption / send.
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
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

  const handlePickPhoto = async (file: File) => {
    setShowAttachmentMenu(false);
    if (!file.type.startsWith('image/')) {
      toast.error('Choose a photo to send.');
      return;
    }
    setPendingPhoto(await compressImage(file));
  };

  const handleSendPhoto = (caption: string) => {
    if (!pendingPhoto || !selectedCustomerId || !onSendMessage) return;
    onSendMessage(selectedCustomerId, caption || 'Photo', { mediaType: 'image', mediaUrl: pendingPhoto, status: 'sent' });
    setPendingPhoto(null);
  };



  const handleStopAndSendVoiceNote = async () => {
    setIsSendingVoice(true);
    const note = await recorder.stop();
    setIsSendingVoice(false);
    if (!note || !selectedCustomerId || !onSendMessage) return;
    onSendMessage(selectedCustomerId, 'Voice note', {
      mediaType: 'audio',
      mediaUrl: note.dataUrl,
      duration: note.durationSeconds,
      waveform: note.peaks,
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
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4 space-y-2 no-scrollbar bg-slate-50/40 dark:bg-slate-950/40">
              {activeMessages.map((msg, index) => {
                const isMe = msg.senderId === professional.id;
                const day = formatChatDay(msg.timestamp);
                const showDay = index === 0 || day !== formatChatDay(activeMessages[index - 1].timestamp);
                const isImage = msg.mediaType === 'image' || Boolean(msg.imageUrl);
                const isMedia = isImage || msg.mediaType === 'audio' || msg.mediaType === 'video' || msg.mediaType === 'location';

                return (
                  <React.Fragment key={msg.id}>
                    {showDay && <ChatDaySeparator label={day} />}
                    <ChatBubble
                      isMine={isMe}
                      timestamp={msg.timestamp}
                      status={msg.status}
                      onRetry={msg.retry}
                      media={isMedia && msg.mediaType !== 'audio'}
                      hideFooter={msg.mediaType === 'audio'}
                      overlayFooter={isImage && !imageCaption(msg.message)}
                    >
                      {isImage && (
                        <ImageMessage
                          src={msg.mediaUrl || msg.imageUrl || ''}
                          caption={imageCaption(msg.message)}
                          sending={msg.status === 'sending'}
                          onOpen={() => setSelectedLightboxImage(msg.mediaUrl || msg.imageUrl || null)}
                        />
                      )}

                      {msg.mediaType === 'video' && msg.mediaUrl && (
                        <video controls className="w-full max-h-52 rounded-xl bg-black">
                          <source src={msg.mediaUrl} type="video/mp4" />
                          Your browser does not support video playback.
                        </video>
                      )}

                      {msg.mediaType === 'audio' && (
                        <VoiceNotePlayer
                          msgId={msg.id}
                          src={msg.mediaUrl}
                          duration={msg.duration}
                          peaks={msg.waveform}
                          isMine={isMe}
                          activeId={playingAudioId}
                          onActiveChange={setPlayingAudioId}
                          meta={<BubbleMeta isMine={isMe} timestamp={msg.timestamp} status={msg.status} />}
                        />
                      )}

                      {msg.mediaType === 'location' && msg.locationData && (
                        <div className={`p-2.5 rounded-xl space-y-1 ${isMe ? 'bg-navy-950/40 text-white' : 'bg-slate-50 dark:bg-slate-900'}`}>
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
                            className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 hover:underline ${isMe ? 'text-brand-orange-400' : 'text-navy-700 dark:text-navy-400'}`}
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Get directions</span>
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
              })}
      <div ref={messagesEndRef} />
    </div>
  );

  const attachmentMenuBody = (
    <AttachmentMenu
      open={showAttachmentMenu}
      onClose={() => setShowAttachmentMenu(false)}
      onPickPhoto={handlePickPhoto}
      onShareLocation={handleShareLiveLocation}
      locating={isLocating}
    />
  );

  // Composer / voice recorder -- identical between mobile and desktop chat views. Bottom padding
  // adds the home-indicator safe-area inset on top of the normal spacing (0px on desktop/
  // non-notched phones, so this is a no-op everywhere except a notched phone in portrait).
  const { isFrozen } = useAccountFrozen();
  const composerBody = (
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
        placeholder={activeConversation ? `Message ${activeConversation.customerName.split(' · ')[0].split(/\s+/)[0]}` : 'Type a message'}
        quickReplies={ARTISAN_QUICK_REPLIES}
        onQuickReply={(text) => {
          if (selectedCustomerId && onSendMessage) onSendMessage(selectedCustomerId, text, { mediaType: 'text', status: 'sent' });
        }}
        onAttach={() => setShowAttachmentMenu(!showAttachmentMenu)}
        attachActive={showAttachmentMenu}
        onMic={() => { recorder.clearError(); setShowAttachmentMenu(false); recorder.start(); }}
        recording={recorder.isRecording ? {
          seconds: recorder.seconds,
          levels: recorder.levels,
          paused: recorder.isPaused,
          sending: isSendingVoice,
          onPause: recorder.pause,
          onResume: recorder.resume,
          onDiscard: recorder.cancel,
          onSend: handleStopAndSendVoiceNote,
        } : null}
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
            <div className="relative shrink-0">
              <div className="relative shrink-0">
                {attachmentMenuBody}
                {isFrozen ? <FrozenComposerNotice /> : composerBody}
              </div>
            </div>
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
              <div className="relative shrink-0">
                {attachmentMenuBody}
                {isFrozen ? <FrozenComposerNotice /> : composerBody}
              </div>
            </>
          ) : emptyStateBody}
        </div>
      </div>

      <ImageLightbox src={selectedLightboxImage} onClose={() => setSelectedLightboxImage(null)} />
      <PhotoPreviewSheet
        photo={pendingPhoto}
        recipientName={activeConversation?.customerName.split(' · ')[0] || 'client'}
        onCancel={() => setPendingPhoto(null)}
        onSend={handleSendPhoto}
      />
    </>
  );
};
