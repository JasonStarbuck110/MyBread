import { useEffect, useState } from 'react'
import { LINKS } from './mockData'

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
      //
    }
  }, [links])
  return [links, setLinks]
}

export const linkKind = (url) => (/youtube\.com|youtu\.be/.test(url) ? 'Video' : 'Website')