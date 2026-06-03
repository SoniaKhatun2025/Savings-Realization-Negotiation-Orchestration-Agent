import React, { useState, useEffect } from "react";
import { Bell, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar: React.FC<{ role: string }> = ({ role }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("nexus_token");

  const fetchNotifications = async () => {
    try {
      const response = await fetch("http://localhost:8002/notifications/unread", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const resData = await response.json();
        setNotifications(resData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number, opportunityId: string | null) => {
    try {
      await fetch(`http://localhost:8002/notifications/${id}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchNotifications();
      setShowDropdown(false);
      if (opportunityId) {
        navigate("/dashboard/opportunity-queue");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>
            
            {showDropdown && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "10px",
                width: "350px",
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                overflow: "hidden",
                zIndex: 200
              }}>
                <div style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem" }}>Notifications</h4>
                  <button onClick={() => setShowDropdown(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={16}/></button>
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>No new notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} style={{ padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "background 0.2s" }} 
                           onClick={() => markAsRead(notif.id, notif.opportunity_id)}
                           onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                           onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <strong style={{ fontSize: "0.9rem", color: "white" }}>{notif.title}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(notif.created_at.endsWith('Z') ? notif.created_at : notif.created_at + 'Z').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.4" }}>{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
