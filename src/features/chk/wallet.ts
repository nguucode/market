// The fictional wallet picked under "Ví điện tử" (Payment only stores `wallet`), per tab.
import { WALLETS } from './checkout'

const KEY = 'market.wallet.v1'
export type Wallet = (typeof WALLETS)[number]
export function getWallet(): Wallet {
  try { const v = sessionStorage.getItem(KEY); return (WALLETS as readonly string[]).includes(v ?? '') ? (v as Wallet) : WALLETS[0] } catch { return WALLETS[0] }
}
export function setWallet(v: Wallet) {
  try { sessionStorage.setItem(KEY, v) } catch { /* private mode */ }
}
