import { Handle, Position } from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Home, BarChart3, FileText } from "lucide-react";
import type { Page } from "@shared/schema";

interface FlowNodeProps {
  data: {
    page: Page;
  };
}

export default function FlowNode({ data }: FlowNodeProps) {
  const { page } = data;

  const getStateColor = (state: string) => {
    switch (state) {
      case "Live":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIcon = (pageType: string) => {
    switch (pageType) {
      case "landing":
        return <Home className="h-4 w-4 text-green-600" />;
      case "dashboard":
        return <BarChart3 className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4 w-64 hover:border-primary transition-colors">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-300" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
            {getIcon(page.pageType)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{page.name}</h3>
            <Badge className={`${getStateColor(page.state)} text-xs mt-1`}>
              {page.state}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Thumbnail preview */}
      <div className="bg-slate-100 rounded-lg p-3 mb-3">
        {page.thumbnail ? (
          <img 
            src={page.thumbnail} 
            alt={`${page.name} preview`}
            className="w-full h-16 object-cover rounded"
          />
        ) : (
          <div className="bg-slate-200 rounded h-16 mb-2 flex items-center justify-center">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
        )}
        <div className="space-y-1 mt-2">
          <div className="bg-slate-300 rounded h-2 w-3/4"></div>
          <div className="bg-slate-300 rounded h-2 w-1/2"></div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>Created {new Date(page.createdAt).toLocaleDateString()}</span>
        <span>0 connections</span>
      </div>
    </div>
  );
}
