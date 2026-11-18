// The buyer's shop-voucher choices in the cart, per tab (sessionStorage), so auto-apply never fights a manual pick.
import { useSyncExternalStore } from 'react'
import type { VoucherChoice } from './cart'

const KEY = 'market.cart-vouchers.v1'
let choice: VoucherChoice = (() => { try { return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as VoucherChoice } catch { return {} } })()
const listeners = new Set<() => void>()

export function setChoice(shopId: string, v: string | null | undefined) {
  choice = { ...choice, [shopId]: v }
  if (v === undefined) delete choice[shopId]
  try { sessionStorage.setItem(KEY, JSON.stringify(choice)) } catch { /* private mode */ }
  listeners.forEach((l) => l())
}
export const useChoice = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => choice, () => choice)
