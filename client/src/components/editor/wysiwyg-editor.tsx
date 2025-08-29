import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, Image, MousePointer, FileText } from "lucide-react";

export default function WYSIWYGEditor() {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      <div>
        <h3 className="font-medium text-slate-900 mb-3">Components</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="p-3 h-auto flex-col"
          >
            <Type className="h-5 w-5 text-slate-500 mb-1" />
            <span className="text-xs text-slate-600">Text</span>
          </Button>
          <Button
            variant="outline"
            className="p-3 h-auto flex-col"
          >
            <Image className="h-5 w-5 text-slate-500 mb-1" />
            <span className="text-xs text-slate-600">Image</span>
          </Button>
          <Button
            variant="outline"
            className="p-3 h-auto flex-col"
          >
            <MousePointer className="h-5 w-5 text-slate-500 mb-1" />
            <span className="text-xs text-slate-600">Button</span>
          </Button>
          <Button
            variant="outline"
            className="p-3 h-auto flex-col"
          >
            <FileText className="h-5 w-5 text-slate-500 mb-1" />
            <span className="text-xs text-slate-600">Form</span>
          </Button>
        </div>
      </div>
      
      {/* Style Panel */}
      <div>
        <h3 className="font-medium text-slate-900 mb-3">Selected Element</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="fontSize" className="text-xs font-medium text-slate-600">Font Size</Label>
            <Select defaultValue="16">
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12px</SelectItem>
                <SelectItem value="14">14px</SelectItem>
                <SelectItem value="16">16px</SelectItem>
                <SelectItem value="18">18px</SelectItem>
                <SelectItem value="24">24px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="textColor" className="text-xs font-medium text-slate-600">Text Color</Label>
            <Input 
              id="textColor"
              type="color" 
              defaultValue="#334155" 
              className="w-full h-8 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="backgroundColor" className="text-xs font-medium text-slate-600">Background</Label>
            <Input 
              id="backgroundColor"
              type="color" 
              defaultValue="#ffffff" 
              className="w-full h-8 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="padding" className="text-xs font-medium text-slate-600">Padding</Label>
            <Input 
              id="padding"
              type="range" 
              min="0" 
              max="50" 
              defaultValue="16" 
              className="w-full mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
