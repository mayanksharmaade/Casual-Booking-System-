# Casual Booking System

A workforce scheduling and casual staff booking platform built with **ASP.NET Core**, **Angular**, **Entity Framework Core**, and **SQL Server**.

The system is designed for stores that manage a mix of **Store Managers, Assistant Managers, Full-Time employees, Part-Time employees, Volunteers, and Casual workers**.

It supports daily workforce planning, employee rostering, casual booking requests, availability, staffing gaps, labour-cost tracking, budgets, approvals, and area-level workforce management.

---

## Overview

The Casual Booking System provides role-based workflows for:

- Super Admin
- Store Manager
- Assistant Manager
- Casual Worker
- Area Manager

The platform is designed around real workforce scheduling rules rather than simple calendar booking.

Key business logic includes:

Resolves existing business problem at organization , which involves multiple Excel sheets to book casuals workers for shifts .

- No Sunday bookings or roster entries
- Maximum 8-hour scheduled shift
- 30-minute unpaid meal break when a shift exceeds 5 hours
- Maximum 37.5 paid hours per week
- Individual employee hourly rates
- 25% Casual loading
- 25% Saturday loading
- Volunteer staff are unpaid
- Accepted Casual bookings contribute to Store labour cost
- Staff absences automatically create staffing-gap visibility where applicable
- Casual bookings can be accepted, declined, cancelled, completed, and rated
- Stores operate within assigned zones
- Area Managers can manage workforce coverage across assigned zones
  

---

# Technology Stack

## Backend

- .NET / ASP.NET Core Web API
- C#
- Entity Framework Core
- SQL Server
- ASP.NET Core Identity
- JWT Authentication
- Role-Based Authorization
- Dependency Injection
- Repository Pattern
- Service Layer
- Clean Architecture style separation

## Frontend

- Angular 22
- TypeScript
- Standalone Components
- Angular Router
- HttpClient
- RxJS
- Reactive API integration
- Custom SCSS responsive UI

## Database

- SQL Server
- Entity Framework Core migrations

---

# Architecture

The backend follows a simplified Clean Architecture structure:

```text
CasualBookingSystem
│
├── CasualBookingSystem.Domain
│   ├── Entities
│   ├── Enums
│   └── Common
│
├── CasualBookingSystem.Application
│   ├── DTOs
│   ├── Interfaces
│   ├── Services
│   └── Business Rules
│
├── CasualBookingSystem.Infrastructure
│   ├── Persistence
│   ├── Repositories
│   ├── Identity
│   └── External Services
│
└── CasualBookingSystem.API
    ├── Controllers
    ├── Authentication
    ├── Configuration
    └── Program.cs
