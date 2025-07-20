import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  Kitchen as KitchenIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [openReservationDialog, setOpenReservationDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reservationsRes, ordersRes, restaurantsRes] = await Promise.all([
        axios.get('/api/reservations'),
        axios.get('/api/orders'),
        axios.get('/api/restaurants')
      ]);
      setReservations(reservationsRes.data);
      setOrders(ordersRes.data);
      setRestaurants(restaurantsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleReservationUpdate = async () => {
    try {
      await axios.put(`/api/reservations/${selectedReservation.id}`, {
        status: selectedReservation.status
      });
      fetchData();
      setOpenReservationDialog(false);
      setSuccess('Reservation updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update reservation');
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchData();
      setSuccess('Order status updated successfully!');
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
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getOrderStatusColor = (status) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Restaurant Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => navigate('/restaurant')}
            sx={{ mr: 2 }}
          >
            <RestaurantIcon sx={{ mr: 1 }} />
            Restaurant View
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/kitchen')}
            sx={{ mr: 2 }}
          >
            <KitchenIcon sx={{ mr: 1 }} />
            Kitchen Display
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
          Admin Dashboard
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
          {/* Statistics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Reservations
                </Typography>
                <Typography variant="h4">
                  {reservations.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Orders
                </Typography>
                <Typography variant="h4">
                  {orders.filter(o => o.status !== 'served').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Restaurants
                </Typography>
                <Typography variant="h4">
                  {restaurants.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Today's Reservations
                </Typography>
                <Typography variant="h4">
                  {reservations.filter(r => 
                    new Date(r.reservation_date).toDateString() === new Date().toDateString()
                  ).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Reservations Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Reservations
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Guests</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reservations.slice(0, 10).map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>#{reservation.id}</TableCell>
                          <TableCell>User #{reservation.user_id}</TableCell>
                          <TableCell>{formatDate(reservation.reservation_date)}</TableCell>
                          <TableCell>{reservation.reservation_time}</TableCell>
                          <TableCell>{reservation.guests}</TableCell>
                          <TableCell>
                            <Chip
                              label={reservation.status.toUpperCase()}
                              color={getStatusColor(reservation.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setOpenReservationDialog(true);
                              }}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Orders Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Orders
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 10).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>User #{order.user_id}</TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip
                              label={order.status.toUpperCase()}
                              color={getOrderStatusColor(order.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={order.status}
                                onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                              >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="preparing">Preparing</MenuItem>
                                <MenuItem value="ready">Ready</MenuItem>
                                <MenuItem value="served">Served</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Reservation Update Dialog */}
      <Dialog open={openReservationDialog} onClose={() => setOpenReservationDialog(false)}>
        <DialogTitle>Update Reservation Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Reservation #{selectedReservation?.id} - {selectedReservation?.guests} guests
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedReservation?.status || ''}
              label="Status"
              onChange={(e) => setSelectedReservation({
                ...selectedReservation,
                status: e.target.value
              })}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReservationDialog(false)}>Cancel</Button>
          <Button onClick={handleReservationUpdate} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard; 