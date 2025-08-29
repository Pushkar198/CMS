import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { usePages, useStats, type Stats } from "@/hooks/use-pages";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, Globe, File, Clock, Trash2 } from "lucide-react";

interface ExportOptions {
  format: 'static' | 'zip' | 'cdn';
  siteName: string;
  exportDirectory: string;
  includeLiveOnly: boolean;
  generateSitemap: boolean;
  minifyAssets: boolean;
  includeMedia: boolean;
}

export default function Export() {
  const { data: pages } = usePages();
  const { data: stats } = useStats();
  const { toast } = useToast();

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'static',
    siteName: 'my-ai-website',
    exportDirectory: '/exports/my-ai-website',
    includeLiveOnly: true,
    generateSitemap: true,
    minifyAssets: false,
    includeMedia: true,
  });

  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const res = await apiRequest("POST", "/api/export", options);
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Export successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Export failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export site",
        variant: "destructive",
      });
    },
  });

  const livePages = pages?.filter(p => p.state === 'Live') || [];
  const pagesToShow = exportOptions.includeLiveOnly ? livePages : pages || [];

  const handlePageToggle = (pageId: string, checked: boolean) => {
    const newSelected = new Set(selectedPages);
    if (checked) {
      newSelected.add(pageId);
    } else {
      newSelected.delete(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleExport = () => {
    exportMutation.mutate(exportOptions);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-inter">
              Export & Publish
            </h1>
            <p className="text-gray-600 mt-2 font-medium">Generate and deploy your static website</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
              Last export: <span className="font-semibold text-gray-900">Never</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Export Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block">Export Format</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'static', title: 'Static HTML', desc: 'HTML/CSS/JS files' },
                    { value: 'zip', title: 'ZIP Archive', desc: 'Compressed download' },
                    { value: 'cdn', title: 'CDN Ready', desc: 'Optimized for hosting' },
                  ].map((format) => (
                    <Label
                      key={format.value}
                      className="flex items-center p-3 border border-slate-300 rounded-lg hover:border-primary cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="export-format"
                        value={format.value}
                        checked={exportOptions.format === format.value}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                        className="text-primary focus:ring-primary mr-3"
                      />
                      <div>
                        <div className="font-medium text-slate-900">{format.title}</div>
                        <div className="text-xs text-slate-500">{format.desc}</div>
                      </div>
                    </Label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName" className="text-sm font-medium text-slate-700">Site Name</Label>
                  <Input
                    id="siteName"
                    value={exportOptions.siteName}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, siteName: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="exportDir" className="text-sm font-medium text-slate-700">Export Directory</Label>
                  <Input
                    id="exportDir"
                    value={exportOptions.exportDirectory}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, exportDirectory: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="liveOnly"
                    checked={exportOptions.includeLiveOnly}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeLiveOnly: checked as boolean }))}
                  />
                  <Label htmlFor="liveOnly" className="text-sm text-slate-700">
                    Include Live pages only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sitemap"
                    checked={exportOptions.generateSitemap}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, generateSitemap: checked as boolean }))}
                  />
                  <Label htmlFor="sitemap" className="text-sm text-slate-700">
                    Generate sitemap.xml
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minify"
                    checked={exportOptions.minifyAssets}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, minifyAssets: checked as boolean }))}
                  />
                  <Label htmlFor="minify" className="text-sm text-slate-700">
                    Minify CSS and JavaScript
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="media"
                    checked={exportOptions.includeMedia}
                    onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeMedia: checked as boolean }))}
                  />
                  <Label htmlFor="media" className="text-sm text-slate-700">
                    Include media files
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pages to Export */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Pages to Export</CardTitle>
            </CardHeader>
            <CardContent>
              {pagesToShow.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No pages available for export.
                </div>
              ) : (
                <div className="space-y-3">
                  {pagesToShow.map((page) => (
                    <Label
                      key={page.id}
                      className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPages.has(page.id)}
                        onCheckedChange={(checked) => handlePageToggle(page.id, checked as boolean)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-900">{page.name}</div>
                            <div className="text-sm text-slate-500">/{page.name.toLowerCase().replace(/\s+/g, '-')}.html</div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            page.state === 'Live' ? 'bg-green-100 text-green-800' :
                            page.state === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1 h-1 rounded-full mr-1 ${
                              page.state === 'Live' ? 'bg-green-500' :
                              page.state === 'Draft' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            {page.state}
                          </span>
                        </div>
                      </div>
                    </Label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">Ready to Export</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedPages.size} pages selected • 
                    {stats?.mediaFiles || 0} media files • 
                    Estimated size: 2.3 MB
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const livePages = pages?.filter(p => p.state === 'Live') || [];
                      if (livePages.length === 0) {
                        toast({
                          title: "No live pages",
                          description: "You need to publish at least one page to preview your site",
                          variant: "destructive",
                        });
                      } else if (livePages.length === 1) {
                        window.open(`/preview/${livePages[0].id}`, '_blank');
                      } else {
                        // Show a list of live pages to choose from
                        toast({
                          title: "Multiple live pages",
                          description: "Click preview buttons in the dashboard to view individual pages",
                        });
                      }
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button 
                    onClick={handleExport}
                    disabled={exportMutation.isPending || selectedPages.size === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export Site'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                No exports yet. Create your first export above!
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
