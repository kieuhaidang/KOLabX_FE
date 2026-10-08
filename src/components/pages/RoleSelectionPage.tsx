import { useNavigate, Link } from "react-router";
import { Briefcase, Users, TrendingUp, Target, Award, Sparkles } from "lucide-react";

export function RoleSelectionPage() {
  const navigate = useNavigate();

  const handleRoleSelect = (role: "marketer" | "koc") => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="public-dark-page flex min-h-screen items-center justify-center p-4">
      <Link to="/landing" className="absolute left-4 top-4 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:text-primary">
        ← Trang chủ
      </Link>
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <img
            src="/logo-cropped.png"
            alt="KOLab logo"
            className="mx-auto mb-4 h-14 w-auto object-contain"
          />
          <h1 className="text-4xl font-bold mb-3">Chọn vai trò của bạn</h1>
          <p className="text-slate-600 text-lg">
            Bạn muốn sử dụng KOLab như thế nào?
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Marketer Card */}
          <button
            onClick={() => handleRoleSelect("marketer")}
            className="group rounded-[28px] border-2 border-slate-200 bg-white p-8 text-left transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="text-white" size={28} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Tôi là Nhà tiếp thị</h2>
            <p className="text-slate-600 mb-6">
              Tìm kiếm và hợp tác với influencers để phát triển thương hiệu
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="text-purple-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">AI Tạo Brief Tự động</p>
                  <p className="text-sm text-slate-500">Tạo brief chiến dịch tự động</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="text-purple-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Khám phá KOC</p>
                  <p className="text-sm text-slate-500">Tìm influencers phù hợp với thương hiệu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="text-purple-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Phân tích chiến dịch</p>
                  <p className="text-sm text-slate-500">Theo dõi hiệu suất và ROI</p>
                </div>
              </div>
            </div>

            <div className="mt-6 px-4 py-3 bg-purple-50 rounded-lg text-center">
              <span className="text-purple-700 font-medium">Tiếp tục với vai trò Marketer →</span>
            </div>
          </button>

          {/* KOC Card */}
          <button
            onClick={() => handleRoleSelect("koc")}
            className="group rounded-[28px] border-2 border-slate-200 bg-white p-8 text-left transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Award className="text-white" size={28} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Tôi là KOC/Influencer</h2>
            <p className="text-slate-600 mb-6">
              Hợp tác với thương hiệu và kiếm tiền từ sức ảnh hưởng
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Briefcase className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Chiến dịch thương hiệu</p>
                  <p className="text-sm text-slate-500">Truy cập cơ hội hợp tác độc quyền</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">AI Script Doctor</p>
                  <p className="text-sm text-slate-500">Tối ưu nội dung với AI</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium">Bảng thu nhập</p>
                  <p className="text-sm text-slate-500">Theo dõi doanh thu và tăng trưởng</p>
                </div>
              </div>
            </div>

            <div className="mt-6 px-4 py-3 bg-blue-50 rounded-lg text-center">
              <span className="text-blue-700 font-medium">Tiếp tục với vai trò KOC →</span>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Bạn có thể thay đổi vai trò bất kỳ lúc nào trong cài đặt
        </p>
      </div>
    </div>
  );
}

