"use client";

import { useEffect, useState } from "react";

import { memberApi, PublicReview } from "../lib/member-api";

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    memberApi.publicReviews()
      .then((result) => {
        if (!cancelled) setReviews(result.reviews);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % reviews.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [reviews.length]);

  if (loading) return <div className="review-carousel-state">Đang tải đánh giá...</div>;
  if (!reviews.length) return <div className="review-carousel-state">Chưa có đánh giá nào từ khách hàng.</div>;

  const review = reviews[active];
  return (
    <div className="review-carousel" aria-live="polite">
      <article className="review-card" key={`${review.customerName}-${review.updatedAt}`}>
        <div className="review-top"><span>{String(active + 1).padStart(2, "0")}</span><div className="stars" aria-label={`${review.rating} trên 5 sao`}>{"★★★★★".slice(0, review.rating)}<span>{"☆☆☆☆☆".slice(0, 5 - review.rating)}</span></div></div>
        <p>“{review.comment}”</p><strong>{review.customerName}</strong>
      </article>
      {reviews.length > 1 && (
        <div className="review-carousel-controls">
          <button type="button" aria-label="Đánh giá trước" onClick={() => setActive((current) => (current - 1 + reviews.length) % reviews.length)}>←</button>
          <div className="review-dots" aria-label="Chọn đánh giá">
            {reviews.map((item, index) => <button type="button" key={`${item.customerName}-${item.updatedAt}`} className={index === active ? "active" : ""} aria-label={`Đánh giá ${index + 1}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} />)}
          </div>
          <button type="button" aria-label="Đánh giá tiếp theo" onClick={() => setActive((current) => (current + 1) % reviews.length)}>→</button>
        </div>
      )}
    </div>
  );
}
