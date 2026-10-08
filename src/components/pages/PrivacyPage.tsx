import { ShieldCheck, Lock, Eye, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export function PrivacyPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="public-dark-page relative min-h-screen px-6 py-16">
      <button 
        onClick={handleBack}
        className="group fixed left-8 top-8 z-50 rounded-full border border-white/15 bg-white/5 p-3 text-slate-200 shadow-lg transition-all hover:bg-white/10 hover:text-primary"
        title="Quay lại"
      >
        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Chính sách Bảo mật</h1>
          <p className="text-slate-500 font-medium italic">Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân</p>
        </div>

        <div className="space-y-10 rounded-[32px] border border-slate-100 bg-white p-10 leading-relaxed text-slate-700 shadow-2xl shadow-blue-900/5 md:p-16">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">1</div>
              Dữ liệu chúng tôi thu thập
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Thông tin định danh
                </h4>
                <p className="text-sm">Họ tên, email, số điện thoại, link mạng xã hội (TikTok, Facebook, Instagram) và thông tin ngân hàng để thanh toán.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Thông tin thanh toán
                </h4>
                <p className="text-sm">Chúng tôi sử dụng hạ tầng của PayOS. KOLab <b>không lưu trữ</b> số thẻ hay mật khẩu ngân hàng của người dùng trên máy chủ của mình.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">2</div>
              Mục đích sử dụng AI với Dữ liệu
            </h2>
            <p>Dữ liệu của bạn được xử lý bởi các thuật toán học máy (Machine Learning) cho các mục đích:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><b>AI Matching:</b> Đề xuất KOC phù hợp nhất với ngân sách và lĩnh vực của Brand.</li>
              <li><b>AI Briefing & Script Doctor:</b> Phân tích và tối ưu hóa nội dung sáng tạo để đạt hiệu quả cao nhất.</li>
              <li><b>Đo lường ROI:</b> Phân tích các chỉ số tương tác thực tế để báo cáo hiệu quả chiến dịch.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">3</div>
              Cam kết và Quyền của người dùng
            </h2>
            <div className="bg-primary text-white p-8 rounded-[32px] space-y-4 shadow-lg shadow-primary/10">
              <p className="font-bold flex items-center gap-2"><Eye size={20} /> KOLab cam kết:</p>
              <ul className="text-orange-100 text-sm space-y-2">
                <li>Không bán dữ liệu người dùng cho bên thứ ba vì mục đích quảng cáo.</li>
                <li>Mọi thông tin cá nhân được mã hóa và bảo vệ theo tiêu chuẩn bảo mật hiện hành.</li>
                <li>Người dùng có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa vĩnh viễn dữ liệu cá nhân khỏi hệ thống bất cứ lúc nào.</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
