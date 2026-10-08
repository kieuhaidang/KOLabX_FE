import { Link } from "react-router";
import { Mail, Phone, Clock, Copyright, ArrowRight } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
      <div className="container relative mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-3">
              <img
                src="/logo-cropped.png"
                alt="KOLab logo"
                className="h-14 w-auto shrink-0 object-contain brightness-0 invert"
              />
              <span className="text-xl font-black tracking-tight text-white">KOLab</span>
            </Link>
            <p className="mb-6 max-w-sm leading-relaxed text-white/70">
              Nền tảng Marketing KOL/Influencer được hỗ trợ bởi AI giúp doanh nghiệp kết nối với KOL nhanh chóng và hiệu quả.
            </p>
            <p className="text-sm font-semibold text-white/60">2026 KOLab Platform</p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-4 font-black text-white">Sản phẩm đang phát triển</h4>
            <p className="mb-4 max-w-md text-sm leading-relaxed text-white/70">
              KOLab hiện đang trong giai đoạn thử nghiệm và tích cực hoàn thiện các tính năng cốt lõi. Mọi đóng góp, ý kiến phản hồi từ bạn là nguồn động lực giúp đội ngũ cải tiến hệ thống.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc7HJd68lqu181oi6Uhde0vw3jl5tZ3xV_16oscr2X6FjFvBw/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/8 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
            >
              Gửi phản hồi &amp; góp ý
              <ArrowRight size={14} />
            </a>
          </div>

          <div>
            <h4 className="mb-4 font-black text-white">Liên hệ</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white/70 transition-colors hover:text-white">
                <Phone size={16} className="text-primary" />
                <span>036 766 4898</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 transition-colors hover:text-white">
                <Mail size={16} className="text-primary" />
                <span className="break-all">kolabplatform@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Clock size={16} className="text-primary" />
                <span>8:30 - 18:30</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6 text-sm md:justify-start">
              <Link to="/terms" className="font-semibold text-white/60 transition-colors hover:text-white">
                Điều khoản sử dụng
              </Link>
              <Link to="/privacy" className="font-semibold text-white/60 transition-colors hover:text-white">
                Chính sách bảo mật
              </Link>
              <Link to="/about" className="font-semibold text-white/60 transition-colors hover:text-white">
                Về chúng tôi
              </Link>
              <Link to="/pricing" className="font-semibold text-white/60 transition-colors hover:text-white">
                Bảng giá
              </Link>
            </div>

            <p className="flex items-center gap-2 text-center text-sm font-semibold text-white/60 md:text-right">
              <Copyright size={14} className="shrink-0" />
              <span>2026 KOLab. Tất cả quyền được bảo lưu.</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
