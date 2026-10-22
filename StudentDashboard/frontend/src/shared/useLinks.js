import { useEffect, useState } from 'react'
import { LINKS } from './mockData'

// Stand-in for the database: the teacher's links are kept in this browser's storage
// so the student side can show them. Replace with API calls when the backend is ready.
const KEY = 'mybread-links'

function load() {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : LINKS
  } catch {
    return LINKS
  }
}

export function useLinks() {
  const [links, setLinks] = useState(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(links))
    } catch {
      /* storage unavailable, links just won't persist */
    }
  }, [links])
  return [links, setLinks]
}

export const linkKind = (url) => (/youtube\.com|youtu\.be/.test(url) ? 'Video' : 'Website')
