"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import barberAvatar from "../../assets/logo.png";
import { AvailableBarber, BookingResult, BookingService, BookingSlot, bookingApi } from "../../lib/booking-api";
import styles from "./page.module.css";

const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

type BarberOption = AvailableBarber & { id: string; any?: boolean };

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<BookingService[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [note, setNote] = useState("");
  const [customerStatus, setCustomerStatus] = useState<"idle" | "checking" | "existing" | "new">("idle");
  const [customerLookupError, setCustomerLookupError] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedServices = services.filter((item) => serviceIds.includes(item.id));
  const totalPrice = selectedServices.reduce((sum, item) => sum + item.price, 0);
  const totalDuration = selectedServices.reduce((sum, item) => sum + item.duration, 0);
  const barber = barbers.find((item) => item.id === barberId);
  const bookingDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(today);
      item.setDate(today.getDate() + index);
      return {
        value: toLocalDateValue(item),
        weekday: index === 0 ? "Hôm nay" : weekdays[item.getDay()],
        day: String(item.getDate()).padStart(2, "0"),
        month: String(item.getMonth() + 1).padStart(2, "0")
      };
    });
  }, []);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    bookingApi.catalog()
      .then((catalog) => {
        if (!active) return;
        setServices(catalog.services);
        setError("");
      })
      .catch((requestError: Error) => active && setError(requestError.message))
      .finally(() => active && setCatalogLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!date) return;
    let active = true;
    setSlotsLoading(true);
    setSlots([]);
    setTime("");
    setServiceIds([]);
    setBarberId("");
    setError("");
    bookingApi.availability(date)
      .then((result) => active && setSlots(result.slots))
      .catch((requestError: Error) => active && setError(requestError.message))
      .finally(() => active && setSlotsLoading(false));
    return () => { active = false; };
  }, [date]);

  useEffect(() => {
    if (step !== 3 || !date || !time || serviceIds.length === 0) return;
    let active = true;
    setBarbersLoading(true);
    setBarbers([]);
    setBarberId("");
    setError("");
    bookingApi.barbers(date, time, serviceIds)
      .then((result) => {
        if (!active) return;
        const options: BarberOption[] = result.barbers;
        if (result.allowAnyBarber) {
          options.unshift({ id: "any", name: "Barber bất kỳ", detail: "Quán sẽ xếp barber phù hợp", remainingCapacity: 1, any: true });
        }
        setBarbers(options);
      })
      .catch((requestError: Error) => active && setError(requestError.message))
      .finally(() => active && setBarbersLoading(false));
    return () => { active = false; };
  }, [step, date, time, serviceIds]);

  const canContinue =
    (step === 1 && services.length > 0 && Boolean(date && time)) ||
    (step === 2 && serviceIds.length > 0) ||
    (step === 3 && Boolean(barberId)) ||
    (step === 4 && Boolean((customerStatus === "existing" || customerStatus === "new") && name.trim() && /^0\d{9}$/.test(phone.replace(/\s/g, "")) && (!referralCode || /^[A-Z0-9]{5}$/.test(referralCode))));

  function changePhone(value: string) {
    setPhone(value);
    setCustomerStatus("idle");
    setCustomerLookupError("");
    setName("");
    setReferralCode("");
  }

  async function checkCustomer() {
    const normalizedPhone = phone.replace(/\s/g, "");
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      setCustomerLookupError("Vui lòng nhập số điện thoại gồm 10 chữ số.");
      return;
    }
    setCustomerStatus("checking");
    setCustomerLookupError("");
    try {
      const result = await bookingApi.lookupCustomer(normalizedPhone);
      if (result.exists) {
        setName(result.customer.fullName);
        setReferralCode("");
        setCustomerStatus("existing");
      } else {
        setName("");
        setCustomerStatus("new");
      }
    } catch (requestError) {
      setCustomerStatus("idle");
      setCustomerLookupError(requestError instanceof Error ? requestError.message : "Không thể kiểm tra số điện thoại.");
    }
  }

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!canContinue || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await bookingApi.create({
        date,
        time,
        serviceIds,
        barberId: barberId === "any" ? null : barberId,
        customer: { fullName: name.trim(), phone: phone.replace(/\s/g, "") },
        referralCode: referralCode || undefined,
        note: note.trim() || undefined
      });
      setBookingResult(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể đặt lịch. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingResult) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <Link className={styles.logo} href="/" aria-label="MING Barber"><strong>MING</strong><span>BARBER</span></Link>
        </header>
        <section className={styles.success}>
          <div className={styles.check}>✓</div>
          <p className={styles.kicker}>Đặt lịch thành công</p>
          <h1>Hẹn gặp bạn tại MING.</h1>
          <p>Lịch hẹn đang chờ quán xác nhận qua số điện thoại của bạn.</p>
          <div className={styles.bookingCode}><span>Mã đặt lịch</span><strong>{bookingResult.bookingCode}</strong></div>
          <div className={styles.successCard}>
            <div><span>Dịch vụ</span><strong>{selectedServices.map((item) => item.name).join(", ")}</strong></div>
            <div><span>Barber</span><strong>{barber?.name}</strong></div>
            <div><span>Thời gian</span><strong>{time} · {formatDate(date)}</strong></div>
          </div>
          <Link className={styles.primaryButton} href="/">Về trang chủ</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="MING Barber"><strong>MING</strong><span>BARBER</span></Link>
        <Link className={styles.backHome} href="/">← Về trang chủ</Link>
      </header>

      <div className={styles.layout}>
        <section className={styles.formArea}>
          <div className={styles.intro}>
            <p className={styles.kicker}>Đặt lịch trực tuyến</p>
            <h1>Chọn lịch hẹn<br />phù hợp với bạn.</h1>
          </div>

          <div className={styles.progress} aria-label={`Bước ${step} trên 4`}>
            {[1, 2, 3, 4].map((item) => (
              <div className={`${styles.progressItem} ${item <= step ? styles.progressActive : ""}`} key={item}>
                <span>{item}</span>
                <small>{["Ngày & giờ", "Dịch vụ", "Barber", "Thông tin"][item - 1]}</small>
              </div>
            ))}
          </div>

          <form onSubmit={submitBooking}>
            {step === 1 && (
              <fieldset className={styles.fieldset}>
                <legend>Chọn ngày và giờ</legend>
                <p className={styles.hint}>Chọn thời điểm bạn muốn đến trong 7 ngày tới.</p>
                <div className={styles.calendar} role="group" aria-label="Chọn ngày hẹn">
                  {bookingDates.map((item) => (
                    <button
                      className={`${styles.dayCard} ${date === item.value ? styles.daySelected : ""}`}
                      type="button"
                      onClick={() => setDate(item.value)}
                      aria-pressed={date === item.value}
                      key={item.value}
                    >
                      <small>{item.weekday}</small><strong>{item.day}</strong><span>Tháng {item.month}</span>
                    </button>
                  ))}
                </div>
                {date && (
                  <div className={styles.timeSection}>
                    <h3>Chọn giờ</h3>
                    <p>Các khung giờ còn nhận lịch trong ngày {formatDate(date)}.</p>
                    {slotsLoading ? <p className={styles.loading}>Đang kiểm tra khung giờ...</p> : slots.length ? (
                      <div className={styles.timeGrid}>{slots.map((item) => (
                        <button className={time === item.time ? styles.timeSelected : ""} type="button" onClick={() => { setTime(item.time); setServiceIds([]); setBarberId(""); }} key={item.time}>
                          {item.time}<small>Còn {item.remainingCapacity} chỗ</small>
                        </button>
                      ))}</div>
                    ) : !error && <p className={styles.empty}>Ngày này không còn khung giờ nhận lịch.</p>}
                  </div>
                )}
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className={styles.fieldset}>
                <legend>Dịch vụ ngày {formatDate(date)}</legend>
                <p className={styles.hint}>Bạn có thể chọn một hoặc nhiều dịch vụ đang nhận lịch lúc {time}, ngày {formatDate(date)}.</p>
                {catalogLoading ? <p className={styles.loading}>Đang tải dịch vụ...</p> : (
                  <div className={styles.optionList}>
                    {services.map((item) => (
                      <label className={`${styles.option} ${serviceIds.includes(item.id) ? styles.selected : ""}`} key={item.id}>
                        <input type="checkbox" name="service" value={item.id} checked={serviceIds.includes(item.id)} onChange={() => {
                          setServiceIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]);
                          setBarberId("");
                        }} />
                        <span className={styles.checkbox}>{serviceIds.includes(item.id) ? "✓" : ""}</span>
                        <span className={styles.optionMain}><strong>{item.name}</strong><small>{item.duration} phút</small></span>
                        <b>{money.format(item.price)}</b>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className={styles.fieldset}>
                <legend>Barber đang làm việc</legend>
                <p className={styles.hint}>Chỉ hiển thị barber đang trống lúc {time} và có thể thực hiện tất cả dịch vụ bạn đã chọn.</p>
                {barbersLoading ? <p className={styles.loading}>Đang tìm barber phù hợp...</p> : barbers.length ? (
                  <div className={styles.barberGrid}>
                    {barbers.map((item) => (
                      <label className={`${styles.barber} ${barberId === item.id ? styles.selected : ""}`} key={item.id}>
                        <input type="radio" name="barber" value={item.id} checked={barberId === item.id} onChange={() => setBarberId(item.id)} />
                        <Image className={styles.avatar} src={barberAvatar} alt={`Avatar ${item.name}`} />
                        <strong>{item.name}</strong><small>{item.detail}</small>
                      </label>
                    ))}
                  </div>
                ) : !error && <p className={styles.empty}>Không còn barber phù hợp. Vui lòng quay lại chọn giờ khác.</p>}
              </fieldset>
            )}

            {step === 4 && (
              <fieldset className={styles.fieldset}>
                <legend>Thông tin của bạn</legend>
                <p className={styles.hint}>Nhập số điện thoại trước để MING kiểm tra thông tin khách hàng.</p>
                <div className={styles.phoneLookup}>
                  <label>Số điện thoại<input type="tel" inputMode="numeric" maxLength={13} required autoFocus placeholder="090 123 4567" value={phone} onChange={(e) => changePhone(e.target.value)} /></label>
                  <button type="button" onClick={checkCustomer} disabled={customerStatus === "checking" || !/^0\d{9}$/.test(phone.replace(/\s/g, ""))}>{customerStatus === "checking" ? "Đang kiểm tra..." : "Tiếp tục"}</button>
                </div>
                {customerLookupError && <p className={styles.error}>{customerLookupError}</p>}

                {customerStatus === "existing" && <div className={styles.returningCustomer}><span>✓</span><div><small>Khách hàng đã có tại MING</small><strong>Chào mừng trở lại, {name}</strong><p>Thông tin của bạn đã được tự động điền.</p></div><button type="button" onClick={() => changePhone("")}>Đổi số</button></div>}

                {customerStatus === "new" && <div className={styles.newCustomer}><p><span>Khách hàng mới</span>Số điện thoại này chưa có tại MING. Vui lòng nhập thông tin bên dưới.</p><div className={styles.inputGrid}>
                  <label className={styles.fullInput}>Họ và tên<input type="text" maxLength={100} required autoFocus placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} /></label>
                  <label className={styles.fullInput}>Mã người giới thiệu <span>(không bắt buộc)</span>
                    <input className={styles.codeInput} type="text" maxLength={5} placeholder="Ví dụ: TUAN7" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
                    <small className={styles.inputHelp}>Mã gồm đúng 5 ký tự, ví dụ TUAN7.</small>
                  </label>
                </div>{referralCode && !/^[A-Z0-9]{5}$/.test(referralCode) && <p className={styles.error}>Mã giới thiệu phải gồm đúng 5 chữ cái hoặc chữ số.</p>}</div>}

                {(customerStatus === "existing" || customerStatus === "new") && <div className={styles.inputGrid}><label className={styles.fullInput}>Ghi chú <span>(không bắt buộc)</span><textarea maxLength={1000} placeholder="Kiểu tóc mong muốn hoặc yêu cầu khác..." value={note} onChange={(e) => setNote(e.target.value)} /></label></div>}
              </fieldset>
            )}

            {error && <div className={styles.requestError} role="alert">{error}</div>}
            <div className={styles.actions}>
              {step > 1 && <button className={styles.secondaryButton} type="button" disabled={submitting} onClick={() => { setError(""); setStep(step - 1); }}>Quay lại</button>}
              {step < 4 ? (
                <button className={styles.primaryButton} type="button" disabled={!canContinue || catalogLoading || slotsLoading || barbersLoading} onClick={() => { setError(""); setStep(step + 1); }}>Tiếp tục <span>→</span></button>
              ) : (
                <button className={styles.primaryButton} type="submit" disabled={!canContinue || submitting}>{submitting ? "Đang đặt lịch..." : "Xác nhận đặt lịch"} <span>→</span></button>
              )}
            </div>
          </form>
        </section>

        <aside className={styles.summary}>
          <p className={styles.kicker}>Lịch hẹn của bạn</p><h2>Thông tin tóm tắt</h2>
          <div className={styles.summaryRows}>
            <div><span>Dịch vụ</span><strong>{selectedServices.length ? selectedServices.map((item) => item.name).join(", ") : "Chưa chọn"}</strong></div>
            <div><span>Barber</span><strong>{barber?.name || "Chưa chọn"}</strong></div>
            <div><span>Ngày</span><strong>{date ? formatDate(date) : "Chưa chọn"}</strong></div>
            <div><span>Giờ</span><strong>{time || "Chưa chọn"}</strong></div>
          </div>
          {selectedServices.length > 0 && <><div className={styles.duration}><span>Tổng thời gian</span><strong>{totalDuration} phút</strong></div><div className={styles.total}><span>Tạm tính</span><strong>{money.format(totalPrice)}</strong></div></>}
          <p className={styles.summaryNote}>Bạn chưa cần thanh toán. Quán sẽ xác nhận lịch hẹn qua số điện thoại.</p>
        </aside>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
