import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useState } from "react";

interface Page {
  id: string;
  name: string;
  state: string;
  createdAt: string;
  submittedAt?: string;
  pageType: string;
  thumbnail?: string;
}

export default function ApprovalDashboard() {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedPageForRejection, setSelectedPageForRejection] = useState<string | null>(null);

  // Fetch pages pending approval
  const { data: pendingPages, isLoading: isLoadingPending } = useQuery<Page[]>({
    queryKey: ['/api/pages/pending-approval'],
  });

  // Fetch all pages to show stats
  const { data: allPages } = useQuery<Page[]>({
    queryKey: ['/api/pages'],
  });

  // Approve page mutation
  const approveMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/pages/${pageId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: 'demo-approver' }) // In real app, get from auth
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages/pending-approval'] });
    }
  });

  // Reject page mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ pageId, reason }: { pageId: string; reason: string }) => {
      const response = await fetch(`/api/pages/${pageId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          approverId: 'demo-approver', // In real app, get from auth
          reason 
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pages/pending-approval'] });
      setRejectionReason("");
      setSelectedPageForRejection(null);
    }
  });

  // Publish approved page mutation
  const publishMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/pages/${pageId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'Live' })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    }
  });

  const handleApprove = (pageId: string) => {
    approveMutation.mutate(pageId);
  };

  const handleReject = (pageId: string, reason: string) => {
    if (!reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    rejectMutation.mutate({ pageId, reason });
  };

  const handlePublish = (pageId: string) => {
    publishMutation.mutate(pageId);
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'Pending_Approval':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'Approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'Live':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Live</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  const stats = {
    pending: allPages?.filter(p => p.state === 'Pending_Approval').length || 0,
    approved: allPages?.filter(p => p.state === 'Approved').length || 0,
    rejected: allPages?.filter(p => p.state === 'Rejected').length || 0,
    live: allPages?.filter(p => p.state === 'Live').length || 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Dashboard</h1>
          <p className="text-muted-foreground">Review and approve pages awaiting publication</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Live Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.live}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Pages Awaiting Approval</CardTitle>
          <CardDescription>
            Review these pages and approve or reject them for publication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPending ? (
            <div className="text-center py-8 text-muted-foreground">Loading pending pages...</div>
          ) : !pendingPages || pendingPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pages pending approval
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPages.map((page) => (
                <div key={page.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{page.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>Type: {page.pageType}</span>
                        <span>•</span>
                        <span>Submitted: {new Date(page.submittedAt || page.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {getStatusBadge(page.state)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/preview/${page.id}`, '_blank')}
                      data-testid={`button-preview-${page.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    
                    <Button
                      onClick={() => handleApprove(page.id)}
                      disabled={approveMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-approve-${page.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setSelectedPageForRejection(page.id)}
                          data-testid={`button-reject-${page.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Page: {page.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejectionReason">Reason for rejection</Label>
                            <Textarea
                              id="rejectionReason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Explain why this page is being rejected..."
                              className="mt-1"
                              data-testid="textarea-rejection-reason"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleReject(page.id, rejectionReason)}
                              disabled={rejectMutation.isPending || !rejectionReason.trim()}
                              variant="destructive"
                              data-testid="button-confirm-reject"
                            >
                              Reject Page
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRejectionReason("");
                                setSelectedPageForRejection(null);
                              }}
                              data-testid="button-cancel-reject"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Pages Ready to Publish */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Pages Ready to Publish</CardTitle>
          <CardDescription>
            These pages have been approved and can be published live
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPages?.filter(p => p.state === 'Approved').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved pages ready to publish
            </div>
          ) : (
            <div className="space-y-4">
              {allPages?.filter(p => p.state === 'Approved').map((page) => (
                <div key={page.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{page.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>Type: {page.pageType}</span>
                      </div>
                    </div>
                    {getStatusBadge(page.state)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/preview/${page.id}`, '_blank')}
                      data-testid={`button-preview-approved-${page.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    
                    <Button
                      onClick={() => handlePublish(page.id)}
                      disabled={publishMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-publish-${page.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Publish Live
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}