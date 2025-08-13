
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a CSV or Excel file to upload.",
      });
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
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
        description: "Please upload a CSV file (.csv) or Excel file (.xlsx, .xls).",
      });
      return;
    }

    onFileUpload(file);

    toast({
      title: isCsv ? "CSV File Selected" : "Excel File Selected",
      description: `"${file.name}" is ready for processing.`,
    });

  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const hasAcceptedFile = acceptedFiles.length > 0;
  const currentFileName = hasAcceptedFile ? acceptedFiles[0].name : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <div
        {...getRootProps()}
        className={`
          relative p-12 border-2 border-dashed rounded-xl
          transition-all duration-300 ease-in-out cursor-pointer
          ${isDragActive
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center space-y-4">
          {hasAcceptedFile ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-primary animate-fadeIn" />
              <div className="space-y-2">
                <p className="text-xl font-semibold text-primary">{currentFileName}</p>
                <p className="text-muted-foreground">
                  {currentFileName?.endsWith('.csv') ? 'CSV file ready for AfriCoin tokenization!' : 'Excel file ready for processing!'}
                </p>
              </div>
            </>
          ) : (
            <>
              {isDragActive ? (
                <ArrowUpCircle className="w-16 h-16 text-primary animate-bounce" />
              ) : (
                <FileSpreadsheet className="w-16 h-16 text-primary/60" />
              )}
              <div className="space-y-3">
                <p className="text-xl font-semibold">
                  {isDragActive ? 'Drop your CSV file here' : 'Upload Your CSV File'}
                </p>
                <p className="text-muted-foreground text-base">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <div className="bg-primary/10 rounded-lg p-3 mt-4">
                  <p className="text-sm text-primary font-medium">
                    📊 CSV files work best with AfriCoin
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Also supports: Excel files (.xlsx, .xls)
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
