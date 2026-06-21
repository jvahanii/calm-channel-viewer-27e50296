import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth.tsx";
import SubscriptionsPage from "./pages/SubscriptionsPage.tsx";
import ChannelPage from "./pages/ChannelPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import GuidePage from "./pages/GuidePage.tsx";
import SavedPage from "./pages/SavedPage.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { UpgradeDialogProvider } from "./contexts/UpgradeDialog";
import { HiddenVideosProvider } from "./contexts/HiddenVideos";
import { SavedVideosProvider } from "./contexts/SavedVideos";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UpgradeDialogProvider>
            <HiddenVideosProvider>
            <SavedVideosProvider>
            <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
            <Route path="/channel/:channelId" element={<ProtectedRoute><ChannelPage /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            </SavedVideosProvider>
            </HiddenVideosProvider>
          </UpgradeDialogProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
