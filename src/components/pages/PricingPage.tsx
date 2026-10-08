import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Briefcase, Check, CircleHelp, Crown, Rocket, Sparkles, TrendingUp, LayoutDashboard, ArrowRight, Loader2 } from "lucide-react";
import { PublicHeader } from "../layouts/PublicHeader";
import { PublicFooter } from "../layouts/PublicFooter";
import { useAuth } from "../auth/AuthProvider";
import { getHomePathForRole } from "../../services/authService";
import { getSubscriptionPlans, createSubscriptionCheckout, getMySubscription, SubscriptionPlan, UserSubscription } from "../../services/subscriptionService";

export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySub, setMySub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingId, setUpgradingId] = useState<number | null>(null);

  const planIcons = {
    Free: Sparkles,
    Starter: Rocket,
    Growth: TrendingUp,
    Pro: TrendingUp,
    "Business / Enterprise": Crown,
    Enterprise: Crown,
  } as const;

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansData, subData] = await Promise.all([
          getSubscriptionPlans(),
          user?.role === "marketer" ? getMySubscription() : Promise.resolve(null),
        ]);
        setPlans(plansData);
        setMySub(subData);
      } catch (error) {
        console.error("Failed to fetch pricing data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }

    if (user.role !== "marketer") {
      alert("Chỉ dành cho tài khoản Marketer");
      return;
    }

    if (plan.price === 0 || plan.name === "Free") {
      return; // Đã là gói mặc định
    }

    try {
      setUpgradingId(plan.id);
      const { checkoutUrl, isFree } = await createSubscriptionCheckout(plan.id);
      if (isFree) {
        window.location.reload();
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      alert(error.message || "Không thể thực hiện nâng cấp");
    } finally {
      setUpgradingId(null);
    }
  };

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".pricing-reveal"));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("pricing-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [loading]); // Re-observe when loading finishes

  const formatPrice = (price: number) => {
    if (price === 0) return "0 VNĐ";
    return `${new Intl.NumberFormat("vi-VN").format(price)} VNĐ`;
  };

  const kolLaunchBenefits = [
    "Tạo hồ sơ KOL/KOC miễn phí để lên sóng sớm trước các brand mới vào hệ thống",
    "Nhận gợi ý chiến dịch phù hợp theo niche, follower và định hướng nội dung",
    "Dùng AI Script Doctor để tối ưu kịch bản trước khi gửi brand duyệt",
    "Tham gia sớm để có lợi thế hiện diện khi KOLab đang mở rộng creator pool",
  ];

  return (
    <div className="public-dark-page">
      <style>{`
        @keyframes pricingFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pricingGlow {
          0%, 100% { box-shadow: 0 12px 30px -22px rgb(var(--kl-primary-rgb)/0.18); }
          50% { box-shadow: 0 20px 40px -20px rgb(var(--kl-primary-rgb)/0.32); }
        }
        @keyframes pricingShine {
          0% { transform: translateX(-140%); opacity: 0; }
          15% { opacity: 0; }
          35% { opacity: 0.28; }
          60% { opacity: 0.28; }
          80% { opacity: 0; }
          100% { transform: translateX(220%); opacity: 0; }
        }
        .pricing-reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 620ms cubic-bezier(.22,1,.36,1), transform 620ms cubic-bezier(.22,1,.36,1);
          transition-delay: var(--pricing-delay, 0ms);
        }
        .pricing-reveal.pricing-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .pricing-float {
          animation: pricingFloat 4s ease-in-out infinite;
          animation-play-state: paused;
        }
        .pricing-glow {
          animation: pricingGlow 3.6s ease-in-out infinite;
          animation-play-state: paused;
        }
        .pricing-sheen {
          position: relative;
          overflow: hidden;
        }
        .pricing-sheen::after {
          content: "";
          position: absolute;
          inset: 0 auto 0 -30%;
          width: 24%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.38), transparent);
          animation: pricingShine 5.8s linear infinite;
          animation-play-state: paused;
          pointer-events: none;
        }
        .pricing-visible.pricing-float,
        .pricing-visible .pricing-float {
          animation-play-state: running;
        }
        .pricing-visible.pricing-glow,
        .pricing-visible .pricing-glow {
          animation-play-state: running;
        }
        .pricing-visible.pricing-sheen::after,
        .pricing-visible .pricing-sheen::after {
          animation-play-state: running;
        }
        .pricing-card {
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background-color 220ms ease;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -24px rgba(15, 23, 42, 0.22);
        }
        @media (prefers-reduced-motion: reduce) {
          .pricing-reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .pricing-float, .pricing-glow, .pricing-sheen::after {
            animation: none !important;
          }
          .pricing-card {
            transition: none !important;
          }
        }
      `}</style>
      <PublicHeader theme="dark" />

      <section
        className="pricing-reveal public-dark-section container relative mx-auto px-4 py-20 sm:px-6 lg:px-8"
        style={{ ["--pricing-delay" as any]: "40ms" }}
      >
        <div className="absolute inset-x-0 top-8 mx-auto h-36 max-w-3xl bg-primary/5 blur-3xl -z-10" />
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="mb-6 text-4xl font-black leading-tight text-white md:text-6xl">
            Chọn gói phù hợp để
            <span className="text-primary"> tăng tốc chiến dịch</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Giá rõ ràng, quyền lợi cụ thể cho cả Marketer và KOL/KOC. Bắt đầu từ gói Free, nâng cấp khi cần.
          </p>
          <div className="flex justify-center">
            <a
              href="#plans"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white/[0.04] px-8 py-4 font-bold text-white transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <Briefcase size={18} />
              Xem gói chi tiết
            </a>
          </div>
        </div>
      </section>

      <section
        className="pricing-reveal public-section-teal px-4 py-16 sm:px-6 lg:px-8"
        style={{ ["--pricing-delay" as any]: "120ms" }}
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="pricing-card pricing-reveal max-w-6xl mx-auto overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-primary/5 border border-slate-100"
            style={{
              ["--pricing-delay" as any]: "160ms",
            }}
          >
            <div className="grid gap-6 p-8 md:grid-cols-[1.1fr,0.9fr] md:p-12">
              <div>
                <div
                  className="pricing-float inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white bg-primary"
                >
                  Dành Cho Marketer
                </div>
                <h3 className="mt-6 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                  Marketer nhận được gì?
                </h3>
                <p className="mt-4 max-w-2xl text-lg text-slate-600">
                  Một flow tập trung giúp team cắt bớt thao tác thủ công, rút ngắn quá trình shortlist và nhìn thấy cơ hội tối ưu ngân sách sớm hơn.
                </p>
 
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Mục tiêu</p>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      Tăng 50% matching
                    </p>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">Giúp team rút ngắn thời gian shortlist nhờ bộ lọc AI chính xác</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Kết quả</p>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      Tăng 30% ROI
                    </p>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">Tối ưu ngân sách khi hiệu suất được theo dõi trong 1 dashboard</p>
                  </div>
                </div>
              </div>
 
              <div
                className="pricing-sheen pricing-glow rounded-[32px] p-8 text-white shadow-xl shadow-primary/20"
                style={{
                  backgroundColor: "var(--kl-primary)",
                }}
              >
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">
                  Quyền lợi nổi bật
                </p>
                <ul className="mt-6 space-y-4">
                  {[
                    "Quản lý campaign theo quy trình rõ ràng.",
                    "Tìm kiếm, lọc và shortlist KOL theo mục tiêu.",
                    "Theo dõi hiệu suất để tối ưu ROI.",
                    "AI phân tích và đề xuất xu hướng mới."
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-primary font-black shadow-sm">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                      <span className="text-base font-bold text-white leading-normal">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl p-5 text-sm text-white bg-white/15 border border-white/25 font-bold leading-relaxed">
                  Phù hợp cho brand muốn đi từ brief đến shortlist nhanh hơn, giảm bớt thời gian vận hành và vẫn giữ quyết định dựa trên số liệu rõ ràng.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="pricing-reveal public-section-orange px-4 py-16 sm:px-6 lg:px-8"
        style={{ ["--pricing-delay" as any]: "180ms" }}
      >
        <div
          className="pricing-card pricing-reveal max-w-6xl mx-auto mt-8 overflow-hidden rounded-[40px] bg-white shadow-2xl shadow-primary/5 border border-slate-100"
          style={{
            ["--pricing-delay" as any]: "220ms",
          }}
        >
          <div className="grid gap-6 p-8 md:grid-cols-[1.1fr,0.9fr] md:p-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="pricing-float inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white bg-primary"
                >
                  Chỉ dành cho KOL/KOC
                </div>
                <div
                  className="inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-blue-50 border border-blue-100"
                >
                  Ưu đãi khởi động
                </div>
              </div>
              <h3 className="mt-6 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                Tham gia <span className="text-primary">miễn phí</span> trong giai đoạn đầu
              </h3>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                Đây là chương trình mở sớm dành riêng cho creator, giúp bạn vào nền tảng với chi phí 0đ, xây hồ sơ chuyên nghiệp và tăng cơ hội được brand nhìn thấy.
              </p>
 
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Ưu đãi</p>
                  <p className="mt-2 text-2xl font-bold text-primary">Miễn phí 100%</p>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">Không tốn phí duy trì tài khoản trong 12 tháng đầu</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Lợi thế</p>
                  <p className="mt-2 text-2xl font-bold text-primary">Early Access</p>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">Vào sớm, dễ lên top đề xuất hơn khi platform còn mới</p>
                </div>
              </div>
            </div>
 
            <div
              className="pricing-sheen pricing-glow rounded-[32px] p-8 text-white shadow-xl shadow-primary/20"
              style={{
                backgroundColor: "var(--kl-primary)",
              }}
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100/80">KOL/KOC nhận được gì?</p>
              <ul className="mt-6 space-y-4">
                {kolLaunchBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check size={14} />
                    </div>
                    <span className="text-base font-medium text-white/90">{benefit}</span>
                  </li>
                ))}
              </ul>
 
              {user?.role === 'koc' ? (
                <Link
                  to="/koc/profile"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-bold text-primary transition-all hover:bg-blue-50 shadow-lg"
                >
                  <LayoutDashboard size={18} />
                  Hoàn thiện hồ sơ ngay
                </Link>
              ) : (
                <Link
                  to="/register?role=koc"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-4 text-sm font-bold text-primary transition-all hover:bg-blue-50 shadow-lg"
                >
                  Đăng ký KOL/KOC miễn phí
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="pricing-reveal border-y border-slate-100 bg-white py-24" style={{ ["--pricing-delay" as any]: "240ms" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Gói dịch vụ nền tảng</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Các gói được thiết kế để giúp Marketer tăng tốc tìm kiếm, booking, quản lý chiến dịch và hoàn toàn miễn phí cho KOL/KOC
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch min-h-[400px]">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-slate-500 font-medium">Đang tải danh sách gói...</p>
              </div>
            ) : (
              plans.map((plan, index) => {
                const isCurrent = mySub?.plan_id === plan.id;
                const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || "[]");
                
                // Cập nhật Highlight và Icon đúng cho 4 gói
                const isHighlighted = plan.name === "Growth";
                const PlanIcon = planIcons[plan.name as keyof typeof planIcons] ?? Briefcase;

                return (
                  <div key={plan.id} className="h-full relative flex flex-col">
                    {isHighlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-1.5 rounded-full bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest shadow-xl whitespace-nowrap">
                        GÓI KHUYẾN NGHỊ
                      </div>
                    )}

                    <div
                          className={`pricing-card pricing-reveal h-full flex flex-col rounded-[32px] border bg-white transition-all ${
                        isHighlighted
                          ? "border-primary/20 shadow-2xl shadow-primary/5 ring-1 ring-primary/10"
                          : "border-slate-200 shadow-sm hover:shadow-xl"
                      }`}
                      style={{ ["--pricing-delay" as any]: `${300 + index * 70}ms` }}
                    >
                      <div className="p-8 flex h-full flex-col">
                        <div className="mb-4 flex items-center gap-3">
                          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${isHighlighted ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                            <PlanIcon size={24} />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                        </div>
                        
                        <p className="text-slate-500 mb-6 text-sm font-medium">{plan.description}</p>

                        <div className="mb-8">
                          <span className={`text-4xl font-extrabold ${isHighlighted ? "text-primary" : "text-slate-900"}`}>{formatPrice(plan.price)}</span>
                          {plan.price > 0 && <span className="text-slate-400 font-bold ml-1">/tháng</span>}
                        </div>

                        <div className="mb-10 space-y-4 flex-1">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cho Marketer</p>
                          <ul className="space-y-4">
                            {features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-3">
                                <Check className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                                <span className="text-sm font-medium text-slate-600 leading-snug">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => handleUpgrade(plan)}
                          disabled={isCurrent || upgradingId === plan.id}
                          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold shadow-md transition-all ${
                            isCurrent
                              ? "bg-slate-100 text-slate-400 cursor-default"
                              : isHighlighted
                                ? "bg-primary text-white hover:bg-primary-hover shadow-primary/20"
                                : "border-2 border-slate-200 text-slate-700 hover:border-primary hover:text-primary hover:bg-blue-50"
                          }`}
                        >
                          {upgradingId === plan.id ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : isCurrent ? (
                            "Đang sử dụng"
                          ) : user ? (
                            plan.price === 0 ? "Gói mặc định" : "Nâng cấp ngay"
                          ) : (
                            "Bắt đầu ngay"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="pricing-reveal container mx-auto px-4 sm:px-6 lg:px-8 py-24" style={{ ["--pricing-delay" as any]: "320ms" }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-16 flex items-center justify-center gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary shadow-sm">
              <CircleHelp size={24} />
            </div>
            <h2 className="text-4xl font-bold text-slate-900">Câu hỏi thường gặp</h2>
          </div>
          <div className="space-y-6">
            <div className="pricing-card bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xl text-slate-900 mb-3">Tôi có thể đổi gói bất kỳ lúc nào không?</h3>
              <p className="text-slate-600 leading-relaxed">Có. Bạn có thể nâng cấp hoặc điều chỉnh gói theo nhu cầu vận hành của team. Hệ thống sẽ tự động tính toán chi phí chênh lệch.</p>
            </div>
            <div className="pricing-card bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-xl text-slate-900 mb-3">Gói Free có giới hạn gì quan trọng?</h3>
              <p className="text-slate-600 leading-relaxed">Gói Free phù hợp để thử hệ thống, giới hạn 1 campaign mỗi tháng và lượt xem hồ sơ KOL cơ bản.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-reveal bg-primary py-24" style={{ ["--pricing-delay" as any]: "380ms" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">
            Chọn gói phù hợp và khởi chạy chiến dịch đầu tiên của bạn ngay hôm nay cùng KOLab.
          </p>
          {user ? (
            <Link
              to={getHomePathForRole(user.role)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-10 py-5 text-lg font-extrabold text-primary shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <LayoutDashboard size={24} />
              Quay lại Dashboard
            </Link>
          ) : (
            <Link
              to="/select-role"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-10 py-5 text-lg font-extrabold text-primary shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-blue-50"
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
