import { Link } from "react-router";
import { Sparkles, Users, TrendingUp, Award, ArrowRight, CheckCircle, Star, LayoutDashboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PublicHeader } from "../layouts/PublicHeader";
import { PublicFooter } from "../layouts/PublicFooter";
import { useAuth } from "../auth/AuthProvider";
import { getHomePathForRole } from "../../services/authService";

const stats = [
  { end: 1200, label: "KOL/Influencers", suffix: "+" },
  { end: 120, label: "Thương hiệu", suffix: "+" },
  { end: 92, label: "Độ hài lòng", suffix: "%" },
  { end: 350, label: "Lượt tiếp cận", suffix: "K+" },
];

const features = [
  {
  icon: Sparkles,
  title: "AI Tạo Brief Tự động",
  points: [
    "Tạo brief chiến dịch trong vài giây",
    "Đề xuất mục tiêu và nội dung",
    "Tối ưu theo ngành hàng",
  ],
  cta: "Dùng thử",
  to: "/try/ai-brief",
},
  {
    icon: Users,
    title: "Kết nối thông minh",
    points: [
      "Tìm KOC phù hợp",
      "Gợi ý dựa trên dữ liệu",
      "Đánh giá mức độ tương thích",
    ],
    cta: "Khám phá",
    to: "/top-kols",
  },
  {
    icon: TrendingUp,
    title: "Phân tích chuyên sâu",
    points: [
      "Theo dõi hiệu suất chiến dịch",
      "Báo cáo theo thời gian thực",
      "Insight hỗ trợ bởi AI",
    ],
    cta: "Xem chi tiết",
    to: "/pricing",
  },
  {
    icon: Award,
    title: "Đảm bảo chất lượng",
    points: [
      "Hồ sơ KOC minh bạch",
      "Chỉ số được xác thực",
      "Quy trình kiểm duyệt rõ ràng",
    ],
    cta: "Khám phá",
    to: "/top-kols",
  },
];

const testimonials = [
  {
    name: "Nguyễn Thu Hà",
    role: "Marketing Manager, Fashion Brand",
    avatar: "/feedback/nguyen-thu-ha.jpg",
    content: "KOLab đã giúp chúng tôi tìm được những influencer phù hợp hoàn hảo. Hiệu quả chiến dịch tăng 150%!",
    rating: 4.9,
  },
  {
    name: "Trần Minh Khoa",
    role: "Content Creator",
    avatar: "/feedback/tran-minh-khoa.jpg",
    content: "Là KOL, tôi rất thích tính năng đề xuất sản phẩm phù hợp. Tôi có thể hợp tác với các thương hiệu mình yêu thích.",
    rating: 4.8,
  },
  {
    name: "Phạm Lan Anh",
    role: "CEO, Beauty Startup",
    avatar: "/feedback/pham-lan-anh.jpg",
    content: "Công cụ AI Script Doctor thật tuyệt vời. Giúp team tôi tối ưu nội dung và tăng engagement đáng kể.",
    rating: 4.9,
  },
];

export function LandingPage() {
  const { user } = useAuth();
  const statsSectionRef = useRef<HTMLElement | null>(null);
  const [hasCounted, setHasCounted] = useState(false);
  const [animatedValues, setAnimatedValues] = useState<number[]>(() => stats.map(() => 0));
  const [activeTheme, setActiveTheme] = useState<"cream" | "black" | "teal" | "orange">("cream");

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-home-theme]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const theme = visible?.target.getAttribute("data-home-theme");
        if (theme === "cream" || theme === "black" || theme === "teal" || theme === "orange") {
          setActiveTheme(theme);
        }
      },
      { threshold: [0.35, 0.55], rootMargin: "-22% 0px -42% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".cp-reveal"));
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hasCounted) return;

    const section = statsSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setHasCounted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [hasCounted]);

  useEffect(() => {
    if (!hasCounted) return;

    const durationMs = 1500;
    let startTime = 0;
    let frameId = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);

      setAnimatedValues(stats.map((stat) => Math.round(stat.end * progress)));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasCounted]);

  const formatStatValue = (index: number) => {
    const stat = stats[index];
    const value = animatedValues[index] ?? 0;

    if (stat.suffix === "K+") {
      return `${value}K+`;
    }

    const formatted = stat.end >= 1000 ? value.toLocaleString("en-US") : String(value);
    return `${formatted}${stat.suffix}`;
  };

  const headerTheme = activeTheme === "cream" ? "cream" : "dark";

  return (
    <div className="homepage-theme-shell min-h-screen" data-active-theme={activeTheme}>
      <PublicHeader theme={headerTheme} logoSize="home" />

      <section data-home-theme="cream" className="homepage-section container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[40px] border border-black/10 bg-white/75 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -left-10 top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative px-4 py-8 sm:px-6 lg:px-8" style={{ paddingTop: 32, paddingBottom: 36 }}>
            <div className="relative overflow-hidden rounded-[36px] border border-black/10 shadow-2xl shadow-primary/10">
              <img
                src="/herobanner.png"
                alt="Marketer và KOL đang làm việc cùng chiến dịch"
                className="h-auto w-full object-cover"
              />
              <div className="hidden" />
              <div
                className="hidden"
                style={{
                  top: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "min(92%, 980px)",
                }}
              >
                <h1
                  className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl"
                  style={{ textShadow: "0 10px 28px rgba(255,255,255,0.35), 0 4px 12px rgba(15,23,42,0.12)" }}
                >
                  <span className="font-extrabold text-slate-900">Kết nối &amp; Book KOL</span>{" "}
                  <span
                    className="inline-block rounded-full px-4 py-1 text-white align-middle shadow-lg shadow-primary/20"
                    style={{ background: "var(--accent-gradient)", border: "1px solid rgba(255,255,255,0.55)" }}
                  >
                    chính xác
                  </span>{" "}
                  chỉ trong{" "}
                  <span
                    className="inline-block rounded-full px-4 py-1 text-white align-middle shadow-lg shadow-primary/20"
                    style={{ background: "var(--accent-gradient)", border: "1px solid rgba(255,255,255,0.55)" }}
                  >
                    1 phút
                  </span>{" "}
                  với AI
                </h1>
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Link
                  to={getHomePathForRole(user.role)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl"
                >
                  <LayoutDashboard size={20} />
                  Vào bảng điều khiển của bạn
                </Link>
              ) : (
                <>
                  <Link
                    to="/select-role"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl"
                  >
                    Bắt đầu miễn phí
                    <ArrowRight size={20} />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/70 px-8 py-4 font-bold text-slate-700 backdrop-blur hover:-translate-y-0.5 hover:border-primary/30 hover:bg-orange-50 hover:text-primary"
                  >
                    Tìm hiểu thêm
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        data-home-theme="black"
        className="homepage-section bg-black px-4 py-24 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="cp-reveal max-w-4xl">
              <p className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-white/55">KoLab services</p>
              <h2 className="section-title text-white">
                <span>Giải pháp </span>
                <span className="section-title__serif section-title__accent">sáng tạo</span>
              </h2>
            </div>
            <p className="cp-reveal max-w-md text-lg leading-8 text-white/70">
              Bộ công cụ kết nối Marketer và KOC với AI, dữ liệu và quy trình xác thực rõ ràng.
            </p>
          </div>

          <div className="cp-stagger grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`cp-service-card cp-reveal ${index % 2 === 0 ? "cp-service-card--orange" : "cp-service-card--teal"}`}
              >
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 className="mb-8 text-[clamp(28px,2.2vw,34px)] font-black leading-tight text-white">
                  {feature.title}
                </h3>
                <ul className="space-y-4 text-base font-medium leading-7 text-white/90">
                  {feature.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 flex-none text-white/85" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Link to={feature.to} className="cp-outline-cta mt-auto">
                  {feature.cta}
                  <ArrowRight size={18} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-home-theme="cream" className="homepage-section border-y border-black/10 bg-[var(--cp-cream)] py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cp-reveal mx-auto mb-16 max-w-4xl text-center">
            <h2 className="section-title mb-6">
              <span>Cách </span>
              <span className="section-title__serif section-title__accent">hoạt động</span>
            </h2>
            <p className="text-xl leading-8 text-slate-700">
              Từ đăng ký đến chiến dịch đầu tiên trong khoảng 10 phút, có báo giá và KPI rõ ràng trước khi chi tiền.
            </p>
          </div>

          {/* 
          <section ref={statsSectionRef} className="cp-stagger mx-auto mb-16 grid max-w-5xl gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="cp-reveal rounded-[28px] border border-black/10 bg-white p-6 text-center shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
                <p className="text-3xl font-black tracking-tight text-primary md:text-4xl">{formatStatValue(index)}</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </section>
          */}

          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            <div className="cp-reveal rounded-[28px] border border-black/10 bg-white p-8 shadow-[var(--shadow-soft)]">
              <h3 className="mb-8 text-2xl font-black text-primary">Dành cho thương hiệu</h3>
              <div className="space-y-6">
                {[
                  ["Nhập mục tiêu trong 1 phút", "Điền sản phẩm, ngân sách, KPI. AI tạo brief và đề xuất hướng nội dung ngay."],
                  ["Nhận shortlist KOL đã lọc sẵn", "Gợi ý theo tệp khách hàng, mức giá và tỉ lệ tương tác để giảm rủi ro chọn sai."],
                  ["Chốt booking và đo ROI", "Theo dõi tiến độ, nội dung, chi phí và hiệu quả để biết chiến dịch nào đáng xuống tiền tiếp."],
                ].map(([title, description], index) => (
                  <div key={title} className="rounded-2xl border border-primary/10 bg-orange-50/40 p-6">
                    <div className="grid grid-cols-[auto_1fr] items-start gap-5">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white">
                        {index + 1}
                      </div>
                      <div className="space-y-2.5 pt-0.5">
                        <h4 className="text-lg font-black leading-7 text-slate-950">{title}</h4>
                        <p className="text-sm leading-7 text-slate-600">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cp-reveal rounded-[28px] border border-black/10 bg-white p-8 shadow-[var(--shadow-soft)]">
              <h3 className="mb-8 text-2xl font-black text-secondary">Dành cho KOL/Influencer</h3>
              <div className="space-y-6">
                {[
                  ["Tạo hồ sơ nổi bật nhanh", "Thiết lập niche, tệp follower và mức giá đề xuất để thương hiệu dễ chốt."],
                  ["Nhận job phù hợp tự động", "AI ghép chiến dịch theo lĩnh vực, giúp tăng tỉ lệ nhận booking chất lượng."],
                  ["Tăng thu nhập ổn định", "Làm việc với thương hiệu phù hợp, theo dõi thanh toán và hiệu suất từng chiến dịch."],
                ].map(([title, description], index) => (
                  <div key={title} className="rounded-2xl border border-secondary/10 bg-teal-50/40 p-6">
                    <div className="grid grid-cols-[auto_1fr] items-start gap-5">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-black text-white">
                        {index + 1}
                      </div>
                      <div className="space-y-2.5 pt-0.5">
                        <h4 className="text-lg font-black leading-7 text-slate-950">{title}</h4>
                        <p className="text-sm leading-7 text-slate-600">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cp-reveal mt-12 flex flex-col gap-5 rounded-[28px] border border-black/10 bg-white p-6 shadow-[var(--shadow-soft)] md:flex-row md:items-center md:justify-between md:p-8">
            <p className="max-w-2xl font-medium leading-7 text-slate-700">
              Bạn muốn tìm hiểu thêm về cách thức hoạt động hay chi phí?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/pricing" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-center font-bold text-slate-700 hover:-translate-y-0.5 hover:border-primary hover:text-primary">
                Xem bảng giá
              </Link>
              {!user && (
                <Link to="/select-role" className="rounded-full bg-primary px-5 py-3 text-center font-bold text-white shadow-lg shadow-primary/15 hover:-translate-y-0.5 hover:bg-primary-hover">
                  Bắt đầu ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section data-home-theme="teal" className="homepage-section bg-[var(--cp-teal-dark)] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="cp-reveal mb-16 text-center">
            <h2 className="section-title text-white">
              <span>Cộng đồng </span>
              <span className="section-title__serif section-title__accent">KoLab</span>
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-xl text-white/70">
              Nền tảng kết nối trực tiếp, tối ưu hóa chiến dịch Marketing cùng KOLab.
            </p>
          </div>

          <div className="cp-stagger grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="cp-reveal rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur transition-all hover:-translate-y-2 hover:bg-white/15">
                <div className="mb-4 flex gap-1">
                  {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                    <Star key={i} className="fill-primary text-primary" size={20} />
                  ))}
                  <span className="ml-2 text-sm font-bold text-white/80">{testimonial.rating}</span>
                </div>
                <p className="mb-6 text-white/80 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full border border-white/20 object-cover"
                  />
                  <div>
                    <p className="font-black text-white">{testimonial.name}</p>
                    <p className="text-sm text-white/60">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-home-theme="orange" className="homepage-section bg-primary py-20">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="cp-reveal mb-6 text-4xl font-black text-white md:text-6xl">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="cp-reveal mx-auto mb-8 max-w-2xl text-xl text-white/80">
            Tham gia cùng hàng nghìn thương hiệu và KOL đang sử dụng KOLab để phát triển.
          </p>
          {user ? (
            <Link
              to={getHomePathForRole(user.role)}
              className="cp-reveal inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-black text-primary shadow-xl hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <LayoutDashboard size={24} />
              Quay lại hệ thống
            </Link>
          ) : (
            <Link
              to="/select-role"
              className="cp-reveal inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-black text-primary shadow-xl hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Bắt đầu miễn phí ngay
              <ArrowRight size={24} />
            </Link>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
