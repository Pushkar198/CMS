import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/protected-route";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import FlowEditor from "@/pages/flow-editor";
import PageEditor from "@/pages/page-editor";
import MediaLibrary from "@/pages/media-library";
import AIGenerator from "@/pages/ai-generator";
import Export from "@/pages/export";
import ApprovalDashboard from "@/pages/approval-dashboard";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={['maker', 'checker', 'admin']}>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/flow-editor">
        <ProtectedRoute allowedRoles={['maker', 'checker', 'admin']}>
          <MainLayout>
            <FlowEditor />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/page-editor">
        <ProtectedRoute allowedRoles={['maker', 'checker', 'admin']}>
          <MainLayout>
            <PageEditor />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/media-library">
        <ProtectedRoute allowedRoles={['maker', 'checker', 'admin']}>
          <MainLayout>
            <MediaLibrary />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/ai-generator">
        <ProtectedRoute allowedRoles={['maker', 'checker', 'admin']}>
          <MainLayout>
            <AIGenerator />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/approval-dashboard">
        <ProtectedRoute allowedRoles={['checker', 'admin']}>
          <MainLayout>
            <ApprovalDashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/export">
        <ProtectedRoute allowedRoles={['maker', 'checker', 'admin']}>
          <MainLayout>
            <Export />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
