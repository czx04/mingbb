export type ServiceCatalogItem = {
  index: string;
  name: string;
  description: string;
  details: string;
  duration: string;
  price: string;
  category: string;
  featured?: boolean;
};

/**
 * The first four items are the services highlighted on the home page.
 * The complete catalogue lives here so the dedicated services page can grow
 * without making the home page feel crowded.
 */
export const services: ServiceCatalogItem[] = [
  {
    index: "01",
    name: "Cắt tóc",
    description: "Tư vấn kiểu tóc, cắt và tạo kiểu hoàn thiện.",
    details: "Tư vấn theo khuôn mặt, chất tóc và phong cách sống của bạn.",
    duration: "45 phút",
    price: "120.000đ",
    category: "Tóc",
    featured: true
  },
  {
    index: "02",
    name: "Cạo mặt",
    description: "Khăn nóng thư giãn và đường cạo sạch gọn.",
    details: "Làm sạch sâu, khăn nóng và đường cạo êm nhẹ cho làn da thoải mái.",
    duration: "30 phút",
    price: "80.000đ",
    category: "Thư giãn",
    featured: true
  },
  {
    index: "03",
    name: "Chăm sóc râu",
    description: "Tỉa form, tạo đường nét và dưỡng râu.",
    details: "Định hình bộ râu cân đối với khuôn mặt, hoàn thiện bằng sản phẩm dưỡng.",
    duration: "30 phút",
    price: "Liên hệ",
    category: "Râu",
    featured: true
  },
  {
    index: "04",
    name: "Combo MING",
    description: "Trải nghiệm chăm sóc trọn vẹn trong một buổi.",
    details: "Kết hợp cắt tóc, cạo mặt và chăm sóc hoàn thiện trong một lần ghé quán.",
    duration: "75 phút",
    price: "190.000đ",
    category: "Combo",
    featured: true
  },
  {
    index: "05",
    name: "Gội đầu thư giãn",
    description: "Làm sạch nhẹ nhàng, thư giãn da đầu.",
    details: "Một khoảng nghỉ ngắn với quy trình gội sạch và massage da đầu thư giãn.",
    duration: "20 phút",
    price: "60.000đ",
    category: "Thư giãn"
  },
  {
    index: "06",
    name: "Tạo kiểu",
    description: "Sấy và hoàn thiện kiểu tóc theo phong cách của bạn.",
    details: "Tạo kiểu cho những dịp đặc biệt hoặc chỉ đơn giản là một ngày thật chỉn chu.",
    duration: "20 phút",
    price: "50.000đ",
    category: "Tóc"
  },
  {
    index: "07",
    name: "Uốn tóc nam",
    description: "Tạo độ phồng và nếp tóc tự nhiên, dễ chăm sóc.",
    details: "Tư vấn kiểu uốn phù hợp chất tóc, khuôn mặt và thời gian chăm sóc tại nhà.",
    duration: "120 phút",
    price: "Liên hệ",
    category: "Tóc"
  },
  {
    index: "08",
    name: "Nhuộm tóc nam",
    description: "Màu tóc cá tính, bền đẹp và phù hợp với bạn.",
    details: "Tư vấn màu và quy trình chăm sóc để mái tóc luôn giữ được độ bóng khỏe.",
    duration: "120 phút",
    price: "Liên hệ",
    category: "Tóc"
  }
];

export const featuredServices = services.filter((service) => service.featured);
