import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PeriodProvider } from './context/PeriodContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdminRules } from './components/AdminRules';
import { AdminCategories } from './components/AdminCategories';
import { TransactionsPage } from './components/TransactionsPage';
import { ReportsPage } from './components/ReportsPage';
import { SecurityPage } from './components/SecurityPage';
import { Login } from './components/Login';
import { RequireAuth } from './components/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <PeriodProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
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
    </AuthProvider>
  );
}

export default App;
