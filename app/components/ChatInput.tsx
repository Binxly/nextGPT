import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  isStreaming: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, isStreaming }, ref) => {
    const [message, setMessage] = useState("");
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const handleSendMessage = () => {
      if (message.trim()) {
        onSendMessage(message, imageUrl);
        setMessage("");
        setImageUrl("");
        setShowImageInput(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
          setShowImageInput(false);
        };
        reader.readAsDataURL(file);
      }
    };

    const removeAttachment = () => {
      setImageUrl("");
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
          onClick={() => setShowImageInput(!showImageInput)}
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
        {showImageInput && (
          <div className="absolute bottom-full left-0 mb-2 w-1/3 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 p-2">
            <div className="flex flex-col space-y-2">
              <label className="flex items-center justify-center cursor-pointer bg-zinc-700 hover:bg-zinc-600 rounded-md p-2 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
                <span className="text-zinc-300">Choose File</span>
              </label>
              <div className="text-zinc-400 text-center">or</div>
              <input
                type="text"
                placeholder="Enter Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-zinc-700 text-zinc-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>
        )}
        {imageUrl && (
          <div className="mt-2 relative inline-block">
            <img src={imageUrl} alt="Uploaded" className="max-w-[200px] max-h-[300px] w-auto h-auto rounded object-cover" />
            <button
              className="absolute top-1 right-1 bg-zinc-800 rounded-full p-1 text-zinc-400 hover:text-zinc-200"
              onClick={removeAttachment}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';