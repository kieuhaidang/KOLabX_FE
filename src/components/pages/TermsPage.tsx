import { ShieldCheck, FileText, Scale, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export function TermsPage() {
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
          <div className="w-20 h-20 bg-blue-100 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Scale size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Điều khoản Dịch vụ</h1>
          <p className="text-slate-500 font-medium italic">Cập nhật lần cuối: Ngày 01 tháng 06 năm 2026</p>
        </div>

        <div className="space-y-10 rounded-[32px] border border-slate-100 bg-white p-10 leading-relaxed text-slate-700 shadow-2xl shadow-primary/5 md:p-16">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary">1</div>
              Định nghĩa và Phạm vi
            </h2>
            <p>
              KOLab là nền tảng công nghệ cung cấp công cụ AI để kết nối Nhãn hàng (Brand/Marketer) và Người sáng tạo nội dung (KOC/KOL). 
              Chúng tôi hoạt động với tư cách là bên thứ ba trung gian, cung cấp hạ tầng kỹ thuật và giải pháp quản lý để tối ưu hóa quá trình hợp tác.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary">2</div>
              Cơ chế Thanh toán và Ký quỹ (Escrow)
            </h2>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <p><b>Thanh toán:</b> Khi Brand xác nhận chiến dịch với một KOC, Brand thực hiện nạp 100% giá trị hợp đồng qua cổng PayOS. Số tiền này bao gồm Phí dịch vụ cho KOC và Phí nền tảng (Commission) của KOLab.</p>
              <p><b>Tạm giữ tiền (Escrow):</b> KOLab có trách nhiệm giữ số tiền này trên hệ thống an toàn. Tiền chỉ được giải ngân cho KOC sau khi KOC hoàn thành bài đăng theo đúng Brief và Brand nhấn nút "Nghiệm thu" trên Dashboard.</p>
              <p><b>Hoa hồng:</b> KOLab thu phí dịch vụ dựa trên tỷ lệ % được hiển thị rõ ràng tại thời điểm tạo chiến dịch. Phí này dùng để duy trì hạ tầng AI và dịch vụ hỗ trợ.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary">3</div>
              Chính sách Hủy bỏ và Hoàn tiền
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><b>Lỗi từ KOC:</b> Nếu KOC không thực hiện đúng thời hạn hoặc nội dung sai lệch nghiêm trọng so với Brief đã thỏa thuận, KOLab sẽ thực hiện hoàn trả tiền cho Brand sau khi đối soát thực tế.</li>
              <li><b>Lỗi từ Brand:</b> Nếu Brand hủy chiến dịch sau khi KOC đã bắt đầu quá trình sản xuất nội dung, Brand có thể bị khấu trừ phí bồi thường tùy theo thỏa thuận cụ thể trong từng Brief.</li>
              <li><b>Vai trò trọng tài:</b> Trong mọi trường hợp tranh chấp, KOLab đóng vai trò là đơn vị phân xử cuối cùng dựa trên các bằng chứng được ghi lại trên hệ thống.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary">4</div>
              Miễn trừ trách nhiệm
            </h2>
            <div className="flex gap-4 items-start p-6 bg-amber-50 text-amber-900 rounded-3xl border border-amber-100">
              <AlertCircle className="shrink-0 mt-1" />
              <div className="text-sm space-y-2">
                <p>KOLab ứng dụng AI để gợi ý Matching và đánh giá nội dung, tuy nhiên Brand chịu trách nhiệm cuối cùng trong việc phê duyệt lựa chọn KOC.</p>
                <p>Chúng tôi không chịu trách nhiệm về các vi phạm bản quyền, phát ngôn gây tranh cãi hoặc các vấn đề pháp lý cá nhân phát sinh từ nội dung thực tế do KOC đăng tải trên các nền tảng mạng xã hội.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
