import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";


export const metadata: Metadata = {
  title: { absolute: "Bảo mật - Soạn Lab" },
  description: "Chính sách bảo mật của Soạn Lab, bao gồm cách dữ liệu được lưu trên trình duyệt và lưu ý khi sử dụng tài liệu.",
};
export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="text-4xl font-bold text-ink">Bảo mật và quyền riêng tư</h1>
        <div className="mt-6 space-y-4 leading-7 text-slate-700">
          <p>So?n Lab l?u d? li?u c?n thi?t ?? ph?c v? qu? tr?nh t?o t?i li?u, l?u l?ch s?, m?u c? nh?n, ng?n h?ng c?u h?i v? c?i ??t xu?t file.</p>
          <p>C?c file Word/PDF ho?c file sao l?u do th?y/c? xu?t ra s? n?m tr?n thi?t b? c?a ng??i d?ng. So?n Lab kh?ng t? g?i c?c file ?? cho b?n th? ba.</p>
          <p>Th?y/c? c? th? xu?t b?n sao l?u ho?c x?a t?ng nh?m d? li?u t?i <Link href="/data" className="font-semibold text-brand">Qu?n l? d? li?u</Link>.</p>
          <p>N?u ??i thi?t b? ho?c x?a d? li?u tr?nh duy?t khi ch?a c? b?n sao l?u, m?t s? d? li?u c? nh?n c? th? kh?ng c?n truy c?p ???c.</p>
          <p>Kh?ng n?n nh?p d? li?u h?c sinh qu? nh?y c?m, th?ng tin s?c kh?e, t?i ch?nh, m?t kh?u ho?c th?ng tin ri?ng t? kh?ng c?n thi?t.</p>
          <p>N?i dung do So?n Lab t?o l? b?n nh?p h? tr? gi?o vi?n. Gi?o vi?n c?n ki?m tra, ch?nh s?a tr??c khi s? d?ng ch?nh th?c.</p>
          <p>So?n Lab kh?ng b?n d? li?u c? nh?n c?a ng??i d?ng.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
