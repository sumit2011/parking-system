import { Header } from "@/components/user/Header";
import { UserTabs } from "@/components/user/UserTabs";

export default function UserApp() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <UserTabs />
    </div>
  );
}
