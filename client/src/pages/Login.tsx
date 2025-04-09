import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

export default function Login() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AuthModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}
