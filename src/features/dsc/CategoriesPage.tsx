// US-DSC-001: /categories. App: two-pane tree. Web: redirect to / with the header menu open.
import { useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useLayout } from '@/app/layout'
import { childrenOf } from '@/app/catalog'
import { useWorld } from '@/app/store'
import { cx, Img, PageTitle } from '@/components/ui'
import { SearchBox } from './SearchBox'
import { arrowNav, categoryImages } from './tree'

function Tile({ to, img, label }: { to: string; img?: string; label: string }) {
  return (
    <Link to={to} className="flex min-w-0 flex-col items-center gap-1.5 text-center no-underline">
      <Img src={img} alt="" className="size-16 rounded-full" />
      <span className="line-clamp-2 text-[12px] leading-4 text-ink-2">{label}</span>
    </Link>
  )
}

export default function CategoriesPage() {
  const layout = useLayout()
  const w = useWorld()
  const level1 = childrenOf(w)
  const [sel, setSel] = useState(level1[0]?.id)
  const pane = useRef<HTMLDivElement>(null)
  const images = useMemo(() => categoryImages(w), [w])
  if (layout === 'web') return <Navigate to="/?menu=categories" replace />

  const active = level1.find((c) => c.id === sel) ?? level1[0]
  const groups = active ? childrenOf(w, active.id) : []
  const pick = (id: string) => { setSel(id); pane.current?.scrollTo({ top: 0 }) }

  return (
    <div className="-mx-3 -mt-3">
      <PageTitle className="sr-only">Danh mục</PageTitle>
      <div className="bg-surface px-3 py-2"><SearchBox /></div>
      <div className="flex h-[calc(100dvh-56px-60px-58px-env(safe-area-inset-bottom))] border-t border-line">
        <nav aria-label="Danh mục cấp 1" onKeyDown={arrowNav} className="no-scrollbar w-[88px] shrink-0 overflow-y-auto bg-ground">
          {level1.map((c) => (
            <button key={c.id} type="button" onClick={() => pick(c.id)} aria-current={c.id === active?.id ? 'true' : undefined}
              className={cx('flex w-full flex-col items-center gap-1 px-1.5 py-3 text-center text-[12px] leading-4', c.id === active?.id ? 'bg-surface font-bold text-accent-ink' : 'text-ink-2')}>
              <Img src={images.get(c.id)} alt="" className="size-10 rounded-full" />
              <span className="break-words">{c.name}</span>
            </button>
          ))}
        </nav>
        <div ref={pane} className="min-w-0 flex-1 overflow-y-auto bg-surface px-3 pt-3 pb-8" aria-live="polite">
          {active && (
            groups.length === 0 ? (
              <div className="grid grid-cols-3 gap-x-3 gap-y-4 pt-2"><Tile to={`/c/${active.slug}`} img={images.get(active.id)} label="Xem tất cả sản phẩm" /></div>
            ) : groups.map((g) => {
              const leaves = childrenOf(w, g.id)
              return (
                <section key={g.id} aria-labelledby={`cg-${g.id}`} className="mb-5 border-b border-line pb-4 last:border-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 id={`cg-${g.id}`} className="text-[15px] leading-snug font-bold">{g.name}</h2>
                    <Link to={`/c/${g.slug}`} className="flex min-h-11 shrink-0 items-center text-[13px] font-semibold text-accent-ink underline-offset-4 hover:underline" aria-label={`Xem tất cả ${g.name}`}>Xem tất cả</Link>
                  </div>
                  <div onKeyDown={arrowNav} className="grid grid-cols-3 gap-x-3 gap-y-4">
                    {leaves.length ? leaves.map((c) => <Tile key={c.id} to={`/c/${c.slug}`} img={images.get(c.id)} label={c.name} />)
                      : <Tile to={`/c/${g.slug}`} img={images.get(g.id)} label="Xem tất cả sản phẩm" />}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
