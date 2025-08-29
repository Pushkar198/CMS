import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePages } from "@/hooks/use-pages";
import WYSIWYGEditor from "@/components/editor/wysiwyg-editor";
import { Undo, Redo } from "lucide-react";

export default function PageEditor() {
  const { data: pages } = usePages();
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const selectedPage = pages?.find(p => p.id === selectedPageId);

  return (
    <div className="flex-1 flex">
      {/* Editor Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Page Editor</h2>
          <p className="text-sm text-slate-500 mt-1">Modify AI-generated content</p>
        </div>
        
        {/* Page Selection */}
        <div className="p-4 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Current Page</label>
          <Select value={selectedPageId} onValueChange={setSelectedPageId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a page to edit" />
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
        
        <WYSIWYGEditor />
        
        <div className="p-4 border-t border-slate-200">
          <Button className="w-full">
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* Editor Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              Desktop
            </Button>
            <Button 
              variant={viewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tablet')}
            >
              Tablet
            </Button>
            <Button 
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              Mobile
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Redo">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 bg-slate-200 p-8 overflow-auto">
          {selectedPage ? (
            <div 
              className={`bg-white shadow-xl rounded-lg mx-auto min-h-96 ${
                viewMode === 'desktop' ? 'max-w-4xl' : 
                viewMode === 'tablet' ? 'max-w-2xl' :
                'max-w-sm'
              }`}
            >
              <div 
                className="p-8"
                dangerouslySetInnerHTML={{ __html: selectedPage.html }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 mb-2">No page selected</h3>
                <p className="text-slate-500">Select a page from the sidebar to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Live Preview Panel */}
      <div className="w-80 bg-white border-l border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Live Preview</h3>
          <p className="text-sm text-slate-500 mt-1">Real-time preview</p>
        </div>
        <div className="p-4">
          <div className="bg-slate-100 rounded-lg p-4 aspect-video">
            {selectedPage ? (
              <div className="bg-white rounded shadow p-3 text-xs h-full overflow-hidden">
                <iframe
                  srcDoc={`
                    <style>${selectedPage.css}</style>
                    ${selectedPage.html}
                    <script>${selectedPage.js}</script>
                  `}
                  className="w-full h-full border-0"
                  title="Live Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Select a page to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
