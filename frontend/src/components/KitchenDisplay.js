import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Kitchen as KitchenIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      setSuccess(`Order #${orderId} status updated to ${newStatus}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update order status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'primary';
      case 'served':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTimeElapsed = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <KitchenIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kitchen Display System
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            <DashboardIcon sx={{ mr: 1 }} />
            Admin Dashboard
          </Button>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Kitchen Orders
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Pending Orders */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '70vh', overflow: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
                  Pending Orders ({pendingOrders.length})
                </Typography>
                <List>
                  {pendingOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6">
                                Order #{order.id}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimerIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">
                                  {getTimeElapsed(order.created_at)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Table: {order.table_id} • ${order.total.toFixed(2)}
                              </Typography>
                              <List dense>
                                {order.items?.map((item, index) => (
                                  <ListItem key={index} sx={{ py: 0 }}>
                                    <ListItemText
                                      primary={`${item.quantity}x ${item.name}`}
                                      secondary={item.notes && `Notes: ${item.notes}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                sx={{ mt: 1 }}
                              >
                                Start Preparing
                              </Button>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Preparing Orders */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '70vh', overflow: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
                  Preparing ({preparingOrders.length})
                </Typography>
                <List>
                  {preparingOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6">
                                Order #{order.id}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimerIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">
                                  {getTimeElapsed(order.created_at)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Table: {order.table_id} • ${order.total.toFixed(2)}
                              </Typography>
                              <List dense>
                                {order.items?.map((item, index) => (
                                  <ListItem key={index} sx={{ py: 0 }}>
                                    <ListItemText
                                      primary={`${item.quantity}x ${item.name}`}
                                      secondary={item.notes && `Notes: ${item.notes}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStatusUpdate(order.id, 'ready')}
                                sx={{ mt: 1 }}
                              >
                                Mark Ready
                              </Button>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Ready Orders */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '70vh', overflow: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                  Ready to Serve ({readyOrders.length})
                </Typography>
                <List>
                  {readyOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="h6">
                                Order #{order.id}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimerIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">
                                  {getTimeElapsed(order.created_at)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                Table: {order.table_id} • ${order.total.toFixed(2)}
                              </Typography>
                              <List dense>
                                {order.items?.map((item, index) => (
                                  <ListItem key={index} sx={{ py: 0 }}>
                                    <ListItemText
                                      primary={`${item.quantity}x ${item.name}`}
                                      secondary={item.notes && `Notes: ${item.notes}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStatusUpdate(order.id, 'served')}
                                sx={{ mt: 1 }}
                              >
                                Mark Served
                              </Button>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Chip 
                label={`Pending: ${pendingOrders.length}`} 
                color="warning" 
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={`Preparing: ${preparingOrders.length}`} 
                color="info" 
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={`Ready: ${readyOrders.length}`} 
                color="primary" 
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Chip 
                label={`Total Active: ${pendingOrders.length + preparingOrders.length + readyOrders.length}`} 
                color="success" 
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

export default KitchenDisplay; 