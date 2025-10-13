import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UrlKeyAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UrlKeyAlertDialog({ open, onOpenChange, onConfirm, onCancel }: UrlKeyAlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔐 URL Key Wallet Alert</DialogTitle>
          <DialogDescription>
            You are using a URL-based private key wallet for signing. This is intended for development testing only.
            <br /><br />
            <strong>⚠️ Security Warning:</strong> Never use real private keys in URLs on production sites.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Proceed with Signing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}