// US-FND-011: static legal pages linked from the footer (rules.md#seller-and-product-disclosures, Luật TMĐT Đ.11 k.1).
import { Link, useParams } from 'react-router'
import NotFound from '@/features/demo/NotFound'
import { PageTitle } from '@/components/ui'

const OPERATOR = 'Công ty TNHH Market Demo (pháp nhân hư cấu), 12 Bạch Đằng, Phường Hải Châu, Thành phố Đà Nẵng. Mã số doanh nghiệp 0400000000 (hư cấu). Điện thoại hỗ trợ 1900 0000 (hư cấu).'

const PAGES: Record<string, { title: string; body: string[] }> = {
  've-market': { title: 'Về Market', body: [
    'Market là bản demo sàn thương mại điện tử phía người mua, dựng cho một case study về thiết kế sản phẩm. Mọi shop, sản phẩm, đơn hàng và thanh toán đều là dữ liệu mẫu.',
    `Đơn vị vận hành: ${OPERATOR}`,
  ] },
  'dieu-khoan': { title: 'Điều khoản sử dụng', body: [
    'Khi nhấn "Đặt hàng", bạn đồng ý mua các sản phẩm đã chọn với giá, phí vận chuyển và các khuyến mại hiển thị tại trang Thanh toán. Giá niêm yết đã bao gồm VAT.',
    'Mỗi lần thanh toán có sản phẩm từ nhiều shop sẽ tạo nhiều đơn, mỗi shop một đơn. Bạn có thể hủy đơn khi shop chưa xác nhận; sau khi shop xác nhận, bạn gửi yêu cầu hủy và shop quyết định.',
    'Chính sách trả hàng/hoàn tiền của Market: gửi yêu cầu trong 15 ngày kể từ khi giao hàng thành công. Đây là chính sách của sàn, không thay thế quyền của người tiêu dùng theo pháp luật.',
  ] },
  'bao-mat': { title: 'Chính sách bảo mật', body: [
    'Bản demo không thu thập dữ liệu cá nhân. Thông tin hiển thị là của người dùng mẫu và chỉ được lưu trong trình duyệt của bạn (localStorage).',
    'Bạn có thể xóa toàn bộ dữ liệu bằng nút "Đặt lại dữ liệu mẫu" trong Demo controls.',
  ] },
  'quy-che': { title: 'Quy chế hoạt động', body: [
    'Người bán trên Market được xác thực trước khi bán. Thông tin người bán (tên, địa chỉ kinh doanh, mã số) hiển thị ở mục "Thông tin người bán" trên trang shop và trang sản phẩm.',
    'Đánh giá của người mua được hiển thị đầy đủ, không ẩn đánh giá tiêu cực. Thứ tự mặc định là mới nhất.',
    `Đơn vị vận hành: ${OPERATOR}`,
  ] },
  'khieu-nai': { title: 'Giải quyết khiếu nại', body: [
    'Với vấn đề về đơn hàng, bạn gửi yêu cầu trả hàng/hoàn tiền trong trang Chi tiết đơn hàng. Yêu cầu có dòng thời gian theo dõi tiến trình và thông báo ngay khi được tiếp nhận.',
    'Nếu shop từ chối và bạn chưa đồng ý, Market sẽ xem xét yêu cầu (tính năng này thuộc giai đoạn sau của bản demo).',
    `Đầu mối tiếp nhận: ${OPERATOR}`,
  ] },
}

export default function PolicyPage() {
  const { slug = '' } = useParams()
  const p = Object.hasOwn(PAGES, slug) ? PAGES[slug] : undefined
  if (!p) return <NotFound />
  return (
    <article className="mx-auto max-w-[68ch] pb-10">
      <PageTitle>{p.title}</PageTitle>
      <div className="mt-5 space-y-4 text-[15px] leading-7 text-ink-2">{p.body.map((x, i) => <p key={i}>{x}</p>)}</div>
      <nav aria-label="Trang chính sách khác" className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 text-[13px]">
        {Object.entries(PAGES).filter(([s]) => s !== slug).map(([s, x]) => <Link key={s} to={`/policies/${s}`}>{x.title}</Link>)}
      </nav>
    </article>
  )
}
