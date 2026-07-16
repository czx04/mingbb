"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicService, bookingApi } from "../lib/booking-api";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export default function ServiceHighlights() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    bookingApi.publicServices()
      .then((catalog) => {
        if (!active) return;
        setServices(catalog.services.filter((service) => service.featured).slice(0, 4));
      })
      .catch((requestError: Error) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div className="service-data-state">Đang tải danh sách dịch vụ...</div>;
  if (error) return <div className="service-data-state service-data-error">Chưa thể tải bảng dịch vụ. Vui lòng thử lại sau.</div>;
  if (!services.length) return <div className="service-data-state">Hiện chưa có dịch vụ nổi bật.</div>;

  return <>
    <div className="service-list">
      {services.map((service, index) => (
        <article className="service-item" key={service.id}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><h3>{service.name}</h3><p>{service.shortDescription || service.description}</p></div>
          <strong>{formatPrice(service)}</strong>
          <Link href={service.onlineBookable ? `/dat-lich?service=${encodeURIComponent(service.id)}` : "/#lien-he"} aria-label={`${service.onlineBookable ? "Đặt lịch" : "Tư vấn"} ${service.name}`}>↗</Link>
        </article>
      ))}
    </div>
    <div className="services-more"><Link href="/dich-vu">Xem tất cả dịch vụ <span>→</span></Link></div>
  </>;
}

export function formatPrice(service: Pick<PublicService, "price" | "priceDisplayMode">) {
  if (service.priceDisplayMode === "contact") return "Liên hệ";
  if (service.priceDisplayMode === "from") return `Từ ${money.format(service.price)}`;
  return money.format(service.price);
}
