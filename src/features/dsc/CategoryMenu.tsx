// US-DSC-001: web header "Danh mục" menu (level 1 left, its level 2 groups and level 3 links right).
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { childrenOf } from '@/app/catalog'
import { useWorld } from '@/app/store'
import { cx, Img } from '@/components/ui'
import { arrowNav, categoryImages } from './tree'

export function CategoryMenu() {
  const w = useWorld()
  const [open, setOpen] = useState(false)
  const [params, setParams] = useSearchParams()
  const level1 = childrenOf(w)
  const [activeId, setActiveId] = useState(level1[0]?.id)
  const images = useMemo(() => categoryImages(w), [w])

  // /categories on web redirects to /?menu=categories: open once, then strip the key (replace).
  useEffect(() => {
    if (params.get('menu') !== 'categories') return
    setOpen(true)
    const next = new URLSearchParams(params); next.delete('menu')
    setParams(next, { replace: true })
  }, [params, setParams])

  const active = level1.find((c) => c.id === activeId) ?? level1[0]
  const groups = active ? childrenOf(w, active.id) : []
  const close = () => setOpen(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-control)] px-3 text-[14px] font-semibold hover:bg-well hover:text-accent-ink data-[state=open]:bg-accent-soft data-[state=open]:text-accent-ink">
        <Menu size={18} aria-hidden />Danh mục<ChevronDown size={14} aria-hidden className={cx('transition-transform', open && 'rotate-180')} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={14} aria-label="Danh mục"
          className="z-50 flex max-h-[min(640px,75dvh)] w-[min(1200px,calc(100vw-64px))] overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-pop)] outline-none motion-safe:animate-[pop-in_160ms_var(--ease-out-expo)]">
          <nav aria-label="Danh mục cấp 1" onKeyDown={arrowNav} className="w-[240px] shrink-0 overflow-y-auto border-r border-line py-2">
            {level1.map((c) => (
              <Link key={c.id} to={`/c/${c.slug}`} onClick={close} onMouseEnter={() => setActiveId(c.id)} onFocus={() => setActiveId(c.id)}
                aria-current={c.id === active?.id ? 'true' : undefined}
                className={cx('flex min-h-11 items-center gap-3 px-4 py-1.5 text-[14px] no-underline', c.id === active?.id ? 'bg-accent-soft font-semibold text-accent-ink' : 'text-ink-2 hover:bg-well')}>
                <Img src={images.get(c.id)} alt="" className="size-7 shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">{c.name}</span>
                <ChevronRight size={15} aria-hidden className="shrink-0 text-muted" />
              </Link>
            ))}
          </nav>
          {active && (
            <div onKeyDown={arrowNav} className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
              <Link to={`/c/${active.slug}`} onClick={close} className="font-display text-[20px] no-underline hover:text-accent-ink">{active.name}</Link>
              {groups.length === 0 ? (
                <p className="mt-4"><Link to={`/c/${active.slug}`} onClick={close} className="text-[14px] underline-offset-4 hover:underline">Xem tất cả sản phẩm</Link></p>
              ) : (
                <div className="mt-5 space-y-6">
                  {groups.map((g) => (
                    <section key={g.id} aria-labelledby={`cm-${g.id}`}>
                      <h3 id={`cm-${g.id}`}><Link to={`/c/${g.slug}`} onClick={close} className="text-[15px] font-bold no-underline hover:text-accent-ink">{g.name}</Link></h3>
                      <ul className="mt-2 grid grid-cols-4 gap-x-6 gap-y-1">
                        {childrenOf(w, g.id).map((c) => (
                          <li key={c.id}><Link to={`/c/${c.slug}`} onClick={close} className="block py-1 text-[14px] text-ink-2 no-underline hover:text-accent-ink">{c.name}</Link></li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
