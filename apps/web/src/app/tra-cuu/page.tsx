"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const history = [
  { id: "M240712", date: "12/07/2026", time: "14:30", services: "Cắt tóc, chăm sóc râu", barber: "Minh", amount: "200.000 ₫", status: "Sắp tới", upcoming: true },
  { id: "M240628", date: "28/06/2026", time: "10:00", services: "Combo chăm sóc", barber: "Khoa", amount: "190.000 ₫", status: "Hoàn thành", upcoming: false },
  { id: "M240604", date: "04/06/2026", time: "17:00", services: "Cắt tóc", barber: "Minh", amount: "120.000 ₫", status: "Hoàn thành", upcoming: false }
];

export default function LookupPage() {
  const [phone, setPhone] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [error, setError] = useState("");

  function lookup(event: FormEvent) {
    event.preventDefault();
    const normalized = phone.replace(/\s/g, "");

    if (!/^0\d{9}$/.test(normalized)) {
      setError("Vui lòng nhập số điện thoại gồm 10 chữ số.");
      return;
    }

    setError("");
    setSearchedPhone(normalized);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.logo} href="/">MING<span>BARBER &amp; GROOMING</span></Link>
        <div className={styles.headerActions}>
          <Link href="/">Trang chủ</Link>
          <Link className={styles.bookButton} href="/dat-lich">Đặt lịch</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Thẻ khách hàng MING</p>
          <h1>Tra cứu lịch hẹn<br />của bạn.</h1>
          <p>Không cần tài khoản hoặc mật khẩu. Nhập số điện thoại đã dùng khi đặt lịch để tiếp tục.</p>
          <form className={styles.search} onSubmit={lookup}>
            <label htmlFor="lookup-phone">Số điện thoại</label>
            <div>
              <input id="lookup-phone" type="tel" inputMode="numeric" placeholder="090 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <button type="submit">Tra cứu <span>→</span></button>
            </div>
            {error && <small>{error}</small>}
          </form>
        </div>
      </section>

      {searchedPhone ? (
        <section className={styles.results}>
          <div className={styles.memberBar}>
            <div><small>Khách hàng</small><strong>Nguyễn Anh Tuấn</strong><span>{maskPhone(searchedPhone)}</span></div>
            <div><small>Điểm hiện có</small><strong>320</strong><span>điểm thưởng</span></div>
            <div><small>Mã giới thiệu</small><strong>TU27</strong><span>Chia sẻ để nhận điểm</span></div>
          </div>

          <div className={styles.sectionHeading}>
            <div><p className={styles.kicker}>Lịch hẹn</p><h2>Lịch sắp tới</h2></div>
            <Link href="/dat-lich">+ Đặt lịch mới</Link>
          </div>

          <div className={styles.appointmentList}>
            {history.filter((item) => item.upcoming).map((item) => <Appointment item={item} key={item.id} />)}
          </div>

          <div className={styles.sectionHeading}>
            <div><p className={styles.kicker}>Lịch sử</p><h2>Dịch vụ đã sử dụng</h2></div>
          </div>

          <div className={styles.appointmentList}>
            {history.filter((item) => !item.upcoming).map((item) => <Appointment item={item} key={item.id} />)}
          </div>

          <p className={styles.demoNote}>Dữ liệu hiện tại là dữ liệu mẫu giao diện. Kết quả thực tế sẽ được tải từ hệ thống theo số điện thoại sau khi kết nối backend.</p>
        </section>
      ) : (
        <section className={styles.emptyIntro}>
          <div><b>01</b><strong>Lịch sắp tới</strong><span>Xem ngày, giờ, dịch vụ và barber đã chọn.</span></div>
          <div><b>02</b><strong>Lịch sử dịch vụ</strong><span>Theo dõi những lần bạn đã sử dụng dịch vụ.</span></div>
          <div><b>03</b><strong>Thẻ thành viên</strong><span>Xem điểm thưởng và mã giới thiệu cá nhân.</span></div>
        </section>
      )}
    </main>
  );
}

function Appointment({ item }: { item: (typeof history)[number] }) {
  return (
    <article className={styles.appointment}>
      <div className={styles.dateBox}><strong>{item.date.slice(0, 2)}</strong><span>THÁNG {item.date.slice(3, 5)}</span></div>
      <div className={styles.appointmentMain}><small>#{item.id}</small><h3>{item.services}</h3><p>{item.time} · Barber {item.barber}</p></div>
      <div className={styles.appointmentMeta}><span className={item.upcoming ? styles.upcoming : styles.completed}>{item.status}</span><strong>{item.amount}</strong></div>
    </article>
  );
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)} *** ${phone.slice(-4)}`;
}
