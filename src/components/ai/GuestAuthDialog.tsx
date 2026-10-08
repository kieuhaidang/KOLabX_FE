import { useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export function GuestAuthDialog({
  open,
  onOpenChange,
  kind,
  role,
  onBeforeNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "exhausted" | "campaign";
  role: "marketer" | "koc";
  onBeforeNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const suffix = `?role=${role}`;
  const exhaustedMessage = role === "marketer"
    ? "Bạn đã hết lượt dùng thử. Đăng nhập để tiếp tục sử dụng AI Brief."
    : "Bạn đã hết lượt dùng thử. Đăng nhập để tiếp tục sử dụng Script Doctor.";
  const go = (path: "/login" | "/register") => {
    onBeforeNavigate?.();
    onOpenChange(false);
    navigate(`${path}${suffix}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/25 bg-[#101414] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-white">
            {kind === "campaign" ? "Đăng nhập để tạo chiến dịch" : "Hết lượt dùng thử"}
          </DialogTitle>
          <DialogDescription className="leading-relaxed text-slate-300">
            {kind === "campaign"
              ? "AI Brief của bạn sẽ được giữ lại và tự động điền vào form tạo chiến dịch sau khi đăng nhập."
              : exhaustedMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => go("/login")} className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white hover:bg-primary-hover">
            Đăng nhập
          </button>
          <button type="button" onClick={() => go("/register")} className="rounded-full border border-secondary/50 bg-secondary/15 px-5 py-2.5 text-sm font-black text-teal-100 hover:bg-secondary/25">
            Đăng ký
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10">
            Để sau
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
