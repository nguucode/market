// Horizontal rail: 2½ cards with scroll-snap on the app, 5-6 visible with round prev/next buttons on the web.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx, IconButton } from '@/components/ui'

export function Rail({ label, items }: { label: string; items: { key: string; node: ReactNode }[] }) {
  const ref = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: true })
  const update = () => {
    const el = ref.current
    if (el) setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }
  useEffect(update, [items.length])
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' })
  const arrow = 'absolute top-[34%] z-10 -translate-y-1/2 bg-surface shadow-[var(--shadow-pop)] hover:bg-surface'
  return (
    <div className="relative">
      <ul ref={ref} onScroll={update} aria-label={label} role="list"
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto px-3 lg:mx-0 lg:scroll-px-0 lg:gap-3 lg:px-0">
        {items.map((it) => <li key={it.key} className="w-[40%] shrink-0 snap-start md:w-[27%] lg:w-[calc((100%-48px)/5)] xl:w-[calc((100%-60px)/6)]">{it.node}</li>)}
      </ul>
      <div className="hidden lg:block">
        {!edge.start && <IconButton label="Xem trước" onClick={() => page(-1)} className={cx(arrow, '-left-5')}><ChevronLeft size={20} aria-hidden /></IconButton>}
        {!edge.end && <IconButton label="Xem tiếp" onClick={() => page(1)} className={cx(arrow, '-right-5')}><ChevronRight size={20} aria-hidden /></IconButton>}
      </div>
    </div>
  )
}
