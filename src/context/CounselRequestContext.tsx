import { createContext, useContext, useCallback, useRef, type ReactNode } from 'react'

/** Maps requestId → the files the user attached when submitting */
type AttachmentStore = Record<string, File[]>

interface CounselRequestContextValue {
  saveAttachments: (requestId: string, files: File[]) => void
  getAttachments: (requestId: string) => File[]
}

const CounselRequestContext = createContext<CounselRequestContextValue | null>(null)

export function CounselRequestProvider({ children }: { children: ReactNode }) {
  // useRef so the store survives re-renders without triggering them
  const storeRef = useRef<AttachmentStore>({})

  const saveAttachments = useCallback((requestId: string, files: File[]) => {
    storeRef.current[requestId] = files
  }, [])

  const getAttachments = useCallback((requestId: string): File[] => {
    return storeRef.current[requestId] ?? []
  }, [])

  return (
    <CounselRequestContext.Provider value={{ saveAttachments, getAttachments }}>
      {children}
    </CounselRequestContext.Provider>
  )
}

export function useCounselRequests() {
  const ctx = useContext(CounselRequestContext)
  if (!ctx) throw new Error('useCounselRequests must be used within CounselRequestProvider')
  return ctx
}
