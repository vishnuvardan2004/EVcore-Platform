// Clean up test vehicles
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/evcore');
        const db = mongoose.connection.db;
        const result = await db.collection('vehicles').deleteMany({ 
            vehicleId: { $regex: /^TEST-/ } 
        });
        console.log(`✅ Cleaned up ${result.deletedCount} test vehicles`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
})();
