import { Link } from "react-router";
import { useEffect } from "react";
import { Sparkles, LayoutDashboard, ArrowRight } from "lucide-react";
import { PublicHeader } from "../layouts/PublicHeader";
import { PublicFooter } from "../layouts/PublicFooter";
import { aboutValues, teamMembers } from "../../data/aboutData";
import { useAuth } from "../auth/AuthProvider";
import { getHomePathForRole } from "../../services/authService";

export function AboutPage() {
  const { user } = useAuth();

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".public-dark-page .cp-reveal"));
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="public-dark-page">
      <PublicHeader theme="dark" />

      <section className="public-dark-section container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="cp-reveal mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-full mb-6 border border-blue-100">
            <Sparkles size={16} />
            <span className="text-sm font-bold">Về chúng tôi</span>
          </div>
          <h1 className="mb-6 text-5xl font-black text-white md:text-6xl">
            Chúng tôi đang
            <span className="text-primary"> nâng chuẩn</span> Influencer Marketing
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            KOLab kết nối thương hiệu với KOL/KOC bằng dữ liệu minh bạch, quy trình rõ ràng
            và công cụ AI giúp tối ưu hiệu quả chiến dịch.
          </p>
        </div>
      </section>

      <section className="public-section-teal px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto grid items-center gap-16 lg:grid-cols-2">
          <div className="cp-reveal space-y-6">
            <h2 className="text-4xl font-bold text-slate-900">Câu chuyện của chúng tôi</h2>
            <div className="space-y-4 text-slate-700 text-lg leading-relaxed">
              <p>
                KOLab ra đời từ nhu cầu thực tế khi cả thương hiệu và creator gặp khó trong việc
                tìm đúng đối tác và kiểm soát chất lượng hợp tác.
              </p>
              <p>
                Chúng tôi xây dựng nền tảng để chuẩn hóa quy trình từ tìm kiếm, short-list, booking
                đến theo dõi hiệu suất, giúp giảm rủi ro và tiết kiệm thời gian vận hành.
              </p>
              <p>
                Mục tiêu của KOLab là trở thành hạ tầng đáng tin cậy cho influencer marketing tại Việt Nam.
              </p>
            </div>
          </div>
          <div className="cp-reveal relative">
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-primary/20 blur-2xl"></div>
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
              alt="Our story"
              className="rounded-[32px] border border-white/15 shadow-2xl transition-transform duration-500 hover:scale-[1.015]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cp-reveal mb-16 text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Giá trị cốt lõi</h2>
            <p className="text-xl text-slate-600">Những giá trị định hướng mọi hành động của chúng tôi</p>
          </div>
          <div className="cp-stagger grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {aboutValues.map((value, index) => (
              <div
                key={index}
                className="cp-reveal rounded-[28px] border border-slate-100 bg-slate-50 p-8 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                  <value.icon className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-orange px-4 py-24 sm:px-6 lg:px-8">
        <div className="container mx-auto">
        <div className="cp-reveal mb-16 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Đội ngũ của chúng tôi</h2>
          <p className="text-xl text-slate-600">Thông tin đội ngũ vận hành KOLab</p>
        </div>
        <div className="cp-stagger grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="cp-reveal overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <img src={member.avatar} alt={member.name} className="w-full h-56 object-cover" />
              <div className="p-6 text-center">
                <h3 className="font-bold text-lg text-slate-900 mb-1">{member.name}</h3>
                <p className="text-primary font-bold text-sm mb-3 uppercase tracking-wider">{member.role}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* 
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-5xl font-bold mb-2">1,200+</p>
              <p className="text-blue-100 font-medium">Mạng lưới KOL/KOC</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">120+</p>
              <p className="text-blue-100 font-medium">Thương hiệu liên kết</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">92%</p>
              <p className="text-blue-100 font-medium">Độ hài lòng đối tác</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">350K+</p>
              <p className="text-blue-100 font-medium">Lượt tiếp cận tiềm năng</p>
            </div>
          </div>
        </div>
      </section>
      */}

      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="cp-reveal rounded-[32px] border border-slate-100 border-b-4 border-b-primary bg-white p-8 text-center shadow-2xl shadow-primary/5 md:p-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Hãy cùng chúng tôi phát triển</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Tham gia KOLab ngay hôm nay và trải nghiệm nền tảng influencer marketing hiện đại.
          </p>
          {user ? (
            <Link
              to={getHomePathForRole(user.role)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-5 text-lg font-bold text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              <LayoutDashboard size={24} />
              Quay lại hệ thống
            </Link>
          ) : (
            <Link
              to="/select-role"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-5 text-lg font-bold text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              Bắt đầu ngay
              <ArrowRight size={24} />
            </Link>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
