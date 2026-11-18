// Pure review helpers: US-REV-001.
import type { Order, Review } from '@/domain/types'

export const STAR_LABEL = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']
export const TAGS_GOOD = ['Chất lượng tốt', 'Đúng mô tả', 'Đóng gói cẩn thận', 'Giao hàng nhanh', 'Đáng tiền']
export const TAGS_BAD = ['Không đúng mô tả', 'Chất lượng kém', 'Đóng gói sơ sài', 'Giao hàng chậm', 'Shop phản hồi chậm']
export const TEXT_MAX = 1000
export const SUB_RATINGS = [['quality', 'Chất lượng sản phẩm'], ['delivery', 'Giao hàng'], ['service', 'Phục vụ của shop']] as const

export const tagsFor = (stars: number) => (stars >= 4 ? TAGS_GOOD : stars >= 1 ? TAGS_BAD : [])
/** Drops tags that no longer apply after the stars cross the 3/4 boundary. */
export const pruneTags = (tags: string[], stars: number) => tags.filter((t) => tagsFor(stars).includes(t))

/** "Lê Thu Hà" → "L***à": first and last letter kept, NFC-safe. */
export function maskName(name: string) {
  const ch = Array.from(name.normalize('NFC').replace(/\s+/g, ''))
  if (ch.length <= 1) return `${ch[0] ?? ''}***`
  return `${ch[0]}***${ch[ch.length - 1]}`
}

export const canEditReview = (r: Pick<Review, 'editedAt' | 'shopReply'>) => !r.editedAt && !r.shopReply
export const reviewableLines = (o: Order) => o.lines.filter((l) => !l.reviewId)

export type ReviewDraft = { rating: number; sub: { quality?: number; delivery?: number; service?: number }; tags: string[]; text: string; photos: string[] }
export const emptyReview = (): ReviewDraft => ({ rating: 0, sub: {}, tags: [], text: '', photos: [] })
export const isDirty = (d: ReviewDraft) => !!(d.rating || d.text.trim() || d.photos.length || d.tags.length || Object.values(d.sub).some(Boolean))
