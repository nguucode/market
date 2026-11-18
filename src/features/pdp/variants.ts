// Pure variant logic for US-PDP-003. A selection holds one option id (or null) per dimension, in dimension order,
// matching Sku.optionIds order.
import type { Product, Sku, VariantDimension } from '@/domain/types'

export const LOW_STOCK = 10
export type Selection = (string | null)[]
export type OptionState = { enabled: boolean; stock: number }

export const emptySelection = (dims: VariantDimension[]): Selection => dims.map(() => null)
export const selectionOf = (sku: Sku): Selection => [...sku.optionIds]

/** The SKU for a complete selection, or null while incomplete. Zero dimensions → the single SKU. */
export function resolveSku(skus: Sku[], sel: Selection): Sku | null {
  if (sel.some((o) => o == null)) return null
  return skus.find((k) => k.optionIds.length === sel.length && k.optionIds.every((o, i) => o === sel[i])) ?? null
}

/** Stock reachable by picking option `optionId` in dimension `d`, given the other picks. */
export function optionState(skus: Sku[], sel: Selection, d: number, optionId: string): OptionState {
  const stock = skus
    .filter((k) => k.optionIds[d] === optionId && k.optionIds.every((o, i) => i === d || sel[i] == null || sel[i] === o))
    .reduce((a, k) => a + k.stock, 0)
  return { enabled: stock > 0, stock }
}

export function availableOptions(dims: VariantDimension[], skus: Sku[], sel: Selection): OptionState[][] {
  return dims.map((dim, d) => dim.options.map((o) => optionState(skus, sel, d, o.id)))
}

/** Tap an option: pick it, or unpick when it is already picked. */
export const toggle = (sel: Selection, d: number, optionId: string): Selection => sel.map((o, i) => (i === d ? (o === optionId ? null : optionId) : o))

/** Image of the picked first-dimension option, if it has one. */
export function galleryImageFor(dims: VariantDimension[], sel: Selection): string | undefined {
  return dims[0]?.options.find((o) => o.id === sel[0])?.image
}

/** "Đen, 11oz" for the picked labels, or "" when nothing is picked. */
export function selectionText(p: Product, sel: Selection): string {
  return p.dimensions.map((dim, i) => dim.options.find((o) => o.id === sel[i])?.label).filter(Boolean).join(', ')
}
