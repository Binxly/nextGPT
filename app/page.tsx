"use client";

import { Menu, Send, Plus, Trash2, PenSquare, Check, UserIcon, BotIcon, Copy } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { streamMessage, ChatMessage, Chat } from "../actions/stream-message";
import { readStreamableValue } from 'ai/rsc';
import { motion, AnimatePresence } from "framer-motion";
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
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatInput } from "./components/ChatInput";
import { useResizable } from '../hooks/useResizable';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { initResize } = useResizable(sidebarRef, setSidebarWidth, 150, 300);

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
  }, [chats, streamingMessage]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: `New Chat ${chats.length + 1}`,
      messages: []
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
    setChatTitle(newChat.name);
    setTimeout(() => chatInputRef.current?.focus(), 0);
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

  const handleSendMessage = async (message: string) => {
    let chatId = currentChatId;

    if (!chatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        name: `New Chat ${chats.length + 1}`,
        messages: []
      };
      setChats(prevChats => [...prevChats, newChat]);
      setCurrentChatId(newChat.id);
      setChatTitle(newChat.name);
      chatId = newChat.id;
    }

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };

    setChats(prevChats => prevChats.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, newUserMessage] }
        : chat
    ));

    setIsStreaming(true);

    const currentChat = chats.find(chat => chat.id === chatId);
    const chatMessages = currentChat ? [...currentChat.messages, newUserMessage] : [newUserMessage];

    const { output } = await streamMessage(chatMessages);

    let fullAssistantMessage = "";
    for await (const delta of readStreamableValue(output)) {
      fullAssistantMessage += delta;
      setStreamingMessage(currentMessage => currentMessage + delta);
    }

    setChats(prevChats => prevChats.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, { id: Date.now(), role: "assistant", content: fullAssistantMessage }] }
        : chat
    ));

    setStreamingMessage("");
    setIsStreaming(false);
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

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }, []);

  return (
    <div className="bg-zinc-900 text-zinc-300 min-h-screen flex">
      {sidebarOpen ? (
        <div 
          ref={sidebarRef}
          className="bg-zinc-800 border-r border-zinc-700 relative flex flex-col"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="bg-zinc-700 p-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <Menu size={24} />
            </button>
            <button
              onClick={createNewChat}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="p-4">
            {chats.slice().reverse().map(chat => (
              <div 
                key={chat.id} 
                className="cursor-pointer p-2 hover:bg-zinc-700 rounded flex justify-between items-center group"
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
                      className="text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <div 
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize bg-zinc-700 hover:bg-zinc-600"
            onMouseDown={initResize}
          />
        </div>
      ) : (
        <div className="bg-zinc-800 p-4 flex flex-col items-center space-y-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <Menu size={24} />
          </button>
          <button
            onClick={createNewChat}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-zinc-700 flex justify-center items-center">
          {isEditingTitle ? (
            <>
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-2xl font-bold bg-zinc-800 text-zinc-300 rounded px-2"
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle();
                  }
                }}
              />
              <button
                className="ml-2 text-zinc-400 hover:text-zinc-200"
                onClick={handleSaveTitle}
              >
                <Check size={20} />
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{chatTitle}</h1>
              <button
                className="ml-2 text-zinc-400 hover:text-zinc-200"
                onClick={handleEditTitle}
              >
                <PenSquare size={20} />
              </button>
            </>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex justify-center">
          <div className="w-full max-w-[800px]">
            <AnimatePresence>
              {currentChatId && chats.find(chat => chat.id === currentChatId)?.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className="flex flex-row gap-2 mb-4"
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
                    {msg.role === "assistant" ? <BotIcon /> : <UserIcon />}
                  </div>
                  <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === "assistant" ? "bg-zinc-800" : "bg-blue-900"} prose`}>
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="relative">
                              <div className="absolute top-2 right-2 flex items-center space-x-2">
                                {copiedStates[String(node.position?.start.line)] && (
                                  <span className="text-green-500">
                                    <Check size={18} />
                                  </span>
                                )}
                                <button
                                  onClick={() => copyToClipboard(String(children), String(node.position?.start.line))}
                                  className="text-zinc-400 hover:text-zinc-200"
                                >
                                  <Copy size={18} />
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                className="bg-zinc-900 p-2 rounded my-2"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-zinc-900 px-1 rounded" {...props}>
                              {children}
                            </code>
                          )
                        },
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium my-2" {...props} />,
                        p: ({node, ...props}) => <p className="my-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                        li: ({node, ...props}) => <li className="my-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-500 pl-4 my-2 italic" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isStreaming && (
                <motion.div
                  className="flex flex-row gap-2 mb-4"
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
                    <BotIcon />
                  </div>
                  <div className="bg-zinc-800 p-3 rounded-lg max-w-[80%] prose">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="relative">
                              <button
                                onClick={() => copyToClipboard(String(children))}
                                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200"
                              >
                                <Copy size={18} />
                              </button>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                className="bg-zinc-900 p-2 rounded my-2"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-zinc-900 px-1 rounded" {...props}>
                              {children}
                            </code>
                          )
                        },
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium my-2" {...props} />,
                        p: ({node, ...props}) => <p className="my-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                        li: ({node, ...props}) => <li className="my-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-500 pl-4 my-2 italic" {...props} />,
                      }}
                    >
                      {streamingMessage}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-700">
          <div className="max-w-[800px] mx-auto">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isStreaming={isStreaming} 
              ref={chatInputRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
