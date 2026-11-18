// US-ACC-003: two-level address form (rules.md#address), shared by /me/addresses and checkout (US-CHK-002).
import { AlertCircle, ArrowLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { saveAddress, useWorld } from '@/app/store'
import { Button, Chip, Confirm, cx, Field, IconButton, inputClass, Sheet, Skeleton, toast } from '@/components/ui'
import type { Address } from '@/domain/types'
import { DETAIL_MAX, formatPhone, LABEL_TEXT, matchVi, NAME_MAX, phoneDigits, validateAddress, type AddressErrors } from './account'

type Unit = { code: number; name: string; wards: [number, string][] }
let unitsCache: Unit[] | null = null
/** The 34 provinces with wards, kept out of the main bundle. */
function useUnits() {
  const [units, setUnits] = useState(unitsCache)
  useEffect(() => {
    if (unitsCache) return
    import('@/mock/data/admin-units.json').then((m) => { unitsCache = m.default as Unit[]; setUnits(unitsCache) })
  }, [])
  return units
}

type Form = { name: string; phone: string; provinceCode?: number; provinceName: string; wardCode?: number; wardName: string; detail: string; label: Address['label']; isDefault: boolean }
const toForm = (a: Address | undefined, first: boolean): Form => a
  ? { name: a.name, phone: formatPhone(a.phone), provinceCode: a.provinceCode, provinceName: a.provinceName, wardCode: a.wardCode, wardName: a.wardName, detail: a.detail, label: a.label, isDefault: a.isDefault }
  : { name: '', phone: '', provinceName: '', wardName: '', detail: '', label: 'home', isDefault: first }

/** The form in a sheet (app) or side panel (web). `actions` adds buttons such as "Xóa" under the form. */
export function AddressFormSheet({ open, initial, onSaved, onClose, actions }: {
  open: boolean; initial?: Address; onSaved: (id: string) => void; onClose: () => void; actions?: ReactNode
}) {
  return open ? <FormSheet key={initial?.id ?? 'new'} initial={initial} onSaved={onSaved} onClose={onClose} actions={actions} /> : null
}

function FormSheet({ initial, onSaved, onClose, actions }: { initial?: Address; onSaved: (id: string) => void; onClose: () => void; actions?: ReactNode }) {
  const w = useWorld()
  const first = w.addresses.length === 0 || (w.addresses.length === 1 && initial?.id === w.addresses[0].id)
  const [start] = useState(() => toForm(initial, w.addresses.length === 0))
  const [f, setF] = useState(start)
  const [errors, setErrors] = useState<AddressErrors>({})
  const [picking, setPicking] = useState<'province' | 'ward' | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [discard, setDiscard] = useState(false)
  const units = useUnits()
  const root = useRef<HTMLDivElement>(null)
  const lockDefault = first || !!initial?.isDefault
  const dirty = JSON.stringify(f) !== JSON.stringify(start)
  const set = (patch: Partial<Form>) => { setF((x) => ({ ...x, ...patch })); setFailed(false) }

  const close = () => (dirty ? setDiscard(true) : onClose())
  const submit = async () => {
    const e = validateAddress(f)
    setErrors(e)
    const firstBad = (['name', 'phone', 'province', 'ward', 'detail'] as const).find((k) => e[k])
    if (firstBad) { root.current?.querySelector<HTMLElement>(`#addr-${firstBad}`)?.focus(); return }
    setSaving(true)
    try {
      const id = await saveAddress({
        id: initial?.id, name: f.name.trim(), phone: formatPhone(f.phone), provinceCode: f.provinceCode!, provinceName: f.provinceName, wardCode: f.wardCode!, wardName: f.wardName,
        detail: f.detail.trim(), label: f.label, isDefault: lockDefault ? true : f.isDefault,
      })
      toast('Đã lưu địa chỉ')
      onSaved(id)
    } catch { setFailed(true) } finally { setSaving(false) }
  }

  const province = units?.find((u) => u.code === f.provinceCode)
  const pickerBtn = (id: string, value: string, placeholder: string, invalid: boolean, onClick: () => void, disabled?: boolean) => (
    <button id={id} type="button" disabled={disabled} onClick={onClick} aria-invalid={invalid || undefined}
      className={cx(inputClass(invalid), 'flex h-12 items-center justify-between gap-2 rounded-[8px] text-left disabled:cursor-not-allowed disabled:bg-well')}>
      <span className={cx('truncate', !value && 'text-muted')}>{value || placeholder}</span>
      <ChevronRight size={16} aria-hidden className="shrink-0 text-muted" />
    </button>
  )

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && close()} title={picking ? (picking === 'province' ? 'Tỉnh/Thành phố' : 'Phường/Xã/Đặc khu') : initial ? 'Sửa địa chỉ' : 'Địa chỉ mới'}
        footer={picking ? undefined : (
          <div className="space-y-2">
            {failed && <p role="alert" className="flex items-center gap-1.5 text-[13px] text-ink"><AlertCircle size={14} aria-hidden />Không lưu được địa chỉ. Thử lại.</p>}
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" className="hidden lg:inline-flex" onClick={close}>Trở lại</Button>
              <Button size="lg" full loading={saving} onClick={submit}>Hoàn thành</Button>
            </div>
          </div>
        )}>
        {picking ? (
          <UnitList
            items={picking === 'province' ? units?.map((u) => [u.code, u.name] as [number, string]) : province?.wards}
            current={picking === 'province' ? f.provinceCode : f.wardCode}
            label={picking === 'province' ? 'Tìm Tỉnh/Thành phố' : 'Tìm Phường/Xã/Đặc khu'}
            onBack={() => setPicking(null)}
            onPick={([code, name]) => {
              if (picking === 'province') { if (code !== f.provinceCode) set({ provinceCode: code, provinceName: name, wardCode: undefined, wardName: '' }); setErrors((e) => ({ ...e, province: undefined })) }
              else { set({ wardCode: code, wardName: name }); setErrors((e) => ({ ...e, ward: undefined })) }
              setPicking(null)
              requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(picking === 'province' ? '#addr-ward' : '#addr-detail')?.focus())
            }}
          />
        ) : (
          <div ref={root} className="space-y-4">
            <Field label="Họ và tên" htmlFor="addr-name" error={errors.name}>
              <input id="addr-name" className={cx(inputClass(!!errors.name), 'h-12 rounded-[8px]')} maxLength={NAME_MAX} autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={!!errors.name || undefined} />
            </Field>
            <Field label="Số điện thoại" htmlFor="addr-phone" error={errors.phone}>
              <input id="addr-phone" className={cx(inputClass(!!errors.phone), 'tabular h-12 rounded-[8px]')} inputMode="tel" autoComplete="tel" value={f.phone}
                onChange={(e) => set({ phone: formatPhone(phoneDigits(e.target.value)) })} aria-invalid={!!errors.phone || undefined} />
            </Field>
            <Field label="Tỉnh/Thành phố" htmlFor="addr-province" error={errors.province}>
              {pickerBtn('addr-province', f.provinceName, 'Chọn Tỉnh/Thành phố', !!errors.province, () => setPicking('province'))}
            </Field>
            <Field label="Phường/Xã/Đặc khu" htmlFor="addr-ward" error={errors.ward} hint={!f.provinceCode ? 'Chọn Tỉnh/Thành phố trước' : undefined}>
              {pickerBtn('addr-ward', f.wardName, 'Chọn Phường/Xã/Đặc khu', !!errors.ward, () => setPicking('ward'), !f.provinceCode)}
            </Field>
            <Field label="Địa chỉ cụ thể" htmlFor="addr-detail" error={errors.detail} hint={`${f.detail.length}/${DETAIL_MAX}`}>
              <input id="addr-detail" className={cx(inputClass(!!errors.detail), 'h-12 rounded-[8px]')} maxLength={DETAIL_MAX} placeholder="Số nhà, tên đường" autoComplete="street-address"
                value={f.detail} onChange={(e) => set({ detail: e.target.value })} aria-invalid={!!errors.detail || undefined} />
            </Field>
            <div role="radiogroup" aria-label="Loại địa chỉ" className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2" aria-hidden>Loại địa chỉ</p>
              <div className="flex gap-2">
                {(['home', 'office'] as const).map((l) => (
                  <Chip key={l} role="radio" aria-checked={f.label === l} aria-pressed={undefined} selected={f.label === l} onClick={() => set({ label: l })} className="min-h-11">{LABEL_TEXT[l]}</Chip>
                ))}
              </div>
            </div>
            <div className="flex min-h-11 items-center justify-between gap-3">
              <span id="addr-default" className="text-[14px]">Đặt làm mặc định</span>
              <button type="button" role="switch" aria-checked={lockDefault || f.isDefault} aria-labelledby="addr-default" disabled={lockDefault} onClick={() => set({ isDefault: !f.isDefault })}
                className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-70', lockDefault || f.isDefault ? 'bg-jade' : 'bg-line-strong')}>
                <span className={cx('absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow transition-transform', (lockDefault || f.isDefault) && 'translate-x-5')} />
              </button>
            </div>
            {actions}
          </div>
        )}
      </Sheet>
      <Confirm open={discard} onOpenChange={setDiscard} title="Bỏ thay đổi?" body="Những gì bạn vừa nhập sẽ không được lưu." confirmLabel="Bỏ thay đổi" cancelLabel="Tiếp tục sửa"
        onConfirm={() => { setDiscard(false); onClose() }} />
    </>
  )
}

function UnitList({ items, current, label, onPick, onBack }: { items?: [number, string][]; current?: number; label: string; onPick: (u: [number, string]) => void; onBack: () => void }) {
  const [q, setQ] = useState('')
  const shown = items?.filter(([, n]) => matchVi(n, q))
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 flex items-center gap-1 bg-surface px-3 pb-3">
        <IconButton label="Trở lại biểu mẫu" onClick={onBack}><ArrowLeft size={20} aria-hidden /></IconButton>
        <label className="relative flex-1">
          <span className="sr-only">{label}</span>
          <Search size={16} aria-hidden className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input autoFocus className={cx(inputClass(), 'pl-9')} placeholder={label} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {!shown ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        : !shown.length ? <p className="py-6 text-center text-[14px] text-muted">Không tìm thấy kết quả phù hợp</p>
        : (
          <ul className="divide-y divide-line">
            {shown.map(([code, name]) => (
              <li key={code}>
                <button type="button" onClick={() => onPick([code, name])} aria-current={code === current || undefined}
                  className={cx('flex min-h-11 w-full items-center py-2.5 text-left text-[14px] hover:text-jade-ink', code === current && 'font-semibold text-jade-ink')}>{name}</button>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
