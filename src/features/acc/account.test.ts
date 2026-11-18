import type { Address, Order, Product } from '@/domain/types'
import {
  addressLine, badgeText, canDeleteAddress, favoriteCardState, formatPhone, isValidVnPhone, maskPhone, matchVi, orderTabCounts, sortAddresses, validateAddress,
} from './account'

const addr = (id: string, isDefault = false): Address => ({ id, name: 'Lê Thu Hà', phone: '0905123456', provinceCode: 48, provinceName: 'Thành phố Đà Nẵng', wardCode: 1, wardName: 'Phường Hải Châu', detail: '27 Lê Đình Dương', label: 'home', isDefault })

describe('address rules', () => {
  it('formats and validates phones', () => {
    expect(formatPhone('0905123456')).toBe('0905 123 456')
    expect(formatPhone('09051')).toBe('0905 1')
    expect(maskPhone('0905 123 456')).toBe('0905 *** 456')
    expect(isValidVnPhone('0905123456')).toBe(true)
    expect(isValidVnPhone('905123456')).toBe(false)
    expect(isValidVnPhone('1905123456')).toBe(false)
  })
  it('validates every field with its message', () => {
    expect(validateAddress({ name: ' ', phone: '123', detail: '' })).toEqual({
      name: 'Vui lòng nhập họ và tên', phone: 'Số điện thoại không hợp lệ', province: 'Vui lòng chọn Tỉnh/Thành phố', ward: 'Vui lòng chọn Phường/Xã/Đặc khu', detail: 'Vui lòng nhập địa chỉ cụ thể',
    })
    expect(validateAddress({ name: 'Hà', phone: '0905 123 456', provinceCode: 1, wardCode: 4, detail: '1 Lý Thái Tổ' })).toEqual({})
  })
  it('sorts default first then newest, and guards deleting the default', () => {
    const xs = [addr('a1'), addr('a2', true), addr('a12')]
    expect(sortAddresses(xs).map((a) => a.id)).toEqual(['a2', 'a12', 'a1'])
    expect(canDeleteAddress(xs[1], xs).ok).toBe(false)
    expect(canDeleteAddress(xs[0], xs).ok).toBe(true)
    expect(canDeleteAddress(xs[1], [xs[1]]).ok).toBe(true)
  })
  it('one-line address and diacritic-insensitive search', () => {
    expect(addressLine(addr('a1'))).toBe('27 Lê Đình Dương, Phường Hải Châu, Thành phố Đà Nẵng')
    expect(matchVi('Thành phố Đà Nẵng', 'da nang')).toBe(true)
    expect(matchVi('Phường Hòa Khánh Bắc', 'HOA KHANH')).toBe(true)
    expect(matchVi('Hà Nội', 'nang')).toBe(false)
  })
})

describe('Me counts and favourites', () => {
  it('maps to_confirm into Chờ lấy hàng and caps badges', () => {
    const o = (status: Order['status']) => ({ status }) as Order
    expect(orderTabCounts([o('to_confirm'), o('to_ship'), o('awaiting_payment'), o('delivered'), o('completed'), o('cancelled')]))
      .toEqual({ awaiting_payment: 1, to_ship: 2, shipping: 0, delivered: 1 })
    expect(badgeText(120)).toBe('99+')
  })
  it('favourite card state', () => {
    const p = (status: Product['status']) => ({ status }) as Product
    expect(favoriteCardState(p('delisted'), [])).toBe('delisted')
    expect(favoriteCardState(p('active'), [{ stock: 0 } as never])).toBe('out_of_stock')
    expect(favoriteCardState(p('active'), [{ stock: 2 } as never])).toBe('available')
  })
})
