# Property Rent Tracker

## Overview

This is a Flask-based web application for tracking property rental payments. The application provides a simple interface for property managers to monitor rent collection status across multiple properties and time periods. It features a dashboard view, property management, and monthly tracking capabilities with data persistence through browser local storage.

## System Architecture

### Frontend Architecture
- **Framework**: Bootstrap 5 with dark theme
- **JavaScript**: Vanilla ES6 classes for application logic
- **Template Engine**: Jinja2 (Flask's default)
- **Styling**: Bootstrap CSS with custom CSS overrides
- **Icons**: Font Awesome 6.4.0

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **WSGI Server**: Gunicorn for production deployment
- **Session Management**: Flask's built-in session handling with secret key
- **Logging**: Python's built-in logging module

### Data Storage
- **Client-side Storage**: Browser localStorage for data persistence
- **Session Storage**: Flask sessions for temporary data
- **Database Ready**: PostgreSQL and Flask-SQLAlchemy dependencies included for future database integration

## Key Components

### Application Structure
1. **main.py**: Entry point that imports the Flask app
2. **app.py**: Core Flask application with route definitions
3. **templates/index.html**: Single-page application template
4. **static/js/app.js**: Client-side application logic using RentTracker class
5. **static/css/custom.css**: Custom styling on top of Bootstrap

### Core Features
1. **Dashboard**: Overview of all properties and rent collection statistics
2. **Property Management**: Add, edit, and manage rental properties
3. **Monthly Tracking**: Track rent payments by month and year
4. **Data Export**: Export data functionality for reporting

### JavaScript Architecture
- **RentTracker Class**: Main application controller
- **Local Storage Integration**: Automatic data persistence
- **Event-driven Architecture**: Bootstrap tabs and form interactions
- **Responsive Design**: Mobile-friendly interface

## Data Flow

1. **Application Initialization**: RentTracker class loads data from localStorage
2. **User Interactions**: Form submissions and clicks trigger class methods
3. **Data Persistence**: All changes automatically saved to localStorage
4. **View Updates**: UI components re-render when data changes
5. **Export Process**: Data serialization for external use

## External Dependencies

### Python Dependencies
- **Flask**: Web framework for backend routing and templating
- **Flask-SQLAlchemy**: ORM for future database integration
- **Gunicorn**: Production WSGI server
- **psycopg2-binary**: PostgreSQL adapter (for future use)
- **email-validator**: Email validation utilities

### Frontend Dependencies (CDN)
- **Bootstrap 5**: UI framework with dark theme
- **Font Awesome**: Icon library
- **Bootstrap JavaScript**: Interactive components

## Deployment Strategy

### Development Environment
- **Python Version**: 3.11
- **Package Manager**: uv for dependency management
- **Local Server**: Flask development server with debug mode

### Production Deployment
- **Platform**: Replit with autoscale deployment
- **Server**: Gunicorn with auto-reload and port reuse
- **Environment**: Nix-based with OpenSSL and PostgreSQL packages
- **Port Configuration**: Binds to 0.0.0.0:5000 for external access

### Configuration
- **Environment Variables**: SESSION_SECRET for production security
- **Logging**: Debug level logging enabled
- **Replit Integration**: Workflow configuration for seamless deployment

## Recent Changes

### June 22, 2025 - Complete Property Dashboard Redesign
- Redesigned homepage as property dashboard with individual property cards
- Added comprehensive renter information (name, contact, lease details)
- Implemented yearly rent increase calculations (percentage or fixed amount)
- Created rent collection workflow with payment mode tracking
- Added records history modal with filtering capabilities
- Implemented Excel export functionality with detailed reports
- Enhanced property cards with color-coded rent status (green=received, orange=pending)
- Added one-click rent collection with automatic date setting
- Integrated lease management with expected rent dates
- Added advanced property creation form with lease terms
- Applied northern lights theme with aurora-inspired gradients

## Changelog

- June 22, 2025. Initial setup with enhanced date tracking features

## User Preferences

Preferred communication style: Simple, everyday language.
UI Theme: Northern lights color scheme with aurora-inspired gradients and dark background.
Interface preference: Simple property dashboard layout with modal-based forms.