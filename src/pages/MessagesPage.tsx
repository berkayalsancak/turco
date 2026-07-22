import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Avatar } from '../components/Avatar';
import type { Conversation, Message, Profile } from '../types';
import { Send, Phone, ArrowLeft, PhoneOff, PhoneCall, Loader2, MessageCircle } from 'lucide-react';
import { timeAgo } from '../lib/utils';

export function MessagesPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState<{ conv: Conversation; status: 'idle' | 'calling' | 'active' | 'ended' } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    const myId = profile.id;
    async function load() {
      const { data: convs } = await supabase
        .from('conversations')
        .select('*, other:profiles!user2_id(*)')
        .or(`user1_id.eq.${myId},user2_id.eq.${myId}`)
        .order('created_at', { ascending: false });
      const conversations = (convs || []).map((c: any) => {
        const other = c.user1_id === myId ? c.other : c.other;
        return { ...c, other_user: other } as Conversation;
      });
      setConversations(conversations);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  useEffect(() => {
    if (!activeConv) return;
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) || []);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` }, (payload) => {
        setMessages((m) => [...m, payload.new as Message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id]);

  const sendMessage = async () => {
    if (!text.trim() || !profile || !activeConv) return;
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConv.id, sender_id: profile.id, text })
      .select('*')
      .single();
    if (data) setMessages((m) => [...m, data as Message]);
    setText('');

    const recipientId = activeConv.other_user?.id;
    if (recipientId && recipientId !== profile.id) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        actor_id: profile.id,
        type: 'message',
        text: 'sana mesaj gönderdi',
      });
    }
  };

  const startConversation = async (otherId: string) => {
    if (!profile) return;
    const user1_id = profile.id < otherId ? profile.id : otherId;
    const user2_id = profile.id < otherId ? otherId : profile.id;
    const { data: existing } = await supabase
      .from('conversations')
      .select('*, other:profiles!user2_id(*)')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .maybeSingle();
    if (existing) {
      const other = existing.user1_id === profile.id ? existing.other : existing.other;
      setActiveConv({ ...existing, other_user: other } as Conversation);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user1_id, user2_id })
        .select('*')
        .single();
      if (newConv) {
        const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherId).maybeSingle();
        setActiveConv({ ...newConv, other_user: otherProfile } as Conversation);
      }
    }
    setSearchOpen(false);
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).neq('id', profile?.id || '').limit(10);
    setSearchResults((data as Profile[]) || []);
  };

  const startCall = async (conv: Conversation) => {
    if (!profile) return;
    setCallState({ conv, status: 'calling' });
    await supabase.from('calls').insert({
      caller_id: profile.id,
      callee_id: conv.other_user?.id || '',
      status: 'initiated',
    });
    setTimeout(() => setCallState((s) => s ? { ...s, status: 'active' } : null), 2000);
  };

  const endCall = () => {
    setCallState((s) => s ? { ...s, status: 'ended' } : null);
    setTimeout(() => setCallState(null), 1500);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--ig-muted)]" /></div>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-5xl md:h-screen">
      <div className={`flex w-full flex-col border-r md:w-80 ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{profile?.username}</h2>
          <button onClick={() => setSearchOpen(true)} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900">
            <MessageCircle size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <MessageCircle size={48} className="text-[var(--ig-muted)]" />
              <p className="mt-3 text-sm text-[var(--ig-muted)]">Mesajların burada görünür</p>
              <button onClick={() => setSearchOpen(true)} className="ig-btn mt-4">Yeni Mesaj</button>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c)}
                className={`flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-900 ${activeConv?.id === c.id ? 'bg-gray-100 dark:bg-zinc-900' : ''}`}
              >
                <Avatar profile={c.other_user || { avatar_url: null, username: '', full_name: '' }} size={48} ring />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.other_user?.username}</p>
                  <p className="text-xs text-[var(--ig-muted)]">Sohbet başlat</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${activeConv ? 'flex' : 'hidden md:flex'}`}>
        {activeConv ? (
          <>
            <div className="flex items-center gap-3 border-b p-3">
              <button onClick={() => setActiveConv(null)} className="md:hidden"><ArrowLeft size={22} /></button>
              <button
                onClick={() => activeConv.other_user?.id && navigate({ name: 'profile', userId: activeConv.other_user.id })}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <Avatar profile={activeConv.other_user || { avatar_url: null, username: '', full_name: '' }} size={36} ring />
                <div>
                  <p className="text-sm font-semibold">{activeConv.other_user?.username}</p>
                  <p className="text-xs text-[var(--ig-muted)]">Çevrimiçi</p>
                </div>
              </button>
              <button onClick={() => startCall(activeConv)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-zinc-900">
                <Phone size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-thin">
              {messages.length === 0 && <p className="py-8 text-center text-sm text-[var(--ig-muted)]">Sohbete başla!</p>}
              {messages.map((m) => {
                const mine = m.sender_id === profile?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-[var(--ig-accent)] text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                      {m.text}
                      <span className="ml-2 text-[10px] opacity-60">{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-2 border-t p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Mesaj yaz..."
                className="ig-input flex-1"
              />
              <button onClick={sendMessage} disabled={!text.trim()} className="ig-btn !px-3">
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageCircle size={64} className="text-[var(--ig-muted)]" />
            <p className="mt-4 text-lg font-semibold">Mesajların</p>
            <p className="text-sm text-[var(--ig-muted)]">Bir sohbet seç</p>
          </div>
        )}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSearchOpen(false)}>
          <div className="ig-card w-full max-w-md p-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-semibold">Yeni Mesaj</h3>
            <input autoFocus placeholder="Kullanıcı ara..." className="ig-input mb-3" onChange={(e) => searchUsers(e.target.value)} />
            <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
              {searchResults.map((r) => (
                <button key={r.id} onClick={() => startConversation(r.id)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-900">
                  <Avatar profile={r} size={40} />
                  <div>
                    <p className="text-sm font-semibold">{r.username}</p>
                    <p className="text-xs text-[var(--ig-muted)]">{r.full_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {callState && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <Avatar profile={callState.conv.other_user || { avatar_url: null, username: '', full_name: '' }} size={120} ring />
            <p className="text-xl font-semibold text-white">{callState.conv.other_user?.username}</p>
            <p className="text-sm text-white/70">
              {callState.status === 'calling' && 'Aranıyor...'}
              {callState.status === 'active' && 'Sesli arama aktif'}
              {callState.status === 'ended' && 'Arama sona erdi'}
            </p>
            <div className="mt-4 flex items-center gap-3 text-white/60">
              <PhoneCall size={20} className={callState.status === 'active' ? 'animate-pulse text-emerald-400' : ''} />
            </div>
            <button onClick={endCall} className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600">
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
