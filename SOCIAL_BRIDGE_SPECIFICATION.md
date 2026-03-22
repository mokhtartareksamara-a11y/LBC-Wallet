# SOCIAL_BRIDGE_SPECIFICATION

## Introduction
This document outlines the architecture of the Social-Bridge system within the LBC Wallet. It covers various aspects of event patterns, integrations, workflows, and notification systems critical for seamless operation.

## 1. Activity Event Patterns
### Marketplace Purchases
- **Event Name**: `MarketplacePurchaseEvent`
- **Description**: Triggered when a user makes a purchase in the marketplace.
- **Attributes**:
  - `userId`: ID of the user who made the purchase
  - `itemId`: ID of the purchased item
  - `purchaseDate`: Timestamp of the purchase
  - `amount`: Total amount spent

### Service Bookings
- **Event Name**: `ServiceBookingEvent`
- **Description**: Triggered when a user books a service.
- **Attributes**:
  - `userId`: ID of the user who booked the service
  - `serviceId`: ID of the booked service
  - `bookingDate`: Timestamp of booking
  - `amount`: Total amount charged

### Travel Events
- **Event Name**: `TravelEvent`
- **Description**: Triggered when a user books travel arrangements.
- **Attributes**:
  - `userId`: ID of the user who booked travel
  - `travelId`: ID of the travel itinerary
  - `travelDate`: Date of travel
  - `amount`: Total cost of the travel booking

## 2. Event-Driven Integration with the Social Hub
- The Social Bridge will integrate with the Social Hub using an event-driven architecture. 
- Each event type will publish messages to a message queue, which the Social Hub will subscribe to.
- This will allow synchronization of user-related activities in real time across platforms, enhancing user engagement via social interactions and updates.

## 3. AI Post Generation Workflows
- Upon successful wallet transactions, an AI-driven post generation workflow is triggered. 
- **Workflow Steps**:
  1. Detect event type (purchase, booking, etc.).
  2. Generate content relevant to the event using AI algorithms.
  3. Post content to the user’s profile.
- **Example**: After a purchase of a Lab Diamond Ring, an AI-generated post might highlight the beauty and significance of the purchase, tagging the marketplace involved.

## 4. Real-Time Notification System
- A notification system will be set up to provide users with real-time updates about their transactions and activities related to the Social Hub. 
- Notifications will be generated for:
  - Successful transactions
  - Upcoming service bookings
  - Travel reminders
- Notifications will utilize WebSocket connections for instant delivery.

## 5. Example Scenarios
### Lab Diamond Ring Purchases
- User purchases a Lab Diamond Ring from the marketplace. The following events occur:
  1. `MarketplacePurchaseEvent` is triggered.
  2. A personalized post is generated detailing the purchase.
  3. User receives a notification about their purchase.

### Paris Trip Bookings
- User books a trip to Paris. The following events occur:
  1. `TravelEvent` is triggered.
  2. An engaging post is created about their upcoming trip.
  3. User receives a travel booking confirmation notification.

## API Specifications
### Events API
- **POST /events**: Create a new event.
  - **Request Body**:
    ```json
    {
      "type": "MarketplacePurchaseEvent",
      "attributes": {
        "userId": "string",
        "itemId": "string",
        "purchaseDate": "2026-03-22T00:48:50Z",
        "amount": "number"
      }
    }
    ```
- **GET /events/{id}**: Retrieve an event by ID.

### Notification API
- **POST /notifications**: Send a notification to the user.
- **GET /notifications/{userId}**: Retrieve notifications for a specific user.

## Message Queue Integration
- The Social Bridge will utilize a message queue (e.g., RabbitMQ, Kafka) to handle events and notifications.
- Each event will be queued and processed asynchronously to ensure scalability and reliability of the system.

---
This document is intended to evolve alongside the Social-Bridge architecture, incorporating enhancements and feedback from ongoing implementations.