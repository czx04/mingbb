export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
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
