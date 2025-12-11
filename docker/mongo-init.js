// MongoDB initialization script
// This runs when the container first starts

db = db.getSiblingDB('healthcare');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'name', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'Email is required'
        },
        password: {
          bsonType: 'string',
          description: 'Password is required'
        },
        name: {
          bsonType: 'string',
          description: 'Name is required'
        },
        role: {
          enum: ['patient', 'doctor'],
          description: 'Role must be patient or doctor'
        },
        specialization: {
          bsonType: 'string',
          description: 'Specialization for doctors'
        },
        phone: {
          bsonType: 'string',
          description: 'Phone number'
        }
      }
    }
  }
});

db.createCollection('appointments');
db.createCollection('notifications');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.appointments.createIndex({ patientId: 1, date: -1 });
db.appointments.createIndex({ doctorId: 1, date: -1 });
db.appointments.createIndex({ doctorId: 1, date: 1, timeSlot: 1, status: 1 });
db.appointments.createIndex({ status: 1 });

db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });

print('MongoDB initialized successfully!');
