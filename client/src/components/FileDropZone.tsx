import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, File, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name: string, maxLength = 40): string {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf(".");
  if (ext === -1) return name.slice(0, maxLength - 3) + "...";
  const extension = name.slice(ext);
  const base = name.slice(0, maxLength - extension.length - 3);
  return base + "..." + extension;
}

export default function FileDropZone({ files, onFilesChange }: FileDropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesChange([...files, ...acceptedFiles]);
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          {isDragActive
            ? "Drop files here..."
            : "Drop files here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          PDFs, images, documents, or any file type
        </p>
      </div>

      {files.length > 0 && (
        <div className="grid gap-2">
          {files.map((file, index) => (
            <Card key={`${file.name}-${index}`} className="p-3">
              <div className="flex items-center gap-3">
                {file.type === "application/pdf" ? (
                  <FileText className="h-5 w-5 text-red-500 shrink-0" />
                ) : (
                  <File className="h-5 w-5 text-blue-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {truncateName(file.name)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
