import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import UserApp from "@/pages/UserApp";
import AdminApp from "@/pages/AdminApp";
import Login from "@/pages/Login";
import { AuthProvider } from "./contexts/AuthContext";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={UserApp} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={AdminApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
