import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileDropZone from "@/components/FileDropZone";
import { useCreateJob } from "@/hooks/useJobs";

const jobFormSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  customerName: z.string().min(1, "Customer name is required"),
  emailBody: z.string().min(1, "Please paste the job details"),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function JobForm() {
  const [, navigate] = useLocation();
  const createJob = useCreateJob();
  const [files, setFiles] = useState<File[]>([]);
  const [customerSelect, setCustomerSelect] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      customerName: "",
      emailBody: "",
    },
  });

  const handleCustomerChange = (value: string) => {
    setCustomerSelect(value);
    if (value !== "other") {
      setValue("customerName", value, { shouldValidate: true });
    } else {
      setValue("customerName", "", { shouldValidate: false });
    }
  };

  const onSubmit = async (data: JobFormValues) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("customerName", data.customerName);
      formData.append("emailBody", data.emailBody);

      for (const file of files) {
        formData.append("files", file);
      }

      const newJob = await createJob.mutateAsync(formData);
      toast.success("Job submitted successfully!");
      navigate("/jobs/" + newJob.id);
    } catch {
      toast.error("Failed to submit job");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Job Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Job Title</Label>
        <Input
          id="title"
          placeholder="e.g., 2025 Spring Mailer - 50,000 qty"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Customer */}
      <div className="space-y-2">
        <Label htmlFor="customer">Customer</Label>
        <Select value={customerSelect} onValueChange={handleCustomerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Impact Direct">Impact Direct</SelectItem>
            <SelectItem value="JD Graphic">JD Graphic</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {customerSelect === "other" && (
          <Input
            id="customerNameCustom"
            placeholder="Enter customer name"
            {...register("customerName")}
          />
        )}
        {errors.customerName && (
          <p className="text-sm text-destructive">
            {errors.customerName.message}
          </p>
        )}
      </div>

      {/* Job Details */}
      <div className="space-y-2">
        <Label htmlFor="emailBody">Job Details</Label>
        <Textarea
          id="emailBody"
          rows={12}
          placeholder="Paste the email body, PO details, job specifications, or any notes here..."
          {...register("emailBody")}
        />
        {errors.emailBody && (
          <p className="text-sm text-destructive">
            {errors.emailBody.message}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Files</Label>
        <FileDropZone files={files} onFilesChange={setFiles} />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={createJob.isPending}
      >
        {createJob.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Job"
        )}
      </Button>
    </form>
  );
}
