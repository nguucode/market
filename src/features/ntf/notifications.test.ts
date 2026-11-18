import { expect, test } from 'vitest'
import type { Notification } from '@/domain/types'
import { seedWorld } from '@/mock/seed'
import { groupUnread, listFor, notificationThumb, tabLabel } from './notifications'

const n = (id: string, kind: Notification['kind'], read: boolean, createdAt: number, link?: string): Notification => ({ id, kind, title: id, body: '', read, createdAt, link })

test('groupUnread counts per kind', () => {
  expect(groupUnread([n('a', 'order', false, 1), n('b', 'order', true, 2), n('c', 'promotion', false, 3)])).toEqual({ order: 1, promotion: 1, system: 0 })
})
test('tabLabel brackets and caps', () => {
  expect(tabLabel('Đơn hàng', 0)).toBe('Đơn hàng')
  expect(tabLabel('Đơn hàng', 3)).toBe('Đơn hàng (3)')
  expect(tabLabel('Đơn hàng', 120)).toBe('Đơn hàng (99+)')
})
test('listFor: one kind, newest first', () => {
  expect(listFor([n('a', 'order', true, 1), n('b', 'system', true, 5), n('c', 'order', true, 3)], 'order').map((x) => x.id)).toEqual(['c', 'a'])
})
test('notificationThumb by link', () => {
  const w = seedWorld(Date.now())
  const o = w.orders[0]
  expect(notificationThumb(n('a', 'order', true, 1, `/orders/${o.id}`), w)).toEqual({ kind: 'image', src: o.lines[0].image })
  expect(notificationThumb(n('a', 'order', true, 1, '/orders/MK000'), w)).toEqual({ kind: 'mark' })
  expect(notificationThumb(n('a', 'promotion', true, 1, '/vouchers?voucher=mk15'), w)).toEqual({ kind: 'voucher', text: 'Giảm 15%' })
  expect(notificationThumb(n('a', 'system', true, 1), w)).toEqual({ kind: 'mark' })
  const r = w.returns[0]
  if (r) expect(notificationThumb(n('a', 'order', true, 1, `/returns/${r.id}`), w).kind).toBe('image')
})
