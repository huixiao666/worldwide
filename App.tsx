import React from 'react';
import { Layout } from './components/Layout';
import { NewsDashboard } from './components/NewsDashboard';

const App: React.FC = () => {
  return (
    <Layout>
      <NewsDashboard />
    </Layout>
  );
};

export default App;