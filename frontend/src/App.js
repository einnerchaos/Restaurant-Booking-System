import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import RestaurantView from './components/RestaurantView';
import KitchenDisplay from './components/KitchenDisplay';
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/customer" 
              element={
                <PrivateRoute>
                  <CustomerDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/restaurant" 
              element={
                <PrivateRoute>
                  <RestaurantView />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/kitchen" 
              element={
                <PrivateRoute>
                  <KitchenDisplay />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 