"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { adminApi } from "./api";
import { addDays, availableRanges, minutes, toKey } from "./data";
import type { Appointment, AppointmentStatus, Barber, Review, ScheduleMap, Service, ServiceCategory, Shift } from "./types";

type View = "schedule" | "appointments" | "reviews" | "catalog";
type IconName = "calendar" | "appointments" | "reviews" | "scissors" | "bell" | "plus" | "settings" | "more" | "clock" | "chevron" | "close" | "menu" | "copy" | "trash" | "edit" | "check" | "user" | "phone" | "briefcase";

const weekdays = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const shortWeekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const statuses: AppointmentStatus[] = ["Đang chờ", "Đã xác nhận", "Đang phục vụ", "Hoàn thành", "Đã hủy", "Không đến"];
const OPENING_TIME = "09:00";
const CLOSING_TIME = "19:30";

export default function AdminPage() {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<View>("schedule");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [schedules, setSchedules] = useState<ScheduleMap>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    adminApi.bootstrap().then((data) => {
      setServices(data.services);
      setCategories(data.categories);
      setBarbers(data.barbers);
      setSchedules(data.schedules);
      setAppointments(data.appointments);
      setReviews(data.reviews);
      setLoadError("");
    }).catch((error: Error) => setLoadError(error.message)).finally(() => setLoading(false));
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  const titles: Record<View, [string, string]> = {
    schedule: ["Lịch làm việc", "Thiết lập ca làm và ngày nghỉ cho từng barber."],
    appointments: ["Lịch hẹn", "Theo dõi và xử lý các lịch khách đã đặt."],
    reviews: ["Đánh giá", "Duyệt nội dung khách hàng hiển thị trên trang chủ."],
    catalog: ["Dịch vụ & Barber", "Cấu hình dữ liệu được sử dụng trên trang đặt lịch."]
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark">M</div><div><strong>MING</strong><span>ADMIN PORTAL</span></div></div>
      <button className="mobile-close" onClick={() => setMobileNav(false)}><Icon name="close" /></button>
      <nav className="main-nav schedule-nav">
        <p>VẬN HÀNH</p>
        <NavButton active={view === "schedule"} icon="calendar" label="Lịch làm việc" onClick={() => changeView("schedule")} />
        <NavButton active={view === "appointments"} icon="appointments" label="Lịch hẹn" badge={String(appointments.filter((item) => item.status === "Đang chờ").length)} onClick={() => changeView("appointments")} />
        <NavButton active={view === "reviews"} icon="reviews" label="Đánh giá" badge={String(reviews.filter((item) => !item.visible).length)} onClick={() => changeView("reviews")} />
        <p>CẤU HÌNH</p>
        <NavButton active={view === "catalog"} icon="scissors" label="Dịch vụ & Barber" onClick={() => changeView("catalog")} />
      </nav>
      <div className="profile"><div className="avatar avatar-dark">AD</div><div><strong>Minh Admin</strong><span>Quản trị viên</span></div><button><Icon name="more" /></button></div>
    </aside>
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} />}

    <main className="main-area">
      <header className="topbar">
        <button className="menu-button" onClick={() => setMobileNav(true)}><Icon name="menu" /></button>
        <div className="page-location"><Icon name={view === "catalog" ? "scissors" : view === "reviews" ? "reviews" : view === "appointments" ? "appointments" : "calendar"} /><span>MING Admin</span><b>/</b><strong>{titles[view][0]}</strong></div>
        <div className="top-actions"><button className="icon-button"><Icon name="bell" /><i /></button><span className="divider" /><div className="today"><small>Hôm nay</small><strong>{weekdays[today.getDay()]}, {today.getDate()} {months[today.getMonth()]}</strong></div></div>
      </header>
      <div className="content schedule-content">
        {loading && <div className="api-state"><span className="api-spinner" /><strong>Đang tải dữ liệu từ hệ thống...</strong></div>}
        {!loading && loadError && <div className="api-state api-error"><strong>Không tải được dữ liệu</strong><span>{loadError}</span><button onClick={() => window.location.reload()}>Thử lại</button></div>}
        {!loading && !loadError && <>
        {view === "schedule" && <ScheduleView barbers={barbers} schedules={schedules} appointments={appointments} setSchedules={setSchedules} notify={notify} />}
        {view === "appointments" && <AppointmentsView appointments={appointments} setAppointments={setAppointments} schedules={schedules} services={services} barbers={barbers} notify={notify} />}
        {view === "reviews" && <ReviewsView reviews={reviews} setReviews={setReviews} notify={notify} />}
        {view === "catalog" && <CatalogView services={services} setServices={setServices} categories={categories} setCategories={setCategories} barbers={barbers} setBarbers={setBarbers} notify={notify} />}
        </>}
      </div>
    </main>
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;

  function changeView(next: View) {
    setView(next);
    setMobileNav(false);
  }
}

function ScheduleView({ barbers, schedules, appointments, setSchedules, notify }: {
  barbers: Barber[]; schedules: ScheduleMap; appointments: Appointment[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleMap>>; notify: (message: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState(toKey(today));
  const [editing, setEditing] = useState<{ barberId: string; shift: Shift | null } | undefined>(undefined);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const selected = new Date(`${selectedDate}T00:00:00`);
  const workingBarbers = barbers.filter((barber) => (schedules[barber.id]?.[selectedDate] || []).length > 0);
  const dayAppointments = appointments.filter((item) => item.date === selectedDate && !["Đã hủy", "Không đến"].includes(item.status));
  const editingShifts = editing ? schedules[editing.barberId]?.[selectedDate] || [] : [];
  const editingBarber = editing ? barbers.find((item) => item.id === editing.barberId) : undefined;

  function moveWeek(days: number) {
    const next = addDays(weekStart, days);
    setWeekStart(next); setSelectedDate(toKey(next));
  }

  async function saveShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const from = String(data.get("from")); const to = String(data.get("to"));
    if (from < OPENING_TIME || to > CLOSING_TIME) return notify(`Ca làm phải nằm trong ${OPENING_TIME}–${CLOSING_TIME}`);
    if (from >= to) return notify("Giờ kết thúc phải sau giờ bắt đầu");
    if (editingShifts.some((item) => item.id !== editing?.shift?.id && from < item.to && to > item.from)) return notify("Ca làm này đang bị trùng");
    const shift = { id: editing?.shift?.id || Date.now(), from, to };
    const next = editing?.shift ? editingShifts.map((item) => item.id === editing.shift?.id ? shift : item) : [...editingShifts, shift];
    const saved = await setDayShifts(editing!.barberId, next.sort((a, b) => a.from.localeCompare(b.from)));
    if (saved) { setEditing(undefined); notify(editing?.shift ? "Đã cập nhật ca làm" : "Đã thêm ca làm"); }
  }

  async function setDayShifts(barberId: string, next: Shift[]) {
    try {
      await adminApi.replaceShifts(barberId, selectedDate, next);
      setSchedules((current) => ({ ...current, [barberId]: { ...(current[barberId] || {}), [selectedDate]: next } }));
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không thể lưu ca làm");
      return false;
    }
  }

  async function toggleWorking(barberId: string) {
    const currentShifts = schedules[barberId]?.[selectedDate] || [];
    if (currentShifts.length) {
      const hasBookings = dayAppointments.some((item) => item.barberId === barberId);
      if (hasBookings) return notify("Thợ đang có lịch hẹn, hãy chuyển hoặc hủy lịch trước");
      if (await setDayShifts(barberId, [])) notify("Đã đánh dấu thợ nghỉ trong ngày");
    } else {
      if (await setDayShifts(barberId, [{ id: Date.now(), from: "09:00", to: "12:00" }, { id: Date.now() + 1, from: "13:30", to: "19:30" }])) notify("Đã xếp thợ đi làm với ca mặc định");
    }
  }

  async function copyPreviousRoster() {
    const previousKey = toKey(addDays(selected, -1));
    const hasSource = barbers.some((barber) => (schedules[barber.id]?.[previousKey] || []).length);
    if (!hasSource) return notify("Ngày trước đó chưa có lịch phân công");
    try {
      const copied = barbers.map((barber, barberIndex) => ({ barber, shifts: (schedules[barber.id]?.[previousKey] || []).map((shift, index) => ({ ...shift, id: Date.now() + barberIndex * 10 + index })) }));
      await Promise.all(copied.map((item) => adminApi.replaceShifts(item.barber.id, selectedDate, item.shifts)));
      setSchedules((current) => {
        const next = { ...current };
        copied.forEach(({ barber, shifts }) => { next[barber.id] = { ...(current[barber.id] || {}), [selectedDate]: shifts }; });
        return next;
      });
      notify("Đã sao chép toàn bộ phân công ngày trước");
    } catch (error) { notify(error instanceof Error ? error.message : "Không thể sao chép phân công"); }
  }

  return <>
    <PageHeading eyebrow="VẬN HÀNH" title="Phân công thợ theo ngày" description="Chọn ngày để xem ngay thợ nào đi làm, thợ nào nghỉ và ca làm cụ thể." action={<button className="primary-button" onClick={copyPreviousRoster}><Icon name="copy" /> Sao chép ngày trước</button>} />
    <section className="panel week-panel">
      <div className="week-toolbar"><div><button onClick={() => moveWeek(-7)}><Icon name="chevron" /></button><h2>{months[week[0].getMonth()]} {week[0].getFullYear()}</h2><button className="next-week" onClick={() => moveWeek(7)}><Icon name="chevron" /></button></div><button onClick={() => { setWeekStart(today); setSelectedDate(toKey(today)); }}>Về hôm nay</button></div>
      <div className="date-strip">{week.map((date) => {
        const key = toKey(date); const count = barbers.filter((barber) => (schedules[barber.id]?.[key] || []).length > 0).length;
        return <button key={key} className={`${selectedDate === key ? "selected" : ""} ${key === toKey(today) ? "is-today" : ""}`} onClick={() => setSelectedDate(key)}><span>{weekdays[date.getDay()]}</span><strong>{date.getDate()}</strong><small>{count ? `${count}/${barbers.length} thợ làm` : "Không có thợ"}</small></button>;
      })}</div>
    </section>
    <section className="panel roster-panel">
      <div className="roster-heading"><div><p>{weekdays[selected.getDay()]}</p><h2>Phân công ngày {selected.getDate()} {months[selected.getMonth()].toLowerCase()}, {selected.getFullYear()}</h2><span>{workingBarbers.length}/{barbers.length} thợ đi làm · {dayAppointments.length} lịch đã đặt</span></div><div className="roster-legend"><i className="working-dot" /> Đi làm <i className="off-dot" /> Nghỉ</div></div>
      <div className="roster-list">{barbers.map((barber) => {
        const shifts = schedules[barber.id]?.[selectedDate] || [];
        const isWorking = shifts.length > 0;
        const barberAppointments = dayAppointments.filter((item) => item.barberId === barber.id);
        const totalMinutes = shifts.reduce((sum, shift) => sum + minutes(shift.to) - minutes(shift.from), 0);
        return <article className={`roster-row ${!isWorking ? "roster-off" : ""}`} key={barber.id}>
          <div className={`big-avatar avatar-${barber.tone}`}>{barber.initials}</div>
          <div className="roster-person"><span>BARBER</span><strong>{barber.name}</strong><small>{barber.detail}</small></div>
          <label className="roster-switch"><input type="checkbox" checked={isWorking} onChange={() => toggleWorking(barber.id)} /><i /><div><strong>{isWorking ? "Đi làm" : "Nghỉ"}</strong><span>{isWorking ? `${Math.floor(totalMinutes / 60)} giờ làm việc` : "Không nhận lịch"}</span></div></label>
          <div className="roster-shifts">{isWorking ? shifts.map((shift) => <div className="shift-pill" key={shift.id}><Icon name="clock" /><strong>{shift.from} – {shift.to}</strong><button onClick={() => setEditing({ barberId: barber.id, shift })}><Icon name="edit" /></button><button onClick={async () => {
            const hasBooking = barberAppointments.some((item) => item.from < shift.to && item.to > shift.from);
            if (hasBooking) return notify("Ca này đang có lịch hẹn, không thể xóa");
            if (await setDayShifts(barber.id, shifts.filter((item) => item.id !== shift.id))) notify("Đã xóa ca làm");
          }}><Icon name="trash" /></button></div>) : <span className="off-message">Thợ nghỉ trong ngày này</span>}</div>
          <div className="roster-actions">{isWorking && <><span>{barberAppointments.length} lịch đã đặt</span><button onClick={() => setEditing({ barberId: barber.id, shift: null })}><Icon name="plus" /> Thêm ca</button></>}</div>
        </article>;
      })}</div>
    </section>
    <div className="roster-note"><span>i</span><p><strong>Cách hoạt động:</strong> tắt “Đi làm” để đánh dấu thợ nghỉ cả ngày. Nếu thợ đi làm, bạn có thể giữ một hoặc nhiều ca như `09:00 – 12:00` và `13:30 – 19:30`.</p></div>
    {editing !== undefined && <Modal onClose={() => setEditing(undefined)} eyebrow={editing.shift ? "CHỈNH SỬA" : "CA LÀM MỚI"} title={editing.shift ? "Sửa ca làm" : `Thêm ca cho ${editingBarber?.name}`} subtitle={`${weekdays[selected.getDay()]}, ngày ${selected.getDate()} ${months[selected.getMonth()].toLowerCase()}`}><form onSubmit={saveShift}><div className="time-range-inputs"><label>Bắt đầu<input name="from" type="time" min={OPENING_TIME} max={CLOSING_TIME} required defaultValue={editing.shift?.from || OPENING_TIME} /></label><span>–</span><label>Kết thúc<input name="to" type="time" min={OPENING_TIME} max={CLOSING_TIME} required defaultValue={editing.shift?.to || "12:00"} /></label></div><div className="range-preview"><Icon name="clock" /><div><span>Ca làm của {editingBarber?.name} trong ngày đã chọn.</span><strong>Khung đặt lịch sẽ được tính bên trong ca này.</strong></div></div><ModalActions onClose={() => setEditing(undefined)} submit={editing.shift ? "Lưu thay đổi" : "Thêm ca làm"} /></form></Modal>}
  </>;
}

function AppointmentsView({ appointments, setAppointments, schedules, services, barbers, notify }: {
  appointments: Appointment[]; setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>; schedules: ScheduleMap; services: Service[]; barbers: Barber[]; notify: (message: string) => void;
}) {
  const [date, setDate] = useState(toKey(new Date()));
  const [filter, setFilter] = useState<"Tất cả" | AppointmentStatus>("Tất cả");
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [creating, setCreating] = useState(false);
  const [serviceId, setServiceId] = useState(services.find((item) => item.active)?.id || "");
  const [barberId, setBarberId] = useState<string | null>(barbers.find((item) => item.active)?.id || null);
  const [bookingDate, setBookingDate] = useState(toKey(new Date()));
  const [range, setRange] = useState("");
  const chosenService = services.find((item) => item.id === serviceId);
  const busy = appointments.filter((item) => item.date === bookingDate && item.barberId === barberId);
  const ranges = (barberId
    ? availableRanges(schedules[barberId]?.[bookingDate] || [], busy, 60, 2)
    : availableAnyBarberRanges(barbers, schedules, appointments, bookingDate, chosenService)
  ).slice(0, 18);
  const selectedDate = new Date(`${date}T00:00:00`);
  const weekStart = addDays(selectedDate, -((selectedDate.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const dayAppointments = appointments.filter((item) => item.date === date).sort((a, b) => a.from.localeCompare(b.from));
  const pendingAppointments = dayAppointments.filter((item) => item.status === "Đang chờ");
  const shown = dayAppointments.filter((item) => (filter === "Tất cả" || item.status === filter) && `${item.customer} ${item.phone} ${services.find((service) => service.id === item.serviceId)?.name || ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => setRange(""), [serviceId, barberId, bookingDate]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!range) return notify("Hãy chọn một khoảng giờ còn trống");
    const data = new FormData(event.currentTarget); const [from, to] = range.split("|");
    const draft = { date: bookingDate, from, to, customer: String(data.get("customer")), phone: String(data.get("phone")), serviceId, barberId, note: String(data.get("note") || "") };
    try {
      const created = await adminApi.createAppointment(draft);
      const item: Appointment = { ...draft, id: created.id, databaseId: created.databaseId, status: "Đang chờ" };
      setAppointments((current) => [...current, item]); setDate(bookingDate); setCreating(false); notify("Đã tạo lịch hẹn mới");
    } catch (error) { notify(error instanceof Error ? error.message : "Không thể tạo lịch hẹn"); }
  }

  async function updateStatus(item: Appointment, status: AppointmentStatus) {
    if (!item.databaseId) return notify("Lịch hẹn thiếu mã dữ liệu");
    setUpdatingId(item.id);
    try {
      await adminApi.updateAppointmentStatus(item.databaseId, status);
      setAppointments((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, status } : currentItem)); notify("Đã cập nhật trạng thái");
    } catch (error) { notify(error instanceof Error ? error.message : "Không thể cập nhật trạng thái"); }
    finally { setUpdatingId(""); }
  }

  async function assignBarber(item: Appointment, selectedBarberId: string) {
    if (!item.databaseId || !selectedBarberId) return;
    try {
      await adminApi.assignBarber(item.databaseId, selectedBarberId);
      setAppointments((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, barberId: selectedBarberId } : currentItem));
      notify("Đã xếp thợ cho lịch hẹn");
    } catch (error) { notify(error instanceof Error ? error.message : "Không thể xếp thợ"); }
  }

  function changeWeek(days: number) {
    setDate(toKey(addDays(selectedDate, days)));
  }

  function openCreate() {
    setBookingDate(date < toKey(new Date()) ? toKey(new Date()) : date);
    setCreating(true);
  }

  function renderAppointment(item: Appointment, compact = false) {
    const service = services.find((serviceItem) => serviceItem.id === item.serviceId);
    const barber = barbers.find((barberItem) => barberItem.id === item.barberId);
    const eligibleBarbers = barbers.filter((candidate) => candidate.active && service?.barberIds.includes(candidate.id) && (schedules[candidate.id]?.[item.date] || []).some((shift) => shift.from <= item.from && shift.to >= item.to));
    const nextAction = item.status === "Đang chờ" ? { label: "Xác nhận", status: "Đã xác nhận" as AppointmentStatus } : item.status === "Đã xác nhận" ? { label: "Khách đã đến", status: "Đang phục vụ" as AppointmentStatus } : item.status === "Đang phục vụ" ? { label: "Hoàn thành", status: "Hoàn thành" as AppointmentStatus } : null;
    const initials = item.customer.split(" ").slice(-2).map((part) => part[0]).join("");

    return <article className={`agenda-card agenda-${statusTone(item.status)} ${compact ? "agenda-compact" : ""}`} key={`${compact ? "queue" : "agenda"}-${item.id}`}>
      <div className="agenda-time"><strong>{item.from}</strong><span>đến {item.to}</span></div>
      <div className="agenda-person">
        <div className={`avatar avatar-${barber?.tone || "blue"}`}>{initials}</div>
        <div><strong>{item.customer}</strong><a href={`tel:${item.phone}`}><Icon name="phone" />{item.phone}</a></div>
      </div>
      {!compact && <div className="agenda-service"><span>Dịch vụ</span><strong>{service?.name || "Dịch vụ đã ẩn"}</strong><small>{service?.duration || 0} phút · {money.format(service?.price || 0)}</small></div>}
      <div className={`agenda-barber ${!barber ? "needs-barber" : ""}`}>
        <span>Barber</span>
        {barber ? <strong><i className={`avatar-dot avatar-${barber.tone}`}>{barber.initials}</i>{barber.name}</strong> : <select value="" onChange={(event) => assignBarber(item, event.target.value)} aria-label={`Xếp barber cho ${item.customer}`}><option value="" disabled>Chọn barber</option>{eligibleBarbers.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select>}
      </div>
      {item.note && !compact && <div className="agenda-note">“{item.note}”</div>}
      <div className="agenda-actions">
        <span className={`status status-${statusTone(item.status)}`}>{item.status}</span>
        {nextAction && <button className="quick-action" disabled={updatingId === item.id} onClick={() => updateStatus(item, nextAction.status)}>{updatingId === item.id ? "Đang lưu..." : nextAction.label}<Icon name="check" /></button>}
        {!compact && <select className="more-status" value={item.status} disabled={updatingId === item.id} onChange={(event) => updateStatus(item, event.target.value as AppointmentStatus)} aria-label={`Đổi trạng thái lịch của ${item.customer}`}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>}
      </div>
    </article>;
  }

  return <>
    <PageHeading eyebrow="QUẢN LÝ LỊCH" title="Lịch hẹn" description="Xem lịch theo ngày và xử lý lịch mới ngay tại một màn hình." action={<button className="primary-button" onClick={openCreate}><Icon name="plus" /> Tạo lịch hẹn</button>} />

    <section className="panel booking-calendar">
      <div className="calendar-toolbar">
        <div><p>Tuần đang xem</p><strong>{formatDate(toKey(week[0]))} – {formatDate(toKey(week[6]))}</strong></div>
        <div className="calendar-nav"><button aria-label="Tuần trước" onClick={() => changeWeek(-7)}><Icon name="chevron" /></button><button className="today-button" onClick={() => setDate(toKey(new Date()))}>Hôm nay</button><button className="next-date" aria-label="Tuần sau" onClick={() => changeWeek(7)}><Icon name="chevron" /></button><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Chọn ngày" /></div>
      </div>
      <div className="appointment-week">{week.map((day) => {
        const key = toKey(day);
        const items = appointments.filter((item) => item.date === key);
        const pending = items.filter((item) => item.status === "Đang chờ").length;
        return <button className={`${key === date ? "selected" : ""} ${key === toKey(new Date()) ? "is-today" : ""}`} onClick={() => setDate(key)} key={key}><span>{shortWeekdays[day.getDay()]}</span><strong>{day.getDate()}</strong><small>{items.length ? `${items.length} lịch` : "Còn trống"}</small>{pending > 0 && <b>{pending} chờ</b>}</button>;
      })}</div>
    </section>

    <section className="day-summary">
      <div><span>Tổng lịch</span><strong>{dayAppointments.length}</strong></div>
      <div className="summary-pending"><span>Cần xác nhận</span><strong>{pendingAppointments.length}</strong></div>
      <div><span>Đã xác nhận</span><strong>{dayAppointments.filter((item) => item.status === "Đã xác nhận").length}</strong></div>
      <div><span>Đã phục vụ</span><strong>{dayAppointments.filter((item) => ["Hoàn thành", "Đang phục vụ"].includes(item.status)).length}</strong></div>
    </section>

    <div className="appointment-grid">
      <section className="panel day-agenda">
        <div className="agenda-heading"><div><p>{weekdays[selectedDate.getDay()]}</p><h2>{formatDate(date)}</h2><span>{shown.length} lịch đang hiển thị</span></div><div className="agenda-search"><Icon name="appointments" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm khách, SĐT hoặc dịch vụ" /></div></div>
        <div className="agenda-filters">{(["Tất cả", "Đang chờ", "Đã xác nhận", "Đang phục vụ", "Hoàn thành"] as const).map((status) => <button className={filter === status ? "active" : ""} onClick={() => setFilter(status)} key={status}>{status}<b>{status === "Tất cả" ? dayAppointments.length : dayAppointments.filter((item) => item.status === status).length}</b></button>)}</div>
        {shown.length ? <div className="agenda-list">{shown.map((item) => renderAppointment(item))}</div> : <Empty icon="appointments" title="Không có lịch phù hợp" text="Thử bộ lọc khác hoặc tạo lịch trực tiếp cho khách." action="Tạo lịch hẹn" onClick={openCreate} />}
      </section>

      <aside className="panel confirm-queue">
        <div className="queue-heading"><div><span className="queue-pulse" /><div><p>ƯU TIÊN XỬ LÝ</p><h2>Cần xác nhận</h2></div></div><strong>{pendingAppointments.length}</strong></div>
        <p className="queue-help">Lịch mới trong ngày được gom tại đây. Bấm xác nhận để xử lý ngay.</p>
        {pendingAppointments.length ? <div className="queue-list">{pendingAppointments.map((item) => renderAppointment(item, true))}</div> : <div className="queue-empty"><span><Icon name="check" /></span><strong>Đã xử lý xong</strong><p>Không còn lịch nào chờ xác nhận trong ngày.</p></div>}
      </aside>
    </div>
    {creating && <Modal onClose={() => setCreating(false)} eyebrow="LỊCH HẸN MỚI" title="Tạo lịch cho khách" subtitle="Mỗi barber nhận tối đa 2 khách trong một khung giờ."><form onSubmit={create}><div className="form-grid"><label>Khách hàng<input name="customer" required placeholder="Nguyễn Văn A" /></label><label>Số điện thoại<input name="phone" required pattern="0[0-9]{9}" placeholder="0901234567" /></label><label>Dịch vụ<select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>{services.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{item.name} · {item.duration} phút</option>)}</select></label><label>Barber<select value={barberId ?? "any"} onChange={(event) => setBarberId(event.target.value === "any" ? null : event.target.value)}><option value="any">Barber bất kỳ</option>{barbers.filter((item) => item.active && chosenService?.barberIds.includes(item.id)).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="full-field">Ngày<input type="date" value={bookingDate} min={toKey(new Date())} onChange={(event) => setBookingDate(event.target.value)} /></label></div><label>Khung giờ còn chỗ</label>{ranges.length ? <div className="range-grid">{ranges.map((item) => <button className={range === `${item.from}|${item.to}` ? "selected" : ""} type="button" onClick={() => setRange(`${item.from}|${item.to}`)} key={item.from}><strong>{item.from} – {item.to}</strong><small>Còn {item.remaining} chỗ</small></button>)}</div> : <div className="no-ranges">Khung giờ không còn đủ chỗ nhận khách.</div>}<label>Ghi chú<textarea name="note" placeholder="Yêu cầu của khách..." /></label><ModalActions onClose={() => setCreating(false)} submit="Tạo lịch hẹn" /></form></Modal>}
  </>;
}

function ReviewsView({ reviews, setReviews, notify }: { reviews: Review[]; setReviews: React.Dispatch<React.SetStateAction<Review[]>>; notify: (message: string) => void }) {
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [busyId, setBusyId] = useState("");
  const visibleCount = reviews.filter((item) => item.visible).length;
  const hiddenCount = reviews.length - visibleCount;
  const average = reviews.length ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1) : "—";
  const shown = reviews.filter((item) => filter === "all" || (filter === "visible" ? item.visible : !item.visible));

  async function toggleVisibility(review: Review) {
    setBusyId(review.customerId);
    try {
      await adminApi.updateReviewVisibility(review.customerId, !review.visible);
      setReviews((current) => current.map((item) => item.customerId === review.customerId ? { ...item, visible: !item.visible } : item));
      notify(review.visible ? "Đã ẩn đánh giá khỏi trang chủ" : "Đã hiển thị lại đánh giá");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Không thể cập nhật đánh giá");
    } finally {
      setBusyId("");
    }
  }

  return <>
    <PageHeading eyebrow="NỘI DUNG" title="Quản lý đánh giá" description="Ẩn hoặc hiển thị phản hồi của khách trên carousel trang chủ." action={<div className="review-total"><strong>{reviews.length}</strong><span>đánh giá</span></div>} />
    <div className="review-admin-stats">
      <div><span>Tổng đánh giá</span><strong>{reviews.length}</strong></div>
      <div><span>Đang hiển thị</span><strong>{visibleCount}</strong></div>
      <div><span>Đã ẩn</span><strong>{hiddenCount}</strong></div>
      <div><span>Điểm trung bình</span><strong>{average}<small>{reviews.length ? "/5" : ""}</small></strong></div>
    </div>
    <section className="panel review-manager">
      <div className="review-manager-toolbar">
        <div><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Tất cả <b>{reviews.length}</b></button><button className={filter === "visible" ? "active" : ""} onClick={() => setFilter("visible")}>Đang hiện <b>{visibleCount}</b></button><button className={filter === "hidden" ? "active" : ""} onClick={() => setFilter("hidden")}>Đã ẩn <b>{hiddenCount}</b></button></div>
        <span>Ẩn review không xóa nội dung khách đã gửi.</span>
      </div>
      {shown.length ? <div className="admin-review-list">{shown.map((review) => <article className={`admin-review-card ${!review.visible ? "review-hidden" : ""}`} key={review.customerId}>
        <div className="review-person"><div className="avatar avatar-blue">{review.customerName.trim()[0]?.toUpperCase() || "K"}</div><div><strong>{review.customerName}</strong><span>{review.phone}</span></div></div>
        <div className="review-rating"><div>{Array.from({ length: 5 }, (_, index) => <span className={index < review.rating ? "filled" : ""} key={index}>★</span>)}</div><small>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(review.updatedAt))}</small></div>
        <p>{review.comment || "Khách không để lại nhận xét."}</p>
        <div className="review-visibility"><span className={review.visible ? "visible" : "hidden"}>{review.visible ? "Đang hiển thị" : "Đã ẩn"}</span><button disabled={busyId === review.customerId} onClick={() => toggleVisibility(review)}><Icon name={review.visible ? "close" : "check"} />{busyId === review.customerId ? "Đang lưu..." : review.visible ? "Ẩn khỏi trang chủ" : "Hiện trên trang chủ"}</button></div>
      </article>)}</div> : <div className="review-admin-empty"><Icon name="reviews" /><strong>Không có đánh giá phù hợp</strong><span>Thử chọn một bộ lọc khác.</span></div>}
    </section>
  </>;
}

function CatalogView({ services, setServices, categories, setCategories, barbers, setBarbers, notify }: { services: Service[]; setServices: React.Dispatch<React.SetStateAction<Service[]>>; categories: ServiceCategory[]; setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>; barbers: Barber[]; setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>; notify: (message: string) => void }) {
  const [tab, setTab] = useState<"services" | "categories" | "barbers">("services");
  const [addingService, setAddingService] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingBarber, setAddingBarber] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name || "Chưa phân loại";
  const nextCategoryOrder = () => categories.reduce((max, category) => Math.max(max, category.sortOrder), 0) + 1;
  const nextServiceOrder = () => services.reduce((max, service) => Math.max(max, service.sortOrder), 0) + 1;

  function readServiceForm(data: FormData, current?: Service): Omit<Service, "id"> {
    return {
      name: String(data.get("name") || "").trim(),
      categoryId: String(data.get("categoryId") || ""),
      shortDescription: String(data.get("shortDescription") || "").trim(),
      description: String(data.get("description") || "").trim(),
      duration: Number(data.get("duration")),
      price: Number(data.get("price")),
      priceDisplayMode: String(data.get("priceDisplayMode") || "fixed") as Service["priceDisplayMode"],
      sortOrder: Number(data.get("sortOrder")),
      active: current?.active ?? true,
      published: data.get("published") === "on",
      featured: data.get("featured") === "on",
      onlineBookable: data.get("onlineBookable") === "on",
      barberIds: data.getAll("barberIds").map(String)
    };
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const draft = readServiceForm(data);
    try { const created = await adminApi.createService(draft); setServices((current) => [...current, { ...draft, id: created.id }]); setAddingService(false); notify("Đã thêm dịch vụ"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể thêm dịch vụ"); }
  }
  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const draft = { name: String(data.get("name") || "").trim(), sortOrder: Number(data.get("sortOrder")), active: true };
    try { const created = await adminApi.createServiceCategory(draft); setCategories((current) => [...current, { ...draft, id: created.id, slug: draft.name.toLowerCase().replace(/\s+/g, "-") }]); setAddingCategory(false); notify("Đã thêm danh mục"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể thêm danh mục"); }
  }
  async function addBarber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get("name"));
    const draft = { name, detail: String(data.get("detail")), active: true, initials: name.trim()[0]?.toUpperCase() || "B", tone: "green" };
    try { const created = await adminApi.createBarber(draft); setBarbers((current) => [...current, { ...draft, id: created.id }]); setAddingBarber(false); notify("Đã thêm barber"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể thêm barber"); }
  }
  async function editService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingService) return; const data = new FormData(event.currentTarget);
    const next = { ...editingService, ...readServiceForm(data, editingService) };
    try { await adminApi.updateService(next); setServices((current) => current.map((item) => item.id === next.id ? next : item)); setEditingService(null); notify("Đã sửa dịch vụ"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể sửa dịch vụ"); }
  }
  async function editCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingCategory) return; const data = new FormData(event.currentTarget);
    const next = { ...editingCategory, name: String(data.get("name") || "").trim(), sortOrder: Number(data.get("sortOrder")), active: data.get("active") === "on" };
    try { await adminApi.updateServiceCategory(next); setCategories((current) => current.map((item) => item.id === next.id ? next : item)); setEditingCategory(null); notify("Đã cập nhật danh mục"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể cập nhật danh mục"); }
  }
  async function editBarber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingBarber) return; const data = new FormData(event.currentTarget); const name = String(data.get("name"));
    const next = { ...editingBarber, name, detail: String(data.get("detail")), initials: String(data.get("initials")) };
    try { await adminApi.updateBarber(next); setBarbers((current) => current.map((item) => item.id === next.id ? next : item)); setEditingBarber(null); notify("Đã sửa barber"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể sửa barber"); }
  }
  async function deleteService(service: Service) {
    if (!window.confirm(`Xóa dịch vụ “${service.name}”? Lịch sử cũ vẫn được giữ lại.`)) return;
    try { await adminApi.deleteService(service.id); setServices((current) => current.filter((item) => item.id !== service.id)); notify("Đã xóa dịch vụ"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể xóa dịch vụ"); }
  }
  async function deleteBarber(barber: Barber) {
    if (!window.confirm(`Xóa barber “${barber.name}”? Lịch hẹn và doanh thu cũ vẫn được giữ lại.`)) return;
    try { await adminApi.deleteBarber(barber.id); setBarbers((current) => current.filter((item) => item.id !== barber.id)); notify("Đã xóa barber"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể xóa barber"); }
  }
  async function toggleSkill(serviceId: string, barberId: string) {
    const current = services.find((service) => service.id === serviceId);
    if (!current) return;
    const next = { ...current, barberIds: current.barberIds.includes(barberId) ? current.barberIds.filter((id) => id !== barberId) : [...current.barberIds, barberId] };
    await saveService(next, "Đã cập nhật kỹ năng barber");
  }
  async function saveService(service: Service, message: string) {
    try { await adminApi.updateService(service); setServices((current) => current.map((item) => item.id === service.id ? service : item)); notify(message); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể cập nhật dịch vụ"); }
  }
  async function saveBarber(barber: Barber) {
    try { await adminApi.updateBarber(barber); setBarbers((current) => current.map((item) => item.id === barber.id ? barber : item)); notify("Đã cập nhật barber"); }
    catch (error) { notify(error instanceof Error ? error.message : "Không thể cập nhật barber"); }
  }

  return <>
    <PageHeading eyebrow="CẤU HÌNH" title="Dịch vụ & Barber" description="Quản lý danh mục, nội dung hiển thị, giá và barber thực hiện dịch vụ." action={<button className="primary-button" onClick={() => tab === "services" ? setAddingService(true) : tab === "categories" ? setAddingCategory(true) : setAddingBarber(true)}><Icon name="plus" /> {tab === "services" ? "Thêm dịch vụ" : tab === "categories" ? "Thêm danh mục" : "Thêm barber"}</button>} />
    <div className="catalog-tabs"><button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}><Icon name="scissors" /> Dịch vụ <b>{services.length}</b></button><button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")}><Icon name="settings" /> Danh mục <b>{categories.length}</b></button><button className={tab === "barbers" ? "active" : ""} onClick={() => setTab("barbers")}><Icon name="user" /> Barber <b>{barbers.length}</b></button></div>
    {tab === "services" ? <div className="catalog-grid">{services.map((service) => <article className={`panel catalog-card ${!service.active || !service.published ? "catalog-inactive" : ""}`} key={service.id}><div className="catalog-card-head"><div className="service-symbol"><Icon name="scissors" /></div><label className="day-switch"><input type="checkbox" checked={service.active} onChange={() => saveService({ ...service, active: !service.active }, "Đã cập nhật trạng thái")} /><i /></label></div><p>{categoryName(service.categoryId).toUpperCase()}</p><h3>{service.name}</h3><div className="catalog-badges"><span>{service.published ? "Hiện website" : "Ẩn website"}</span><span>{service.featured ? "Nổi bật" : "Không nổi bật"}</span><span>{service.onlineBookable ? "Đặt online" : "Liên hệ"}</span></div><div className="catalog-meta"><span><Icon name="clock" /> {service.duration} phút</span><strong>{service.priceDisplayMode === "contact" ? "Liên hệ" : service.priceDisplayMode === "from" ? `Từ ${money.format(service.price)}` : money.format(service.price)}</strong></div><p className="catalog-description">{service.shortDescription || "Chưa có mô tả ngắn"}</p><div className="skill-list"><span>BARBER THỰC HIỆN</span><div>{barbers.map((barber) => <button type="button" className={service.barberIds.includes(barber.id) ? "selected" : ""} onClick={() => toggleSkill(service.id, barber.id)} key={barber.id}><i>{barber.initials}</i>{barber.name}<b>{service.barberIds.includes(barber.id) ? "✓" : "+"}</b></button>)}</div></div><div className="catalog-actions"><button type="button" onClick={() => setEditingService(service)}><Icon name="edit" /> Sửa</button><button type="button" onClick={() => deleteService(service)}><Icon name="trash" /> Ẩn</button></div></article>)}</div> : tab === "categories" ? <div className="catalog-grid category-admin-grid">{categories.map((category) => <article className={`panel category-admin-card ${!category.active ? "catalog-inactive" : ""}`} key={category.id}><div className="category-order">{String(category.sortOrder).padStart(2, "0")}</div><div><p>DANH MỤC</p><h3>{category.name}</h3><span>{services.filter((service) => service.categoryId === category.id).length} dịch vụ</span></div><label className="day-switch"><input type="checkbox" checked={category.active} onChange={() => { const next = { ...category, active: !category.active }; adminApi.updateServiceCategory(next).then(() => { setCategories((current) => current.map((item) => item.id === next.id ? next : item)); notify("Đã cập nhật danh mục"); }).catch((error) => notify(error instanceof Error ? error.message : "Không thể cập nhật danh mục")); }} /><i /></label><div className="catalog-actions category-actions"><button type="button" onClick={() => setEditingCategory(category)}><Icon name="edit" /> Sửa</button></div></article>)}</div> : <div className="catalog-grid barber-grid-admin">{barbers.map((barber) => <article className={`panel barber-card-admin ${!barber.active ? "catalog-inactive" : ""}`} key={barber.id}><div className={`big-avatar avatar-${barber.tone}`}>{barber.initials}</div><div><p>BARBER</p><h3>{barber.name}</h3><span>{barber.detail}</span></div><label className="day-switch"><input type="checkbox" checked={barber.active} onChange={() => saveBarber({ ...barber, active: !barber.active })} /><i /></label><div className="barber-skills"><span>Dịch vụ có thể thực hiện</span><strong>{services.filter((service) => service.barberIds.includes(barber.id)).map((service) => service.name).join(" · ") || "Chưa có"}</strong></div><div className="catalog-actions barber-catalog-actions"><button type="button" onClick={() => setEditingBarber(barber)}><Icon name="edit" /> Sửa</button><button type="button" onClick={() => deleteBarber(barber)}><Icon name="trash" /> Xóa</button></div></article>)}</div>}
    {addingService && <Modal onClose={() => setAddingService(false)} eyebrow="DỊCH VỤ MỚI" title="Thêm dịch vụ" subtitle="Chọn danh mục để dịch vụ đúng nhóm trên website."><ServiceForm categories={categories} defaultSortOrder={nextServiceOrder()} onSubmit={addService} onClose={() => setAddingService(false)} barbers={barbers} /></Modal>}
    {addingCategory && <Modal onClose={() => setAddingCategory(false)} eyebrow="DANH MỤC MỚI" title="Thêm danh mục" subtitle="Ví dụ: Cắt tóc, Uốn tóc, Gội & chăm sóc."><form onSubmit={addCategory}><label>Tên danh mục<input name="name" required placeholder="Ví dụ: Uốn tóc" /></label><label>Thứ tự hiển thị<input name="sortOrder" type="number" min="0" defaultValue={nextCategoryOrder()} required /></label><ModalActions onClose={() => setAddingCategory(false)} submit="Thêm danh mục" /></form></Modal>}
    {addingBarber && <Modal onClose={() => setAddingBarber(false)} eyebrow="BARBER MỚI" title="Thêm barber" subtitle="Sau khi thêm, hãy thiết lập ca làm việc cho barber."><form onSubmit={addBarber}><label>Tên barber<input name="name" required placeholder="Ví dụ: Hoàng" /></label><label>Mô tả ngắn<input name="detail" required placeholder="Chuyên fade & styling" /></label><ModalActions onClose={() => setAddingBarber(false)} submit="Thêm barber" /></form></Modal>}
    {editingService && <Modal onClose={() => setEditingService(null)} eyebrow="CHỈNH SỬA" title="Sửa dịch vụ" subtitle="Cập nhật nội dung hiển thị và khả năng đặt lịch."><ServiceForm categories={categories} service={editingService} onSubmit={editService} onClose={() => setEditingService(null)} barbers={barbers} /></Modal>}
    {editingCategory && <Modal onClose={() => setEditingCategory(null)} eyebrow="CHỈNH SỬA" title="Sửa danh mục" subtitle="Đổi tên hoặc thứ tự hiển thị danh mục."><form onSubmit={editCategory}><label>Tên danh mục<input name="name" required defaultValue={editingCategory.name} /></label><label>Thứ tự hiển thị<input name="sortOrder" type="number" min="0" defaultValue={editingCategory.sortOrder} required /></label><label className="check-field"><input name="active" type="checkbox" defaultChecked={editingCategory.active} /> Hiển thị danh mục</label><ModalActions onClose={() => setEditingCategory(null)} submit="Lưu thay đổi" /></form></Modal>}
    {editingBarber && <Modal onClose={() => setEditingBarber(null)} eyebrow="CHỈNH SỬA" title="Sửa barber" subtitle="Cập nhật thông tin hiển thị của barber."><form onSubmit={editBarber}><label>Tên barber<input name="name" required defaultValue={editingBarber.name} /></label><div className="form-grid"><label>Tên viết tắt<input name="initials" required maxLength={3} defaultValue={editingBarber.initials} /></label><label>Mô tả ngắn<input name="detail" required defaultValue={editingBarber.detail} /></label></div><ModalActions onClose={() => setEditingBarber(null)} submit="Lưu thay đổi" /></form></Modal>}
  </>;
}

function ServiceForm({ categories, service, defaultSortOrder = 0, barbers, onSubmit, onClose }: { categories: ServiceCategory[]; service?: Service; defaultSortOrder?: number; barbers: Barber[]; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <form onSubmit={onSubmit}>
    <label>Tên dịch vụ<input name="name" required defaultValue={service?.name} placeholder="Ví dụ: Uốn texture" /></label>
    <div className="form-grid"><label>Danh mục<select name="categoryId" defaultValue={service?.categoryId || categories.find((category) => category.active)?.id} required>{categories.filter((category) => category.active).map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Thứ tự<input name="sortOrder" type="number" min="0" defaultValue={service?.sortOrder ?? defaultSortOrder} required /></label></div>
    <div className="form-grid"><label>Thời lượng (phút)<input name="duration" type="number" min="5" max="720" step="5" defaultValue={service?.duration ?? 45} required /></label><label>Giá dịch vụ<input name="price" type="number" min="0" step="10000" defaultValue={service?.price ?? 120000} required /></label></div>
    <label>Hiển thị giá<select name="priceDisplayMode" defaultValue={service?.priceDisplayMode || "fixed"}><option value="fixed">Giá cố định</option><option value="from">Giá từ</option><option value="contact">Liên hệ</option></select></label>
    <label>Mô tả ngắn<input name="shortDescription" defaultValue={service?.shortDescription} placeholder="Hiển thị trên thẻ dịch vụ" required /></label>
    <label>Mô tả đầy đủ<textarea name="description" defaultValue={service?.description} placeholder="Mô tả chi tiết quy trình, trải nghiệm..." required /></label>
    <fieldset className="barber-check-field"><legend>Barber thực hiện</legend><div>{barbers.filter((barber) => barber.active).map((barber) => <label className="check-field" key={barber.id}><input name="barberIds" type="checkbox" value={barber.id} defaultChecked={service ? service.barberIds.includes(barber.id) : true} /> {barber.name}</label>)}</div></fieldset>
    <div className="check-grid"><label className="check-field"><input name="published" type="checkbox" defaultChecked={service?.published ?? true} /> Hiện trên website</label><label className="check-field"><input name="featured" type="checkbox" defaultChecked={service?.featured ?? false} /> Nổi bật trang chủ</label><label className="check-field"><input name="onlineBookable" type="checkbox" defaultChecked={service?.onlineBookable ?? true} /> Cho đặt lịch online</label></div>
    <div className="service-form-note">Chỉ những barber được chọn mới nhận được lịch cho dịch vụ này.</div>
    <ModalActions onClose={onClose} submit={service ? "Lưu thay đổi" : "Thêm dịch vụ"} />
  </form>;
}

function NavButton({ active, icon, label, badge, onClick }: { active: boolean; icon: IconName; label: string; badge?: string; onClick: () => void }) { return <button className={active ? "active" : ""} onClick={onClick}><Icon name={icon} /><span>{label}</span>{badge && badge !== "0" && <b>{badge}</b>}</button>; }
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action: React.ReactNode }) { return <section className="page-heading schedule-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</section>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Empty({ icon, title, text, action, onClick }: { icon: IconName; title: string; text: string; action: string; onClick: () => void }) { return <div className="closed-state"><div><Icon name={icon} /></div><h3>{title}</h3><p>{text}</p><button onClick={onClick}><Icon name="plus" /> {action}</button></div>; }
function Modal({ children, onClose, eyebrow, title, subtitle }: { children: React.ReactNode; onClose: () => void; eyebrow: string; title: string; subtitle: string }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal slot-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><span>{subtitle}</span></div><button onClick={onClose}><Icon name="close" /></button></div>{children}</div></div>; }
function ModalActions({ onClose, submit }: { onClose: () => void; submit: string }) { return <div className="modal-actions"><button type="button" onClick={onClose}>Hủy</button><button className="primary-button" type="submit">{submit}</button></div>; }
function availableAnyBarberRanges(barbers: Barber[], schedules: ScheduleMap, appointments: Appointment[], date: string, service?: Service) {
  const slots = new Map<string, { from: string; to: string; remaining: number }>();
  barbers.filter((barber) => barber.active && service?.barberIds.includes(barber.id)).forEach((barber) => {
    availableRanges(schedules[barber.id]?.[date] || [], [], 60, 2).forEach((slot) => {
      const key = `${slot.from}|${slot.to}`;
      const current = slots.get(key);
      slots.set(key, { from: slot.from, to: slot.to, remaining: (current?.remaining || 0) + 2 });
    });
  });
  appointments.filter((item) => item.date === date && item.status !== "Đã hủy" && item.status !== "Không đến").forEach((item) => {
    const key = `${item.from}|${item.to}`;
    const slot = slots.get(key);
    if (slot) slot.remaining -= 1;
  });
  return Array.from(slots.values()).filter((slot) => slot.remaining > 0).sort((a, b) => a.from.localeCompare(b.from));
}
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function statusTone(status: AppointmentStatus) { return status === "Đang chờ" ? "pending" : status === "Đã xác nhận" ? "confirmed" : status === "Đang phục vụ" ? "serving" : status === "Hoàn thành" ? "done" : "cancelled"; }

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>, appointments: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/></>, reviews: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/></>, scissors: <><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.6 8.5 12.4-6M8.6 15.5 21 22M8.6 8.5 12 12l-3.4 3.5"/></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></>, plus: <path d="M12 5v14M5 12h14"/>, settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6a8 8 0 0 0-1.5.9l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2.2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.5.9l.3 2.6h4l.3-2.6a8 8 0 0 0 1.5-.9l2.4-1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></>, more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, chevron: <path d="m9 18 6-6-6-6"/>, close: <path d="M6 6l12 12M18 6 6 18"/>, menu: <path d="M4 7h16M4 12h16M4 17h16"/>, copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></>, trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></>, edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>, check: <path d="m5 12 4 4L19 6"/>, user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>, phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .4 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>, briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
