import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  ShoppingCart,
  PieChart,
} from "lucide-react";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>("Buyer");

  const roleRouteMap: Record<string, string> = {
    Buyer: "buyer",
    Finance: "finance",
    "Category Manager": "category",
    CPO: "cpo",
  };

  const personas = [
    {
      role: "Buyer",
      title: "Buyer / Sourcing",
      icon: <ShoppingCart size={24} />,
      desc: "AI tasks & negotiations",
    },
    {
      role: "Finance",
      title: "Finance Controller",
      icon: <PieChart size={24} />,
      desc: "Savings tracking & validation",
    },
    {
      role: "Category Manager",
      title: "Category Manager",
      icon: <Briefcase size={24} />,
      desc: "Review opportunities & analytics",
    },
    {
      role: "CPO",
      title: "Chief Procurement Officer",
      icon: <LayoutDashboard size={24} />,
      desc: "Executive dashboard & approvals",
    },
  ];

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem("nexus_role", selectedRole);
    const dashboardRoute = roleRouteMap[selectedRole] ?? "buyer";
    navigate(`/dashboard/${dashboardRoute}`);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ maxWidth: "600px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: "var(--primary)", fontSize: "2rem", margin: 0 }}>
            NexusProcure
          </h2>
          <p style={{ color: "#94a3b8", marginTop: "10px" }}>
            Select your enterprise persona to continue
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "30px",
            }}
          >
            {personas.map((p) => (
              <div
                key={p.role}
                onClick={() => setSelectedRole(p.role)}
                style={{
                  border:
                    selectedRole === p.role
                      ? "2px solid var(--primary)"
                      : "1px solid rgba(255,255,255,0.1)",
                  background:
                    selectedRole === p.role
                      ? "rgba(59, 130, 246, 0.1)"
                      : "rgba(0,0,0,0.2)",
                  padding: "20px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    color:
                      selectedRole === p.role ? "var(--primary)" : "#cbd5e1",
                    marginBottom: "10px",
                  }}
                >
                  {p.icon}
                </div>
                <strong style={{ color: "white", marginBottom: "5px" }}>
                  {p.title}
                </strong>
                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                  {p.desc}
                </span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary login-btn"
            style={{ padding: "15px", fontSize: "1.1rem" }}
          >
            Login as {selectedRole}
          </button>
          <button
            type="button"
            className="btn-secondary login-btn"
            style={{
              marginTop: "12px",
              padding: "15px",
              fontSize: "1.1rem",
              background: "rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onClick={() => navigate("/")}
          >
            Back to Landing Page
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
