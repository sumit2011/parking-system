import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleToggleAuth = () => {
    if (isAuthenticated) {
      logout();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <PlusCircle className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-semibold text-gray-800">Quick Park</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center">
              {isAuthenticated && user?.isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="mr-4">
                    Admin Panel
                  </Button>
                </Link>
              )}
              
              {isAuthenticated ? (
                <div className="flex items-center">
                  <span className="mr-2 text-gray-600">{user?.name}</span>
                  <Button variant="ghost" onClick={handleToggleAuth}>
                    Log Out
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={handleToggleAuth}>
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
