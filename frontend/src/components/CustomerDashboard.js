import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Schedule as ScheduleIcon,
  RestaurantMenu as RestaurantMenuIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    guests: 1,
    special_requests: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [minAvailableTables, setMinAvailableTables] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('/api/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const handleRestaurantSelect = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    try {
      const response = await axios.get(`/api/restaurants/${restaurant.id}/tables`);
      setTables(response.data);
      setOpenBooking(true);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleBookingSubmit = async () => {
    try {
      // Find available table for the number of guests
      const availableTable = tables.find(table => 
        table.capacity >= bookingData.guests && table.status === 'available'
      );

      if (!availableTable) {
        setError('No available tables for the requested number of guests');
        return;
      }

      const reservationData = {
        table_id: availableTable.id,
        restaurant_id: selectedRestaurant.id,
        reservation_date: bookingData.date,
        reservation_time: bookingData.time,
        guests: bookingData.guests,
        special_requests: bookingData.special_requests
      };

      await axios.post('/api/reservations', reservationData);
      
      setSuccess('Reservation created successfully!');
      setOpenBooking(false);
      setBookingData({
        date: '',
        time: '',
        guests: 1,
        special_requests: ''
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create reservation');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  // Extract city and district from address
  const getCity = (address) => address?.split(',').slice(-2)[0]?.trim() || '';
  const getDistrict = (address) => address?.split(',').slice(-1)[0]?.trim() || '';
  // Map restaurant id to available tables
  const availableTablesMap = useMemo(() => {
    const map = {};
    restaurants.forEach(r => {
      axios.get(`/api/restaurants/${r.id}/tables`).then(res => {
        map[r.id] = res.data.filter(t => t.status === 'available').length;
      });
    });
    return map;
  }, [restaurants]);
  // Unique values for filters
  const cuisines = Array.from(new Set(restaurants.map(r => r.cuisine).filter(Boolean)));
  const cities = Array.from(new Set(restaurants.map(r => getCity(r.address)).filter(Boolean)));
  const districts = Array.from(new Set(restaurants.map(r => getDistrict(r.address)).filter(Boolean)));
  // Filtering logic
  const filteredRestaurants = restaurants.filter(r => {
    if (cuisineFilter && r.cuisine !== cuisineFilter) return false;
    if (cityFilter && getCity(r.address) !== cityFilter) return false;
    if (districtFilter && getDistrict(r.address) !== districtFilter) return false;
    // availableTablesMap[r.id] may be undefined on first render, so skip filter if so
    if (minAvailableTables > 0 && availableTablesMap[r.id] !== undefined && availableTablesMap[r.id] < minAvailableTables) return false;
    return true;
  });
  // Restaurant images by name/cuisine
  const restaurantImages = {
    'Fine Dining Restaurant': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    'Kebab Haus': 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80',
    'Pizza Napoli': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    'Sushi Meister': 'https://images.unsplash.com/photo-1541544181051-94c1c7c623f4?auto=format&fit=crop&w=600&q=80',
    'Bavarian Bräuhaus': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <RestaurantMenuIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Restaurant Booking System
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{
        width: '100%',
        minHeight: 300,
        backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 4,
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Typography variant="h2" sx={{ color: '#fff', fontWeight: 700, textShadow: '2px 2px 8px #000' }}>
          Willkommen bei Kebab Haus Berlin
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Available Restaurants
        </Typography>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3, maxWidth: 900 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Cuisine</InputLabel>
              <Select
                value={cuisineFilter}
                label="Cuisine"
                onChange={e => setCuisineFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {cuisines.map(cuisine => (
                  <MenuItem key={cuisine} value={cuisine}>{cuisine}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select
                value={cityFilter}
                label="City"
                onChange={e => setCityFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {cities.map(city => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>District</InputLabel>
              <Select
                value={districtFilter}
                label="District"
                onChange={e => setDistrictFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {districts.map(district => (
                  <MenuItem key={district} value={district}>{district}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Min. Available Tables"
              value={minAvailableTables}
              onChange={e => setMinAvailableTables(Number(e.target.value))}
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>

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
          {filteredRestaurants.map((restaurant, idx) => (
            <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 6, display: 'flex', flexDirection: 'column', minHeight: 350 }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={restaurantImages[restaurant.name] || 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=600&q=80'}
                  alt={restaurant.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {restaurant.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {restaurant.cuisine} • {getCity(restaurant.address)}, {getDistrict(restaurant.address)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {restaurant.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <b>Available Tables:</b> {availableTablesMap[restaurant.id] !== undefined ? availableTablesMap[restaurant.id] : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    {restaurant.opening_hours}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleRestaurantSelect(restaurant)}
                    sx={{
                      background: 'linear-gradient(90deg, #d7263d 0%, #f46036 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: 2,
                      '&:hover': { background: 'linear-gradient(90deg, #f46036 0%, #d7263d 100%)' }
                    }}
                  >
                    Tisch reservieren
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Book Table at {selectedRestaurant?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={bookingData.date}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Time</InputLabel>
                <Select
                  value={bookingData.time}
                  label="Time"
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                >
                  {timeSlots.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Number of Guests</InputLabel>
                <Select
                  value={bookingData.guests}
                  label="Number of Guests"
                  onChange={(e) => setBookingData({ ...bookingData, guests: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Special Requests"
                value={bookingData.special_requests}
                onChange={(e) => setBookingData({ ...bookingData, special_requests: e.target.value })}
                placeholder="Any special requests or dietary requirements..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBooking(false)}>Cancel</Button>
          <Button 
            onClick={handleBookingSubmit} 
            variant="contained"
            disabled={!bookingData.date || !bookingData.time}
          >
            Book Table
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerDashboard; 