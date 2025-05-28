const request = require('supertest');
const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware'); // Path to your authMiddleware
const { users } = require('../../models/user'); // Assuming you have a users model with email and passwordHash
const bcrypt = require('bcrypt');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Define a test route that uses the authMiddleware
app.post('/api/protected', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'Authorized' });
});

let authMiddlewareBoundaryTest = `AuthMiddleware boundary test`;

// Mocking the users array for testing
jest.mock('../../models/user', () => ({
    users: [
        {
            email: 'admin@example.com',
            passwordHash: '$2a$10$H7sRLDuY3lGhJ5vV2nTXcu9sJgy89.gAOXNh..5a0p./rNpeioxeC' // Hash for 'admin123'
        },
    ],
}));

describe('Auth Middleware', () => {
    describe('boundary', () => {

        // Test for missing Authorization header
        it(`${authMiddlewareBoundaryTest} should return 401 if Authorization header is missing`, async () => {
            const response = await request(app).post('/api/protected');
            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/authorization header is missing or malformed/i);
        });

        // Test for malformed Authorization header
        it(`${authMiddlewareBoundaryTest} should return 401 if Authorization header is malformed`, async () => {
            const response = await request(app)
                .post('/api/protected')
                .set('Authorization', 'Basic12345'); // Invalid header format

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/authorization header is missing or malformed/i);
        });

        // Test for missing username or password in Authorization header
        it(`${authMiddlewareBoundaryTest} should return 400 if username or password is missing in the Authorization header`, async () => {
            const invalidBase64 = Buffer.from(':admin123').toString('base64'); // Missing username
            const response = await request(app)
                .post('/api/protected')
                .set('Authorization', `Basic ${invalidBase64}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/username and password are required/i);
        });

        // Test for invalid username
        it(`${authMiddlewareBoundaryTest} should return 400 if username is incorrect`, async () => {
            const invalidBase64 = Buffer.from('invalid@example.com:admin123').toString('base64'); // Invalid email
            const response = await request(app)
                .post('/api/protected')
                .set('Authorization', `Basic ${invalidBase64}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/invalid username or password/i);
        });

        // Test for valid username and password
        it(`${authMiddlewareBoundaryTest} should return 200 and authorized message if username and password are correct`, async () => {
            const validBase64 = Buffer.from('admin@example.com:admin123').toString('base64'); // Correct credentials
            const response = await request(app)
                .post('/api/protected')
                .set('Authorization', `Basic ${validBase64}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/authorized/i);
        });

        // Test for bcrypt password comparison inside the middleware
        it(`${authMiddlewareBoundaryTest} should successfully compare the password with bcrypt hash`, async () => {
            const password = 'admin123'; // Correct password for 'admin@example.com'
            const passwordHash = await bcrypt.hash(password, 10);

            // Update the mock to include this hash (so we can verify the password comparison)
            users[0].passwordHash = passwordHash;

            const validBase64 = Buffer.from('admin@example.com:admin123').toString('base64');
            const response = await request(app)
                .post('/api/protected')
                .set('Authorization', `Basic ${validBase64}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/authorized/i);
        });
    });
});
