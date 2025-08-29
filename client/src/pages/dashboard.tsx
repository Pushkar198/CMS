import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePages, useStats, useDeletePage, useUpdatePageState, type Stats } from "@/hooks/use-pages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Globe, Plus, Search, FileText, Eye, PencilIcon, Trash2, CheckCircle, Play, StopCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: pages, isLoading: pagesLoading } = usePages();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { mutate: deletePage } = useDeletePage();
  const { mutate: updatePageState } = useUpdatePageState();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  // Submit for approval mutation
  const submitForApprovalMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await fetch(`/api/pages/${pageId}/submit-for-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    }
  });

  const filteredPages = pages?.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(search.toLowerCase());
    const matchesState = stateFilter === "all" || page.state.toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesState;
  });

  const handleDeletePage = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deletePage(id, {
        onSuccess: () => {
          toast({
            title: "Page deleted",
            description: `"${name}" has been deleted successfully.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete page.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleStateChange = (id: string, name: string, newState: 'Draft' | 'Live' | 'Expired') => {
    const stateActions = {
      'Live': 'publish',
      'Draft': 'move to draft',
      'Expired': 'expire'
    };
    
    const action = stateActions[newState];
    if (window.confirm(`Are you sure you want to ${action} "${name}"?`)) {
      updatePageState({ id, state: newState }, {
        onSuccess: () => {
          toast({
            title: "Page updated",
            description: `"${name}" has been ${newState === 'Live' ? 'published' : newState === 'Draft' ? 'moved to draft' : 'expired'} successfully.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: `Failed to ${action} page.`,
            variant: "destructive",
          });
        }
      });
    }
  };

  const submitForApproval = (pageId: string) => {
    const page = pages?.find(p => p.id === pageId);
    if (window.confirm(`Submit "${page?.name}" for approval?`)) {
      submitForApprovalMutation.mutate(pageId, {
        onSuccess: () => {
          toast({
            title: "Page submitted",
            description: `"${page?.name}" has been submitted for approval.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to submit page for approval.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "Live":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Pending_Approval":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Approved":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
      case "Rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "Expired":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-inter">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2 font-medium">Manage your AI-generated pages and site structure</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={() => {
                const livePages = pages?.filter(p => p.state === 'Live') || [];
                if (livePages.length === 0) {
                  toast({
                    title: "No published pages",
                    description: "Create and publish pages first to view your site",
                    variant: "destructive",
                  });
                } else {
                  window.open(`/preview/${livePages[0].id}`, '_blank');
                }
              }}
            >
              <Globe className="mr-2 h-4 w-4" />
              View Site
            </Button>
            <Link href="/ai-generator">
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Generate Page
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Total Pages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? "..." : stats?.totalPages || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Live Pages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? "..." : stats?.livePages || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Eye className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Draft Pages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? "..." : stats?.draftPages || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-secondary to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <PencilIcon className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Media Files</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? "..." : stats?.mediaFiles || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pages Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">Recent Pages</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    placeholder="Search pages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-3 border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {pagesLoading ? (
              <div className="p-6">Loading pages...</div>
            ) : !filteredPages || filteredPages.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                {search || stateFilter !== "all" ? "No pages match your filters." : "No pages created yet."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Page Name</th>
                      <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">State</th>
                      <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Created</th>
                      <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Publish Date</th>
                      <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-slate-200 rounded-lg mr-3 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{page.name}</p>
                              <p className="text-sm text-slate-500">AI Generated</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={getStateColor(page.state)}>
                            {page.state}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500">
                          {formatDistanceToNow(new Date(page.createdAt), { addSuffix: true })}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500">
                          {page.publishAt ? new Date(page.publishAt).toLocaleDateString() : "Not scheduled"}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {/* Quick State Actions */}
                            {page.state === 'Draft' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => submitForApproval(page.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Submit for Approval"
                                data-testid={`button-submit-${page.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {page.state === 'Approved' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleStateChange(page.id, page.name, 'Live')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Publish Live"
                                data-testid={`button-publish-${page.id}`}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {page.state === 'Live' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleStateChange(page.id, page.name, 'Draft')}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                title="Move to Draft"
                              >
                                <StopCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Standard Actions */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Preview"
                              onClick={() => {
                                if (page.state === 'Live') {
                                  window.open(`/preview/${page.id}`, '_blank');
                                } else {
                                  toast({
                                    title: "Cannot preview",
                                    description: "Page must be published (Live) to preview",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* More Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Edit Page
                                </DropdownMenuItem>
                                
                                {/* State Change Options */}
                                {page.state !== 'Live' && (
                                  <DropdownMenuItem onClick={() => handleStateChange(page.id, page.name, 'Live')}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Publish Live
                                  </DropdownMenuItem>
                                )}
                                {page.state !== 'Draft' && (
                                  <DropdownMenuItem onClick={() => handleStateChange(page.id, page.name, 'Draft')}>
                                    <PencilIcon className="mr-2 h-4 w-4" />
                                    Move to Draft
                                  </DropdownMenuItem>
                                )}
                                {page.state !== 'Expired' && (
                                  <DropdownMenuItem onClick={() => handleStateChange(page.id, page.name, 'Expired')}>
                                    <StopCircle className="mr-2 h-4 w-4" />
                                    Mark as Expired
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePage(page.id, page.name)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Page
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
