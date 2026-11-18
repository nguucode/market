// Shop identity pieces shared by the shop page and the search shop match.
import { BadgeCheck } from 'lucide-react'
import type { Shop } from '@/domain/types'
import { cx } from '@/components/ui'

const TONES = ['bg-[#eef0f4] text-[#2f3a52]', 'bg-[#eaf3ef] text-[#1f4a3c]', 'bg-[#f3eef6] text-[#4a3460]', 'bg-[#fdeef1] text-[#8f0d2b]', 'bg-[#fff2e5] text-[#6b3d0e]', 'bg-[#eef3f8] text-[#23415e]']
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
    <span className={cx('inline-flex h-5 shrink-0 items-center gap-1 rounded-[4px] bg-accent-soft px-1.5 text-[11px] font-semibold whitespace-nowrap text-accent-ink', className)}>
      <BadgeCheck size={12} aria-hidden />{label}
    </span>
  )
}
