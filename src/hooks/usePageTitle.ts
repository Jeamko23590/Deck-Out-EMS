import { useEffect } from 'react'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} · Decked Out Cafe`
      : 'Decked Out Cafe · TCG Club & Tournament Venue'
  }, [title])
}
