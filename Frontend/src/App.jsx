import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Context/ProtectedRoute';
import Login from './Pages/Login/Login';
import CryptoDetail from './Components/CryptoDetail/CryptoDetail';
import Signup from './Pages/Login/Signup';
import Portfolio from './Pages/Portfolio/Portfolio';
import DepositFunds from './Components/AddingFund/AddingFund';
import HomePage from './Pages/HomePage/HomePage';
import Watchlist from './Components/Watchlist/Watchlist';
import CryptoList from './Components/CryptoList/CryptoList';
import PasswordReset from './Pages/Login/PasswordReset';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/" element={<PasswordReset />} />


          <Route path="/user" element={
            <ProtectedRoute>
              <CryptoList />
            </ProtectedRoute>
          } />

          <Route path="/crypto/:symbol" element={
            <ProtectedRoute>
              <CryptoDetail />
            </ProtectedRoute>
          } />

          <Route path="/portfolio" element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          } />

          <Route path="/funds" element={
            <ProtectedRoute>
              <DepositFunds />
            </ProtectedRoute>
          } />

          <Route path="/watchlist" element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
