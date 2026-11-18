// US-FND-006: not-found page.
import { SearchX } from 'lucide-react'
import { ButtonLink, EmptyState } from '@/components/ui'

export default function NotFound({ what = 'trang' }: { what?: string }) {
  return (
    <EmptyState className="panel my-4" icon={<SearchX size={24} />} title={<span data-page-title tabIndex={-1}>Không tìm thấy {what}</span>}
      body="Đường dẫn có thể đã sai hoặc nội dung đã bị gỡ."
      action={<div className="flex gap-2"><ButtonLink to="/">Về trang chủ</ButtonLink><ButtonLink to="/search" variant="secondary">Tìm sản phẩm</ButtonLink></div>} />
  )
}
