import React, { useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePages } from "@/hooks/use-pages";
import { useComponents, useCreateComponent, useAddComponentToPage } from "@/hooks/use-components";
import { useLinks, useCreateLink } from "@/hooks/use-links";
import FlowNode from "@/components/flow/flow-node";
import { ZoomIn, ZoomOut, Save, Plus, Component as ComponentIcon, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const nodeTypes = {
  pageNode: FlowNode,
};

export default function FlowEditor() {
  const { data: pages } = usePages();
  const { data: components } = useComponents();
  const { data: links } = useLinks();
  const { mutate: createComponent } = useCreateComponent();
  const { mutate: addComponentToPage } = useAddComponentToPage();
  const { mutate: createLink } = useCreateLink();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Component creation state
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [componentName, setComponentName] = useState("");
  const [componentSelector, setComponentSelector] = useState("");
  const [componentDescription, setComponentDescription] = useState("");
  
  // Component addition state
  const [targetPageId, setTargetPageId] = useState<string>("");
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  
  // Page linking state
  const [fromPageId, setFromPageId] = useState<string>("");
  const [toPageId, setToPageId] = useState<string>("");
  const [triggerText, setTriggerText] = useState("");
  const [linkType, setLinkType] = useState<"button" | "link">("button");

  // Generate nodes from pages data
  React.useEffect(() => {
    if (pages) {
      const generatedNodes = pages.map((page, index) => ({
        id: page.id,
        type: 'pageNode',
        position: { 
          x: 100 + (index % 3) * 350, 
          y: 100 + Math.floor(index / 3) * 250 
        },
        data: { page },
      }));
      setNodes(generatedNodes);
    }
  }, [pages, setNodes]);

  // Generate edges from page navigation links
  React.useEffect(() => {
    if (links) {
      const generatedEdges = links.map(link => ({
        id: link.id,
        source: link.fromPageId,
        target: link.toPageId,
        label: link.triggerText,
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        labelStyle: { fontSize: '12px', fontWeight: 'bold' },
        labelBgStyle: { fill: '#dbeafe', padding: '2px 4px', borderRadius: '4px' },
      }));

      setEdges(generatedEdges);
    }
  }, [links, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Function to extract component from page
  const extractComponent = async () => {
    if (!selectedPage || !componentName || !componentSelector) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const sourcePage = pages?.find(p => p.id === selectedPage);
    if (!sourcePage) {
      toast({
        title: "Page not found",
        description: "Selected page does not exist",
        variant: "destructive",
      });
      return;
    }

    // Extract component HTML (simplified version)
    const componentData = {
      name: componentName,
      sourcePageId: selectedPage,
      selector: componentSelector,
      html: `<div class="${componentName.toLowerCase().replace(/\s+/g, '-')}-component">
  <!-- Extracted from ${sourcePage.name} using selector: ${componentSelector} -->
  <div class="component-content">
    <!-- Component content would be extracted here -->
    <p>Reusable ${componentName} component</p>
  </div>
</div>`,
      css: `.${componentName.toLowerCase().replace(/\s+/g, '-')}-component {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #ffffff;
  margin: 1rem 0;
}

.${componentName.toLowerCase().replace(/\s+/g, '-')}-component .component-content {
  /* Component-specific styles */
}`,
      description: componentDescription,
    };

    createComponent(componentData, {
      onSuccess: () => {
        toast({
          title: "Component created",
          description: `"${componentName}" has been extracted successfully`,
        });
        setComponentName("");
        setComponentSelector("");
        setComponentDescription("");
        setSelectedPage("");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create component",
          variant: "destructive",
        });
      },
    });
  };

  // Function to add component to page
  const addComponentToTargetPage = async () => {
    if (!targetPageId || !selectedComponentId) {
      toast({
        title: "Missing selection",
        description: "Please select both a component and target page",
        variant: "destructive",
      });
      return;
    }

    const pageComponentData = {
      pageId: targetPageId,
      componentId: selectedComponentId,
      position: 0,
    };

    addComponentToPage(pageComponentData, {
      onSuccess: () => {
        const component = components?.find(c => c.id === selectedComponentId);
        const targetPage = pages?.find(p => p.id === targetPageId);
        toast({
          title: "Component added",
          description: `"${component?.name}" added to "${targetPage?.name}"`,
        });
        setTargetPageId("");
        setSelectedComponentId("");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add component to page",
          variant: "destructive",
        });
      },
    });
  };

  // Function to create page navigation link
  const createPageLink = async () => {
    if (!fromPageId || !toPageId || !triggerText) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields for the page link",
        variant: "destructive",
      });
      return;
    }

    const linkData = {
      fromPageId,
      toPageId,
      triggerText,
      linkType,
      fromElementId: `.${triggerText.toLowerCase().replace(/\s+/g, '-')}-trigger`,
    };

    createLink(linkData, {
      onSuccess: () => {
        const fromPage = pages?.find(p => p.id === fromPageId);
        const toPage = pages?.find(p => p.id === toPageId);
        toast({
          title: "Page link created",
          description: `"${triggerText}" on "${fromPage?.name}" now links to "${toPage?.name}"`,
        });
        setFromPageId("");
        setToPageId("");
        setTriggerText("");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create page link",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-inter">Page Flow Editor</h1>
            <p className="text-slate-500 mt-1">Visual page connections and navigation flow</p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ComponentIcon className="mr-2 h-4 w-4" />
                  Extract Component
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Extract Component from Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sourcePage">Source Page</Label>
                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages?.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="componentName">Component Name</Label>
                    <Input
                      id="componentName"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      placeholder="Header, Navigation, Footer..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="selector">CSS Selector</Label>
                    <Input
                      id="selector"
                      value={componentSelector}
                      onChange={(e) => setComponentSelector(e.target.value)}
                      placeholder=".header, #navigation, .card"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={componentDescription}
                      onChange={(e) => setComponentDescription(e.target.value)}
                      placeholder="Brief description of this component"
                      rows={2}
                    />
                  </div>
                  
                  <Button onClick={extractComponent} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Component
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Link2 className="mr-2 h-4 w-4" />
                  Create Page Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Navigation Link Between Pages</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fromPage">From Page (with clickable element)</Label>
                    <Select value={fromPageId} onValueChange={setFromPageId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages?.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="triggerText">Clickable Element Text</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="triggerText"
                        value={triggerText}
                        onChange={(e) => setTriggerText(e.target.value)}
                        placeholder="Settings, About, Contact..."
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          if (!fromPageId) {
                            alert('Please select a source page first');
                            return;
                          }
                          try {
                            const response = await fetch(`/api/pages/${fromPageId}/clickable-elements`);
                            const elements = await response.json();
                            
                            if (elements.length > 0) {
                              // Show all found elements for user to choose from
                              const elementTexts = elements.map((el: any) => `${el.text} (${el.type})`).join('\n');
                              const selectedIndex = prompt(
                                `Found ${elements.length} clickable elements:\n\n${elementTexts}\n\nEnter the number (1-${elements.length}) to select:`,
                                '1'
                              );
                              
                              if (selectedIndex && !isNaN(Number(selectedIndex))) {
                                const index = Number(selectedIndex) - 1;
                                if (index >= 0 && index < elements.length) {
                                  setTriggerText(elements[index].text);
                                  setLinkType(elements[index].type);
                                }
                              }
                            } else {
                              alert('No clickable elements found on this page. Try generating content with buttons or links first.');
                            }
                          } catch (error) {
                            console.error('Error extracting elements:', error);
                            alert('Failed to extract clickable elements. Please try again.');
                          }
                        }}
                      >
                        Auto-Extract
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click Auto-Extract to find all clickable elements from the selected page
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="linkType">Element Type</Label>
                    <Select value={linkType} onValueChange={(value: "button" | "link") => setLinkType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="button">Button</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="toPage">To Page (destination)</Label>
                    <Select value={toPageId} onValueChange={setToPageId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages?.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={createPageLink} className="w-full">
                    <Link2 className="mr-2 h-4 w-4" />
                    Create Navigation Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component to Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Component to Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="component">Component</Label>
                    <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a component" />
                      </SelectTrigger>
                      <SelectContent>
                        {components?.map((component) => (
                          <SelectItem key={component.id} value={component.id}>
                            {component.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="targetPage">Target Page</Label>
                    <Select value={targetPageId} onValueChange={setTargetPageId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages?.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={addComponentToTargetPage} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Component
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm">
              <ZoomOut className="mr-2 h-4 w-4" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm">
              <ZoomIn className="mr-2 h-4 w-4" />
              Zoom In
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/init-dummy-pages', { method: 'POST' });
                  const result = await response.json();
                  if (response.ok) {
                    // Refresh pages data
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error creating dummy pages:', error);
                }
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Test Pages
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Flow
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 p-4 overflow-y-auto">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Page Navigation Links</CardTitle>
            </CardHeader>
            <CardContent>
              {links && links.length > 0 ? (
                <div className="space-y-3">
                  {links.map((link) => {
                    const fromPage = pages?.find(p => p.id === link.fromPageId);
                    const toPage = pages?.find(p => p.id === link.toPageId);
                    return (
                      <div key={link.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium text-blue-900">{fromPage?.name}</span>
                          <span className="text-blue-600">→</span>
                          <span className="font-medium text-blue-900">{toPage?.name}</span>
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          Trigger: "{link.triggerText}" ({link.linkType})
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">
                  No page links created yet. Create navigation flows between your pages.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Available Components</CardTitle>
            </CardHeader>
            <CardContent>
              {components && components.length > 0 ? (
                <div className="space-y-2">
                  {components.map((component) => (
                    <div key={component.id} className="p-2 border border-slate-200 rounded-lg">
                      <div className="font-medium text-sm">{component.name}</div>
                      <div className="text-xs text-slate-500">
                        From: {pages?.find(p => p.id === component.sourcePageId)?.name}
                      </div>
                      {component.description && (
                        <div className="text-xs text-slate-600 mt-1">
                          {component.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">
                  No components created yet. Extract components from your pages to reuse them.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 bg-slate-100">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-100"
          >
            <Background color="#64748b" gap={20} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </>
  );
}
