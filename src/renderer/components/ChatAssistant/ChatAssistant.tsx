import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input, InputGroup } from "reactstrap";
import { X, Send, MessageCircle } from "react-feather";
import { chatAssistantActions } from "../../store/chat-assistant-slice";
import "./ChatAssistant.css";

function ChatAssistant() {
  const dispatch = useDispatch();
  
  const isOpen = useSelector((state: any) => state.chatAssistant?.isOpen) || false;
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "I received your message: '" + inputMessage + "'. This is a demo response. In a real implementation, you would integrate with an AI service here.",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const closeChat = () => {
    dispatch(chatAssistantActions.close());
  };

  if (!isOpen) return null;

  return (
    <div className="chat-assistant">
      <div className="chat-assistant-header">
        <div className="chat-assistant-title">
          <MessageCircle size={20} />
          <span>OnePad Assistant</span>
        </div>
        <Button color="link" onClick={closeChat} className="close-button">
          <X size={16} />
        </Button>
      </div>
      
      <div className="chat-assistant-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === "user" ? "user-message" : "assistant-message"}`}
          >
            <div className="message-content">
              {message.text}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="chat-assistant-input">
        <InputGroup>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="chat-input"
          />
          <Button color="primary" onClick={handleSendMessage} className="send-button">
            <Send size={16} />
          </Button>
        </InputGroup>
      </div>
    </div>
  );
}

export default ChatAssistant;
