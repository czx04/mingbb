import Link from "next/link";
import MobileBookingBar from "../../components/MobileBookingBar";
import ServicesCatalog from "../../components/ServicesCatalog";
import SiteHeader from "../../components/SiteHeader";
import styles from "./page.module.css";

export default function ServicesPage() {
  return (
    <main className={styles.page}>
      <div className="notice-bar">
        <span>MỞ CỬA MỖI NGÀY · 09:00 — 19:30</span>
        <Link href="/dat-lich">ĐẶT LỊCH TRƯỚC →</Link>
      </div>

      <SiteHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.eyebrow}>Dịch vụ &amp; bảng giá</p>
            <h1>Chọn cách<br /><em>chăm sóc</em> bạn.</h1>
          </div>
          <div className={styles.heroNote}>
            <span>MENU MING</span>
            <p>Mỗi dịch vụ tại MING đều bắt đầu bằng một cuộc trò chuyện ngắn để hiểu bạn cần gì và kết thúc bằng một diện mạo thật vừa vặn.</p>
          </div>
        </div>
        <div className={styles.heroRule} />
      </section>

      <section className={styles.catalog}>
        <div className={styles.catalogInner}>
          <div className={styles.catalogHeading}>
            <div>
              <p className={styles.kicker}>Menu MING</p>
              <h2>Đủ gọn gàng.<br />Đủ khác biệt.</h2>
            </div>
            <p className={styles.catalogIntro}>Từ một đường cắt mới đến một buổi thư giãn trọn vẹn, bạn có thể chọn riêng từng dịch vụ hoặc kết hợp thành trải nghiệm của riêng mình.</p>
          </div>

          <ServicesCatalog />
        </div>
      </section>

      <section className={styles.bookingBand}>
        <div>
          <p className={styles.eyebrow}>Bạn chưa biết chọn gì?</p>
          <h2>Cứ đến MING.<br />Chúng tôi sẽ tư vấn.</h2>
        </div>
        <div className={styles.bookingCopy}>
          <p>Đặt lịch trước để MING giữ chỗ và chuẩn bị thời gian phù hợp nhất cho bạn.</p>
          <Link className={styles.bookingButton} href="/dat-lich">Đặt lịch ngay <span>→</span></Link>
        </div>
      </section>

      <footer className="ref-footer">
        <div className="ref-container footer-grid">
          <div><Link className="brand" href="/" aria-label="MING Barber"><span className={styles.footerMark}>M</span></Link><p>Trải nghiệm grooming hiện đại, gần gũi và chỉn chu dành cho bạn.</p></div>
          <div><h3>Khám phá</h3><Link href="/#gioi-thieu">Câu chuyện</Link><Link href="/dich-vu">Dịch vụ</Link><Link href="/#khong-gian">Không gian</Link></div>
          <div><h3>Cuộc hẹn</h3><Link href="/dat-lich">Đặt lịch ngay</Link><Link href="/tra-cuu">Thẻ MING</Link><Link href="/#lien-he">Giờ mở cửa</Link></div>
        </div>
        <div className="ref-container copyright"><span>© 2026 MING Barber</span><span>Gọn gàng · Tự tin · Đúng chất</span></div>
      </footer>
      <MobileBookingBar />
    </main>
  );
}
