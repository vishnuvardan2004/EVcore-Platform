/**
 * Sample Data Generator for Vehicle Deployment Testing
 * Creates sample vehicles, deployments, and pilot data for testing reports
 */

import { vehicleService, pilotService } from '../services/database';
import { Vehicle, Deployment } from '../types/vehicle';
import { Pilot } from '../types/pilot';

export const generateSampleData = async () => {
  console.log('🔧 Generating sample data for Vehicle Deployment Tracker...');

  try {
    // Sample Vehicles
    const sampleVehicles: Vehicle[] = [
      {
        id: 'TS09EZ1234',
        vehicleNumber: 'TS09EZ1234',
        status: 'IN',
        deploymentHistory: []
      },
      {
        id: 'TS09EZ5678',
        vehicleNumber: 'TS09EZ5678',
        status: 'OUT',
        deploymentHistory: []
      },
      {
        id: 'TS09EZ9876',
        vehicleNumber: 'TS09EZ9876',
        status: 'IN',
        deploymentHistory: []
      },
      {
        id: 'KA01EZ4567',
        vehicleNumber: 'KA01EZ4567',
        status: 'IN',
        deploymentHistory: []
      },
      {
        id: 'AP09EZ2345',
        vehicleNumber: 'AP09EZ2345',
        status: 'OUT',
        deploymentHistory: []
      }
    ];

    // Create vehicles
    for (const vehicle of sampleVehicles) {
      await vehicleService.createOrUpdateVehicle(vehicle);
    }
    console.log('✅ Sample vehicles created');

    // Generate sample deployments over the last 30 days
    const deployments: Deployment[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const supervisors = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'Alex Thompson'];
    const drivers = ['Driver A', 'Driver B', 'Driver C', 'Driver D', 'Driver E'];
    const locations = ['Bangalore Central', 'Electronic City', 'Whitefield', 'HSR Layout', 'Koramangala'];
    
    // Helper function to generate vehicle checklist
    const generateVehicleChecklist = () => ({
      fireExtinguisher: Math.random() > 0.05,
      stepney: Math.random() > 0.1,
      carFreshener: Math.random() > 0.2,
      cleaningCloth: Math.random() > 0.1,
      umbrella: Math.random() > 0.15,
      torch: Math.random() > 0.1,
      toolkit: Math.random() > 0.08,
      spanner: Math.random() > 0.1,
      medicalKit: Math.random() > 0.05,
      carCharger: Math.random() > 0.03,
      jack: Math.random() > 0.12,
      lightsWorking: Math.random() > 0.02,
      tyrePressure: Math.random() > 0.05,
      wheelCaps: Math.random() > 0.15,
      wiperWater: Math.random() > 0.1,
      cleanliness: Math.random() > 0.2,
      antenna: Math.random() > 0.3,
      acWorking: Math.random() > 0.02,
      mobileCable: Math.random() > 0.1,
      mobileAdapter: Math.random() > 0.08,
      phoneStand: Math.random() > 0.12,
      hornWorking: Math.random() > 0.01,
      damages: Math.random() > 0.8 ? 'Minor scratches on bumper' : ''
    });

    // Generate 50 sample deployments
    for (let i = 0; i < 50; i++) {
      const vehicleNumber = sampleVehicles[Math.floor(Math.random() * sampleVehicles.length)].vehicleNumber;
      const outTime = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      const inTime = Math.random() > 0.2 ? new Date(outTime.getTime() + Math.random() * (8 * 60 * 60 * 1000)) : undefined; // 80% completed
      
      const deployment: Deployment = {
        id: `DEP_${Date.now()}_${i}`,
        vehicleNumber,
        direction: 'OUT',
        purpose: Math.random() > 0.5 ? 'Office' : 'Pilot',
        outTimestamp: outTime.toISOString(),
        outData: {
          driverName: drivers[Math.floor(Math.random() * drivers.length)],
          employeeName: `EMP${String(i + 1).padStart(3, '0')}`,
          pilotId: `PILOT${String(i + 1).padStart(3, '0')}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          odometer: Math.floor(Math.random() * 50000) + 10000,
          batteryCharge: Math.floor(Math.random() * 40) + 60,
          range: Math.floor(Math.random() * 150) + 100,
          supervisorName: supervisors[Math.floor(Math.random() * supervisors.length)],
          vehiclePhotos: [`photo_${i}_1.jpg`, `photo_${i}_2.jpg`],
          driverChecklist: {
            idCard: Math.random() > 0.1,
            uniform: Math.random() > 0.05,
            shoes: Math.random() > 0.05,
            groomed: Math.random() > 0.1
          },
          vehicleChecklist: generateVehicleChecklist(),
          notes: Math.random() > 0.5 ? `Deployment notes for vehicle ${vehicleNumber}` : undefined
        },
        inTimestamp: inTime?.toISOString(),
        inData: inTime ? {
          returnOdometer: Math.floor(Math.random() * 50000) + 10000 + Math.floor(Math.random() * 200),
          vehiclePhotos: [`return_photo_${i}_1.jpg`, `return_photo_${i}_2.jpg`],
          inSupervisorName: supervisors[Math.floor(Math.random() * supervisors.length)],
          vehicleChecklist: generateVehicleChecklist(),
          checklistMismatches: Math.random() > 0.8 ? ['Missing fire extinguisher'] : []
        } : undefined,
        duration: inTime ? Math.floor((inTime.getTime() - outTime.getTime()) / (1000 * 60)) : undefined,
        totalKms: Math.floor(Math.random() * 200) + 50
      };

      deployments.push(deployment);
    }

    // Create deployments
    for (const deployment of deployments) {
      await vehicleService.createDeployment(deployment);
    }
    console.log('✅ Sample deployments created');

    // TODO: Create sample pilots (complex structure, skipping for now)
    // The pilot creation requires all fields from the Pilot interface
    // which includes driving info, identity docs, banking details, etc.
    
    console.log('⚠️  Pilot creation skipped (complex structure)');

    console.log('🎉 Sample data generation completed successfully!');
    console.log('📊 Generated:');
    console.log(`   • ${sampleVehicles.length} vehicles`);
    console.log(`   • ${deployments.length} deployments`);
    console.log('   • 0 pilots (structure complex, skipped)');
    console.log('');
    console.log('💡 You can now test the reports and see data visualizations!');

    return {
      vehicles: sampleVehicles.length,
      deployments: deployments.length,
      pilots: 0
    };

  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    throw error;
  }
};
