"use client";

import { Menu, Send, Plus, Trash2, PenSquare, Check, Paperclip } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { streamMessage, ChatMessage, Chat } from "../actions/stream-message";
import { readStreamableValue } from 'ai/rsc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedChats = localStorage.getItem('chats');
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingMessage]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: `New Chat ${chats.length + 1}`,
      messages: []
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
    setChatTitle(newChat.name);
  };

  useEffect(() => {
    if (currentChatId) {
      const currentChat = chats.find(chat => chat.id === currentChatId);
      if (currentChat) {
        setChatTitle(currentChat.name);
      }
    } else {
      setChatTitle("New Chat");
    }
  }, [currentChatId, chats]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId) return;

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };

    setChats(prevChats => prevChats.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, newUserMessage] }
        : chat
    ));
    setMessage("");
    setIsStreaming(true);

    const currentChat = chats.find(chat => chat.id === currentChatId);
    const { output } = await streamMessage([...currentChat!.messages, newUserMessage]);

    let fullAssistantMessage = "";
    for await (const delta of readStreamableValue(output)) {
      fullAssistantMessage += delta;
      setStreamingMessage(prev => prev + delta);
    }

    setChats(prevChats => prevChats.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, { id: Date.now(), role: "assistant", content: fullAssistantMessage }] }
        : chat
    ));
    setStreamingMessage("");
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
    setChatToDelete(null);
  };

  const handleEditTitle = () => {
    setIsEditingTitle(true);
    setEditedTitle(chatTitle);
  };

  const handleSaveTitle = () => {
    if (currentChatId && editedTitle.trim()) {
      setChats(prevChats => prevChats.map(chat => 
        chat.id === currentChatId ? { ...chat, name: editedTitle.trim() } : chat
      ));
      setChatTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen flex">
      {sidebarOpen ? (
        <div className="w-[300px] bg-gray-900 border-r border-gray-800 relative">
          <div className="bg-gray-800 p-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <button
              onClick={createNewChat}
              className="text-gray-300 hover:text-white"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="p-4">
            {chats.slice().reverse().map(chat => (
              <div 
                key={chat.id} 
                className="cursor-pointer p-2 hover:bg-gray-800 rounded flex justify-between items-center group"
                onClick={() => setCurrentChatId(chat.id)}
              >
                <span>{chat.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chat.id);
                      }}
                      className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the chat.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteChat(chat.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 p-4 flex flex-col items-center space-y-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <button
            onClick={createNewChat}
            className="text-gray-300 hover:text-white"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-center items-center">
          {isEditingTitle ? (
            <>
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold bg-gray-800 text-gray-100 rounded px-2"
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                  }
                }}
              />
              <button
                className="ml-2 text-gray-400 hover:text-gray-200"
                onClick={handleSaveTitle}
              >
                <Check size={20} />
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{chatTitle}</h1>
              <button
                className="ml-2 text-gray-400 hover:text-gray-200"
                onClick={handleEditTitle}
              >
                <PenSquare size={20} />
              </button>
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex justify-center">
          <div className="w-full max-w-[800px] bg-gray-900 rounded-lg p-4">
            <div className="space-y-4">
              {currentChatId && chats.find(chat => chat.id === currentChatId)?.messages.map((msg) => (
                <div key={msg.id} className={`flex justify-${msg.role === "assistant" ? "start" : "end"}`}>
                  <div className={`${msg.role === "assistant" ? "bg-indigo-600" : "bg-gray-700"} p-3 rounded-lg max-w-[80%]`}>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-indigo-600 p-3 rounded-lg max-w-[80%]">
                    <p>{streamingMessage}</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800">
          <div className="max-w-[800px] mx-auto relative">
            <TextareaAutosize
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full bg-gray-900 text-gray-100 rounded-lg p-3 pr-24 resize-none"
              minRows={2}
            />
            <button
              className="absolute left-2 bottom-2 text-gray-300 hover:text-white"
              onClick={() => {/* Add attachment functionality here */}}
            >
              <Paperclip size={24} />
            </button>
            <button
              className="absolute right-2 bottom-2 text-gray-300 hover:text-white"
              onClick={handleSendMessage}
              disabled={isStreaming}
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
