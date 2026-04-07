# System Architecture

## Project Overview

The system is a **Multivendor Marketplace Platform** with a **seller rating management module** and a **dispute resolution system**.

The application allows multiple sellers to publish products and buyers to purchase them. The system also supports reviews, seller ratings, and dispute handling moderated by administrators.

The platform is implemented as a **distributed web application** consisting of two independent projects:

1. Backend (Spring Boot REST API)
2. Frontend (React + TypeScript SPA)

Both projects communicate via HTTP/HTTPS using JSON.

---

# High-Level Architecture

The system follows **Clean Architecture (Hexagonal Architecture)** principles.

Layers are organized as follows:


Frontend (React SPA)
↓ HTTP REST API
Backend (Spring Boot)


Backend layers:


presentation (controllers, DTO)
↓
application (use cases / services)
↓
domain (entities, business rules)
↓
infrastructure (database, external APIs)


This architecture ensures:

- separation of concerns
- maintainability
- testability
- scalability

---

# Backend Architecture

The backend is implemented using **Spring Boot 3+** with **Java 21**.

The project follows a **modular monolith structure** with domain-based modules.

Example project structure:


backend/
src/main/java/com/marketplace

config/
security/
websocket/

presentation/
controllers/
dto/

application/
services/
usecases/

domain/
entities/
valueobjects/
interfaces/

infrastructure/
repositories/
external/
persistence/


---

# Architectural Principles

The system must follow these principles:

SOLID  
DRY  
KISS  
YAGNI

Business logic must exist only inside **domain and application layers**.

Controllers must only handle:

- request validation
- DTO mapping
- calling services

Repositories must only handle **data access**.

---

# Design Patterns

The system implements several design patterns:

Repository Pattern  
Strategy Pattern  
Factory Pattern  
Observer Pattern  
Builder Pattern  
Facade Pattern

Examples:

Strategy Pattern → Seller rating calculation

Observer Pattern → Notifications (rating updates, disputes)

Factory Pattern → Payment processing

Builder Pattern → Complex DTO creation

Facade Pattern → Order processing logic

---

# Frontend Architecture

Frontend is a **Single Page Application (SPA)** built with:

React 18  
TypeScript  
Vite

State management:

Zustand or Redux Toolkit

Main libraries:

React Router  
TanStack Query  
Axios  
React Hook Form  
Zod validation  
Tailwind CSS

Frontend communicates only through the **REST API**.

---

# Domain Model Overview

Core domain entities:

User  
Product  
Category  
Order  
OrderItem  
Review  
SellerRating  
Dispute  
Message  
Payment

Relationships:

Users can be buyers or sellers.

A seller can publish many products.

Products belong to categories.

Buyers can place orders containing multiple products.

Buyers can review products and rate sellers.

Disputes can be opened for orders.

Moderators resolve disputes.

---

# Core Modules

The system is divided into several modules.

## User Management

Handles:

- user registration
- authentication
- authorization
- profile management

Roles:

ADMIN  
SELLER  
BUYER  
MODERATOR

Authentication uses JWT tokens.

---

## Product Catalog

Allows sellers to:

- create products
- edit products
- manage inventory

Buyers can:

- browse catalog
- filter products
- search products
- view product details

---

## Order Management

Handles:

- order creation
- order status
- order history
- payments

Order statuses:

CREATED  
PAID  
SHIPPED  
DELIVERED  
CANCELLED

---

## Review System

Buyers can leave reviews for products.

Review fields:

rating  
comment  
date

Reviews affect product reputation.

---

## Seller Rating System

Buyers can rate sellers after completing an order.

Rating includes:

score (1–5)
comment

Seller reputation score is calculated using a **Strategy Pattern**.

Example formula:

weighted average based on recent ratings.

---

## Dispute Resolution System

Buyers can open disputes for problematic orders.

Dispute lifecycle:

OPEN  
UNDER_REVIEW  
RESOLVED  
REJECTED

Moderators manage dispute resolution.

Disputes include:

description  
evidence  
messages between buyer and moderator

---

# API Design

The backend exposes a **RESTful API**.

Base path:


/api/v1/


Supported methods:

GET  
POST  
PUT  
PATCH  
DELETE

API supports:

pagination  
sorting  
filtering

Example:


GET /api/v1/products?page=0&size=20&sort=price


API documentation is provided via **OpenAPI (Swagger)**.

---

# Database Architecture

The system uses **PostgreSQL** as the main database.

Database schema follows **3rd Normal Form (3NF)**.

Key tables:

users  
roles  
products  
categories  
orders  
order_items  
reviews  
seller_ratings  
disputes  
messages  
payments

Schema migrations are managed using **Flyway**.

---

# Caching Layer

Redis is used for caching:

product catalog  
top products  
seller rating aggregates

This reduces database load.

---

# Security Architecture

Authentication:

JWT access tokens  
refresh tokens

Authorization:

RBAC (Role-Based Access Control)

Security features:

BCrypt password hashing  
Spring Security  
method-level security (@PreAuthorize)

---

# External Integrations

The system integrates with external APIs.

Example integrations:

Google OAuth login  
Google Maps API for addresses

These integrations are implemented using REST clients.

---

# Real-Time Features

Optional real-time features can be implemented using **WebSockets**.

Examples:

new order notifications  
new dispute alerts  
rating updates

---

# Testing Strategy

Two types of testing are used.

## Unit Testing

Frameworks:

JUnit 5  
Mockito

Unit tests cover business logic.

---

## Integration Testing

Integration tests verify:

REST API  
database operations

Tools:

Testcontainers  
Spring Boot Test

---

# Deployment

The system is containerized using Docker.

Services:

backend  
frontend  
postgres  
redis

Docker Compose is used for local development.

---

# Monitoring

Optional monitoring tools:

Spring Boot Actuator  
Micrometer  
Prometheus  
Grafana

These provide metrics and system health monitoring.

---

# Performance Goals

API response time:

less than 200 ms for 95% of requests.

Performance optimizations:

database indexing  
query optimization  
Redis caching

---

# Summary

The system implements a scalable marketplace architecture using modern technologies.

Key features:

Clean Architecture backend  
React SPA frontend  
RESTful API  
PostgreSQL database  
JWT security  
seller rating system  
dispute resolution system  
Docker-based deployment

The architecture ensures maintainability, modularity, and scalability.