import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import FlowEditor from "@/pages/flow-editor";
import PageEditor from "@/pages/page-editor";
import MediaLibrary from "@/pages/media-library";
import AIGenerator from "@/pages/ai-generator";
import Export from "@/pages/export";
import ApprovalDashboard from "@/pages/approval-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/flow-editor" component={FlowEditor} />
        <Route path="/page-editor" component={PageEditor} />
        <Route path="/media-library" component={MediaLibrary} />
        <Route path="/ai-generator" component={AIGenerator} />
        <Route path="/approval-dashboard" component={ApprovalDashboard} />
        <Route path="/export" component={Export} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
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
