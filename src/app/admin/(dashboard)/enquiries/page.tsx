"use client";

import { useEffect, useState } from "react";
import { getEnquiriesAdmin, updateEnquiryStatus } from "@/actions/enquiries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Awaited<ReturnType<typeof getEnquiriesAdmin>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnquiriesAdmin().then((data) => {
      setEnquiries(data);
      setLoading(false);
    });
  }, []);

  async function handleStatusChange(id: string, status: string) {
    const result = await updateEnquiryStatus(id, status);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update");
      return;
    }
    setEnquiries(
      enquiries.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Enquiries</h1>
        <p className="text-muted-foreground">Quote and bulk enquiries</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : enquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No enquiries yet.
                </TableCell>
              </TableRow>
            ) : (
              enquiries.map((enquiry) => (
                <TableRow key={enquiry.id}>
                  <TableCell className="font-medium text-white">
                    {enquiry.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {enquiry.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {enquiry.organisation ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {enquiry.buyer_type ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {enquiry.message}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={enquiry.status}
                      onValueChange={(value) =>
                        handleStatusChange(enquiry.id, value ?? "")
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="handled">Handled</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
