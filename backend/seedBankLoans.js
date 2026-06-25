const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BankLoan = require('./models/BankLoan');
const fs = require('fs');

// Load env vars
dotenv.config();

const seedLoans = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('MONGO_URI is missing in .env file');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing
    await BankLoan.deleteMany();
    console.log('Existing bank loans cleared.');

    // Read JSON
    const loansData = JSON.parse(fs.readFileSync('./data/bankLoans.json', 'utf-8'));
    
    // Insert
    await BankLoan.insertMany(loansData);
    console.log(`Successfully seeded ${loansData.length} bank loans.`);

    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedLoans();
