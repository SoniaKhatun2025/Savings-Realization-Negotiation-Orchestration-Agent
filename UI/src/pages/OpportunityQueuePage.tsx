import React from 'react';
import OpportunityQueue from '../components/OpportunityQueue';

const OpportunityQueuePage: React.FC = () => {
  return (
    <div>
      <h1>Enterprise Opportunity Queue</h1>
      <p>All identified savings opportunities across categories.</p>
      <OpportunityQueue />
    </div>
  );
};

export default OpportunityQueuePage;
