// One voucher as a radio row, shared by the cart shop-voucher sheet and the checkout voucher sheet.
import { Ticket } from 'lucide-react'
import type { ReactNode } from 'react'
import { Radio, vnd } from '@/components/ui'
import { voucherLabel } from '@/domain/pricing'
import type { Voucher } from '@/domain/types'
import { expiryText } from './vouchers'

export function VoucherOption({ v, name, checked, onPick, reason, now, disabled, extra }: {
  v: Voucher; name: string; checked: boolean; onPick: () => void; reason?: string; now: number; disabled?: boolean; extra?: ReactNode
}) {
  return (
    <Radio name={name} checked={checked} onChange={onPick} disabled={disabled || !!reason}>
      <span className="flex items-start gap-2.5">
        <Ticket size={18} strokeWidth={1.6} aria-hidden className="mt-0.5 shrink-0 text-jade" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-jade-ink">{voucherLabel(v)}</span>
          <span className="block text-[12px] text-muted">Đơn tối thiểu {vnd(v.minSpend)} · {expiryText(v.endsAt, now)}</span>
          {reason && <span className="mt-0.5 block text-[12px] text-ink-2">{reason}</span>}
          {extra}
        </span>
      </span>
    </Radio>
  )
}

/** "Không dùng voucher" radio, the explicit way to remove one. */
export function NoVoucherOption({ name, checked, onPick, disabled }: { name: string; checked: boolean; onPick: () => void; disabled?: boolean }) {
  return <Radio name={name} checked={checked} onChange={onPick} disabled={disabled}><span className="text-[14px]">Bỏ chọn</span></Radio>
}
