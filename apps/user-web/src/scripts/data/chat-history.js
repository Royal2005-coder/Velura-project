export const mockHistoryData = [
  {
    sender: "bot",
    text: "Chào mừng bạn quay lại Velura! Set đồ len bạn đã xem hôm qua vẫn còn hàng đấy ạ.",
    time: "10:30 AM",
    isHistory: true
  },
  {
    sender: "user",
    text: "Set đồ đó có size M màu đỏ rượu vang không bạn?",
    time: "10:32 AM",
    isHistory: true
  },
  {
    sender: "bot",
    text: "Dạ có sẵn ạ, size M màu đỏ rượu vang đang là phối màu bán chạy nhất trong tuần này. Mình gửi bạn thông tin chi tiết để đặt hàng ngay nhé:",
    time: "10:33 AM",
    isHistory: true,
    // BỔ SUNG: Object product để kích hoạt giao diện Thẻ sản phẩm trong khung chat
    product: {
      image: "/src/assets/images/products/detail/detail-img-1.png",
      title: "Set đồ len thu đông cao cấp",
      price: "1.990.000₫"
    }
  }
];

export const mockRecommendedProducts = [
  {
    id: "set-do-len",
    title: "Set đồ len thu đông cao cấp",
    price: "1.990.000₫",
    image: "/src/assets/images/products/detail/detail-img-1.png",
    link: "/src/pages/products/detail.html"
  },
  {
    id: "ao-len-co-lo",
    title: "Áo len cổ lọ dệt kim lông cừu",
    price: "1.290.000₫",
    image: "/src/assets/images/products/product-ao-len.png",
    link: "/src/pages/products/list.html"
  },
  {
    id: "ao-khoac-da-tweed",
    title: "Áo khoác dạ Tweed cổ điển",
    price: "2.190.000₫",
    image: "/src/assets/images/product-silk-blazer.png",
    link: "/src/pages/products/list.html"
  }
];