import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUploadHTML, type HTMLUploadData } from "@/hooks/use-html-upload";
import { useImportWebsite, type WebsiteImportData } from "@/hooks/use-website-import";
import { Sparkles, Info, Clock, Zap, Code, Eye, Edit, RotateCcw, Upload, FileText, Globe, Package, FolderOpen } from "lucide-react";

interface GenerationRequest {
  prompt: string;
  pageType: string;
  pageName: string;
  options: {
    colorScheme?: string;
    layoutStyle?: string;
    includeResponsive?: boolean;
    includeInteractive?: boolean;
    includeSEO?: boolean;
  };
}

interface ManualUploadData {
  name: string;
  pageType: string;
  state: string;
  html: string;
  css: string;
  js: string;
}

export default function AIGenerator() {
  const [formData, setFormData] = useState<GenerationRequest>({
    prompt: "",
    pageType: "landing",
    pageName: "",
    options: {
      includeResponsive: true,
      includeSEO: true,
    }
  });

  const [uploadData, setUploadData] = useState<ManualUploadData>({
    name: "",
    pageType: "landing",
    state: "Draft",
    html: "",
    css: "",
    js: ""
  });

  const [htmlUploadData, setHtmlUploadData] = useState<HTMLUploadData>({
    name: "",
    pageType: "custom",
    state: "Draft"
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [websiteImportData, setWebsiteImportData] = useState<WebsiteImportData>({
    projectName: ""
  });

  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: generations } = useQuery<any[]>({
    queryKey: ["/api/generations"],
  });

  const htmlUploadMutation = useUploadHTML();
  const websiteImportMutation = useImportWebsite();

  const generateMutation = useMutation({
    mutationFn: async (data: GenerationRequest) => {
      const res = await apiRequest("POST", "/api/generate", data);
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Page generated successfully!",
        description: `"${result.page.name}" has been created.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/generations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      // Reset form
      setFormData({
        prompt: "",
        pageType: "landing",
        pageName: "",
        options: {
          includeResponsive: true,
          includeSEO: true,
        }
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate page",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: ManualUploadData) => {
      // Create a simple thumbnail
      const thumbnail = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="150" fill="#f3f4f6"/>
          <rect x="20" y="20" width="160" height="30" fill="#6366f1"/>
          <text x="100" y="40" font-family="Arial" font-size="14" fill="white" text-anchor="middle">${data.name}</text>
          <rect x="20" y="70" width="160" height="60" fill="#white" stroke="#e5e7eb"/>
          <text x="100" y="105" font-family="Arial" font-size="12" fill="#6b7280" text-anchor="middle">Custom Upload</text>
        </svg>
      `)}`;

      const pageData = {
        ...data,
        thumbnail
      };

      const res = await apiRequest("POST", "/api/pages", pageData);
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Page created successfully!",
        description: `"${result.name}" has been created from your upload.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      // Reset form
      setUploadData({
        name: "",
        pageType: "landing",
        state: "Draft",
        html: "",
        css: "",
        js: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to create page from upload",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!formData.prompt.trim() || !formData.pageName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a page name and description.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(formData);
  };

  const handleUpload = () => {
    if (!uploadData.name.trim() || !uploadData.html.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a page name and HTML content.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(uploadData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/html') {
      setSelectedFile(file);
      // Auto-fill name from filename if not set
      if (!htmlUploadData.name) {
        setHtmlUploadData(prev => ({
          ...prev,
          name: file.name.replace('.html', '')
        }));
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an HTML file.",
        variant: "destructive",
      });
    }
  };

  const handleHTMLUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an HTML file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await htmlUploadMutation.mutateAsync({
        file: selectedFile,
        uploadData: htmlUploadData
      });

      toast({
        title: "HTML file uploaded successfully!",
        description: result.message,
      });

      // Reset form
      setSelectedFile(null);
      setHtmlUploadData({
        name: "",
        pageType: "custom",
        state: "Draft"
      });

      // Clear file input
      const fileInput = document.getElementById('html-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload HTML file",
        variant: "destructive",
      });
    }
  };

  const handleZipFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/zip' || file.type === 'application/x-zip-compressed')) {
      setSelectedZipFile(file);
      // Auto-fill project name from filename if not set
      if (!websiteImportData.projectName) {
        setWebsiteImportData(prev => ({
          ...prev,
          projectName: file.name.replace('.zip', '')
        }));
      }
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a ZIP file containing your website.",
        variant: "destructive",
      });
    }
  };

  const handleWebsiteImport = async () => {
    if (!selectedZipFile) {
      toast({
        title: "No file selected",
        description: "Please select a ZIP file to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await websiteImportMutation.mutateAsync({
        file: selectedZipFile,
        importData: websiteImportData
      });

      toast({
        title: "Website imported successfully!",
        description: result.message,
      });

      // Reset form
      setSelectedZipFile(null);
      setWebsiteImportData({
        projectName: ""
      });

      // Clear file input
      const fileInput = document.getElementById('zip-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import website",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-inter">
              AI Page Generator
            </h1>
            <p className="text-gray-600 mt-2 font-medium">Create stunning pages with PWC's AI-powered platform</p>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            PWC GenAI Connected
          </Badge>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tabs for generation methods */}
          <Tabs defaultValue="ai-generate" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai-generate" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Generation
              </TabsTrigger>
              <TabsTrigger value="manual-upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Manual Upload
              </TabsTrigger>
              <TabsTrigger value="html-upload" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                HTML Upload
              </TabsTrigger>
              <TabsTrigger value="website-import" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Website Import
              </TabsTrigger>
            </TabsList>

            {/* AI Generation Tab */}
            <TabsContent value="ai-generate">
              <Card>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="text-xl font-bold text-gray-900">Generate with AI</CardTitle>
                  <p className="text-sm text-gray-600 font-medium">Use PWC GenAI to generate complete pages from descriptions</p>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Page Type</label>
                  <Select 
                    value={formData.pageType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, pageType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="contact">Contact Form</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="analytics">Analytics Page</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Page Name</label>
                  <Input
                    placeholder="Enter page name"
                    value={formData.pageName}
                    onChange={(e) => setFormData(prev => ({ ...prev, pageName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description & Requirements
                  <span className="text-xs text-slate-500 ml-1">(Be specific for better results)</span>
                </label>
                <Textarea
                  rows={6}
                  placeholder="Describe what you want the page to include...

Example: Create a modern landing page for a SaaS product with:
- Hero section with compelling headline
- Feature showcase with icons
- Pricing table with 3 tiers
- Customer testimonials
- Contact form in footer
- Blue and white color scheme
- Mobile responsive design"
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                />
              </div>

              {/* Advanced Options */}
              <details className="border border-slate-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-slate-700 hover:bg-slate-50">
                  Advanced Options
                </summary>
                <div className="p-4 border-t border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Color Scheme</label>
                      <Input
                        placeholder="e.g., blue and white, dark theme"
                        value={formData.options.colorScheme || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, colorScheme: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Layout Style</label>
                      <Select 
                        value={formData.options.layoutStyle || ""} 
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, layoutStyle: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="responsive"
                        checked={formData.options.includeResponsive || false}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, includeResponsive: checked as boolean }
                        }))}
                      />
                      <label htmlFor="responsive" className="text-sm text-slate-700">
                        Include responsive design
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="interactive"
                        checked={formData.options.includeInteractive || false}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, includeInteractive: checked as boolean }
                        }))}
                      />
                      <label htmlFor="interactive" className="text-sm text-slate-700">
                        Include interactive elements
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seo"
                        checked={formData.options.includeSEO || false}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          options: { ...prev.options, includeSEO: checked as boolean }
                        }))}
                      />
                      <label htmlFor="seo" className="text-sm text-slate-700">
                        Include SEO optimization
                      </label>
                    </div>
                  </div>
                </div>
              </details>

              <Button 
                onClick={handleGenerate} 
                className="w-full" 
                disabled={generateMutation.isPending}
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Page...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Page with AI
                  </>
                )}
              </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Upload Tab */}
            <TabsContent value="manual-upload">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Manual Upload</CardTitle>
                  <p className="text-sm text-slate-500">Upload your own HTML, CSS, and JavaScript code</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="upload-name">Page Name</Label>
                      <Input
                        id="upload-name"
                        placeholder="Enter page name"
                        value={uploadData.name}
                        onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="upload-type">Page Type</Label>
                      <Select 
                        value={uploadData.pageType} 
                        onValueChange={(value) => setUploadData(prev => ({ ...prev, pageType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landing">Landing Page</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="contact">Contact Form</SelectItem>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="portfolio">Portfolio</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="upload-state">Page State</Label>
                    <Select 
                      value={uploadData.state} 
                      onValueChange={(value) => setUploadData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Live">Live</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="upload-html">HTML Content *</Label>
                    <Textarea
                      id="upload-html"
                      rows={8}
                      placeholder="Paste your HTML code here..."
                      value={uploadData.html}
                      onChange={(e) => setUploadData(prev => ({ ...prev, html: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="upload-css">CSS Styles (optional)</Label>
                    <Textarea
                      id="upload-css"
                      rows={6}
                      placeholder="Paste your CSS code here..."
                      value={uploadData.css}
                      onChange={(e) => setUploadData(prev => ({ ...prev, css: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="upload-js">JavaScript (optional)</Label>
                    <Textarea
                      id="upload-js"
                      rows={4}
                      placeholder="Paste your JavaScript code here..."
                      value={uploadData.js}
                      onChange={(e) => setUploadData(prev => ({ ...prev, js: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button 
                    onClick={handleUpload} 
                    className="w-full" 
                    disabled={uploadMutation.isPending}
                    size="lg"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Page...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Create Page from Upload
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HTML Upload Tab */}
            <TabsContent value="html-upload">
              <Card>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="text-xl font-bold text-gray-900">Upload HTML File</CardTitle>
                  <p className="text-sm text-gray-600 font-medium">Upload an existing HTML file and convert it to a manageable page</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="html-page-name">Page Name</Label>
                      <Input
                        id="html-page-name"
                        placeholder="Enter page name (auto-filled from filename)"
                        value={htmlUploadData.name}
                        onChange={(e) => setHtmlUploadData(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="input-html-page-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="html-page-type">Page Type</Label>
                      <Select 
                        value={htmlUploadData.pageType} 
                        onValueChange={(value) => setHtmlUploadData(prev => ({ ...prev, pageType: value }))}
                      >
                        <SelectTrigger data-testid="select-html-page-type">
                          <SelectValue placeholder="Select page type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="landing">Landing Page</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="blog">Blog</SelectItem>
                          <SelectItem value="portfolio">Portfolio</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="html-file-input">HTML File</Label>
                    <div className="mt-2">
                      <input
                        id="html-file-input"
                        type="file"
                        accept=".html,text/html"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                        data-testid="input-html-file"
                      />
                      {selectedFile && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm text-green-800 font-medium">{selectedFile.name}</span>
                            <span className="text-sm text-green-600 ml-2">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="html-initial-state">Initial State</Label>
                    <Select 
                      value={htmlUploadData.state} 
                      onValueChange={(value) => setHtmlUploadData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger data-testid="select-html-initial-state">
                        <SelectValue placeholder="Select initial state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">What happens when you upload?</h4>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>• HTML structure is extracted and cleaned</li>
                          <li>• CSS styles are consolidated from &lt;style&gt; tags and linked files</li>
                          <li>• JavaScript is extracted from &lt;script&gt; tags</li>
                          <li>• Page becomes available in the Flow Editor for linking</li>
                          <li>• All existing page management features are enabled</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleHTMLUpload} 
                    className="w-full" 
                    disabled={htmlUploadMutation.isPending || !selectedFile}
                    size="lg"
                    data-testid="button-upload-html"
                  >
                    {htmlUploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing HTML...
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Convert HTML to Page
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Website Import Tab */}
            <TabsContent value="website-import">
              <Card>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="text-xl font-bold text-gray-900">Import Website Project</CardTitle>
                  <p className="text-sm text-gray-600 font-medium">Upload a ZIP file containing multiple HTML pages and manage them as a project</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="Enter project name (auto-filled from ZIP filename)"
                      value={websiteImportData.projectName}
                      onChange={(e) => setWebsiteImportData(prev => ({ ...prev, projectName: e.target.value }))}
                      data-testid="input-project-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip-file-input">Website ZIP File</Label>
                    <div className="mt-2">
                      <input
                        id="zip-file-input"
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        onChange={handleZipFileUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                        data-testid="input-zip-file"
                      />
                      {selectedZipFile && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm text-green-800 font-medium">{selectedZipFile.name}</span>
                            <span className="text-sm text-green-600 ml-2">({(selectedZipFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Website Import Process</h4>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>• Extracts all HTML files from your ZIP archive</li>
                          <li>• Processes CSS and JavaScript from each page</li>
                          <li>• Creates individual manageable pages</li>
                          <li>• Preserves file structure and relationships</li>
                          <li>• All pages are available for linking in Flow Editor</li>
                          <li>• Supports folders and nested HTML structures</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex">
                      <FolderOpen className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-900">Supported ZIP Structure</h4>
                        <div className="text-sm text-amber-700 mt-1">
                          <p>Your ZIP file can contain:</p>
                          <ul className="mt-2 space-y-1 ml-4">
                            <li>• index.html, about.html, contact.html (root level)</li>
                            <li>• css/ folder with stylesheets</li>
                            <li>• js/ folder with JavaScript files</li>
                            <li>• images/ folder with assets</li>
                            <li>• pages/ subfolder with additional HTML files</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleWebsiteImport} 
                    className="w-full" 
                    disabled={websiteImportMutation.isPending || !selectedZipFile}
                    size="lg"
                    data-testid="button-import-website"
                  >
                    {websiteImportMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing Website...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Import Website Project
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generation History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Generations</CardTitle>
            </CardHeader>
            <CardContent>
              {!generations || generations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No generations yet. Create your first AI-generated page above!
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {generations.map((generation: any) => (
                    <div key={generation.id} className="py-6 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-medium text-slate-900 mr-3">
                              {generation.pageId ? `Page Generated` : generation.pageType}
                            </h3>
                            <Badge className={
                              generation.status === 'completed' ? 'bg-green-100 text-green-800' :
                              generation.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {generation.status === 'completed' && <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>}
                              {generation.status === 'failed' && <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>}
                              {generation.status === 'processing' && <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></div>}
                              {generation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {generation.prompt}
                          </p>
                          <div className="flex items-center text-xs text-slate-500 space-x-4">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(generation.createdAt).toLocaleString()}
                            </span>
                            {generation.duration && (
                              <span className="flex items-center">
                                <Zap className="h-3 w-3 mr-1" />
                                Generated in {(generation.duration / 1000).toFixed(1)}s
                              </span>
                            )}
                            {generation.status === 'completed' && (
                              <span className="flex items-center">
                                <Code className="h-3 w-3 mr-1" />
                                HTML, CSS & JS
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {generation.status === 'completed' && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Eye className="mr-1 h-3 w-3" />
                                Preview
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm">
                                <RotateCcw className="mr-1 h-3 w-3" />
                                Regenerate
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
