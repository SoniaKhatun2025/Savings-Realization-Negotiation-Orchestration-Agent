import React from "react";
import ProcurementChatbot from "../components/ProcurementChatbot";

const ProcurementChatbotPage: React.FC = () => {
  return (
    <div>
      {/* <h1>AI Procurement Assistant</h1> */}
      {/* <p>
        Ask NexusProcure about procurement strategies, contract terms, or
        supplier history.
      </p> */}
      <div style={{ width: "100%", marginTop: "20px" }}>
        <ProcurementChatbot />
      </div>
    </div>
  );
};

export default ProcurementChatbotPage;
