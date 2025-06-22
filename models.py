from app import db
from datetime import datetime
from sqlalchemy import JSON


class Property(db.Model):
    __tablename__ = 'properties'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=False)
    renter_name = db.Column(db.String(200), nullable=False)
    renter_contact = db.Column(db.String(200), nullable=True)
    initial_rent = db.Column(db.Numeric(10, 2), nullable=False)
    current_rent = db.Column(db.Numeric(10, 2), nullable=False)
    lease_start_date = db.Column(db.Date, nullable=False)
    expected_rent_date = db.Column(db.Integer, nullable=False)  # Day of month (1-31)
    yearly_increase_percent = db.Column(db.Numeric(5, 2), nullable=True)  # Percentage increase
    yearly_increase_amount = db.Column(db.Numeric(10, 2), nullable=True)  # Fixed amount increase
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to rent records
    rent_records = db.relationship('RentRecord', backref='property', lazy=True, cascade='all, delete-orphan')
    
    def calculate_current_rent(self):
        """Calculate current rent based on lease start date and yearly increases"""
        from datetime import date
        from dateutil.relativedelta import relativedelta
        import calendar
        
        today = date.today()
        years_since_lease = relativedelta(today, self.lease_start_date).years
        
        if years_since_lease <= 0:
            return float(self.initial_rent)
        
        current_rent = float(self.initial_rent)
        
        for year in range(years_since_lease):
            if self.yearly_increase_percent:
                current_rent += current_rent * (float(self.yearly_increase_percent) / 100)
            elif self.yearly_increase_amount:
                current_rent += float(self.yearly_increase_amount)
        
        # Update the current_rent field in database
        self.current_rent = current_rent
        db.session.commit()
        
        return current_rent
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'address': self.address,
            'renterName': self.renter_name,
            'renterContact': self.renter_contact or '',
            'initialRent': float(self.initial_rent),
            'currentRent': float(self.current_rent),
            'leaseStartDate': self.lease_start_date.isoformat(),
            'expectedRentDate': self.expected_rent_date,
            'yearlyIncreasePercent': float(self.yearly_increase_percent) if self.yearly_increase_percent else None,
            'yearlyIncreaseAmount': float(self.yearly_increase_amount) if self.yearly_increase_amount else None,
            'createdAt': self.created_at.isoformat(),
            'monthlyRent': float(self.current_rent)  # For backward compatibility
        }


class RentRecord(db.Model):
    __tablename__ = 'rent_records'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    received = db.Column(db.Boolean, default=False)
    expected_date = db.Column(db.Date, nullable=True)
    received_date = db.Column(db.Date, nullable=True)
    payment_mode = db.Column(db.String(100), nullable=True)  # Cash, Bank Transfer, Check, etc.
    rent_amount = db.Column(db.Numeric(10, 2), nullable=True)  # Rent amount for this specific month
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint to prevent duplicate records for same property/month/year
    __table_args__ = (db.UniqueConstraint('property_id', 'year', 'month', name='unique_property_month_year'),)
    
    def to_dict(self):
        return {
            'received': self.received,
            'expectedDate': self.expected_date.isoformat() if self.expected_date else '',
            'receivedDate': self.received_date.isoformat() if self.received_date else '',
            'paymentMode': self.payment_mode or '',
            'rentAmount': float(self.rent_amount) if self.rent_amount else 0
        }