import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PeriodProvider } from './context/PeriodContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdminRules } from './components/AdminRules';
import { AdminCategories } from './components/AdminCategories';
import { TransactionsPage } from './components/TransactionsPage';
import { ReportsPage } from './components/ReportsPage';
import { SecurityPage } from './components/SecurityPage';

function App() {
  return (
    <PeriodProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="rules" element={<AdminRules />} />
            <Route path="categories-admin" element={<AdminCategories />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="security" element={<SecurityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PeriodProvider>
  );
}

export default App;
