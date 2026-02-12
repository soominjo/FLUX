import { useState, useEffect, useRef, FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button, Input, cn, Card, CardHeader, CardTitle, CardContent } from '@repo/ui'
import { useAuth } from '../../providers/AuthProvider'
import { useChat } from '../../hooks/useChat'

interface ChatBoxProps {
  otherUserId: string
  otherUserName?: string
}

export function ChatBox({ otherUserId, otherUserName }: ChatBoxProps) {
  const { user } = useAuth()
  const { messages, isLoading, sendMessage } = useChat(otherUserId)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  console.log('[ChatBox] FETCHED MESSAGES:', messages)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isSending) return

    const textToSend = inputText
    setInputText('')
    setIsSending(true)

    try {
      await sendMessage(textToSend)
      console.log('[ChatBox] Message sent successfully')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error('FIREBASE CHAT ERROR:', error)
      alert('Failed to send: ' + errMsg)
      // Restore the text so user doesn't lose it
      setInputText(textToSend)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <div className="p-4 text-zinc-500">Loading chat...</div>

  return (
    <Card className="h-[500px] flex flex-col border-zinc-800 bg-zinc-900 text-zinc-400">
      <CardHeader className="py-3 border-b border-zinc-800">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
          Chat with {otherUserName || 'User'}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-10">No messages yet. Say hi! 👋</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user?.uid
            return (
              <div
                key={msg.id}
                className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    isMe
                      ? 'bg-lime-500/10 text-lime-100 border border-lime-500/20 rounded-tr-none'
                      : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            )
          })
        )}
      </CardContent>

      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2">
        <Input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="bg-zinc-950 border-zinc-800 focus:ring-lime-400"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSending || !inputText.trim()}
          className="bg-lime-500 text-zinc-950 hover:bg-lime-400"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  )
}
