// One voucher as a radio row, shared by the cart shop-voucher sheet and the checkout voucher sheet.
import { Ticket } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx, Radio, vnd } from '@/components/ui'
import { voucherLabel } from '@/domain/pricing'
import type { Voucher } from '@/domain/types'
import { expiryText } from './vouchers'

/** Ticket tile: tinted stub with the value, white body with conditions; ineligible tiles grey out with the reason. */
export function VoucherOption({ v, name, checked, onPick, reason, now, disabled, extra }: {
  v: Voucher; name: string; checked: boolean; onPick: () => void; reason?: string; now: number; disabled?: boolean; extra?: ReactNode
}) {
  const off = disabled || !!reason
  return (
    <label className={cx('flex overflow-hidden rounded-[var(--radius-control)] bg-surface ring-1 ring-inset transition-colors', checked ? 'ring-accent' : 'ring-line hover:ring-line-strong', off ? 'cursor-not-allowed' : 'cursor-pointer')}>
      <span className={cx('flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed px-2 py-3 text-center', off ? 'border-line-strong bg-well text-muted' : 'border-accent/40 bg-accent-soft text-accent')}>
        <Ticket size={18} strokeWidth={1.8} aria-hidden />
        <span className="text-[13px] leading-tight font-bold">{voucherLabel(v)}</span>
      </span>
      <span className="flex min-w-0 flex-1 items-start gap-3 p-3">
        <span className={cx('min-w-0 flex-1', off && 'opacity-80')}>
          <span className="block text-[13px] text-ink-2">Đơn tối thiểu {vnd(v.minSpend)}</span>
          <span className="block text-[12px] text-muted">{expiryText(v.endsAt, now)}</span>
          {reason && <span className="mt-1 block text-[12px] font-medium text-danger">{reason}</span>}
          {extra}
        </span>
        <input type="radio" name={name} checked={checked} disabled={off} onChange={onPick} className="mt-0.5 size-[18px] shrink-0 accent-[var(--color-accent)]" />
      </span>
    </label>
  )
}

/** "Không dùng voucher" radio, the explicit way to remove one. */
export function NoVoucherOption({ name, checked, onPick, disabled }: { name: string; checked: boolean; onPick: () => void; disabled?: boolean }) {
  return <Radio name={name} checked={checked} onChange={onPick} disabled={disabled}><span className="text-[14px]">Bỏ chọn</span></Radio>
}
