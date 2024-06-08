import React, { useState } from 'react';
import './App.css';

const initialFacilities = {
  'Clubhouse': {
    rates: [
      { start: '10:00', end: '16:00', rate: 100 },
      { start: '16:00', end: '22:00', rate: 500 }
    ],
    bookings: []
  },
  'Tennis Court': {
    rates: [
      { start: '00:00', end: '24:00', rate: 50 }
    ],
    bookings: []
  }
};

const isAvailable = (facility, start, end) => {
  for (let booking of facility.bookings) {
    if (!(end <= new Date(booking.start) || start >= new Date(booking.end))) {
      return false;
    }
  }
  return true;
};

const calculateCost = (facility, start, end) => {
  let totalCost = 0;
  let current = new Date(start);

  while (current < end) {
    let found = false;
    for (let rate of facility.rates) {
      const rateStart = new Date(current);
      rateStart.setHours(...rate.start.split(':'), 0, 0);
      const rateEnd = new Date(rateStart);
      rateEnd.setHours(...rate.end.split(':'), 0, 0);

      if (rateStart > rateEnd) { // Handle overnight rates
        rateEnd.setDate(rateEnd.getDate() + 1);
      }

      if (current < rateStart) continue;

      const nextTime = new Date(Math.min(end, rateEnd));
      if (current < nextTime) {
        const duration = (nextTime - current) / 3600000; // Convert milliseconds to hours
        totalCost += rate.rate * duration;
        current = nextTime;
        found = true;
        break;
      }
    }
    if (!found) { // No rate covers this time; should not happen in your current config
      break;
    }
  }
  return totalCost;
};

const formatDate = (dateString) => {
  const options = {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

const Bookings = ({ facilities }) => (
  <div className="bookings">
    <h2>Current Bookings</h2>
    {Object.keys(facilities).map(facilityName => (
      <div key={facilityName}>
        <h3>{facilityName}</h3>
        {facilities[facilityName].bookings.length === 0 ? (
          <p>No bookings yet.</p>
        ) : (
          <ul>
            {facilities[facilityName].bookings.map((booking, index) => (
              <li key={index}>
                {formatDate(booking.start)} - {formatDate(booking.end)}
              </li>
            ))}
          </ul>
        )}
      </div>
    ))}
  </div>
);

function App() {
  const [facilities, setFacilities] = useState(initialFacilities);
  const [facilityName, setFacilityName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const facility = facilities[facilityName];
    if (!facility) {
      setError('Invalid Facility');
      setMessage('');
      return;
    }

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    if (start >= end) {
      setError('End time must be after start time.');
      setMessage('');
      return;
    }

    if (!isAvailable(facility, start, end)) {
      setError('Booking Failed, Time Slot Already Booked');
      setMessage('');
      return;
    }

    const newBooking = { start: start.toISOString(), end: end.toISOString() };
    setFacilities(prevFacilities => {
      const updatedFacility = { ...prevFacilities[facilityName] };
      updatedFacility.bookings = [...updatedFacility.bookings, newBooking];
      return { ...prevFacilities, [facilityName]: updatedFacility };
    });

    const cost = calculateCost(facility, start, end);
    setMessage(`Booked, Cost: ₹${cost}`);
    setError('');
  };

  return (
    <div className="App">
      <h1>Facility Booking</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Facility:
            <select value={facilityName} onChange={(e) => setFacilityName(e.target.value)}>
              <option value="">Select Facility</option>
              {Object.keys(facilities).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Date:
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>
            Start Time:
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>
            End Time:
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </label>
        </div>
        <button type="submit">Book</button>
      </form>
      {message && <div className="message">{message}</div>}
      {error && <div className="error">{error}</div>}
      <Bookings facilities={facilities} />
    </div>
  );
}

export default App;
