import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, FileText, Loader } from 'lucide-react';
import { usePortfolio } from './PortfolioContext';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { userDetails, updateUserDetails } = usePortfolio();
  const messagesEndRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);

  const script = [
    {
      question: "Hi there! I'm Vita, your personal portfolio assistant. What's your full name to get started?",
      key: "fullName",
      required: true,
      optionalResponses: [], // Name is required, no skip allowed
    },
    {
      question: "Great, ! What's a good email address for you? (You can also say 'skip' or 'I don't have one')",
      key: "email",
      required: false,
      optionalResponses: ["skip", "no", "don't have", "continue without email"]
    },
    {
      question: "Perfect. What's your professional headline? (e.g., 'Full Stack Developer' or 'UI/UX Designer')",
      key: "headline",
      required: false,
      optionalResponses: ["skip", "no headline", "not now"]
    },
    {
      question: "Nice! Could you share a short bio about yourself? (You can skip this, and I’ll generate a default bio for you)",
      key: "careerObjective", // Maps to bio
      required: false,
      optionalResponses: ["skip", "no bio", "not now"]
    },
    {
      question: "Awesome! What's your GitHub profile link or username? (or say 'skip' if you don't have one)",
      key: "github",
      required: false,
      optionalResponses: ["skip", "don't have", "no github"]
    },
    {
      question: "Do you have a LinkedIn profile? If yes, please drop the link. Otherwise, just say 'no' or 'skip'.",
      key: "linkedin",
      required: false,
      optionalResponses: ["skip", "no"]
    },
    {
      question: "Great! Please list your top skills, separated by commas. (Example: React, Node.js, MongoDB, UI/UX, AWS)",
      key: "skills",
      required: true,
    },
    {
      question: "Would you like to add a portfolio/personal website link? You can skip this if you don't have one.",
      key: "portfolio",
      required: false,
      optionalResponses: ["skip", "no"]
    },
    {
      question: "Do you want to include any notable projects? If yes, type the project name and short description. Otherwise say 'skip'.",
      key: "projects",
      required: false,
      optionalResponses: ["skip", "no", "later"]
    },
    {
      question: "Do you want to upload a profile picture or should I continue without it? (Say 'skip' to continue without a photo)",
      key: "avatar",
      required: false,
      optionalResponses: ["skip", "no", "continue without", "not now"]
    },
    {
      question: "Everything looks good so far! Should I generate your portfolio now? (yes / no)",
      key: "confirmation",
      required: true,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'bot', content: script[0].question }]);
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Check if the input is a question to be handled by AI
    const isQuestion = ['what', 'how', 'why', 'who', 'when', 'where', 'can you','i','i cant','no','done' ,'?'].some(q => input.toLowerCase().includes(q));

    if (isQuestion) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        });
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
      } catch (error) {
        console.error('Chatbot AI fallback error:', error);
        setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I couldn't process that question. Let's get back to the form." }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Proceed with the scripted conversation
      const step = script[currentStep];
      const lowerInput = input.toLowerCase();
      const isSkipping = step.optionalResponses && step.optionalResponses.some(r => lowerInput.includes(r));

      if (isSkipping && !step.required) {
        // User is skipping an optional question
        toast.info(`Skipping ${step.key}.`);
      } else {
        // User is providing an answer
        if (step) {
          updateUserDetails({ ...userDetails, [step.key]: input });
        }
      }

      // Use a timeout to make the bot's response feel more natural
      setTimeout(() => {
        const nextStep = currentStep + 1;
        if (script[nextStep]) {
          let nextQuestion = script[nextStep].question;
          // Personalize the next question if possible
          if (nextQuestion.includes('{{fullName}}') && userDetails.fullName) {
            nextQuestion = nextQuestion.replace('{{fullName}}', userDetails.fullName.split(' ')[0]);
          }
          setMessages(prev => [...prev, { role: 'bot', content: nextQuestion }]);
          setCurrentStep(nextStep);
        } else {
          // End of script
          const finalMessage = {
            role: 'bot',
            content: "That's a great start! I've collected the basic information. Would you like to go to the form to review and add more details like projects and experience?",
            action: 'SUGGEST_FORM',
          };
          setMessages(prev => [...prev, finalMessage]);
        }
        setIsLoading(false);
      }, 500);
    }
  };

  const handleActionClick = (action) => {
    if (action === 'SUGGEST_FORM') {
      toast.info("Navigating to the form to continue...");
      navigate('/form');
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg"
        >
          <MessageSquare size={24} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-full max-w-sm h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Bot className="text-indigo-600" /> Chat with Vita
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0"><Bot size={18} /></div>}
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    <p>{msg.content}</p>
                    {msg.action === 'SUGGEST_FORM' && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleActionClick('SUGGEST_FORM')} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                          <FileText size={16} /> Go to Form
                        </button>
                      </div>
                    )}
                  </div>
                   {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center flex-shrink-0"><User size={18} /></div>}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                   <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0"><Bot size={18} /></div>
                   <div className="max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                      <Loader className="animate-spin" size={20} />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;