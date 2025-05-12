const request = require('supertest');
const express = require('express');
const { hotels } = require('../../models/hotel');
const hotelController = require('../../controllers/hotelController');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Define the routes for testing
app.get('/api/hotels', hotelController.getAllHotels);
app.get('/api/hotels/:id', hotelController.getHotelById);
app.post('/api/hotels', hotelController.createHotel);
app.put('/api/hotels/:id', hotelController.updateHotel);

let userControllerBoundaryTest = `UserController boundary test`;

describe('User Controller', () => {
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
        it(`${userControllerBoundaryTest} should return all hotels`, async () => {
            const response = await request(app).get('/api/hotels');
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(2); // Ensure there are two hotels
            expect(response.body[0].name).toBe('Hotel Sunshine');
        });

        // Test for GET /api/hotels/:id (Get hotel by ID)
        it(`${userControllerBoundaryTest} should return a hotel by ID`, async () => {
            const response = await request(app).get('/api/hotels/1');
            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Hotel Sunshine');
        });

        it(`${userControllerBoundaryTest} should return a 404 if hotel not found`, async () => {
            const response = await request(app).get('/api/hotels/999');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Hotel not found');
        });

        // Test for POST /api/hotels (Create a hotel)
        it(`${userControllerBoundaryTest} should create a new hotel`, async () => {
            const newHotel = { name: 'Hotel California', location: 'Los Angeles', pricePerNight: 300 };
            const response = await request(app)
                .post('/api/hotels')
                .send(newHotel);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Hotel created successfully');
            expect(response.body.hotel.name).toBe('Hotel California');
            expect(hotels.length).toBe(3); // Ensure hotel is added to the array
        });

        // Test for PUT /api/hotels/:id (Update hotel)
        it(`${userControllerBoundaryTest} should update an existing hotel`, async () => {
            const updatedHotel = { name: 'Hotel Mirage', location: 'Las Vegas', pricePerNight: 300 };
            const response = await request(app)
                .put('/api/hotels/2')
                .send(updatedHotel);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Hotel updated successfully');
            expect(response.body.hotel.name).toBe('Hotel Mirage');
            expect(response.body.hotel.location).toBe('Las Vegas');
        });

        it(`${userControllerBoundaryTest} should return 404 if hotel to update is not found`, async () => {
            const updatedHotel = { name: 'Hotel Mirage', location: 'Las Vegas', pricePerNight: 300 };
            const response = await request(app)
                .put('/api/hotels/999')
                .send(updatedHotel);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Hotel not found');
        });
    });
});
