import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../providers/AuthProvider'
import { Notification } from '@repo/shared'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, snapshot => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[]

      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)
    })

    return () => unsubscribe()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    const ref = doc(db, 'notifications', notificationId)
    await updateDoc(ref, { read: true })
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read)
    // Batch or parallel update
    // For V1 simple parallel updates
    await Promise.all(
      unread.map(n => {
        if (n.id) {
          return updateDoc(doc(db, 'notifications', n.id), { read: true })
        }
        return Promise.resolve()
      })
    )
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
