import React, { useState, useEffect } from "react";
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

  const token = localStorage.getItem("nexus_token");

  const fetchHistory = async () => {
    try {
      const response = await fetch("http://localhost:8002/chat/history", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (response.ok && resData.data && resData.data.length > 0) {
        const historyMsgs = resData.data.map((msg: any) => {
          let msgTime = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (msg.created_at) {
            try {
              msgTime = new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            } catch (e) {
              console.error(e);
            }
          }
          return {
            sender: msg.sender,
            text: msg.message,
            time: msgTime
          };
        });
        setMessages(historyMsgs);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  useEffect(() => {
    // Intentionally left empty to start fresh as per user request
    // fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    try {
      const response = await fetch("http://localhost:8002/chat/history", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        setMessages([
          {
            sender: "AI",
            text: "Hello, I am NexusProcure. I can analyze supplier history, review benchmark pricing, and generate negotiation playbooks. How can I assist you today?",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Error clearing chat history:", err);
    }
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput !== undefined ? customInput : input;
    if (textToSend.trim()) {
      const timeNow = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        { sender: "User", text: textToSend, time: timeNow },
      ]);
      if (customInput === undefined) {
        setInput("");
      }
      setIsTyping(true);

      try {
        const response = await fetch("http://localhost:8002/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ message: textToSend })
        });

        if (response.ok && response.body) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: "",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);

          setIsTyping(false);

          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                newMessages[lastIdx] = {
                  ...newMessages[lastIdx],
                  text: newMessages[lastIdx].text + chunk
                };
                return newMessages;
              });
            }
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "AI",
              text: "Sorry, I encountered an error processing your request. Please try again.",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }
      } catch (err) {
        console.error("Error sending chat query:", err);
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: "Network error. Please check your backend connection.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
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
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        <button
          onClick={handleClearHistory}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#cbd5e1",
            padding: "4px 10px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.8rem",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          New Chat
        </button>
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
              whiteSpace: "pre-wrap",
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
            {msg.text.replace(/\n\n(?=\d+\.|-|\*)/g, '\n')}
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
            handleSend("Show top variance suppliers");
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
            handleSend("Which suppliers are overpriced?");
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
            handleSend("Show expiring contracts");
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
          onClick={() => handleSend()}
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
