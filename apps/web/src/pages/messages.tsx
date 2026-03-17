import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, ArrowLeft, Plus, X, Package, User } from 'lucide-react';
import { TopHeader } from '@/shared/components/top-header';
import { BottomNav } from '@/shared/components/bottom-nav';
import { cn, getInitials } from '@/shared/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getConversations, getMessages, sendMessage } from '@/services/messages.service';
import type { ConversationRow, MessageRow } from '@/lib/database.types';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selected, setSelected] = useState<ConversationRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageType, setNewMessageType] = useState<'load' | 'user' | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const role = (profile?.role === 'admin' ? 'carrier' : profile?.role) ?? 'carrier';

  // Load conversations
  useEffect(() => {
    if (!user) return;
    getConversations(user.id).then(setConversations).catch(console.error);
  }, [user]);

  const fetchMessages = useCallback((id: string) => {
    getMessages(id).then(setMessages).catch(console.error);
  }, []);

  // Load + live-subscribe to messages when a conversation is selected
  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);

    const channel = supabase
      .channel(`convo-${selected.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selected.id}`,
        },
        () => fetchMessages(selected.id),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!draft.trim() || !selected || !user) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    await sendMessage(selected.id, user.id, text).catch(console.error);
    // Realtime will trigger fetchMessages; call manually as fallback
    fetchMessages(selected.id);
    setSending(false);
  }

  const filtered = conversations.filter(
    (c) =>
      !search ||
      c.other_party.toLowerCase().includes(search.toLowerCase()) ||
      (c.load_number ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  if (selected) {
    const initials = getInitials(selected.other_party);
    return (
      <div className="min-h-dvh flex flex-col pb-[84px]">
        {/* Chat header */}
        <div className="sticky top-0 z-20 bg-fx-bg/80 backdrop-blur-md border-b border-fx-border px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-fx-surface transition-colors"
          >
            <ArrowLeft size={18} className="text-fx-text" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-fx-orange">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-fx-text leading-tight">{selected.other_party}</p>
            {selected.load_number && (
              <p className="text-xs text-fx-orange">{selected.load_number}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-fx-text-muted py-10">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.from_me ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5',
                    msg.from_me
                      ? 'bg-fx-orange text-white rounded-br-sm'
                      : 'bg-fx-surface border border-fx-border text-fx-text rounded-bl-sm',
                  )}
                >
                  <p className="text-sm leading-snug">{msg.text}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      msg.from_me ? 'text-white/60 text-right' : 'text-fx-text-dim',
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-4 flex gap-2 items-end">
          <input
            type="text"
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 h-12 bg-fx-surface border border-fx-border rounded-2xl px-4 text-sm text-fx-text placeholder:text-fx-text-dim focus:border-fx-orange focus:ring-1 focus:ring-fx-orange/30 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="w-12 h-12 bg-fx-orange rounded-2xl flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col pb-[84px]">
      <TopHeader
        title="Messages"
        notificationCount={conversations.filter((c) => c.unread_count > 0).length}
      />

      {/* Search */}
      <div className="px-5 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fx-orange" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-fx-surface border border-fx-border rounded-2xl pl-10 pr-4 text-sm text-fx-text placeholder:text-fx-text-dim focus:border-fx-orange focus:ring-1 focus:ring-fx-orange/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-5">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-bold text-fx-text">No messages yet</p>
            <p className="text-sm text-fx-text-muted mt-1">Your conversations will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-fx-border">
            {filtered.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelected(convo)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-fx-surface transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-fx-surface border border-fx-border flex items-center justify-center">
                    <span className="text-sm font-bold text-fx-orange">
                      {getInitials(convo.other_party)}
                    </span>
                  </div>
                  {convo.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-fx-orange rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{convo.unread_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p
                      className={cn(
                        'text-sm font-semibold truncate',
                        convo.unread_count > 0 ? 'text-fx-text' : 'text-fx-text-muted',
                      )}
                    >
                      {convo.other_party}
                    </p>
                    <span className="text-[10px] text-fx-text-dim shrink-0 ml-2">
                      {new Date(convo.last_message_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {convo.last_message && (
                    <p
                      className={cn(
                        'text-xs truncate mt-0.5',
                        convo.unread_count > 0 ? 'text-fx-text-muted' : 'text-fx-text-dim',
                      )}
                    >
                      {convo.last_message}
                    </p>
                  )}
                  {convo.load_number && (
                    <p className="text-[10px] text-fx-orange font-semibold mt-0.5">
                      {convo.load_number}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Message FAB */}
      <button
        onClick={() => setShowNewMessage(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-orange-gradient rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-30"
        style={{ boxShadow: '0 4px 20px rgba(232,96,48,0.5)' }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-fx-bg rounded-t-3xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-fx-text">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessage(false);
                  setNewMessageType(null);
                }}
                className="w-8 h-8 rounded-full bg-fx-surface flex items-center justify-center"
              >
                <X size={18} className="text-fx-text-dim" />
              </button>
            </div>

            {!newMessageType ? (
              <div className="space-y-3">
                <p className="text-sm text-fx-text-muted mb-4">
                  Choose how you want to start a conversation:
                </p>
                <button
                  onClick={() => setNewMessageType('load')}
                  className="w-full bg-fx-surface border border-fx-border rounded-2xl p-4 flex items-center gap-3 hover:bg-fx-surface-2 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center">
                    <Package size={22} className="text-fx-orange" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-fx-text">Message about a Load</p>
                    <p className="text-xs text-fx-text-muted">
                      Start a conversation tied to a specific load
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setNewMessageType('user')}
                  className="w-full bg-fx-surface border border-fx-border rounded-2xl p-4 flex items-center gap-3 hover:bg-fx-surface-2 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-fx-orange/10 border border-fx-orange/20 flex items-center justify-center">
                    <User size={22} className="text-fx-orange" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-fx-text">Message a User</p>
                    <p className="text-xs text-fx-text-muted">
                      Browse and message any user directly
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setNewMessageType(null)}
                  className="text-sm text-fx-orange font-medium"
                >
                  ← Back
                </button>
                <p className="text-sm text-fx-text-muted">
                  {newMessageType === 'load'
                    ? 'Select a load to start a conversation about:'
                    : 'Search for a user to message:'}
                </p>
                <div className="bg-fx-surface border border-fx-border rounded-2xl p-4 text-center">
                  <p className="text-sm text-fx-text-dim">
                    {newMessageType === 'load'
                      ? 'Your loads will appear here for selection'
                      : 'Search users by name or company'}
                  </p>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full h-10 bg-fx-bg border border-fx-border rounded-xl px-4 text-sm text-fx-text mt-3"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav role={role} />
    </div>
  );
}
