const request = require('supertest');
const express = require('express');
const userController = require('../../controllers/userController'); // Your user controller
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Define the user registration route
app.post('/api/users/register', userController.registerUser);

let userRoutesBoundaryTest = `UserRoutes boundary test`;

describe('User Routes', () => {
    describe('boundary', () => {
        // Test for successful registration
        it(`${userRoutesBoundaryTest} should successfully register a new user`, async () => {
            const newUser = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'john123',
                age: 28,
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(newUser);

            expect(response.status).toBe(201); // User successfully registered
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.user.name).toBe('John Doe');
            expect(response.body.user.email).toBe('john@example.com');
        });

        // Test for duplicate user registration (email already taken)
        it(`${userRoutesBoundaryTest} should return a 400 error if the email already exists`, async () => {
            // First, register a user
            const existingUser = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'jane123',
                age: 25,
            };

            await request(app).post('/api/users/register').send(existingUser);

            // Attempt to register with the same email
            const newUser = {
                name: 'John Doe',
                email: 'jane@example.com', // Duplicate email
                password: 'john123',
                age: 28,
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(newUser);

            expect(response.status).toBe(400); // Duplicate email
            expect(response.body.message).toBe('User already exists');
        });

        // Test for missing required fields
        it(`${userRoutesBoundaryTest} should return a 400 error if required fields are missing`, async () => {
            const incompleteUser = {
                name: 'John Doe',
                email: 'john@example.com',
                // Missing password
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(incompleteUser);

            expect(response.status).toBe(400); // Missing password
        });

        // Test for password hashing
        it(`${userRoutesBoundaryTest} should store the password in hashed form`, async () => {
            const userToRegister = {
                name: 'Sam Smith',
                email: 'sam@example.com',
                password: 'sam123',
                age: 30,
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userToRegister);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.user.passwordHash).toBeDefined();
            expect(response.body.user.passwordHash).not.toBe(userToRegister.password); // Ensure password is hashed
        });
    });
});
