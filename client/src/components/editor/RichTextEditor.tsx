import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { Paperclip, Image, Link, Save } from 'lucide-react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number | string;
  attachmentsEnabled?: boolean;
  toolbarOptions?: any;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  onSave,
  placeholder = 'Write test case steps here...',
  readOnly = false,
  height = 200,
  attachmentsEnabled = true,
  toolbarOptions
}) => {
  const [value, setValue] = useState(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  // Handle server-side rendering with react-quill
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (content: string) => {
    setValue(content);
    onChange?.(content);
  };

  const handleSave = () => {
    onSave?.(value);
  };

  // File upload handler
  const handleFileUpload = (callback: (url: string) => void) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt');
    
    input.onchange = () => {
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = () => {
          // In a real implementation, you would upload to server and get a URL
          // For demo purposes, we'll use a data URL or mock URL
          const fileUrl = reader.result as string;
          callback(fileUrl);
        };
        
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    
    input.onchange = () => {
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = () => {
          // In a real implementation, you would upload to server and get a URL
          // For now, we'll use a data URL
          const imageUrl = reader.result as string;
          
          // Get the Quill editor instance
          const quillEditor = (document.querySelector('.quill') as any)?.querySelector('.ql-editor');
          if (quillEditor) {
            // Insert image at current cursor position
            const range = window.getSelection()?.getRangeAt(0);
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            
            if (range) {
              range.insertNode(img);
            } else {
              quillEditor.appendChild(img);
            }
          }
        };
        
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const modules = {
    toolbar: toolbarOptions || {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image', 'code-block'
  ];

  // Don't render on server
  if (!isMounted) {
    return <div style={{ height: height, border: '1px solid #ccc' }}>Loading editor...</div>;
  }

  return (
    <div className="rich-text-editor">
      <div className="editor-container" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <ReactQuill 
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{ height: '100%' }}
        />
      </div>
      
      {attachmentsEnabled && !readOnly && (
        <div className="flex mt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFileUpload(url => {
              // Insert a file attachment link
              const fileName = url.split('/').pop() || 'Attachment';
              const link = `<a href="${url}" target="_blank" class="file-attachment"><span class="attachment-icon">📎</span> ${fileName}</a>`;
              const quillEditor = (document.querySelector('.quill') as any)?.getEditor();
              
              if (quillEditor) {
                const range = quillEditor.getSelection();
                quillEditor.clipboard.dangerouslyPasteHTML(range?.index || 0, link);
              }
            })}
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Attach File
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImageUpload}
          >
            <Image className="h-4 w-4 mr-1" />
            Add Image
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const url = prompt('Enter link URL:');
              if (url) {
                const quillEditor = (document.querySelector('.quill') as any)?.getEditor();
                if (quillEditor) {
                  const range = quillEditor.getSelection();
                  const linkText = window.getSelection()?.toString() || url;
                  quillEditor.clipboard.dangerouslyPasteHTML(
                    range?.index || 0,
                    `<a href="${url}" target="_blank">${linkText}</a>`
                  );
                }
              }
            }}
          >
            <Link className="h-4 w-4 mr-1" />
            Add Link
          </Button>
          
          {onSave && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      )}
      
      <style jsx global>{`
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          background: #fff;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 150px;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .file-attachment {
          display: inline-flex;
          align-items: center;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 4px 0;
          color: #374151;
          text-decoration: none;
        }
        
        .attachment-icon {
          margin-right: 4px;
        }
      `}</style>
    </div>
  );
};