import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TextArea } from "./ui-kit";

export function RejectDialog({ onReject, pending, label = "Reject" }: { onReject: (reason: string) => void; pending?: boolean | undefined; label?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 10;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">{label}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reason for rejection</DialogTitle>
          <DialogDescription>The applicant will see this message. Be specific and constructive.</DialogDescription>
        </DialogHeader>
        <label htmlFor="reject-reason" className="sr-only">Reason</label>
        <TextArea id="reject-reason" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
        {!valid && reason.length > 0 && <p className="text-sm text-destructive">Please write at least 10 characters.</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!valid || pending} onClick={() => { onReject(reason.trim()); setOpen(false); setReason(""); }}>Reject</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
