import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Message } from '../types';
import { Send, Paperclip } from 'lucide-react';

interface ChatProps {
  projectId: string;
}

export default function Chat({ projectId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot received, docs count:', snapshot.size);
      const fetched: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        } as Message);
      });
      console.log('Messages fetched:', fetched);
      // Sort messages locally by timestamp, handling potential missing timestamps
      fetched.sort((a, b) => {
        const timeA = a.timestamp?.getTime() || 0;
        const timeB = b.timestamp?.getTime() || 0;
        return timeA - timeB;
      });
      setMessages(fetched);
    }, (error) => {
      console.error('Snapshot error:', error);
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Get persistent guestId from localStorage if not authenticated
    let guestId = localStorage.getItem('flodech-guest-id');
    if (!guestId && !auth.currentUser) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('flodech-guest-id', guestId);
    }

    const senderId = auth.currentUser?.uid || guestId || 'guest_unknown';
    const senderName = auth.currentUser?.displayName || 'Client (Guest)';

    try {
      console.log('Sending message:', { projectId, message: newMessage });
      await addDoc(collection(db, 'messages'), {
        projectId,
        senderId: senderId,
        senderName: senderName,
        message: newMessage,
        timestamp: serverTimestamp(),
        messageType: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    }
  };

  const isSender = (senderId: string) => {
    return auth.currentUser ? senderId === auth.currentUser.uid : senderId === localStorage.getItem('flodech-guest-id');
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-xl overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-stone-500 mt-10">No messages yet. Start a discussion!</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${isSender(m.senderId) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl ${isSender(m.senderId) ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-stone-100 text-stone-800 rounded-bl-none'}`}>
                <p className="text-sm">{m.message}</p>
                <span className={`text-[10px] mt-1 block ${isSender(m.senderId) ? 'text-indigo-200' : 'text-stone-500'}`}>
                  {m.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={sendMessage} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
