import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image, 
  FileText, 
  Code
} from 'lucide-react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialValue = '', 
  onChange,
  placeholder = 'Enter your test case details here...'
}) => {
  const [content, setContent] = useState(initialValue);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  // This is a simplified version without actual rich text editing
  // In a real implementation, we would use a proper rich text editor library
  return (
    <div className="rich-text-editor border rounded-md">
      {/* Toolbar */}
      <div className="flex p-2 bg-gray-50 border-b items-center gap-1 flex-wrap">
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Bold">
          <Bold size={18} />
        </button>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Italic">
          <Italic size={18} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Bullet List">
          <List size={18} />
        </button>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Numbered List">
          <ListOrdered size={18} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Insert Link">
          <LinkIcon size={18} />
        </button>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Insert Image">
          <Image size={18} />
        </button>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Insert Attachment">
          <FileText size={18} />
        </button>
        <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Insert Code">
          <Code size={18} />
        </button>
      </div>
      
      {/* Editor Area */}
      <textarea
        className="w-full p-3 min-h-[200px] outline-none"
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
      />
      
      {/* Add a note about this being a simplified version */}
      <div className="p-2 text-xs text-gray-500 bg-gray-50 border-t">
        <p>Note: This is a simplified demo. In the full version, you would have a proper WYSIWYG editor with formatting capabilities.</p>
      </div>
    </div>
  );
};

export default RichTextEditor;