import React, { useRef, useCallback, useState, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Link as LinkIcon, 
  Code, 
  Image as ImageIcon,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Write something visual...', 
  minHeight = '300px',
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  // Sync state to editor only once or when value is changed externally (rare)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const applyFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput(); // Sync back immediately
    
    // Maintain focus
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [handleInput]);

  // Monitor selection to show/hide bar
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setShowToolbar(true);
    } else if (isFocused) {
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey)) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); applyFormat('bold'); break;
        case 'i': e.preventDefault(); applyFormat('italic'); break;
        case 'u': e.preventDefault(); applyFormat('underline'); break;
      }
    }

    // Continue numbered list on Enter / Shift+Enter:
    // "1. Item" + line break -> "2. "
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (
        selection &&
        selection.rangeCount > 0 &&
        editorRef.current &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0).cloneRange();
        range.selectNodeContents(editorRef.current);
        range.setEnd(selection.anchorNode as Node, selection.anchorOffset);
        const beforeCaret = range.toString();
        const currentLine = beforeCaret.split('\n').pop() ?? '';
        const match = currentLine.match(/^(\d+)\.\s+.*$/);

        if (match) {
          e.preventDefault();
          const next = Number(match[1]) + 1;
          document.execCommand('insertText', false, `\n${next}. `);
          handleInput();
          return;
        }
      }
    }

    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('indent');
    }
  };

  const isEmpty = !value || value === '<br>' || value === '';

  return (
    <div className={`relative flex flex-col group transition-all ${className}`}>
      {/* Visual Floating Toolbar (Linear style) */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-[#1C1F2B] border border-gray-700 dark:border-border-dark rounded-xl shadow-[0_16px_36px_rgba(95,114,234,0.24)] backdrop-blur-xl"
          >
            <ToolbarButton onClick={() => applyFormat('formatBlock', '<h2>')} icon={<Type size={16} />} title="Title" />
            <ToolbarButton onClick={() => applyFormat('formatBlock', '<p>')} icon={<Type size={14} />} title="Body" />
            <div className="w-[1px] h-4 bg-gray-700 mx-1" />
            <ToolbarButton onClick={() => applyFormat('bold')} icon={<Bold size={16} />} title="Bold" />
            <ToolbarButton onClick={() => applyFormat('italic')} icon={<Italic size={16} />} title="Italic" />
            <ToolbarButton onClick={() => applyFormat('underline')} icon={<Underline size={16} />} title="Underline" />
            
            <div className="w-[1px] h-4 bg-gray-700 mx-2" />
            
            <ToolbarButton onClick={() => applyFormat('insertUnorderedList')} icon={<List size={16} />} title="Bullet List" />
            <ToolbarButton onClick={() => applyFormat('insertOrderedList')} icon={<ListOrdered size={16} />} title="Numbered List" />
            <ToolbarButton onClick={() => applyFormat('createLink', window.prompt('Enter URL') || '')} icon={<LinkIcon size={16} />} title="Link" />
            <ToolbarButton onClick={() => applyFormat('formatBlock', '<pre>')} icon={<Code size={16} />} title="Code Block" />
            
            <div className="w-[1px] h-4 bg-gray-700 mx-2" />
            
            <ToolbarButton onClick={() => {}} icon={<ImageIcon size={16} />} title="Media" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surface Indicator */}
      <div 
        className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300 pointer-events-none ${
          isFocused ? 'border-primary/30 shadow-lg shadow-primary/5 ring-2 ring-primary/10' : 'border-gray-200 dark:border-border-dark'
        }`} 
      />

      {/* Professional Editor Surface */}
      <div className="relative p-8 overflow-hidden rounded-2xl bg-white dark:bg-transparent">
        {isEmpty && !isFocused && (
          <div className="absolute top-8 left-8 text-gray-400 dark:text-gray-600 font-medium italic text-base pointer-events-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={true}
          onInput={handleInput}
          onFocus={() => {
            setIsFocused(true);
            setShowToolbar(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hide so context bar buttons can be clicked
            setTimeout(() => setShowToolbar(false), 200);
          }}
          onSelect={handleSelection}
          onKeyDown={handleKeyDown}
          className="rich-text-content w-full bg-transparent border-none outline-none min-h-[300px] text-[15px] leading-7 text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-700 font-sans selection:bg-primary/30"
          style={{ minHeight }}
        />
      </div>

      {/* <div className="flex justify-between items-center px-5 py-2.5 mt-2 bg-gray-50/70 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-border-dark transition-all">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
          <Type size={12} className="text-primary" />
          <span>Professional Rich Text</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-medium tracking-wide text-gray-400 uppercase">
          <span>Title / Body</span>
          <div className="w-1 h-1 rounded-full bg-primary" />
          <span>Numbered Continuation</span>
        </div>
      </div> */}
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string }> = ({ onClick, icon, title }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault(); // VERY IMPORTANT: prevents focus loss from editor
      onClick();
    }}
    className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 dark:hover:bg-primary/20 transition-all active:scale-90 group relative"
    title={title}
  >
    {icon}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 rounded bg-black text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] uppercase tracking-widest">
      {title}
    </span>
  </button>
);
