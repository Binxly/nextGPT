import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, isStreaming }, ref) => {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const handleSendMessage = () => {
      if (message.trim()) {
        onSendMessage(message);
        setMessage("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    return (
      <div className="relative">
        <TextareaAutosize
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="w-full bg-zinc-800 text-zinc-300 rounded-lg p-3 pr-24 resize-none"
          minRows={2}
        />
        <button
          className="absolute left-2 bottom-2 text-zinc-400 hover:text-zinc-200"
          onClick={() => {/* TODO: Add attachment functionality here */}}
        >
          <Paperclip size={24} />
        </button>
        <button
          className="absolute right-2 bottom-2 text-zinc-400 hover:text-zinc-200"
          onClick={handleSendMessage}
          disabled={isStreaming}
        >
          <Send size={24} />
        </button>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';