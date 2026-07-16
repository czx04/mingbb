import Image from "next/image";
import logo from "../assets/logo.png";
import shopInterior from "../assets/shop-interior.png";
import MobileBookingBar from "../components/MobileBookingBar";
import ReviewsCarousel from "../components/ReviewsCarousel";
import ServiceHighlights from "../components/ServiceHighlights";
import SiteHeader from "../components/SiteHeader";

export default function Home() {
  return (
    <main id="top">
      <div className="notice-bar">
        <span>MỞ CỬA MỖI NGÀY · 09:00 — 19:30</span>
        <a href="/dat-lich">ĐẶT LỊCH TRƯỚC →</a>
      </div>

      <SiteHeader />

      <section className="ref-hero">
        <Image className="hero-photo" src={shopInterior} alt="Không gian thực tế tại MING Barber" fill priority sizes="100vw" />
        <div className="ref-hero-overlay" />
        <div className="ref-container ref-hero-content">
          <p className="ref-eyebrow">MING Barber · Không gian thật · Trải nghiệm thật</p>
          <h1>Đẹp hơn<br />theo cách <span className="mobile-title-break">của bạn.</span></h1>
          <p className="ref-lead">Một tiệm barber ấm cúng, những người thợ tận tâm và khoảng thời gian dành riêng để bạn làm mới chính mình.</p>
          <div className="ref-actions">
            <a className="ref-button ref-button-gold" href="/dat-lich">Đặt lịch ngay <span>→</span></a>
            <a className="ref-button ref-button-ghost" href="#dich-vu">Xem bảng giá</a>
          </div>
        </div>
        <div className="mobile-hero-photo">
          <Image src={shopInterior} alt="Không gian thực tế và biển hiệu MING Barber" fill priority sizes="100vw" />
          <span>Hình ảnh thực tế tại quán</span>
        </div>
        <div className="hero-facts" aria-label="Thông tin nổi bật">
          <div><strong>09:00 — 19:30</strong><span>Mở cửa mỗi ngày</span></div>
          <div><strong>Đặt lịch online</strong><span>Chủ động, không chờ lâu</span></div>
          <div><strong>Không gian thật</strong><span>Thoải mái như ở nhà</span></div>
        </div>
      </section>

      <section className="ref-intro" id="gioi-thieu">
        <div className="ref-container intro-grid">
          <div>
            <p className="ref-eyebrow ref-eyebrow-red">Về MING</p>
            <span className="section-number">01</span>
          </div>
          <div className="intro-copy">
            <h2>Barber truyền thống.<br />Tinh thần hiện đại.</h2>
            <p>MING mang đến cho bạn một trải nghiệm barber được xây dựng từ tay nghề, sự chính xác và cách phục vụ tử tế. Mỗi kiểu tóc đều được tư vấn dựa trên khuôn mặt, chất tóc và phong cách sống — để tạo nên một diện mạo gọn gàng, tự tin và phù hợp lâu dài.</p>
            <div className="intro-values">
              <div><strong>Hiểu đúng</strong><span>Tư vấn dựa trên đặc điểm và nhu cầu thực tế của từng khách hàng.</span></div>
              <div><strong>Làm kỹ</strong><span>Chú trọng từng đường cắt, đường cạo và bước hoàn thiện cuối cùng.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="services-section" id="dich-vu">
        <div className="ref-container">
          <div className="services-heading">
            <div><p className="ref-eyebrow">Dịch vụ</p><h2>Chọn trải nghiệm<br />dành cho bạn.</h2></div>
            <p>Giá rõ ràng, thời gian chủ động. Bạn có thể chọn một hoặc kết hợp nhiều dịch vụ khi đặt lịch.</p>
          </div>
          <ServiceHighlights />
        </div>
      </section>

      <section className="space-section" id="khong-gian">
        <div className="space-photo">
          <Image src={shopInterior} alt="Ghế cắt và khu vực chờ tại MING Barber" fill sizes="(max-width: 900px) 100vw, 62vw" />
        </div>
        <div className="space-copy">
          <p className="ref-eyebrow ref-eyebrow-red">Không gian MING</p>
          <h2>Một khoảng nghỉ<br />giữa ngày bận rộn.</h2>
          <p>Tông màu ấm, ghế ngồi thoải mái và mọi dụng cụ luôn sẵn sàng. Đây không chỉ là nơi cắt tóc — đây là nơi bạn có thể chậm lại một chút.</p>
          <div className="space-signature">
            <Image src={logo} alt="MING Barber" />
            <span>Hình ảnh thực tế tại quán</span>
          </div>
        </div>
      </section>

      <section className="reviews" id="danh-gia">
        <div className="ref-container">
          <div className="section-head">
            <div><p className="ref-eyebrow ref-eyebrow-red">Khách hàng nói gì</p><h2>Người thật.<br />Cảm nhận thật.</h2></div>
            <p>Sự hài lòng của khách hàng là điều khiến MING tiếp tục chăm chút cho từng cuộc hẹn.</p>
          </div>
          <ReviewsCarousel />
        </div>
      </section>

      <section className="location-band" id="lien-he">
        <div className="ref-container location-grid">
          <div>
            <p className="ref-eyebrow">Ghé MING hôm nay</p>
            <h2>Ghế đã sẵn sàng.<br />Chỉ còn chờ bạn.</h2>
          </div>
          <div className="location-details">
            <div><span>Giờ mở cửa</span><strong>09:00 — 19:30</strong><small>Mỗi ngày trong tuần</small></div>
            <div><span>Đặt lịch</span><strong>Trực tuyến 24/7</strong><small>Chọn barber và giờ phù hợp</small></div>
            <a className="ref-button ref-button-gold" href="/dat-lich">Đặt lịch ngay <span>→</span></a>
          </div>
        </div>
      </section>

      <footer className="ref-footer">
        <div className="ref-container footer-grid">
          <div><a className="brand" href="#top" aria-label="MING Barber"><Image src={logo} alt="MING Barber" /></a><p>Trải nghiệm grooming hiện đại, gần gũi và chỉn chu dành cho bạn.</p></div>
          <div><h3>Khám phá</h3><a href="#gioi-thieu">Câu chuyện</a><a href="#dich-vu">Dịch vụ</a><a href="#khong-gian">Không gian</a></div>
          <div><h3>Cuộc hẹn</h3><a href="/dat-lich">Đặt lịch ngay</a><a href="/tra-cuu">Thẻ MING</a><a href="#lien-he">Giờ mở cửa</a></div>
        </div>
        <div className="ref-container copyright"><span>© 2026 MING Barber</span><span>Gọn gàng · Tự tin · Đúng chất</span></div>
      </footer>
      <MobileBookingBar />
    </main>
  );
}
