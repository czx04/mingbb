const services = [
  ["Cắt tóc", "Tư vấn, cắt và tạo kiểu hoàn thiện."],
  ["Cạo mặt", "Khăn nóng và đường cạo sạch gọn."],
  ["Chăm sóc râu", "Tỉa form, tạo đường nét và dưỡng râu."],
  ["Combo MING", "Trải nghiệm chăm sóc trọn vẹn nhất."]
];

const reviews = [
  ["Không gian đẹp, barber tư vấn kỹ và cắt rất đúng ý. Mình chắc chắn sẽ quay lại.", "ANH TUẤN"],
  ["Đặt lịch nhanh, tới nơi không phải chờ. Một trải nghiệm rất chỉn chu.", "MINH QUÂN"],
  ["Dịch vụ tốt, nhân viên thân thiện. Cảm giác thực sự được thư giãn sau giờ làm.", "HOÀNG NAM"]
];

export default function Home() {
  return (
    <main id="top">
      <div className="notice-bar">LẦN ĐẦU ĐẾN MING? <a href="/dat-lich">ĐẶT LỊCH NGAY</a></div>

      <header className="site-header">
        <nav className="nav-shell" aria-label="Điều hướng chính">
          <a className="brand" href="#top"><b>MING</b><span>BARBER &amp; GROOMING</span></a>
          <div className="nav-menu">
            <a href="#dich-vu">Dịch vụ</a>
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#danh-gia">Đánh giá</a>
            <a href="/tra-cuu">Tra cứu lịch</a>
            <a href="#lien-he">Liên hệ</a>
          </div>
          <div className="nav-actions">
            <a className="lookup-button" href="/tra-cuu">Tra cứu</a>
            <a className="ref-button ref-button-outline" href="/dat-lich">Đặt lịch</a>
          </div>
        </nav>
      </header>

      <section className="ref-hero">
        <div className="ref-hero-overlay" />
        <div className="ref-container ref-hero-content">
          <p className="ref-eyebrow">Barber shop · Grooming · Style</p>
          <h1>Phong độ bắt đầu<br />từ sự chỉn chu.</h1>
          <p className="ref-lead">Không chỉ là một lần cắt tóc. Đây là khoảng thời gian dành riêng cho bạn — thư giãn, làm mới và trở lại với phiên bản tự tin hơn.</p>
          <div className="ref-actions">
            <a className="ref-button ref-button-gold" href="/dat-lich">Đặt lịch ngay</a>
            <a className="ref-button ref-button-ghost" href="#dich-vu">Xem dịch vụ</a>
          </div>
        </div>
        <a className="scroll-cue" href="#gioi-thieu" aria-label="Cuộn xuống" />
      </section>

      <section className="ref-intro" id="gioi-thieu">
        <div className="ref-container ref-narrow">
          <p className="ref-eyebrow ref-eyebrow-red">Dành thời gian cho chính mình</p>
          <h2>Cắt gọn. Thư giãn.<br />Và bước ra đầy tự tin.</h2>
          <p>MING mang trải nghiệm barber truyền thống vào một không gian hiện đại. Từ đường kéo chỉn chu đến cách phục vụ gần gũi, mọi chi tiết đều được chuẩn bị để bạn cảm thấy thoải mái.</p>
        </div>
      </section>

      <section className="ref-split" id="dich-vu">
        <div className="ref-split-media" role="img" aria-label="Không gian barber shop" />
        <div className="ref-split-copy">
          <p className="ref-eyebrow ref-eyebrow-red">Dịch vụ</p>
          <h2>Đến để làm đẹp.<br />Ở lại để tận hưởng.</h2>
          <p>Barber tận tâm, dịch vụ rõ ràng và một không gian khiến mỗi cuộc hẹn trở thành khoảng nghỉ đáng giá.</p>
          <div className="ref-service-grid">
            {services.map(([name, description]) => <div key={name}><strong>{name}</strong><span>{description}</span></div>)}
          </div>
          <a className="ref-button ref-button-dark" href="/dat-lich">Chọn dịch vụ</a>
        </div>
      </section>

      <section className="location-band" id="lien-he">
        <div className="ref-container location-grid">
          <div>
            <p className="ref-eyebrow">Ghé MING hôm nay</p>
            <h2>Chúng tôi luôn<br />sẵn sàng đón bạn.</h2>
            <p>Mở cửa mỗi ngày<br /><strong>09:00 — 21:00</strong></p>
            <a className="ref-button ref-button-gold" href="/dat-lich">Đặt lịch tại quán</a>
          </div>
          <div className="location-art" aria-hidden="true"><span>M</span><small>MING BARBER</small></div>
        </div>
      </section>

      <section className="reviews" id="danh-gia">
        <div className="ref-container">
          <div className="section-head">
            <p className="ref-eyebrow ref-eyebrow-red">Khách hàng nói gì</p>
            <h2>Trải nghiệm tạo nên khác biệt.</h2>
          </div>
          <div className="review-grid">
            {reviews.map(([review, name]) => <article className="review-card" key={name}><div className="stars">★★★★★</div><p>“{review}”</p><strong>{name}</strong></article>)}
          </div>
        </div>
      </section>

      <section className="ref-banner">
        <div className="ref-banner-overlay" />
        <div className="ref-container ref-banner-content">
          <p className="ref-eyebrow">Sẵn sàng?</p>
          <h2>Đẹp hơn. Tự tin hơn.<br />Bắt đầu ngay hôm nay.</h2>
          <a className="ref-button ref-button-gold" href="/dat-lich">Đặt lịch ngay</a>
        </div>
      </section>

      <footer className="ref-footer">
        <div className="ref-container footer-grid">
          <div><a className="brand" href="#top"><b>MING</b><span>BARBER &amp; GROOMING</span></a><p>Trải nghiệm grooming hiện đại dành cho quý ông.</p></div>
          <div><h3>Khám phá</h3><a href="#dich-vu">Dịch vụ</a><a href="#gioi-thieu">Giới thiệu</a><a href="#danh-gia">Đánh giá</a></div>
          <div><h3>Đặt lịch</h3><a href="/dat-lich">Đặt lịch ngay</a><a href="#lien-he">Giờ mở cửa</a></div>
        </div>
        <div className="ref-container copyright">© 2026 MING Barber. All rights reserved.</div>
      </footer>
    </main>
  );
}
