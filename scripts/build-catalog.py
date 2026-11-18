"""Builds src/mock/data/catalog-source.json from the DummyJSON product list (MIT, images hosted on cdn.dummyjson.com).
Run: python3 -I scripts/build-catalog.py .scratch/source/dummyjson.json
Names are rewritten in Vietnamese without real brand names; branded products are excluded (mock-data.md)."""
import json, sys

# category tree: level1 slug -> (name, {level2 slug: (name, {level3 slug: name})})
TREE = {
  'thoi-trang-nu': ('Thời trang nữ', {
    'vay-dam': ('Váy đầm', {'dam-du-tiec': 'Đầm dự tiệc', 'dam-hang-ngay': 'Đầm hằng ngày'}),
    'giay-nu': ('Giày dép nữ', {'giay-cao-got': 'Giày cao gót', 'dep-sandal-nu': 'Dép & sandal'}),
    'tui-xach': ('Túi xách', {'tui-deo-vai': 'Túi đeo vai', 'balo-nu': 'Balo'}),
  }),
  'thoi-trang-nam': ('Thời trang nam', {
    'ao-nam': ('Áo nam', {'so-mi-nam': 'Sơ mi', 'ao-thun-nam': 'Áo thun'}),
    'giay-nam': ('Giày nam', {'giay-the-thao-nam': 'Giày thể thao'}),
  }),
  'phu-kien': ('Phụ kiện thời trang', {
    'kinh-mat': ('Kính mát', {'kinh-ram': 'Kính râm'}),
    'trang-suc': ('Trang sức', {'bong-tai': 'Bông tai'}),
    'dong-ho': ('Đồng hồ', {'dong-ho-nam': 'Đồng hồ nam', 'dong-ho-nu': 'Đồng hồ nữ'}),
  }),
  'sac-dep': ('Sắc đẹp', {
    'trang-diem': ('Trang điểm', {'trang-diem-mat': 'Mắt', 'trang-diem-moi': 'Môi', 'son-mong': 'Sơn móng', 'phan': 'Phấn'}),
  }),
  'nha-cua': ('Nhà cửa & Đời sống', {
    'noi-that': ('Nội thất', {'giuong-sofa': 'Giường & sofa', 'ban-ghe': 'Bàn ghế', 'phong-tam': 'Phòng tắm'}),
    'trang-tri': ('Trang trí nhà', {'cay-chau': 'Cây & chậu', 'den': 'Đèn', 'khung-anh': 'Khung ảnh & đồ trang trí'}),
    'giay-ve-sinh': ('Đồ dùng gia đình', {'khan-giay': 'Khăn giấy'}),
  }),
  'do-bep': ('Đồ bếp', {
    'dung-cu-nau': ('Dụng cụ nấu', {'noi-chao': 'Nồi & chảo', 'dung-cu-che-bien': 'Dụng cụ chế biến'}),
    'ban-an': ('Bàn ăn', {'ly-coc': 'Ly & cốc', 'chen-dia': 'Chén, đĩa & muỗng nĩa'}),
    'thiet-bi-bep': ('Thiết bị bếp', {'may-xay': 'Máy xay', 'lo-bep': 'Lò & bếp điện'}),
    'bao-quan': ('Lưu trữ & bảo quản', {'hop-dung': 'Hộp & khay', 'ke-bep': 'Kệ bếp'}),
  }),
  'bach-hoa': ('Bách hóa', {
    'rau-cu-qua': ('Rau củ quả', {'rau-cu': 'Rau củ', 'trai-cay': 'Trái cây'}),
    'thit-ca-trung': ('Thịt, cá & trứng', {'thit-ca': 'Thịt & cá', 'trung': 'Trứng'}),
    'do-uong': ('Đồ uống', {'nuoc': 'Nước & nước ngọt', 'sua': 'Sữa & kem'}),
    'do-kho': ('Đồ khô & gia vị', {'gao-dau': 'Gạo, dầu & mật ong', 'thuc-pham-bo-sung': 'Thực phẩm bổ sung'}),
    'thu-cung': ('Thú cưng', {'thuc-an-thu-cung': 'Thức ăn thú cưng'}),
  }),
  'the-thao': ('Thể thao & Dã ngoại', {
    'bong': ('Bóng', {'bong-cac-loai': 'Bóng các loại'}),
    'vot-gay': ('Vợt & gậy', {'vot': 'Vợt', 'gay': 'Gậy & găng'}),
    'bao-ho': ('Đồ bảo hộ & dụng cụ', {'dung-cu-tap': 'Dụng cụ tập'}),
  }),
  'dien-thoai-pk': ('Điện thoại & Phụ kiện', {
    'phu-kien-chup': ('Phụ kiện chụp ảnh', {'gay-chan-may': 'Gậy & chân máy', 'den-selfie': 'Đèn selfie'}),
    'op-lung': ('Ốp lưng', {'op-lung-dt': 'Ốp lưng điện thoại'}),
  }),
}

# id: (name, level3, price VND, variant kind)
# kinds: apparel (Màu × Kích cỡ), shoes (Màu × Size), color, weight, none
P = {
  1: ('Mascara chuốt mi cong dài, chống lem', 'trang-diem-mat', 89000, 'none'),
  2: ('Bảng phấn mắt 12 ô có gương', 'trang-diem-mat', 159000, 'color'),
  3: ('Hộp phấn phủ kiềm dầu', 'phan', 129000, 'color'),
  4: ('Son thỏi đỏ lì mềm môi', 'trang-diem-moi', 119000, 'color'),
  5: ('Sơn móng tay đỏ nhung', 'son-mong', 49000, 'color'),
  11: ('Giường gỗ bọc nệm đầu giường cao', 'giuong-sofa', 12499000, 'size-bed'),
  12: ('Sofa băng ba chỗ bọc vải', 'giuong-sofa', 9890000, 'color'),
  13: ('Tủ đầu giường gỗ anh đào', 'ban-ghe', 1890000, 'none'),
  14: ('Ghế văn phòng tựa lưng cao', 'ban-ghe', 2490000, 'color'),
  15: ('Tủ lavabo gỗ kèm gương', 'phong-tam', 4590000, 'none'),
  16: ('Táo đỏ nhập khẩu', 'trai-cay', 79000, 'weight'),
  17: ('Thăn bò Úc cắt steak', 'thit-ca', 289000, 'weight'),
  18: ('Hạt khô cho mèo trưởng thành', 'thuc-an-thu-cung', 159000, 'weight'),
  19: ('Ức gà phi lê tươi', 'thit-ca', 69000, 'weight'),
  20: ('Dầu ăn thực vật 1L', 'gao-dau', 52000, 'none'),
  21: ('Dưa leo baby', 'rau-cu', 29000, 'weight'),
  22: ('Hạt khô cho chó mọi lứa tuổi', 'thuc-an-thu-cung', 189000, 'weight'),
  23: ('Trứng gà sạch hộp 10 quả', 'trung', 39000, 'none'),
  24: ('Cá hồi cắt khúc', 'thit-ca', 259000, 'weight'),
  25: ('Ớt chuông xanh', 'rau-cu', 35000, 'weight'),
  26: ('Ớt hiểm xanh', 'rau-cu', 15000, 'weight'),
  27: ('Mật ong hoa nhãn hũ thủy tinh', 'gao-dau', 145000, 'none'),
  28: ('Kem que vị trái cây hộp 4', 'sua', 65000, 'none'),
  29: ('Nước ép cam nguyên chất', 'nuoc', 45000, 'none'),
  30: ('Kiwi vàng', 'trai-cay', 99000, 'weight'),
  31: ('Chanh vàng', 'trai-cay', 49000, 'weight'),
  32: ('Sữa tươi thanh trùng 1L', 'sua', 36000, 'none'),
  33: ('Dâu tằm tươi', 'trai-cay', 85000, 'weight'),
  35: ('Khoai tây Đà Lạt', 'rau-cu', 32000, 'weight'),
  36: ('Bột protein vị vani', 'thuc-pham-bo-sung', 890000, 'none'),
  37: ('Hành tím', 'rau-cu', 39000, 'weight'),
  38: ('Gạo thơm túi 5kg', 'gao-dau', 145000, 'none'),
  39: ('Nước ngọt có ga lốc 6 lon', 'nuoc', 59000, 'none'),
  40: ('Dâu tây Đà Lạt', 'trai-cay', 129000, 'weight'),
  41: ('Khăn giấy hộp 3 lớp', 'khan-giay', 25000, 'none'),
  42: ('Nước khoáng thiên nhiên thùng 24 chai', 'nuoc', 115000, 'none'),
  43: ('Xích đu mây treo ban công', 'khung-anh', 1690000, 'none'),
  44: ('Khung ảnh cây gia đình', 'khung-anh', 189000, 'none'),
  45: ('Cây cảnh giả trang trí kệ', 'cay-chau', 149000, 'none'),
  46: ('Chậu cây gốm men', 'cay-chau', 129000, 'size'),
  47: ('Đèn bàn chân gỗ chụp vải', 'den', 459000, 'color'),
  48: ('Xẻng tre lật đồ chiên', 'dung-cu-che-bien', 29000, 'none'),
  49: ('Cốc nhôm đen giữ nhiệt', 'ly-coc', 99000, 'color'),
  50: ('Phới đánh trứng cán đen', 'dung-cu-che-bien', 45000, 'none'),
  51: ('Máy xay sinh tố 1,5L', 'may-xay', 890000, 'color'),
  52: ('Chảo xào thép carbon 32cm', 'noi-chao', 389000, 'none'),
  53: ('Thớt gỗ cao su', 'dung-cu-che-bien', 119000, 'size'),
  54: ('Dụng cụ vắt cam', 'dung-cu-che-bien', 39000, 'none'),
  55: ('Dụng cụ cắt trứng', 'dung-cu-che-bien', 35000, 'none'),
  56: ('Bếp điện từ đơn', 'lo-bep', 790000, 'none'),
  57: ('Rây lọc lưới mịn', 'dung-cu-che-bien', 55000, 'size'),
  58: ('Nĩa inox bộ 6', 'chen-dia', 79000, 'none'),
  59: ('Ly thủy tinh bộ 6', 'ly-coc', 149000, 'none'),
  60: ('Dụng cụ bào sợi 4 mặt', 'dung-cu-che-bien', 69000, 'none'),
  61: ('Máy xay cầm tay', 'may-xay', 459000, 'none'),
  62: ('Khay làm đá silicone', 'hop-dung', 45000, 'color'),
  63: ('Rổ lọc inox', 'dung-cu-che-bien', 65000, 'size'),
  64: ('Dao bếp thép không gỉ', 'dung-cu-che-bien', 159000, 'none'),
  65: ('Hộp cơm giữ nhiệt 3 ngăn', 'hop-dung', 189000, 'color'),
  66: ('Lò vi sóng 20L', 'lo-bep', 1890000, 'none'),
  67: ('Cây treo cốc 6 móc', 'ke-bep', 129000, 'none'),
  68: ('Chảo chống dính 26cm', 'noi-chao', 259000, 'size'),
  69: ('Đĩa sứ trắng tròn', 'chen-dia', 39000, 'size'),
  70: ('Kẹp gắp đồ ăn silicone', 'dung-cu-che-bien', 49000, 'color'),
  71: ('Nồi inox nắp kính 24cm', 'noi-chao', 349000, 'size'),
  72: ('Xẻng lật có rãnh', 'dung-cu-che-bien', 39000, 'none'),
  73: ('Kệ gia vị 2 tầng', 'ke-bep', 159000, 'none'),
  74: ('Muỗng inox bộ 6', 'chen-dia', 69000, 'none'),
  75: ('Khay gỗ phục vụ', 'chen-dia', 149000, 'size'),
  76: ('Cây cán bột gỗ', 'dung-cu-che-bien', 49000, 'none'),
  77: ('Dao bào vỏ', 'dung-cu-che-bien', 25000, 'color'),
  83: ('Áo sơ mi caro xanh đen', 'so-mi-nam', 289000, 'apparel'),
  85: ('Áo sơ mi kẻ caro dáng suông', 'so-mi-nam', 259000, 'apparel'),
  86: ('Áo sơ mi nam ngắn tay', 'so-mi-nam', 219000, 'apparel'),
  87: ('Áo sơ mi caro cổ bẻ', 'so-mi-nam', 249000, 'apparel'),
  91: ('Giày thể thao trắng đỏ đế êm', 'giay-the-thao-nam', 690000, 'shoes-m'),
  92: ('Giày sneaker trắng phối đỏ', 'giay-the-thao-nam', 590000, 'shoes-m'),
  93: ('Đồng hồ dây da nâu mặt tròn', 'dong-ho-nam', 890000, 'none'),
  109: ('Gậy monopod chụp ảnh', 'gay-chan-may', 189000, 'none'),
  108: ('Ốp lưng silicone có nam châm', 'op-lung-dt', 99000, 'color'),
  111: ('Gậy selfie có remote', 'gay-chan-may', 149000, 'color'),
  112: ('Chân máy quay có bánh xe', 'gay-chan-may', 2890000, 'none'),
  137: ('Bóng bầu dục da', 'bong-cac-loai', 289000, 'none'),
  138: ('Bóng chày da khâu tay', 'bong-cac-loai', 89000, 'none'),
  139: ('Găng bắt bóng chày', 'gay', 390000, 'size'),
  140: ('Bóng rổ số 7', 'bong-cac-loai', 259000, 'none'),
  141: ('Vành rổ treo tường', 'dung-cu-tap', 590000, 'none'),
  142: ('Bóng cricket da đỏ', 'bong-cac-loai', 129000, 'none'),
  143: ('Gậy cricket gỗ liễu', 'gay', 690000, 'none'),
  144: ('Mũ bảo hiểm thể thao có lưới', 'dung-cu-tap', 790000, 'size'),
  145: ('Bộ cọc cricket', 'dung-cu-tap', 459000, 'none'),
  146: ('Quả cầu lông vũ hộp 12', 'bong-cac-loai', 129000, 'none'),
  147: ('Bóng đá số 5', 'bong-cac-loai', 229000, 'none'),
  148: ('Bóng golf hộp 3', 'bong-cac-loai', 149000, 'none'),
  149: ('Gậy golf sắt số 7', 'gay', 1890000, 'none'),
  150: ('Gậy bóng chày kim loại', 'gay', 459000, 'size'),
  151: ('Bóng tennis hộp 3', 'bong-cac-loai', 99000, 'none'),
  152: ('Vợt tennis khung carbon', 'vot', 1290000, 'none'),
  153: ('Bóng chuyền da mềm', 'bong-cac-loai', 249000, 'none'),
  154: ('Kính râm gọng đen', 'kinh-ram', 189000, 'none'),
  155: ('Kính râm cổ điển', 'kinh-ram', 229000, 'color'),
  156: ('Kính mắt viền xanh đen', 'kinh-ram', 199000, 'none'),
  157: ('Kính tiệc gọng màu', 'kinh-ram', 129000, 'color'),
  158: ('Kính râm phi công', 'kinh-ram', 259000, 'color'),
  162: ('Đầm xòe xanh dương', 'dam-hang-ngay', 329000, 'apparel'),
  163: ('Đầm mùa hè hoa nhí', 'dam-hang-ngay', 299000, 'apparel'),
  164: ('Đầm suông xám', 'dam-hang-ngay', 279000, 'apparel'),
  165: ('Đầm ngắn tay phồng', 'dam-hang-ngay', 259000, 'apparel'),
  166: ('Đầm kẻ caro tartan', 'dam-hang-ngay', 349000, 'apparel'),
  172: ('Túi xách nữ xanh dương', 'tui-deo-vai', 459000, 'none'),
  173: ('Túi da nữ dáng hộp', 'tui-deo-vai', 690000, 'color'),
  175: ('Balo da giả màu trắng', 'balo-nu', 389000, 'none'),
  176: ('Túi xách nữ đen', 'tui-deo-vai', 429000, 'none'),
  177: ('Đầm dạ hội đen', 'dam-du-tiec', 890000, 'apparel'),
  178: ('Áo corset da kèm chân váy', 'dam-du-tiec', 790000, 'apparel'),
  179: ('Áo corset với chân váy đen', 'dam-du-tiec', 690000, 'apparel'),
  180: ('Đầm chấm bi', 'dam-hang-ngay', 319000, 'apparel'),
  182: ('Bông tai pha lê xanh', 'bong-tai', 159000, 'none'),
  183: ('Bông tai đá oval xanh', 'bong-tai', 189000, 'none'),
  184: ('Bông tai nhiệt đới', 'bong-tai', 129000, 'none'),
  185: ('Dép lê nâu đen', 'dep-sandal-nu', 159000, 'shoes-w'),
  187: ('Giày cao gót ánh vàng', 'giay-cao-got', 459000, 'shoes-w'),
  188: ('Giày búp bê nơ', 'giay-cao-got', 329000, 'shoes-w'),
  189: ('Giày cao gót đỏ', 'giay-cao-got', 489000, 'shoes-w'),
  193: ('Đồng hồ nữ dây kim loại vàng', 'dong-ho-nu', 1290000, 'none'),
  194: ('Đồng hồ nữ mặt nhỏ', 'dong-ho-nu', 690000, 'none'),
}

def main(path):
  src = {p['id']: p for p in json.load(open(path, encoding='utf-8'))['products']}
  cats = []
  leaf_parent = {}
  for s1, (n1, l2) in TREE.items():
    cats.append({'id': s1, 'slug': s1, 'name': n1, 'level': 1})
    for s2, (n2, l3) in l2.items():
      cats.append({'id': s2, 'slug': s2, 'name': n2, 'level': 2, 'parentId': s1})
      for s3, n3 in l3.items():
        cats.append({'id': s3, 'slug': s3, 'name': n3, 'level': 3, 'parentId': s2})
        leaf_parent[s3] = s2
  products = []
  for pid, (name, cat, price, kind) in P.items():
    assert cat in leaf_parent, cat
    s = src[pid]
    products.append({'src': pid, 'name': name, 'categoryId': cat, 'price': price, 'kind': kind,
                     'images': s['images'], 'thumbnail': s['thumbnail'], 'weight': s.get('weight', 1)})
  json.dump({'categories': cats, 'products': products}, open('src/mock/data/catalog-source.json', 'w', encoding='utf-8'),
            ensure_ascii=False, separators=(',', ':'))
  print(len(cats), 'categories,', len(products), 'products')

main(sys.argv[1])
