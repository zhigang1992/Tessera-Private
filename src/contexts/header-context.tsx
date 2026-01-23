import { createContext, useContext, useState, ReactNode } from 'react'

interface BackButtonConfig {
  show: boolean
  text: string
  onClick: () => void
}

interface HeaderContextType {
  backButton?: BackButtonConfig
  setBackButton: (config?: BackButtonConfig) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [backButton, setBackButton] = useState<BackButtonConfig | undefined>()

  return (
    <HeaderContext.Provider value={{ backButton, setBackButton }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}
