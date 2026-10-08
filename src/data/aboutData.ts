import { Award, Heart, Target, Users } from "lucide-react";

export type AboutValue = {
  icon: typeof Target;
  title: string;
  description: string;
};

export type TeamMember = {
  name: string;
  role: string;
  avatar: string;
  description: string;
};

export const aboutValues: AboutValue[] = [
  {
    icon: Target,
    title: "Sứ mệnh",
    description:
      "Kết nối thương hiệu và KOL/KOC bằng quy trình minh bạch, đo lường rõ ràng và hỗ trợ bởi AI.",
  },
  {
    icon: Users,
    title: "Cộng đồng",
    description:
      "Xây dựng hệ sinh thái hợp tác bền vững giữa thương hiệu, creator và đội ngũ vận hành.",
  },
  {
    icon: Heart,
    title: "Tận tâm",
    description:
      "Đồng hành xuyên suốt từ lên brief, lựa chọn creator, theo dõi tiến độ đến đánh giá hiệu quả.",
  },
  {
    icon: Award,
    title: "Chất lượng",
    description:
      "Mỗi hồ sơ trên nền tảng đều được chuẩn hóa thông tin để tăng độ tin cậy khi hợp tác.",
  },
];

// TODO: Replace with real team data
export const teamMembers: TeamMember[] = [
  {
    name: "Tấn Dũng",
    role: "CMO",
    avatar: "/team/tan-dung.png",
    description: "Phụ trách chiến lược marketing và tăng trưởng thương hiệu.",
  },
  {
    name: "Minh Tâm",
    role: "CTO",
    avatar: "/team/minh-tam.png",
    description: "Phụ trách công nghệ, kiến trúc hệ thống và nền tảng sản phẩm.",
  },
  {
    name: "Hương Giang",
    role: "CEO",
    avatar: "/team/huong-giang.png",
    description: "Định hướng chiến lược và điều hành tổng thể KOLab.",
  },
  {
    name: "Đình Nam",
    role: "CPO",
    avatar: "/team/dinh-nam.png",
    description: "Phụ trách chiến lược sản phẩm và trải nghiệm người dùng.",
  },
  {
    name: "Phúc Bình",
    role: "CDO",
    avatar: "/team/phuc-binh.png",
    description: "Phụ trách dữ liệu, phân tích và định hướng dữ liệu sản phẩm.",
  },
];
