"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicService, ServiceCategory, bookingApi } from "../lib/booking-api";
import { formatPrice } from "./ServiceHighlights";
import styles from "../app/dich-vu/page.module.css";

export default function ServicesCatalog() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    bookingApi.publicServices()
      .then((catalog) => {
        if (!active) return;
        setCategories(catalog.categories);
        setServices(catalog.services);
      })
      .catch((requestError: Error) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const shownServices = useMemo(
    () => activeCategory === "all" ? services : services.filter((service) => service.category?.id === activeCategory),
    [activeCategory, services],
  );

  if (loading) return <div className={styles.catalogState}>Đang tải menu dịch vụ...</div>;
  if (error) return <div className={`${styles.catalogState} ${styles.catalogError}`}>Chưa thể tải menu dịch vụ. Vui lòng thử lại sau.</div>;

  return <>
    <div className={styles.categoryBar} aria-label="Nhóm dịch vụ">
      <button type="button" className={activeCategory === "all" ? styles.categoryActive : ""} onClick={() => setActiveCategory("all")}>Tất cả <small>{services.length}</small></button>
      {categories.map((category) => {
        const count = services.filter((service) => service.category?.id === category.id).length;
        if (!count) return null;
        return <button type="button" className={activeCategory === category.id ? styles.categoryActive : ""} onClick={() => setActiveCategory(category.id)} key={category.id}>{category.name} <small>{count}</small></button>;
      })}
    </div>

    {shownServices.length ? <div className={styles.serviceGrid}>
      {shownServices.map((service, index) => (
        <article className={styles.serviceCard} key={service.id}>
          <div className={styles.cardTop}><span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")}</span><span className={styles.cardCategory}>{service.category?.name || "Dịch vụ MING"}</span></div>
          <div className={styles.cardBody}><h3>{service.name}</h3><p>{service.description || service.shortDescription}</p></div>
          <div className={styles.cardBottom}><div><span>Thời lượng</span><strong>{service.duration} phút</strong></div><div><span>{service.priceDisplayMode === "contact" ? "Mức giá" : service.priceDisplayMode === "from" ? "Giá từ" : "Giá"}</span><strong>{formatPrice(service)}</strong></div></div>
          <Link className={styles.cardLink} href={service.onlineBookable ? `/dat-lich?service=${encodeURIComponent(service.id)}` : "/#lien-he"}>{service.onlineBookable ? "Đặt lịch" : "Tư vấn"} <span>↗</span></Link>
        </article>
      ))}
    </div> : <div className={styles.catalogState}>Danh mục này chưa có dịch vụ.</div>}
  </>;
}
