export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export type Service = {
  id: string;
  name: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  duration: number;
  price: number;
  priceDisplayMode: "fixed" | "from" | "contact";
  sortOrder: number;
  active: boolean;
  published: boolean;
  featured: boolean;
  onlineBookable: boolean;
  barberIds: string[];
};

export type Barber = {
  id: string;
  name: string;
  detail: string;
  active: boolean;
  initials: string;
  tone: string;
};

export type Shift = {
  id: string | number;
  from: string;
  to: string;
};

export type ScheduleMap = Record<string, Record<string, Shift[]>>;

export type AppointmentStatus = "Đang chờ" | "Đã xác nhận" | "Đang phục vụ" | "Hoàn thành" | "Đã hủy" | "Không đến";

export type Appointment = {
  id: string;
  databaseId?: string;
  date: string;
  from: string;
  to: string;
  customer: string;
  phone: string;
  serviceId: string;
  barberId: string | null;
  status: AppointmentStatus;
  note: string;
};

export type Review = {
  customerId: string;
  customerName: string;
  phone: string;
  rating: number;
  comment: string;
  visible: boolean;
  updatedAt: string;
};
