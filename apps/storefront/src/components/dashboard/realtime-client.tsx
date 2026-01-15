"use client"

import { StatusBadge } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useTransition } from "react"

type Props = {
  restaurantId?: string
  driverId?: string
  deliveryId?: string
}

export default function RealtimeClient({
  restaurantId,
  driverId,
  deliveryId,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sourceRef = useRef<EventSource | null>(null)
  const lastPlayedRef = useRef<number>(0)

  const serverUrl = (() => {
    const params = new URLSearchParams()
    if (restaurantId) params.set("restaurant_id", restaurantId)
    if (driverId) params.set("driver_id", driverId)
    if (deliveryId) params.set("delivery_id", deliveryId)
    return `/api/subscribe?${params.toString()}`
  })()

  useEffect(() => {
    // Prepare audio safely
    audioRef.current = new Audio("/notification.mp3")
    audioRef.current.preload = "auto"

    // Initialize SSE
    const source = new EventSource(serverUrl)
    sourceRef.current = source

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data?.new) {
          const now = Date.now()

          // Prevent rapid duplicate sounds (1.5s cooldown)
          if (now - lastPlayedRef.current > 1500) {
            lastPlayedRef.current = now

            audioRef.current
              ?.play()
              .catch(() => {
                // Autoplay blocked until user interaction
                console.warn("Notification sound blocked by browser")
              })
          }
        }

        startTransition(() => {
          router.refresh()
        })
      } catch (err) {
        console.error("Invalid SSE payload", err)
      }
    }

    source.onerror = () => {
      console.warn("SSE connection lost, retrying…")
    }

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [serverUrl, router])

  if (isPending) {
    return (
      <StatusBadge color="orange" className="flex pl-1 pr-2 py-1 gap-1 w-fit">
        {deliveryId ? "Syncing order status" : "Syncing deliveries"}
        <span className="animate-ping inline-flex h-1 w-1 rounded-full bg-orange-400 opacity-75 ml-2" />
      </StatusBadge>
    )
  }

  return (
    <StatusBadge color="green" className="flex pl-1 pr-2 py-1 gap-1 w-fit">
      Up to date
    </StatusBadge>
  )
}
