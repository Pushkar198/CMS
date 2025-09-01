import { useState } from 'react';
import { format } from 'date-fns';
import { usePageVersions, useRollbackToVersion } from '@/hooks/use-versions';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
  CheckCircle,
} from 'lucide-react';

interface VersionHistoryProps {
  pageId: string;
  pageName: string;
  onVersionRollback?: () => void;
}

export function VersionHistory({ pageId, pageName, onVersionRollback }: VersionHistoryProps) {
  const { user } = useAuth();
  const { data: versions, isLoading, error } = usePageVersions(pageId);
  const rollbackMutation = useRollbackToVersion();

  const canRollback = user && ['checker', 'admin'].includes(user.role);

  const handleRollback = async (versionId: string) => {
    try {
      await rollbackMutation.mutateAsync({ pageId, versionId });
      onVersionRollback?.();
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>Failed to load version history</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History for "{pageName}"
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rollbackMutation.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {rollbackMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {rollbackMutation.isSuccess && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Page rolled back successfully! The page is now in Draft state for review.
            </AlertDescription>
          </Alert>
        )}

        {!versions || versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No version history available for this page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        v{version.versionNumber}
                      </div>
                      {index < versions.length - 1 && (
                        <div className="w-px h-8 bg-gray-200 mt-2" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{version.name}</h4>
                        {index === 0 && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            Latest
                          </Badge>
                        )}
                        <Badge variant={version.state === 'Live' ? 'default' : 'secondary'}>
                          {version.state}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {version.createdBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            User
                          </div>
                        )}
                      </div>
                      
                      {version.changeDescription && (
                        <div className="flex items-start gap-1 text-sm text-gray-600">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{version.changeDescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {canRollback && index > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rollbackMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Rollback
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to rollback "{pageName}" to version {version.versionNumber}?
                            <br /><br />
                            This will:
                            <ul className="list-disc pl-5 mt-2">
                              <li>Create a backup of the current version</li>
                              <li>Restore the content from version {version.versionNumber}</li>
                              <li>Set the page state to Draft for review</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRollback(version.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Rollback to v{version.versionNumber}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}