// Stub owned by US-DSC-003 (search input with history and suggestions). Minimal working version.
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { cx } from '@/components/ui'

export function SearchBox({ className }: { className?: string }) {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const nav = useNavigate()
  return (
    <form role="search" className={cx('relative flex h-11 items-center', className)} onSubmit={(e) => { e.preventDefault(); nav(`/search?q=${encodeURIComponent(q.trim())}`) }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm, shop" placeholder="Tìm sản phẩm, shop…" className="h-11 w-full rounded-full bg-surface pr-14 pl-5 text-[15px] ring-2 ring-inset ring-ink outline-none focus:ring-jade" />
      <button type="submit" aria-label="Tìm kiếm" className="absolute right-1 flex size-9 items-center justify-center rounded-full bg-jade text-white hover:bg-jade-ink"><Search size={18} aria-hidden /></button>
    </form>
  )
}
