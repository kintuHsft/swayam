// components/InactivityProvider.tsx
'use client'

import { Button, Dialog, Portal } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cartStore'

const INACTIVITY_LIMIT = 2 * 60 * 1000
const WARNING_DURATION = 30 * 1000

const START_PAGE = '/start'
const LOGIN_PAGE = '/login'
const SELECT_READER_BASE = '/select-reader'

// Helper for matching a base route and its nested children
const matchesBase = (base: string, path?: string | null) =>
  !!path && (path === base || path.startsWith(base + '/'))

export default function InactivityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [countdown, setCountdown] = useState(30)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const { clearCart } = useCartStore()

  // ✅ Exempt these pages from *any* idle handling
  const EXEMPT_PATHS = [START_PAGE, LOGIN_PAGE]
  const isExempt =
    (pathname && EXEMPT_PATHS.some((p) => matchesBase(p, pathname))) || false

  // ✅ Decide where to go on idle:
  // - If on /select-reader*  -> /login
  // - Else everywhere else    -> /start
  const idleRedirect = matchesBase(SELECT_READER_BASE, pathname) ? LOGIN_PAGE : START_PAGE
  const redirectLabel = idleRedirect === LOGIN_PAGE ? 'login' : 'start'

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  const resetTimer = () => {
    // Skip idle logic on exempt routes
    if (isExempt) {
      clearTimers()
      setDialogOpen(false)
      return
    }

    clearTimers()
    setDialogOpen(false)

    // Final redirect after full inactivity window
    timerRef.current = setTimeout(() => {
      clearCart()
      // Keep push to preserve your current behavior; use replace() if you prefer no back navigation
      router.push(idleRedirect)
    }, INACTIVITY_LIMIT)

    // Show warning dialog WARNING_DURATION before redirect
    warningTimerRef.current = setTimeout(() => {
      setDialogOpen(true)
      setCountdown(30)

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
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
    // Do not attach listeners on exempt pages
    if (isExempt) {
      clearTimers()
      setDialogOpen(false)
      return
    }

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'pointerdown',
    ] as const

    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      clearTimers()
    }
    // Re-evaluate when route changes or exemption changes
  }, [pathname, isExempt])

  return (
    <>
      {children}

      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(state) => {
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
                You’ll be redirected to the <strong>{redirectLabel}</strong> page in{' '}
                <strong>{countdown}</strong> seconds due to inactivity.
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
