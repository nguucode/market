// Shop identity pieces shared by the shop page and the search shop match.
import { BadgeCheck } from 'lucide-react'
import type { Shop } from '@/domain/types'
import { cx } from '@/components/ui'

const TONES = ['bg-[#e9dccb] text-[#5a4630]', 'bg-[#d9e6df] text-[#21493d]', 'bg-[#e6dbe4] text-[#4f3550]', 'bg-[#dfe2ec] text-[#333c5a]', 'bg-[#efe1cf] text-[#6b4a1f]', 'bg-[#e0e6d5] text-[#3e4a26]']
export const initials = (name: string) => name.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()

export function Monogram({ shop, className }: { shop: Shop; className?: string }) {
  return (
    <span aria-hidden className={cx('flex shrink-0 items-center justify-center rounded-full font-display font-semibold', TONES[Number(shop.avatar) % TONES.length], className)}>
      {initials(shop.name)}
    </span>
  )
}

export function OfficialBadge({ label = 'Shop chính hãng', className }: { label?: string; className?: string }) {
  return (
    <span className={cx('inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 text-[11px] font-semibold whitespace-nowrap text-ground', className)}>
      <BadgeCheck size={13} aria-hidden />{label}
    </span>
  )
}
