import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Assuming useToast is in @/hooks/use-toast

interface FileUploadProps {
  onFileUpload: (file: File) => void; // New prop: a callback to pass the uploaded file to the parent
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload.",
      });
      return;
    }

    // Check file type for CSV or Excel
    const isCsv = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

    if (!isCsv && !isExcel) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls).",
      });
      return;
    }

    // Pass the file directly to the parent component (Index.tsx) for parsing
    onFileUpload(file);

    toast({
      title: "File Selected",
      description: `"${file.name}" is ready for processing.`,
    });

  }, [onFileUpload, toast]); // Dependencies for useCallback

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false, // Only allow a single file
  });

  // Determine if a file has been "accepted" by the dropzone, even if not yet processed by parent
  const hasAcceptedFile = acceptedFiles.length > 0;
  const currentFileName = hasAcceptedFile ? acceptedFiles[0].name : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <div
        {...getRootProps()}
        className={`
          relative p-12 border-2 border-dashed rounded-xl
          transition-all duration-300 ease-in-out
          ${isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center space-y-4">
          {hasAcceptedFile ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-primary animate-fadeIn" />
              <div className="space-y-2">
                <p className="text-lg font-medium">{currentFileName}</p>
                <p className="text-sm text-gray-500">File selected. Proceed to review data.</p>
              </div>
            </>
          ) : (
            <>
              {isDragActive ? (
                <ArrowUpCircle className="w-12 h-12 text-primary animate-bounce" />
              ) : (
                <FileSpreadsheet className="w-12 h-12 text-gray-400" />
              )}
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV or Excel file'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to select a file
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Removed the local preview section as Index.tsx now handles data parsing and preview */}
    </div>
  );
};
