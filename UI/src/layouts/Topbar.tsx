import React from "react";
import { Bell, User } from "lucide-react";

const Topbar: React.FC<{ role: string }> = ({ role }) => {
  return (
    <header
      style={{
        height: "70px",
        background: "rgba(30, 41, 59, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          width: "400px",
        }}
      >
        {/* <div style={{ position: "relative", width: "100%" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search suppliers, POs, or tasks..."
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "10px 15px 10px 40px",
              borderRadius: "20px",
              color: "white",
              outline: "none",
              transition: "all 0.2s",
            }}
          />
        </div> */}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
          <RefreshCw size={14} />
          <span>Last ERP Sync: <strong>2 mins ago</strong></span>
        </div> */}

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#cbd5e1",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <Bell size={20} />
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                background: "#ef4444",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
              }}
            ></span>
          </button>
          {/* <button
            style={{
              background: "none",
              border: "none",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            <Moon size={20} />
          </button>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            <Settings size={20} />
          </button> */}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            paddingLeft: "25px",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Enterprise User
            </div>
            <div
              style={{
                color: "var(--primary)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {role}
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
