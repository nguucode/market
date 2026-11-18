// US-PDP-001: gallery (web thumbnail strip, app swipe with counter) and the full-screen image viewer (also used by review photos).
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLayout } from '@/app/layout'
import { cx, IconButton, Img } from '@/components/ui'

export function ImageViewer({ images, index, onIndex, open, onOpenChange, alt }: {
  images: string[]; index: number; onIndex: (i: number) => void; open: boolean; onOpenChange: (o: boolean) => void; alt: string
}) {
  const n = images.length
  const go = (d: number) => onIndex((index + d + n) % n)
  const startX = useRef<number | null>(null)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-ink/95" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[56] flex flex-col text-ground outline-none"
          onKeyDown={(e) => { if (n > 1 && e.key === 'ArrowRight') go(1); if (n > 1 && e.key === 'ArrowLeft') go(-1) }}
        >
          <div className="flex h-14 shrink-0 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
            <Dialog.Title className="tabular px-2 text-[14px]">{n > 1 ? `${index + 1}/${n}` : alt}<span className="sr-only">, {alt}</span></Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold hover:bg-ground/10"><X size={18} aria-hidden />Đóng</button>
            </Dialog.Close>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 touch-pan-y"
            onPointerDown={(e) => { startX.current = e.clientX }}
            onPointerUp={(e) => { if (startX.current != null && n > 1 && Math.abs(e.clientX - startX.current) > 40) go(e.clientX < startX.current ? 1 : -1); startX.current = null }}
          >
            <img src={images[index]} alt={`${alt}, ảnh ${index + 1}`} className="max-h-full max-w-full rounded-[8px] bg-surface object-contain select-none" draggable={false} />
            {n > 1 && (<>
              <IconButton label="Ảnh trước" onClick={() => go(-1)} className="absolute left-3 bg-ground/15 text-ground hover:bg-ground/25"><ChevronLeft size={22} aria-hidden /></IconButton>
              <IconButton label="Ảnh sau" onClick={() => go(1)} className="absolute right-3 bg-ground/15 text-ground hover:bg-ground/25"><ChevronRight size={22} aria-hidden /></IconButton>
            </>)}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** `show` is an image pushed by the variant picker; it wins until it changes back to undefined. */
export function Gallery({ images, alt, show, muted, overlay }: { images: string[]; alt: string; show?: string; muted?: boolean; overlay?: ReactNode }) {
  const layout = useLayout()
  const [idx, setIdx] = useState(0)
  const [viewer, setViewer] = useState(false)
  const all = show && !images.includes(show) ? [show, ...images] : images
  const [prevShow, setPrevShow] = useState(show)
  if (show !== prevShow) { setPrevShow(show); setIdx(show ? all.indexOf(show) : 0) }
  const shownIdx = Math.min(idx, all.length - 1)
  const strip = useRef<HTMLDivElement>(null)

  // App: keep the swipe position in step with a pushed image.
  useEffect(() => {
    if (layout !== 'app' || !strip.current) return
    const el = strip.current
    el.scrollTo({ left: el.clientWidth * shownIdx, behavior: 'instant' as ScrollBehavior })
  }, [prevShow, layout]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (i: number) => { setIdx(i); setViewer(true) }
  const viewerEl = <ImageViewer images={all} index={shownIdx} onIndex={setIdx} open={viewer} onOpenChange={setViewer} alt={alt} />

  if (layout === 'app')
    return (
      <div className={cx('relative -mx-4 -mt-4', muted && 'opacity-60 grayscale')}>
        <div ref={strip} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== idx) setIdx(i) }}>
          {all.map((src, i) => (
            <button key={src + i} type="button" onClick={() => open(i)} className="w-full shrink-0 snap-center" aria-label={`Xem ảnh ${i + 1} toàn màn hình`}>
              <Img full src={src} alt={i === 0 ? alt : ''} eager={i === 0} className="aspect-[4/5] w-full" />
            </button>
          ))}
        </div>
        {all.length > 1 && <span className="tabular absolute right-3 bottom-3 rounded-full bg-ink/70 px-2.5 py-1 text-[12px] font-medium text-ground" aria-hidden>{shownIdx + 1}/{all.length}</span>}
        {overlay}
        {viewerEl}
      </div>
    )

  return (
    <div className={cx('flex gap-3', muted && 'opacity-60 grayscale')}>
      {all.length > 1 && (
        <div className="relative w-[72px] shrink-0">
        <ul aria-label="Ảnh sản phẩm" className="no-scrollbar absolute inset-0 flex flex-col gap-2 overflow-y-auto">
          {all.map((src, i) => (
            <li key={src + i}>
              <button type="button" aria-label={`Ảnh ${i + 1}`} aria-current={i === shownIdx || undefined} onMouseEnter={() => setIdx(i)} onClick={() => setIdx(i)}
                className={cx('block w-full overflow-hidden rounded-[8px] ring-inset', i === shownIdx ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-line-strong')}>
                <Img src={src} alt="" className="aspect-[4/5] w-full" />
              </button>
            </li>
          ))}
        </ul>
        </div>
      )}
      <div className="relative min-w-0 flex-1">
        <button type="button" onClick={() => open(shownIdx)} className="block w-full cursor-zoom-in" aria-label="Xem ảnh toàn màn hình">
          <Img full src={all[shownIdx]} alt={alt} eager className="aspect-[4/5] w-full rounded-[8px]" />
        </button>
        {overlay}
      </div>
      {viewerEl}
    </div>
  )
}
