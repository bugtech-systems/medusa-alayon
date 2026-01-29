"use client"

import { sendChatMessage } from "@/lib/actions/ai"
import { useEffect, useRef, useState } from "react"

interface ChatMessage {
  role: "user" | "assistant"
  text: string
}

interface ChatBubbleProps {
  sessionId: string
  language?: string
  position?: "bottom-right" | "bottom-left"
}

export default function ChatBubble({
  sessionId,
  language = "English",
  position = "bottom-right",
}: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Send message to backend AI endpoint
  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input
    setMessages((prev) => [...prev, { role: "user", text: userMessage }])
    setInput("")
    setIsTyping(true)

    try {
      const response = await sendChatMessage(sessionId, input, language) as any

  console.log(response, 'RESPPP')       

    /*   if (!response.ok) {
        throw new Error("AI request failed")
      }

      const data: { assistant_response: string } = await response.json()
 */
 
      setMessages((prev) => [...prev, { role: "assistant", text: response.assistant_response }])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [...prev, { role: "assistant", text: "AI failed to respond." }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg ${
          position === "bottom-right" ? "bottom-5 right-5" : "bottom-5 left-5"
        }`}
      >
        💬
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed z-50 w-80 h-96 bg-white border rounded-lg shadow-lg flex flex-col overflow-hidden ${
            position === "bottom-right" ? "bottom-20 right-5" : "bottom-20 left-5"
          }`}
        >
          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <span
                  className={`inline-block p-2 rounded ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isTyping && <p className="italic text-gray-400">Assistant is typing...</p>}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex p-2 border-t gap-2">
            <input
              type="text"
              className="flex-1 border rounded p-2"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="bg-blue-600 text-white px-4 rounded" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
