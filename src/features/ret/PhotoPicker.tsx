// Local mock upload, shared by US-RET-001/-002 and US-REV-001. Photos become small data URLs so they survive the localStorage store.
import { ImagePlus, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { delay } from '@/app/store'
import { cx, Skeleton } from '@/components/ui'
import { PHOTO_ERROR, validPhoto } from './logic'

/** Downscale to ≤640 px JPEG; formats the browser cannot decode (some HEIC) fall back to an object URL for this session. */
async function toPhotoUrl(file: File): Promise<string> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, 640 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.8)
  } catch {
    return URL.createObjectURL(file)
  }
}

export function PhotoPicker({ photos, onChange, max = 5, counted = 0, samples = [], label = 'Thêm ảnh', tile = 'size-20' }: {
  photos: string[]; onChange: (p: string[]) => void; max?: number; counted?: number; samples?: string[]; label?: string; tile?: string
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState('')
  const total = counted + photos.length
  const room = max - total - pending
  const add = async (files: File[]) => {
    setError('')
    const ok = files.filter(validPhoto).slice(0, Math.max(0, room))
    if (ok.length < files.length) setError(PHOTO_ERROR)
    if (!ok.length) return
    setPending((n) => n + ok.length)
    const urls = await Promise.all(ok.map(toPhotoUrl))
    await delay()
    setPending((n) => n - ok.length)
    onChange([...photos, ...urls])
  }
  const unusedSample = samples.find((s) => !photos.includes(s))
  return (
    <div>
      <ul className="flex flex-wrap gap-2" aria-label="Ảnh đã thêm">
        {photos.map((p, i) => (
          <li key={i} className={cx('relative overflow-hidden rounded-[var(--radius-control)] bg-well', tile)}>
            <img src={p} alt={`Ảnh ${counted + i + 1}`} className="size-full object-cover" />
            <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label={`Xóa ảnh ${counted + i + 1}`}
              className="absolute top-0 right-0 flex size-8 items-center justify-center rounded-bl-[var(--radius-control)] bg-ink/70 text-white hover:bg-ink">
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
        {Array.from({ length: pending }, (_, i) => <li key={`p${i}`} className={tile}><Skeleton className="size-full" /></li>)}
        {room > 0 && (
          <li className={tile}>
            <label htmlFor={id} className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] text-center text-[11px] leading-tight text-ink-2 ring-1 ring-line-strong ring-inset [border-style:dashed] hover:bg-well hover:text-accent-ink focus-within:ring-2 focus-within:ring-accent">
              <ImagePlus size={20} aria-hidden />
              <span>{label} ({total}/{max})</span>
            </label>
            <input id={id} ref={input} type="file" accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif" multiple className="sr-only"
              onChange={(e) => { add(Array.from(e.target.files ?? [])); e.target.value = '' }} />
          </li>
        )}
      </ul>
      {unusedSample && room > 0 && (
        <button type="button" onClick={() => onChange([...photos, unusedSample])} className="mt-2 min-h-11 text-[13px] font-semibold text-accent-ink hover:underline">
          Dùng ảnh mẫu
        </button>
      )}
      {error && <p role="alert" className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  )
}
