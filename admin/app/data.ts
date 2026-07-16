import type { Appointment, Barber, ScheduleMap, Service, Shift } from "./types";

export const servicesSeed: Service[] = [
  { id: "cut", name: "Cắt tóc", categoryId: "haircut", shortDescription: "Tư vấn và tạo kiểu.", description: "Cắt tóc nam.", duration: 45, price: 120000, priceDisplayMode: "fixed", sortOrder: 1, active: true, published: true, featured: true, onlineBookable: true, barberIds: ["minh", "khoa"] },
  { id: "shave", name: "Cạo mặt", categoryId: "beard", shortDescription: "Khăn nóng và cạo sạch.", description: "Cạo mặt thư giãn.", duration: 30, price: 80000, priceDisplayMode: "fixed", sortOrder: 2, active: true, published: true, featured: true, onlineBookable: true, barberIds: ["minh", "khoa"] },
  { id: "combo", name: "Combo chăm sóc", categoryId: "combo", shortDescription: "Trải nghiệm trọn vẹn.", description: "Combo chăm sóc.", duration: 75, price: 190000, priceDisplayMode: "fixed", sortOrder: 3, active: true, published: true, featured: true, onlineBookable: true, barberIds: ["minh", "khoa"] }
];

export const barbersSeed: Barber[] = [
  { id: "minh", name: "Minh", detail: "5 năm kinh nghiệm", active: true, initials: "M", tone: "blue" },
  { id: "khoa", name: "Khoa", detail: "Chuyên fade & styling", active: true, initials: "K", tone: "orange" }
];

export function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function makeScheduleSeed(): ScheduleMap {
  const result: ScheduleMap = { minh: {}, khoa: {} };
  const today = new Date();
  for (let index = 0; index < 35; index += 1) {
    const date = addDays(today, index);
    const key = toKey(date);
    const isSunday = date.getDay() === 0;
    result.minh[key] = isSunday ? [] : standardShifts(index * 10);
    result.khoa[key] = date.getDay() === 2 ? [] : [
      { id: 3000 + index * 10, from: "10:00", to: "13:00" },
      { id: 3001 + index * 10, from: "14:00", to: "19:30" }
    ];
  }
  return result;
}

function standardShifts(seed: number): Shift[] {
  return [
    { id: 1000 + seed, from: "09:00", to: "12:00" },
    { id: 1001 + seed, from: "13:30", to: "19:30" }
  ];
}

export function makeAppointmentSeed(): Appointment[] {
  const today = toKey(new Date());
  const tomorrow = toKey(addDays(new Date(), 1));
  return [
    { id: "MG-2401", date: today, from: "09:00", to: "10:15", customer: "Nguyễn Minh Tuấn", phone: "0903218876", serviceId: "combo", barberId: "minh", status: "Đã xác nhận", note: "Fade thấp, giữ độ dài phần mái." },
    { id: "MG-2402", date: today, from: "10:15", to: "11:00", customer: "Trần Hoàng Nam", phone: "0981152234", serviceId: "cut", barberId: "khoa", status: "Đang chờ", note: "" },
    { id: "MG-2403", date: today, from: "13:30", to: "14:00", customer: "Lê Đức Anh", phone: "0917724610", serviceId: "shave", barberId: "minh", status: "Hoàn thành", note: "" },
    { id: "MG-2404", date: today, from: "15:00", to: "16:15", customer: "Phạm Quốc Bảo", phone: "0936881022", serviceId: "combo", barberId: "khoa", status: "Đang chờ", note: "Khách mới." },
    { id: "MG-2405", date: tomorrow, from: "09:00", to: "09:45", customer: "Võ Thành Long", phone: "0974126630", serviceId: "cut", barberId: "minh", status: "Đã xác nhận", note: "" }
  ];
}

export function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function timeValue(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function availableRanges(shifts: Shift[], appointments: Appointment[], slotMinutes = 60, capacity = 2) {
  const ranges: { from: string; to: string; remaining: number }[] = [];
  shifts.forEach((shift) => {
    for (let start = minutes(shift.from); start + slotMinutes <= minutes(shift.to); start += slotMinutes) {
      const end = start + slotMinutes;
      const from = timeValue(start);
      const to = timeValue(end);
      const booked = appointments.filter((item) => item.status !== "Đã hủy" && item.status !== "Không đến" && item.from === from && item.to === to).length;
      if (booked < capacity) ranges.push({ from, to, remaining: capacity - booked });
    }
  });
  return ranges;
}
