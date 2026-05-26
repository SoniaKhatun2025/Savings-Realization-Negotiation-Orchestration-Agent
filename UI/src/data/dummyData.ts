// JSON structured data simulating API responses

export const dummyOpportunities = [
  { id: 'OPT-101', category: 'IT Hardware', supplier: 'TechCorp', currentSpend: '₹450,000', benchmarkSpend: '₹405,000', variance: '+₹45,000 (11%)', savingsPotential: '₹45,000', confidence: '92%', risk: 'High', priorityScore: '95', assignedBuyer: 'buyer@nexusprocure.com', renewalDate: '2026-08-15', action: 'Renegotiate Contract', status: 'Pending Analysis' },
  { id: 'OPT-102', category: 'Facilities', supplier: 'OfficeSupplies Inc', currentSpend: '₹120,000', benchmarkSpend: '₹108,000', variance: '+₹12,000 (10%)', savingsPotential: '₹12,000', confidence: '85%', risk: 'Low', priorityScore: '70', assignedBuyer: 'buyer@nexusprocure.com', renewalDate: '2026-11-01', action: 'Re-source', status: 'Ready for Negotiation' },
  { id: 'OPT-103', category: 'Marketing', supplier: 'Global Logistics', currentSpend: '₹1,300,000', benchmarkSpend: '₹1,170,000', variance: '+₹130,000 (10%)', savingsPotential: '₹130,000', confidence: '98%', risk: 'Medium', priorityScore: '88', assignedBuyer: 'buyer@nexusprocure.com', renewalDate: '2026-12-31', action: 'Consolidate Spend', status: 'In Progress' }
];

export const dummySupplierAnalytics = [
  { name: 'TechCorp', category: 'IT Hardware', variance: '+12% (Overpaying)', risk: 'High', trendClass: 'trend-down' },
  { name: 'OfficeSupplies Inc', category: 'Facilities', variance: '-4% (Savings)', risk: 'Low', trendClass: 'trend-up' },
  { name: 'Global Logistics', category: 'Marketing', variance: '+8% (Overpaying)', risk: 'Medium', trendClass: 'trend-down' }
];

export const dummyActiveNegotiations = [
  { 
    id: 'TSK-5091', 
    supplier: 'Global Logistics', 
    category: 'Marketing', 
    slaTimer: '48h remaining',
    status: 'Outreach Sent',
    lifecycleStatus: 'Negotiating',
    aiAction: 'Follow up on RFQ',
    riskScore: 'Medium (65/100)',
    historicalInsight: 'Supplier typically concedes 5% at end-of-quarter.',
    prevDiscount: '7% (2025)',
    playbook: {
      currentPrice: '₹1.3M',
      benchmarkPrice: '₹1.17M',
      targetPrice: '₹1.15M',
      walkawayPrice: '₹1.25M',
      expectedSavings: '₹150k',
      supplierRisk: 'Medium',
      prevOutcome: 'Successfully negotiated 7% off rate card in 2025.',
      talkingPoints: [
        'Highlight our 20% volume increase YoY.',
        'Mention recent competitive bids from FedEx.',
        'Request volume-tiered pricing model.'
      ],
      aiConfidenceExplanation: 'High confidence (92%) due to identical historical precedents and strong market benchmark data showing 10% lower rates regionally.'
    },
    action: 'Review Playbook' 
  },
  { 
    id: 'TSK-5092', 
    supplier: 'TechCorp', 
    category: 'IT Hardware', 
    slaTimer: 'Overdue by 2h',
    status: 'Supplier Responded',
    lifecycleStatus: 'Pending Approval',
    aiAction: 'Approve Counter-Offer',
    riskScore: 'High (82/100)',
    historicalInsight: 'Sole-source dependency on critical hardware.',
    prevDiscount: '0% (2025)',
    playbook: {
      currentPrice: '₹450k',
      benchmarkPrice: '₹405k',
      targetPrice: '₹410k',
      walkawayPrice: '₹450k',
      expectedSavings: '₹40k',
      supplierRisk: 'High',
      prevOutcome: 'Supplier refused discounts last year due to chip shortage.',
      talkingPoints: [
        'Chip shortage has ended, market prices have dropped 15%.',
        'We are consolidating our hardware vendors this quarter.'
      ],
      aiConfidenceExplanation: 'Medium confidence (75%) because supplier has strong leverage, but macro market conditions favor buyers currently.'
    },
    action: 'Execute Approval' 
  }
];

export const dummyKpis = {
  cpo: [
    { title: "Total Planned Savings", value: "₹12.4M", trend: "+15% vs Last Year", positive: true },
    { title: "Realized Savings", value: "₹9.1M", trend: "73% Realization Rate", positive: true },
    { title: "Savings Leakage", value: "₹3.2M", trend: "-5% vs Last Quarter", positive: false },
    { title: "Negotiation Win Rate", value: "68%", trend: "+4% vs Last Month", positive: true }
  ],
  categoryManager: [
    { title: "Open Opportunities", value: "24", trend: "+3 New Today", positive: true },
    { title: "Avg Supplier Variance", value: "12%", trend: "-2% vs Benchmark", positive: true }
  ],
  finance: [
    { title: "YTD Realized Savings", value: "₹9.1M", trend: "On Track", positive: true },
    { title: "Planned vs Realized Gap", value: "-₹1.2M", trend: "Requires Attention", positive: false },
    { title: "Savings Validation Pending", value: "14", trend: "Action Required", positive: false }
  ],
  buyerTracker: [
    { title: "Planned Savings (Assigned)", value: "₹450k", trend: "Q3 Target", positive: true },
    { title: "Realized Savings (YTD)", value: "₹310k", trend: "68% of Target", positive: true },
    { title: "Negotiation Success Rate", value: "82%", trend: "+5% vs Q2", positive: true },
    { title: "Completed Negotiations", value: "12", trend: "This Quarter", positive: true }
  ]
};

export const dummyKnowledgeBaseFiles = [
  { name: 'TechCorp_MSA_2024.pdf', date: '2026-05-20', processingStatus: 'Indexed', aiExtraction: 'Complete' },
  { name: 'Logistics_Benchmark_Q2.docx', date: '2026-05-25', processingStatus: 'Indexed', aiExtraction: 'Complete' },
  { name: 'OfficeSupplies_Invoice_May.pdf', date: '2026-05-26', processingStatus: 'Processing', aiExtraction: 'In Progress' },
  { name: 'Legacy_Vendor_List.csv', date: '2026-05-26', processingStatus: 'Failed', aiExtraction: 'Format Error' }
];
