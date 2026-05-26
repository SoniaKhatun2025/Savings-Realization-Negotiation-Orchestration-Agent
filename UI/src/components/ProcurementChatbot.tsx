import React, { useState } from "react";
import { motion } from "framer-motion";

const ProcurementChatbot: React.FC = () => {
  const [messages, setMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([
    {
      sender: "AI",
      text: "Hello, I am NexusProcure. I can analyze supplier history, review benchmark pricing, and generate negotiation playbooks. How can I assist you today?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (input.trim()) {
      const timeNow = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages([
        ...messages,
        { sender: "User", text: input, time: timeNow },
      ]);
      setInput("");
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: `I have analyzed your request regarding "${input}". Based on my semantic search of 142 contracts and ERP data, I recommend consolidating the IT Hardware spend with TechCorp to achieve an estimated ₹45k in savings.`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }, 2500);
    }
  };

  return (
    <div
      className="kpi-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "600px",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          padding: "15px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            background: "#22c55e",
            borderRadius: "50%",
            boxShadow: "0 0 10px #22c55e",
          }}
        ></div>
        <strong>NexusProcure AI Copilot</strong>
      </div>

      <div
        className="chat-messages"
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`message ${msg.sender === "User" ? "msg-user" : "msg-ai"}`}
            style={{
              alignSelf: msg.sender === "User" ? "flex-end" : "flex-start",
              background:
                msg.sender === "User"
                  ? "var(--primary)"
                  : "rgba(255,255,255,0.05)",
              padding: "12px 18px",
              color: msg.sender === "User" ? "#fff" : "#e2e8f0",

              borderRadius:
                msg.sender === "User" ? "18px 18px 0 18px" : "18px 18px 18px 0",
              maxWidth: "80%",
              lineHeight: "1.5",
            }}
          >
            <div
              style={{
                marginBottom: "5px",
                fontSize: "0.75rem",
                color: msg.sender === "User" ? "#cbd5e1" : "#94a3b8",
              }}
            >
              <strong>{msg.sender}</strong> • {msg.time}
            </div>
            {msg.text}
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.05)",
              padding: "12px 18px",
              borderRadius: "18px 18px 18px 0",
              display: "flex",
              gap: "5px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                marginRight: "5px",
              }}
            >
              Analyzing procurement data
            </span>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              style={{
                width: "4px",
                height: "4px",
                background: "var(--primary)",
                borderRadius: "50%",
              }}
            />
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
              style={{
                width: "4px",
                height: "4px",
                background: "var(--primary)",
                borderRadius: "50%",
              }}
            />
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
              style={{
                width: "4px",
                height: "4px",
                background: "var(--primary)",
                borderRadius: "50%",
              }}
            />
          </motion.div>
        )}
      </div>

      <div
        style={{
          padding: "10px 20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <button
          onClick={() => {
            setInput("Show top variance suppliers");
            handleSend();
          }}
          className="btn-secondary"
          style={{
            fontSize: "0.75rem",
            padding: "6px 12px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#cbd5e1",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Show top variance suppliers
        </button>
        <button
          onClick={() => {
            setInput("Which suppliers are overpriced?");
            handleSend();
          }}
          className="btn-secondary"
          style={{
            fontSize: "0.75rem",
            padding: "6px 12px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#cbd5e1",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Which suppliers are overpriced?
        </button>
        <button
          onClick={() => {
            setInput("Show expiring contracts");
            handleSend();
          }}
          className="btn-secondary"
          style={{
            fontSize: "0.75rem",
            padding: "6px 12px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#cbd5e1",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Show expiring contracts
        </button>
      </div>

      <div
        className="chat-input"
        style={{
          padding: "20px",
          background: "rgba(30, 41, 59, 0.5)",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask NexusProcure a question..."
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "25px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          className="btn-primary"
          style={{ padding: "10px 25px", borderRadius: "25px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ProcurementChatbot;
