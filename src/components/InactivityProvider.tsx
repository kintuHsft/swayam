// components/InactivityProvider.tsx
'use client'

import { Button, Dialog, Portal } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {useCartStore} from "@/lib/cartStore";

const INACTIVITY_LIMIT = 2 * 60 * 1000
const WARNING_DURATION = 30 * 1000
const START_PAGE = '/start'

export default function InactivityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [countdown, setCountdown] = useState(30)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const { clearCart } = useCartStore();

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  const resetTimer = () => {
    if (pathname === START_PAGE) {
      clearTimers()
      setDialogOpen(false)
      return
    }

    clearTimers()
    setDialogOpen(false)

    timerRef.current = setTimeout(() => {
      clearCart()
      router.push(START_PAGE)
    }, INACTIVITY_LIMIT)

    warningTimerRef.current = setTimeout(() => {
      setDialogOpen(true)
      setCountdown(30)

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, INACTIVITY_LIMIT - WARNING_DURATION)
  }

  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'pointerdown',
    ]
    events.forEach(event => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      clearTimers()
    }
  }, [pathname])

  return (
    <>
      {children}

      <Dialog.Root
        open={dialogOpen}
        onOpenChange={state => {
          setDialogOpen(state.open)
          if (!state.open) resetTimer()
        }}
        closeOnEscape={true}
        closeOnInteractOutside={false}
        trapFocus={true}
        preventScroll={true}
        placement="center"
        modal
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Are you still there?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                You’ll be redirected to the start page in <strong>{countdown}</strong> seconds due to inactivity.
              </Dialog.Body>
              <Dialog.Footer>
                <Button onClick={resetTimer}>I'm still here</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
