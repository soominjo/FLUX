import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../providers/AuthProvider'
import { Message } from '@repo/shared'

/**
 * Builds a deterministic chat room ID from two user UIDs.
 * Always produces the same string regardless of argument order.
 */
function buildChatRoomId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_')
}

export function useChat(otherUserId: string | undefined) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || !otherUserId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    const chatRoomId = buildChatRoomId(user.uid, otherUserId)

    console.log('[useChat] Subscribing to chatRoomId:', chatRoomId)

    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[]
        console.log('[useChat] Snapshot received, message count:', msgs.length)
        setMessages(msgs)
        setIsLoading(false)
      },
      error => {
        console.error('[useChat] onSnapshot error:', error)
        alert('[Chat] Firestore listener error: ' + error.message)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, otherUserId])

  const sendMessage = async (text: string) => {
    if (!user || !otherUserId || !text.trim()) return

    const chatRoomId = buildChatRoomId(user.uid, otherUserId)
    const participants = [user.uid, otherUserId].sort()

    const payload = {
      text,
      senderId: user.uid,
      receiverId: otherUserId,
      chatRoomId,
      participants,
      createdAt: serverTimestamp(),
    }

    console.log(
      '[useChat] Sending message payload:',
      JSON.stringify({ ...payload, createdAt: 'serverTimestamp()' })
    )

    // Let the error propagate to the caller (ChatBox) for alert handling
    await addDoc(collection(db, 'messages'), payload)
  }

  return { messages, isLoading, sendMessage }
}
