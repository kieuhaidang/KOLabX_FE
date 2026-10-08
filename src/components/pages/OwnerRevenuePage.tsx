import { AdminEarningsPage } from "./AdminEarningsPage";
import { ownerNavigationItems } from "../owner/ownerNavigation";

export function OwnerRevenuePage() {
  return (
    <AdminEarningsPage
      navigationItems={ownerNavigationItems}
      layoutRole="owner"
      pageTitle="Doanh thu nền tảng"
      pageDescription="Tổng quan doanh thu, hoa hồng KOC và lợi nhuận nền tảng theo cài đặt phí hiện tại."
    />
  );
}
