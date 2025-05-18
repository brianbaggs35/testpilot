import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import { Paperclip, X, FileText, Image, File } from 'lucide-react';
import 'react-quill/dist/quill.snow.css';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface RichTextEditorProps {
  initialValue?: string;
  attachments?: Attachment[];
  onChange?: (content: string) => void;
  onAttachmentAdd?: (file: File) => Promise<Attachment>;
  onAttachmentRemove?: (id: string) => Promise<void>;
  readOnly?: boolean;
  placeholder?: string;
  height?: string | number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  attachments = [],
  onChange,
  onAttachmentAdd,
  onAttachmentRemove,
  readOnly = false,
  placeholder = 'Enter your test case steps, preconditions, and expected results here...',
  height = 300
}) => {
  const [value, setValue] = useState(initialValue);
  const [files, setFiles] = useState<Attachment[]>(attachments);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(attachments);
  }, [attachments]);

  const handleChange = (content: string) => {
    setValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  const handleFileClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onAttachmentAdd || !e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const file = e.target.files[0];
      const newAttachment = await onAttachmentAdd(file);
      setFiles([...files, newAttachment]);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error appropriately
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (id: string) => {
    if (!onAttachmentRemove || readOnly) return;
    
    try {
      await onAttachmentRemove(id);
      setFiles(files.filter(file => file.id !== id));
    } catch (error) {
      console.error('Error removing file:', error);
      // Handle error appropriately
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'color', 'background',
    'link', 'image', 'code-block'
  ];

  return (
    <div className="rich-text-editor">
      <div className={`border rounded-md overflow-hidden ${readOnly ? 'bg-gray-50' : 'bg-white'}`}>
        <ReactQuill 
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          readOnly={readOnly}
          placeholder={placeholder}
          style={{ height }}
        />
      </div>
      
      {/* Attachments section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={handleFileClick}
              disabled={isUploading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              {isUploading ? 'Uploading...' : 'Attach File'}
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        
        {files.length > 0 ? (
          <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                <div className="flex items-center">
                  {getFileIcon(file.type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs mr-4"
                  >
                    View
                  </a>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 border border-dashed rounded-md">
            <Paperclip className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="mt-1 text-sm text-gray-500">
              {readOnly 
                ? 'No attachments available' 
                : 'Attach files to this test case by clicking the button above'
              }
            </p>
          </div>
        )}
      </div>

      {/* Custom styles for the Quill editor */}
      <style jsx global>
        {`
          .ql-editor {
            min-height: ${typeof height === 'number' ? height - 42 : height};
            font-size: 0.875rem;
            line-height: 1.5;
          }
          
          .ql-toolbar {
            border-bottom: 1px solid #e5e7eb;
          }
          
          .ql-container {
            font-family: inherit;
          }
          
          /* Make sure the editor takes the specified height */
          .quill, .ql-container {
            height: auto !important;
          }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;