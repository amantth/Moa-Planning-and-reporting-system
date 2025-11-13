import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onForceDelete?: () => void;
  title: string;
  description: string;
  itemName: string;
  isLoading?: boolean;
  dependencies?: string[];
  warningMessage?: string;
  allowForceDelete?: boolean;
}

export const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  onForceDelete,
  title,
  description,
  itemName,
  isLoading = false,
  dependencies = [],
  warningMessage,
  allowForceDelete = false,
}: DeleteConfirmationDialogProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const hasDependencies = dependencies.length > 0;

  const handleConfirm = () => {
    if (hasDependencies && !confirmed) {
      setConfirmed(true);
      return;
    }
    onConfirm();
    setConfirmed(false);
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <p className="font-medium">Item to delete:</p>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">
              {itemName}
            </p>
          </div>

          {hasDependencies && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
              <p className="font-medium text-destructive mb-2">
                ⚠️ Warning: This item is being used
              </p>
              <ul className="text-sm text-destructive space-y-1">
                {dependencies.map((dep, index) => (
                  <li key={index}>• {dep}</li>
                ))}
              </ul>
              {warningMessage && (
                <p className="text-sm text-destructive mt-2 font-medium">
                  {warningMessage}
                </p>
              )}
            </div>
          )}

          {hasDependencies && !confirmed && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Deleting this item may cause data integrity issues. Please ensure you understand the consequences.
              </p>
            </div>
          )}

          {hasDependencies && confirmed && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ You are about to force delete this item despite dependencies. This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          
          {hasDependencies && allowForceDelete && onForceDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onForceDelete();
                setConfirmed(false);
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Force Delete (Remove All Dependencies)
            </Button>
          )}
          
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasDependencies && !confirmed
              ? "I Understand, Continue"
              : confirmed
              ? "Delete Anyway"
              : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
