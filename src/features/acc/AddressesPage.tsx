// US-ACC-002: address book with one default; the form is US-ACC-003.
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { useLayout } from '@/app/layout'
import { MAX_ADDRESSES, removeAddress, setDefaultAddress, useWorld } from '@/app/store'
import { Button, Confirm, cx, EmptyState, PageTitle, Skeleton, toast, useLoaded } from '@/components/ui'
import type { Address } from '@/domain/types'
import { addressLine, canAddAddress, canDeleteAddress, LABEL_TEXT, sortAddresses } from './account'
import { AccountNav } from './AccountNav'
import { AddressFormSheet } from './AddressForm'

const Tag = ({ children, strong }: { children: string; strong?: boolean }) => (
  <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold', strong ? 'bg-jade-soft text-jade-ink' : 'bg-well text-ink-2')}>{children}</span>
)

export default function AddressesPage() {
  const loaded = useLoaded()
  const web = useLayout() === 'web'
  const w = useWorld()
  const list = sortAddresses(w.addresses)
  const [form, setForm] = useState<{ address?: Address } | null>(null)
  const [del, setDel] = useState<Address | null>(null)
  const canAdd = canAddAddress(w.addresses)

  const makeDefault = (a: Address) => {
    try { setDefaultAddress(a.id); toast('Đã cập nhật địa chỉ mặc định') } catch { toast('Không cập nhật được địa chỉ. Thử lại.', { tone: 'error' }) }
  }
  const remove = () => {
    const ok = del && removeAddress(del.id)
    setDel(null); setForm(null)
    toast(ok ? 'Đã xóa địa chỉ' : 'Không cập nhật được địa chỉ. Thử lại.', ok ? {} : { tone: 'error' })
  }
  const addBtn = (
    <div className={cx(!web && 'fixed inset-x-0 bottom-0 z-30 bg-surface px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar)]')}>
      <Button size="lg" full={!web} disabled={!canAdd} onClick={() => setForm({})}>Thêm địa chỉ mới</Button>
      {!canAdd && <p className="mt-1 text-center text-[12px] text-muted">Bạn đã có tối đa {MAX_ADDRESSES} địa chỉ</p>}
    </div>
  )

  const body = !loaded ? (
    <div aria-busy="true" aria-label="Đang tải" className="divide-y divide-line">{[0, 1, 2].map((i) => <div key={i} className="space-y-2 py-4"><Skeleton className="h-4 w-56" /><Skeleton className="h-4 w-4/5" /></div>)}</div>
  ) : !list.length ? (
    <EmptyState icon={<MapPin size={24} />} title="Bạn chưa có địa chỉ nào" action={<Button onClick={() => setForm({})}>Thêm địa chỉ mới</Button>} />
  ) : (
    <ul className={cx('divide-y divide-line', !web && '-mx-4 bg-surface px-4')}>
      {list.map((a) => {
        const can = canDeleteAddress(a, w.addresses)
        const info = (
          <>
            <span className="flex min-w-0 items-center gap-1.5 text-[15px]"><span className="truncate font-semibold">{a.name}</span><span className="text-muted" aria-hidden>|</span><span className="tabular shrink-0 text-ink-2">{a.phone}</span></span>
            <span className="mt-0.5 line-clamp-3 block text-[13px] break-words text-ink-2">{addressLine(a)}</span>
            <span className="mt-1.5 flex gap-1.5">{a.isDefault && <Tag strong>Mặc định</Tag>}<Tag>{LABEL_TEXT[a.label]}</Tag></span>
          </>
        )
        return (
          <li key={a.id}>
            {web ? (
              <div className="flex items-start gap-6 py-4">
                <div className="min-w-0 flex-1">{info}</div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex gap-4 text-[13px]">
                    <button type="button" className="font-semibold text-jade-ink hover:underline" onClick={() => setForm({ address: a })}>Sửa</button>
                    <button type="button" className="text-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:text-muted" disabled={!can.ok} aria-describedby={!can.ok ? `del-${a.id}` : undefined} onClick={() => setDel(a)}>Xóa</button>
                  </div>
                  {!can.ok && <p id={`del-${a.id}`} className="max-w-[260px] text-right text-[12px] text-muted">{can.reason}</p>}
                  {!a.isDefault && <Button size="sm" variant="secondary" onClick={() => makeDefault(a)}>Thiết lập mặc định</Button>}
                </div>
              </div>
            ) : (
              <button type="button" className="block w-full py-3.5 text-left" onClick={() => setForm({ address: a })}>{info}<span className="sr-only">Sửa địa chỉ này</span></button>
            )}
          </li>
        )
      })}
    </ul>
  )

  const editing = form?.address
  const formActions = !web && editing ? (() => {
    const d = canDeleteAddress(editing, w.addresses)
    return (
      <div className="flex flex-col gap-2 border-t border-line pt-4">
        {!editing.isDefault && <Button variant="secondary" onClick={() => { makeDefault(editing); setForm(null) }}>Thiết lập mặc định</Button>}
        <Button variant="ghost" disabled={!d.ok} onClick={() => setDel(editing)}>Xóa</Button>
        {!d.ok && <p className="text-center text-[12px] text-muted">{d.reason}</p>}
      </div>
    )
  })() : undefined

  return (
    <div className={cx(web ? 'grid grid-cols-[240px_minmax(0,1fr)] gap-10 pb-12' : 'pb-[calc(96px+env(safe-area-inset-bottom))]')}>
      {web && <AccountNav />}
      <div className="min-w-0">
        <div className={cx('flex items-start justify-between gap-4', web ? 'mb-3' : 'sr-only')}>
          <PageTitle>Địa chỉ của tôi</PageTitle>
          {web && list.length > 0 && addBtn}
        </div>
        {body}
        {!web && list.length > 0 && addBtn}
      </div>
      <AddressFormSheet open={!!form} initial={editing} onClose={() => setForm(null)} onSaved={() => setForm(null)} actions={formActions} />
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Xóa địa chỉ này?" body={del ? addressLine(del) : undefined} confirmLabel="Xóa" cancelLabel="Trở lại" onConfirm={remove} />
    </div>
  )
}
