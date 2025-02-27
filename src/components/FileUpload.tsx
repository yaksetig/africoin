
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Array<any>>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file.type !== 'text/csv') {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a CSV file.",
      });
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const csvText = reader.result as string;
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj: any, header: string, index: number) => {
          obj[header.trim()] = values[index]?.trim();
          return obj;
        }, {});
      });
      setCsvData(data);
      toast({
        title: "File Uploaded",
        description: `Successfully parsed ${data.length} rows from ${file.name}`,
      });
    };
    reader.readAsText(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

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
          {file ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-primary animate-fadeIn" />
              <div className="space-y-2">
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{csvData.length} rows parsed</p>
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
                  {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
                </p>
                <p className="text-sm text-gray-500">
                  or click to select a file
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {csvData.length > 0 && (
        <div className="space-y-4 animate-slideUp">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(csvData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, i) => (
                      <td
                        key={i}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
