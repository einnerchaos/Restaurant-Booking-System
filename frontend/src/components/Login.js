import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Navigate based on role
      if (role === 'customer') {
        navigate('/customer');
      } else if (role === 'restaurant_admin') {
        navigate('/admin');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Fullscreen background image */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80)', // Döner counter
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(2px) brightness(0.7)',
      }} />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
          width: '100%',
        }}
      >
        <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3, background: 'rgba(255,255,255,0.95)', minHeight: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <img src="https://img.icons8.com/color/96/000000/chef-hat.png" alt="Restaurant Logo" style={{ width: 70, marginBottom: 8, borderRadius: 2, background: '#fff' }} />
            <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: '#d7263d' }}>
              Kebab Haus Berlin
            </Typography>
          </Box>
          <Typography component="h2" variant="h6" align="center" color="textSecondary" gutterBottom>
            Sign in to your account
          </Typography>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={handleRoleChange}
              aria-label="role selection"
            >
              <ToggleButton value="customer" aria-label="customer">
                Customer
              </ToggleButton>
              <ToggleButton value="restaurant_admin" aria-label="restaurant admin">
                Restaurant Admin
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3, mb: 2,
                background: 'linear-gradient(90deg, #d7263d 0%, #f46036 100%)',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': { background: 'linear-gradient(90deg, #f46036 0%, #d7263d 100%)' }
              }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          <Typography variant="body2" color="textSecondary" align="center">
            Demo Credentials:<br/>
            Customer: customer@example.com / customer123<br/>
            Admin: admin@restaurant.com / admin123
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 