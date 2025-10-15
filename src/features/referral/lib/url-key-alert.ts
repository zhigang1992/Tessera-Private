export type UrlKeyAlertHandlers = {
  handleConfirm?: () => Promise<void> | void
  handleCancel?: () => void
}

type WindowWithUrlKey = Window & {
  _urlKeyAlertHandlers?: UrlKeyAlertHandlers
}

function getWindow(): WindowWithUrlKey | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window as WindowWithUrlKey
}

export function setUrlKeyAlertHandlers(handlers: UrlKeyAlertHandlers | undefined) {
  const win = getWindow()
  if (!win) {
    return
  }
  if (!handlers) {
    delete win._urlKeyAlertHandlers
    return
  }
  win._urlKeyAlertHandlers = handlers
}

export function getUrlKeyAlertHandlers() {
  return getWindow()?._urlKeyAlertHandlers
}
