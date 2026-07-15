"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import { MemberApiError, MemberAppointment, MemberLookupResult, MemberReview, memberApi } from "../../lib/member-api";
import styles from "./page.module.css";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function LookupPage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<MemberLookupResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  async function lookup(event: FormEvent) {
    event.preventDefault();
    const normalized = phone.replace(/\s/g, "");
    if (!/^0\d{9}$/.test(normalized)) {
      setError("Vui lòng nhập số điện thoại gồm 10 chữ số.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const nextResult = await memberApi.lookup(normalized);
      setResult(nextResult);
      setReviewRating(nextResult.review?.rating ?? 0);
      setReviewComment(nextResult.review?.comment ?? "");
      setReviewMessage("");
      setReviewError("");
    } catch (requestError) {
      setResult(null);
      if (requestError instanceof MemberApiError && requestError.status === 404) {
        setError("Không tìm thấy Thẻ MING. Hãy dùng số điện thoại bạn đã đặt lịch hoặc liên hệ quán.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Không thể mở Thẻ MING lúc này.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveReview(event: FormEvent) {
    event.preventDefault();
    if (!result?.canReview) return;
    if (!reviewRating) {
      setReviewError("Vui lòng chọn số sao cho trải nghiệm của bạn.");
      return;
    }

    setReviewLoading(true);
    setReviewMessage("");
    setReviewError("");
    try {
      const saved = await memberApi.saveReview(
        phone.replace(/\s/g, ""),
        reviewRating,
        reviewComment,
      );
      setResult((current) => current ? { ...current, review: saved.review } : current);
      setReviewMessage("Đánh giá của bạn đã được lưu.");
    } catch (requestError) {
      setReviewError(requestError instanceof Error ? requestError.message : "Không thể lưu đánh giá lúc này.");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>MING Member</p>
          <h1>Thẻ MING<br />của bạn.</h1>
          <p>Một số điện thoại. Mọi cuộc hẹn và quyền lợi tại MING.</p>
          <form className={styles.search} onSubmit={lookup}>
            <label htmlFor="lookup-phone">Số điện thoại thành viên</label>
            <div>
              <input id="lookup-phone" type="tel" inputMode="numeric" maxLength={13} placeholder="090 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} />
              <button type="submit" disabled={loading}>{loading ? "Đang mở..." : "Mở thẻ"} <span>→</span></button>
            </div>
            {error && <small role="alert">{error}</small>}
          </form>
        </div>
      </section>

      {result ? (
        <section className={styles.results}>
          <div className={styles.memberOverview}>
            <article className={styles.memberCard}>
              <div className={styles.cardGlow} />
              <div className={styles.cardTop}><span>MING</span><small>BARBER MEMBER</small></div>
              <div className={styles.cardMain}><small>Thành viên</small><h2>{result.member.fullName}</h2><p>{result.member.maskedPhone}</p></div>
              <div className={styles.cardBottom}>
                <div><small>Mã thành viên</small><strong>{result.member.referralCode || "MING"}</strong></div>
                <div><small>Điểm hiện có</small><strong>{result.member.loyaltyPoints}</strong></div>
              </div>
            </article>

            <div className={styles.memberInfo}>
              <p className={styles.kicker}>Quyền lợi của bạn</p>
              <h2>Mọi thứ về MING<br />trong một chiếc thẻ.</h2>
              <p>Thẻ được tạo tự động từ số điện thoại bạn dùng khi đặt lịch.</p>
              <div className={styles.memberStats}>
                <div><strong>{result.member.loyaltyPoints}</strong><span>Điểm thưởng</span></div>
                <div><strong>{result.member.referralCode || "—"}</strong><span>Mã giới thiệu</span></div>
                <div><strong>{String(result.member.completedVisits).padStart(2, "0")}</strong><span>Lần sử dụng</span></div>
              </div>
              <p className={styles.referralStat}>Đã giới thiệu <strong>{result.member.referralCount}</strong> người bạn đến MING.</p>
            </div>
          </div>

          {result.canReview && (
            <ReviewPanel
              rating={reviewRating}
              comment={reviewComment}
              existingReview={result.review}
              loading={reviewLoading}
              message={reviewMessage}
              error={reviewError}
              onSubmit={saveReview}
              onRatingChange={(rating) => { setReviewRating(rating); setReviewMessage(""); setReviewError(""); }}
              onCommentChange={setReviewComment}
            />
          )}

          <div className={styles.sectionHeading}>
            <div><p className={styles.kicker}>Lịch hẹn</p><h2>Lịch sắp tới</h2></div>
            <Link href="/dat-lich">+ Đặt lịch mới</Link>
          </div>
          {result.upcomingAppointments.length ? (
            <div className={styles.appointmentList}>
              {result.upcomingAppointments.map((item) => <Appointment item={item} upcoming key={item.bookingCode} />)}
            </div>
          ) : <div className={styles.emptyState}>Bạn chưa có lịch hẹn sắp tới.</div>}

          <div className={styles.sectionHeading}>
            <div><p className={styles.kicker}>Lịch sử</p><h2>Dịch vụ đã sử dụng</h2></div>
          </div>
          {result.appointmentHistory.length ? (
            <div className={styles.appointmentList}>
              {result.appointmentHistory.map((item) => <Appointment item={item} key={item.bookingCode} />)}
            </div>
          ) : <div className={styles.emptyState}>Chưa có lịch sử sử dụng dịch vụ.</div>}
        </section>
      ) : (
        <section className={styles.emptyIntro}>
          {searched && error ? (
            <div className={styles.notFound}><b>!</b><strong>Chưa mở được thẻ</strong><span>Kiểm tra lại số điện thoại hoặc đặt lịch lần đầu để hệ thống tự tạo Thẻ MING.</span></div>
          ) : <>
            <div><b>01</b><strong>Điểm &amp; quyền lợi</strong><span>Theo dõi điểm thưởng sau mỗi lần sử dụng dịch vụ.</span></div>
            <div><b>02</b><strong>Lịch hẹn của bạn</strong><span>Xem ngày, giờ, dịch vụ và barber đã chọn.</span></div>
            <div><b>03</b><strong>Mã giới thiệu</strong><span>Chia sẻ mã cá nhân để cùng nhận thêm quyền lợi.</span></div>
          </>}
        </section>
      )}
    </main>
  );
}

function ReviewPanel({
  rating,
  comment,
  existingReview,
  loading,
  message,
  error,
  onSubmit,
  onRatingChange,
  onCommentChange,
}: {
  rating: number;
  comment: string;
  existingReview: MemberReview | null;
  loading: boolean;
  message: string;
  error: string;
  onSubmit: (event: FormEvent) => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
}) {
  return (
    <section className={styles.reviewPanel}>
      <div className={styles.sectionHeading}>
        <div><p className={styles.kicker}>Trải nghiệm của bạn</p><h2>{existingReview ? "Đánh giá của bạn" : "Đánh giá dịch vụ"}</h2></div>
        <span className={styles.reviewHint}>Một đánh giá chung cho trải nghiệm tại MING</span>
      </div>
      <form className={styles.reviewForm} onSubmit={onSubmit}>
        <div className={styles.ratingField}>
          <span>Chấm điểm</span>
          <div className={styles.starsInput} aria-label="Chọn số sao">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={star <= rating ? styles.starActive : styles.star}
                aria-label={`${star} sao`}
                aria-pressed={star === rating}
                onClick={() => onRatingChange(star)}
                disabled={loading}
              >★</button>
            ))}
          </div>
        </div>
        <label className={styles.commentField}>
          <span>Nhận xét (không bắt buộc)</span>
          <textarea maxLength={500} value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder="Bạn cảm nhận thế nào về trải nghiệm tại MING?" disabled={loading} />
        </label>
        <div className={styles.reviewActions}>
          <button type="submit" disabled={loading}>{loading ? "Đang lưu..." : existingReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}<span>→</span></button>
          {message && <small className={styles.reviewSuccess} role="status">{message}</small>}
          {error && <small className={styles.reviewError} role="alert">{error}</small>}
        </div>
      </form>
    </section>
  );
}

function Appointment({ item, upcoming = false }: { item: MemberAppointment; upcoming?: boolean }) {
  const date = new Date(item.startsAtIso);
  const day = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", month: "2-digit" }).format(date);
  const time = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  const serviceNames = item.services.map((service) => service.name).join(", ") || "Dịch vụ tại MING";
  return (
    <article className={styles.appointment}>
      <div className={styles.dateBox}><strong>{day}</strong><span>THÁNG {month}</span></div>
      <div className={styles.appointmentMain}>
        <small>#{item.bookingCode}</small><h3>{serviceNames}</h3>
        <p>{time} · {item.barberName ? `Barber ${item.barberName}` : "Đang xếp barber"}</p>
      </div>
      <div className={styles.appointmentMeta}>
        <span className={statusClass(item.status, upcoming)}>{item.statusLabel}</span>
        <strong>{money.format(item.totalAmount)}</strong>
      </div>
    </article>
  );
}

function statusClass(status: MemberAppointment["status"], upcoming: boolean) {
  if (upcoming || status === "pending" || status === "confirmed" || status === "in_service") return styles.upcoming;
  if (status === "cancelled" || status === "no_show") return styles.cancelled;
  return styles.completed;
}
