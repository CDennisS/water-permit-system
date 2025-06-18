# Water Permit Management System

A comprehensive web application for managing water permits, built with Flask and deployed on Vercel.

## Features

- User authentication and role-based access control
- Permit application management
- Document upload and management
- Activity logging and monitoring
- Export functionality (CSV, Excel, JSON)
- Advanced search and filtering
- Mobile-responsive design

## Tech Stack

- **Backend**: Python/Flask
- **Database**: PostgreSQL
- **File Storage**: AWS S3
- **Deployment**: Vercel
- **Frontend**: HTML, CSS, JavaScript
- **Monitoring**: Custom logging and monitoring system

## Prerequisites

- Python 3.9+
- Node.js and npm (for Vercel CLI)
- PostgreSQL database
- AWS S3 bucket
- Vercel account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/water-permit-system.git
cd water-permit-system
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
python seed.py
```

## Development

1. Run the development server:
```bash
flask run
```

2. Run tests:
```bash
python -m pytest
```

## Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
./deploy.sh
```

## Project Structure

```
water-permit-system/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   ├── static/
│   └── templates/
├── tests/
├── utils/
├── config.py
├── requirements.txt
├── seed.py
└── vercel.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@waterpermit.gov.zw or create an issue in the repository. 