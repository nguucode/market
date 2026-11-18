// US-FND-005: the app shell in a 390×844 phone frame, demo controls docked beside it.
import { ExternalLink, RotateCw, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLayout } from '@/app/layout'
import { DemoControlsPanel } from './DemoControls'
import { Button, ButtonLink, SampleBadge, Toaster } from '@/components/ui'

const W = 390, H = 844, BEZEL = 14

export default function DevicePage() {
  const layout = useLayout()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const [src] = useState(params.get('path') || '/')
  const frame = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => { document.title = 'Xem trên điện thoại · Market' }, [])
  useEffect(() => {
    const fit = () => setScale(Math.max(0.6, Math.min(1, (window.innerHeight - 110) / (H + BEZEL * 2))))
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const loc = frame.current?.contentWindow?.location
        const cur = loc ? loc.pathname + loc.search : null
        if (cur && cur !== params.get('path')) setParams({ path: cur }, { replace: true })
      } catch { /* same-origin only */ }
    }, 500)
    return () => clearInterval(id)
  }, [params, setParams])

  if (layout === 'app')
    return (
      <main className="panel mx-auto mt-16 max-w-[560px] px-5 py-10 text-center">
        <h1 data-page-title tabIndex={-1} className="font-display text-[22px]">Bạn đang dùng màn hình nhỏ</h1>
        <p className="mt-2 text-muted">Market đã hiển thị dạng ứng dụng.</p>
        <ButtonLink to="/" className="mt-6">Về trang chủ</ButtonLink>
      </main>
    )

  return (
    <div className="flex min-h-dvh bg-ground">
      <main className="flex flex-1 flex-col items-center px-8 pt-6">
        <div className="mb-4 flex w-full max-w-[560px] items-center gap-2">
          <Smartphone size={18} strokeWidth={1.75} aria-hidden />
          <h1 data-page-title tabIndex={-1} className="flex-1 text-[15px] font-bold">Xem trên điện thoại</h1>
          <SampleBadge />
          <Button variant="secondary" size="sm" onClick={() => frame.current?.contentWindow?.location.reload()}><RotateCw size={14} aria-hidden />Tải lại</Button>
          <Button variant="secondary" size="sm" onClick={() => nav(params.get('path') || '/')}><ExternalLink size={14} aria-hidden />Mở bản web</Button>
        </div>
        <div style={{ width: (W + BEZEL * 2) * scale, height: (H + BEZEL * 2) * scale }}>
          <div className="origin-top-left rounded-[56px] bg-ink p-[14px] shadow-[var(--shadow-pop)]" style={{ transform: `scale(${scale})`, width: W + BEZEL * 2 }}>
            <iframe ref={frame} title="Market trên điện thoại" src={src} width={W} height={H} className="block rounded-[42px] bg-ground" />
          </div>
        </div>
      </main>
      <aside aria-label="Demo controls" className="h-dvh w-[380px] shrink-0 overflow-y-auto border-l border-line bg-surface px-6 py-5">
        <h2 className="font-display text-[18px]">Demo controls</h2>
        <p className="mt-1 text-[13px] text-muted">Thay đổi ở đây hiện ngay trong khung điện thoại.</p>
        <DemoControlsPanel />
      </aside>
      <Toaster />
    </div>
  )
}
