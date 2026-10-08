import { createElement } from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { LandingPage } from "./components/pages/LandingPage";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { CheckEmailPage } from "./components/pages/CheckEmailPage";
import { RoleSelectionPage } from "./components/pages/RoleSelectionPage";
import { AboutPage } from "./components/pages/AboutPage";
import { TopKOLsPage } from "./components/pages/TopKOLsPage";
import { PricingPage } from "./components/pages/PricingPage";
import { TermsPage } from "./components/pages/TermsPage";
import { PrivacyPage } from "./components/pages/PrivacyPage";
import { KOLProfileBuilderPage } from "./components/pages/KOLProfileBuilderPage";
import { MarketerDashboard } from "./components/pages/MarketerDashboard";
import { KOCDashboard } from "./components/pages/KOCDashboard";
import { MarketerKocProfilePage } from "./components/pages/MarketerKocProfilePage";
import { CampaignBookingPage } from "./components/pages/CampaignBookingPage";
import { BookingsPage } from "./components/pages/BookingsPage";
import { CampaignsPage } from "./components/pages/CampaignsPage";
import { KocCampaignDetailPage } from "./components/pages/KocCampaignDetailPage";
import { MarketerCampaignDetailPage } from "./components/pages/MarketerCampaignDetailPage";
import { MessagesPage } from "./components/pages/MessagesPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { EarningsPage } from "./components/pages/EarningsPage";
import { MarketerWalletPage } from "./components/pages/MarketerWalletPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { VerifyEmailPage } from "./components/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./components/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/pages/ResetPasswordPage";
import { AdminDashboardPage } from "./components/pages/AdminDashboardPage";
import { AdminUsersPage } from "./components/pages/AdminUsersPage";
import { AdminReportsPage } from "./components/pages/AdminReportsPage";
import { AdminEarningsPage } from "./components/pages/AdminEarningsPage";
import { AdminPlaceholderPage } from "./components/pages/AdminPlaceholderPage";
import { AdminDisputesPage } from "./components/pages/AdminDisputesPage";
import { AdminCampaignsPage } from "./components/pages/AdminCampaignsPage";
import { AdminWithdrawalsPage } from "./components/pages/AdminWithdrawalsPage";
import { AdminPaymentsPage } from "./components/pages/AdminPaymentsPage";
import { OwnerDashboardPage } from "./components/pages/OwnerDashboardPage";
import { OwnerAdminsPage } from "./components/pages/OwnerAdminsPage";
import { OwnerFinancialSettingsPage } from "./components/pages/OwnerFinancialSettingsPage";
import { OwnerAuditLogsPage } from "./components/pages/OwnerAuditLogsPage";
import { OwnerRevenuePage } from "./components/pages/OwnerRevenuePage";
import { AdminAccountProfilePage } from "./components/pages/AdminAccountProfilePage";
import { AIAutoBriefingPage } from "./components/pages/AIAutoBriefingPage";
import { AIScriptDoctorPage } from "./components/pages/AIScriptDoctorPage";
import { GuestAiBriefPage } from "./components/pages/GuestAiBriefPage";
import { GuestScriptDoctorPage } from "./components/pages/GuestScriptDoctorPage";
import { AISmartMatchingPage } from "./components/pages/AISmartMatchingPage";
import { MarketerSubmissionsPage } from "./components/pages/MarketerSubmissionsPage";
import { PaymentResultPage } from "./components/pages/PaymentResultPage";
import { CampaignPaymentResultPage } from "./components/pages/CampaignPaymentResultPage";

console.log("KOLab Router Configuration Loaded v2.1");

const AdminProfilePage = () => createElement(AdminAccountProfilePage, { layoutRole: "admin" });
const OwnerProfilePage = () => createElement(AdminAccountProfilePage, { layoutRole: "owner" });

const MarketerGuard = () => createElement(RequireAuth, { allowedRoles: ["marketer"] });
const KocGuard = () => createElement(RequireAuth, { allowedRoles: ["koc"] });
const AdminGuard = () => createElement(RequireAuth, { allowedRoles: ["admin", "owner"] });
const OwnerGuard = () => createElement(RequireAuth, { allowedRoles: ["owner"] });

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "landing", Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "check-email", Component: CheckEmailPage },
      { path: "verify-email", Component: VerifyEmailPage },
      { path: "payment/success", element: createElement(PaymentResultPage, { type: "success" }) },
      { path: "payment/cancel", element: createElement(PaymentResultPage, { type: "cancel" }) },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
      { path: "select-role", Component: RoleSelectionPage },
      { path: "about", Component: AboutPage },
      { path: "terms", Component: TermsPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "top-kols", Component: TopKOLsPage },
      { path: "pricing", Component: PricingPage },
      { path: "kol-profile-builder", Component: KOLProfileBuilderPage },
      { path: "try/ai-brief", Component: GuestAiBriefPage },
      { path: "try/script-doctor", Component: GuestScriptDoctorPage },
      {
        Component: MarketerGuard,
        children: [
          { path: "marketer", Component: MarketerDashboard },
          { path: "marketer/dashboard", Component: MarketerDashboard },
          { path: "marketer/auto-briefing", Component: AIAutoBriefingPage },
          { path: "marketer/smart-matching", Component: AISmartMatchingPage },
          { path: "marketer/koc-profile/:kocId", Component: MarketerKocProfilePage },
          { path: "marketer/campaigns", Component: CampaignsPage },
          { path: "marketer/campaigns/payment-success", element: createElement(CampaignPaymentResultPage, { type: "success" }) },
          { path: "marketer/campaigns/payment-cancel", element: createElement(CampaignPaymentResultPage, { type: "cancel" }) },
          { path: "marketer/campaigns/:id", Component: MarketerCampaignDetailPage },
          { path: "marketer/bookings", Component: CampaignBookingPage },
          { path: "marketer/submissions", Component: MarketerSubmissionsPage },
          { path: "marketer/wallet", Component: MarketerWalletPage },
          { path: "marketer/messages", Component: MessagesPage },
          { path: "marketer/profile", Component: ProfilePage },
         
        ],
      },
      {
        Component: KocGuard,
        children: [
          { path: "koc", Component: KOCDashboard },
          { path: "koc/dashboard", Component: KOCDashboard },
          { path: "koc/campaigns", Component: CampaignsPage },
          { path: "koc/campaigns/:id", Component: KocCampaignDetailPage },
          { path: "koc/bookings", Component: BookingsPage },
          { path: "koc/script-doctor", Component: AIScriptDoctorPage },
          { path: "koc/messages", Component: MessagesPage },
          { path: "koc/earnings", Component: EarningsPage },
          { path: "koc/profile", Component: ProfilePage },
        ],
      },
      {
        Component: AdminGuard,
        children: [
          { path: "admin", Component: AdminDashboardPage },
          { path: "admin/dashboard", Component: AdminDashboardPage },
          { path: "admin/users", Component: AdminUsersPage },
          { path: "admin/withdrawals", Component: AdminWithdrawalsPage },
          { path: "admin/payments", Component: AdminPaymentsPage },
          { path: "admin/campaigns", Component: AdminCampaignsPage },
          { path: "admin/analytics", Component: AdminReportsPage },
          { path: "admin/revenue", Component: AdminEarningsPage },
          { path: "admin/moderation", Component: AdminDisputesPage },
          { path: "admin/moderation/disputes", Component: AdminDisputesPage },
          { path: "admin/settings", Component: AdminPlaceholderPage },
          { path: "admin/activities", Component: AdminPlaceholderPage },
          { path: "admin/support", Component: AdminPlaceholderPage },
          { path: "admin/reports", Component: AdminReportsPage },
          { path: "admin/earnings", Component: AdminEarningsPage },
          { path: "admin/profile", Component: AdminProfilePage },
        ],
      },
      {
        Component: OwnerGuard,
        children: [
          { path: "owner", Component: OwnerDashboardPage },
          { path: "owner/dashboard", Component: OwnerDashboardPage },
          { path: "owner/admins", Component: OwnerAdminsPage },
          { path: "owner/revenue", Component: OwnerRevenuePage },
          { path: "owner/financial-settings", Component: OwnerFinancialSettingsPage },
          { path: "owner/audit-logs", Component: OwnerAuditLogsPage },
          { path: "owner/profile", Component: OwnerProfilePage },
        ],
      },
    ],
  },
]);
