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
  Chip
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  TableRestaurant as TableIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RestaurantView() {
  const [restaurants, setRestaurants] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [restaurantsRes, reservationsRes] = await Promise.all([
        axios.get('/api/restaurants'),
        axios.get('/api/reservations')
      ]);
      setRestaurants(restaurantsRes.data);
      setReservations(reservationsRes.data);
      
      if (restaurantsRes.data.length > 0) {
        setSelectedRestaurant(restaurantsRes.data[0]);
        const tablesRes = await axios.get(`/api/restaurants/${restaurantsRes.data[0].id}/tables`);
        setTables(tablesRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRestaurantChange = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    try {
      const response = await axios.get(`/api/restaurants/${restaurant.id}/tables`);
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const getTableStatus = (tableId) => {
    const reservation = reservations.find(r => 
      r.table_id === tableId && 
      r.status === 'confirmed' &&
      new Date(r.reservation_date).toDateString() === new Date().toDateString()
    );
    return reservation ? 'reserved' : 'available';
  };

  const getTableReservation = (tableId) => {
    return reservations.find(r => 
      r.table_id === tableId && 
      r.status === 'confirmed' &&
      new Date(r.reservation_date).toDateString() === new Date().toDateString()
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'reserved':
        return 'warning';
      case 'occupied':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <TableIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Restaurant Table Management
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
          Table Management
        </Typography>



        {/* Restaurant Selector */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Restaurant
          </Typography>
          <Grid container spacing={2}>
            {restaurants.map((restaurant) => (
              <Grid item key={restaurant.id}>
                <Button
                  variant={selectedRestaurant?.id === restaurant.id ? "contained" : "outlined"}
                  onClick={() => handleRestaurantChange(restaurant)}
                >
                  {restaurant.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {selectedRestaurant && (
          <>
            <Typography variant="h5" gutterBottom>
              {selectedRestaurant.name} - Table Layout
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              {selectedRestaurant.address} • {selectedRestaurant.opening_hours}
            </Typography>

            {/* Table Grid */}
            <Grid container spacing={2}>
              {tables.map((table) => {
                const status = getTableStatus(table.id);
                const reservation = getTableReservation(table.id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
                    <Card 
                      sx={{ 
                        height: 150,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                        <Typography variant="h4" component="div" gutterBottom>
                          Table {table.table_number}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Capacity: {table.capacity} guests
                        </Typography>
                        <Chip
                          label={status.toUpperCase()}
                          color={getStatusColor(status)}
                          size="small"
                        />
                        {reservation && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block">
                              Reserved for {reservation.guests} guests
                            </Typography>
                            <Typography variant="caption" display="block">
                              {reservation.reservation_time}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Legend */}
            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Legend
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Chip label="AVAILABLE" color="success" size="small" />
                </Grid>
                <Grid item>
                  <Chip label="RESERVED" color="warning" size="small" />
                </Grid>
                <Grid item>
                  <Chip label="OCCUPIED" color="error" size="small" />
                </Grid>
              </Grid>
            </Box>

            {/* Today's Reservations Summary */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Today's Reservations
              </Typography>
              <Grid container spacing={2}>
                {reservations
                  .filter(r => 
                    r.restaurant_id === selectedRestaurant.id &&
                    new Date(r.reservation_date).toDateString() === new Date().toDateString()
                  )
                  .map((reservation) => (
                    <Grid item xs={12} sm={6} md={4} key={reservation.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">
                            Table {tables.find(t => t.id === reservation.table_id)?.table_number}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {reservation.guests} guests • {reservation.reservation_time}
                          </Typography>
                          <Chip
                            label={reservation.status.toUpperCase()}
                            color={getStatusColor(reservation.status)}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

export default RestaurantView; 