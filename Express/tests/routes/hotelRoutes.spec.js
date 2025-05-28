const request = require('supertest');
const express = require('express');
const hotelController = require('../../controllers/hotelController');
const authMiddleware = require('../../middleware/authMiddleware');
const { hotels } = require('../../models/hotel');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Define routes for the test
app.get('/api/hotels', hotelController.getAllHotels);
app.get('/api/hotels/:id', hotelController.getHotelById);
app.post('/api/hotels', authMiddleware, hotelController.createHotel);
app.put('/api/hotels/:id', authMiddleware, hotelController.updateHotel);

// Mock authentication middleware for testing
jest.mock('../../middleware/authMiddleware', () => jest.fn((req, res, next) => next()));

let hotelRoutesBoundaryTest = `HotelRoutes boundary test`;

describe('Hotel Routes', () => {
  describe('boundary', () => {
    beforeEach(() => {
      // Reset the hotels array before each test
      hotels.length = 0;
      hotels.push(
        { id: 1, name: 'Hotel Sunshine', location: 'Paris', pricePerNight: 200 },
        { id: 2, name: 'Hotel Mirage', location: 'New York', pricePerNight: 250 }
      );
    });

    // Test for GET /api/hotels (Get all hotels)
    it(`${hotelRoutesBoundaryTest} should return all hotels (public route)`, async () => {
      const response = await request(app).get('/api/hotels');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2); // Ensure there are two hotels
      expect(response.body[0].name).toBe('Hotel Sunshine');
    });

    // Test for GET /api/hotels/:id (Get hotel by ID)
    it(`${hotelRoutesBoundaryTest} should return a hotel by ID (public route)`, async () => {
      const response = await request(app).get('/api/hotels/1');
      expect(response.status).toBe(200);
      expect(response.body.name).toMatch(/hotel Sunshine/i);
    });

    it(`${hotelRoutesBoundaryTest} should return 404 if hotel not found (public route)`, async () => {
      const response = await request(app).get('/api/hotels/999');
      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/hotel not found/i);
    });

    it(`${hotelRoutesBoundaryTest} should create a new hotel (protected route with correct auth)`, async () => {
      const newHotel = { name: 'Hotel California', location: 'Los Angeles', pricePerNight: 300 };

      // Simulate correct authentication by passing Basic Auth in headers
      const response = await request(app)
        .post('/api/hotels')
        .set('Authorization', 'Basic YWRtaW5AZXhhbXBsZS5jb206YWRtaW4xMjM=') // Base64: admin@example.com:admin123
        .send(newHotel);

      expect(response.status).toBe(201); // Hotel created
      expect(response.body.message).toMatch(/hotel created successfully/i);
      expect(response.body.hotel.name).toMatch(/hotel California/i);
      expect(hotels.length).toBe(3); // Ensure hotel is added to the array
    });

    it(`${hotelRoutesBoundaryTest} should update an existing hotel (protected route with correct auth)`, async () => {
      const updatedHotel = { name: 'Hotel Mirage', location: 'Las Vegas', pricePerNight: 300 };

      // Simulate correct authentication by passing Basic Auth in headers
      const response = await request(app)
        .put('/api/hotels/1')
        .set('Authorization', 'Basic YWRtaW5AZXhhbXBsZS5jb206YWRtaW4xMjM=') // Base64: admin@example.com:admin123
        .send(updatedHotel);

      expect(response.status).toBe(200); // Hotel updated
      expect(response.body.message).toMatch(/hotel updated successfully/i);
      expect(response.body.hotel.name).toMatch(/hotel Mirage/i);
      expect(response.body.hotel.location).toMatch(/las Vegas/i);
    });

    it(`${hotelRoutesBoundaryTest} should return 404 if hotel to update is not found (protected route)`, async () => {
      const updatedHotel = { name: 'Hotel Mirage', location: 'Las Vegas', pricePerNight: 300 };

      const response = await request(app)
        .put('/api/hotels/999')
        .set('Authorization', 'Basic YWRtaW5AZXhhbXBsZS5jb206YWRtaW4xMjM=') // Base64: admin@example.com:admin123
        .send(updatedHotel);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/hotel not found/i);
    });
  });
});
