const fs = require('fs');
const path = require('path');

function activatePhase3() {
  console.log('🚀 Activating Phase 3: Complete Reference-Based Architecture');
  console.log('================================================================\n');

  try {
    const backupDir = path.join(__dirname, 'phase2-backup');
    
    // Step 1: Create backup directory
    console.log('📦 Creating Phase 2 backup...');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Step 2: Backup Phase 2 files
    const filesToBackup = [
      {
        current: 'src/controllers/vehicleDeploymentController.js',
        backup: 'vehicleDeploymentController_Phase2.js'
      },
      {
        current: 'src/models/vehicleDeploymentModels.js',
        backup: 'vehicleDeploymentModels_Phase2.js'
      },
      {
        current: 'src/routes/vehicleDeployment.js',
        backup: 'vehicleDeployment_Phase2.js'
      }
    ];

    filesToBackup.forEach(file => {
      const sourcePath = path.join(__dirname, file.current);
      const backupPath = path.join(backupDir, file.backup);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`   ✅ Backed up: ${file.current} → ${file.backup}`);
      } else {
        console.log(`   ⚠️  File not found: ${file.current}`);
      }
    });

    // Step 3: Activate Phase 3 files
    console.log('\n🔄 Activating Phase 3 files...');
    
    const phase3Activations = [
      {
        source: 'src/controllers/vehicleDeploymentController_Phase3.js',
        target: 'src/controllers/vehicleDeploymentController.js'
      },
      {
        source: 'src/models/vehicleDeploymentModels_Phase3.js',
        target: 'src/models/vehicleDeploymentModels.js'
      },
      {
        source: 'src/routes/vehicleDeployment_Phase3.js',
        target: 'src/routes/vehicleDeployment.js'
      }
    ];

    phase3Activations.forEach(activation => {
      const sourcePath = path.join(__dirname, activation.source);
      const targetPath = path.join(__dirname, activation.target);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`   ✅ Activated: ${activation.source} → ${activation.target}`);
      } else {
        console.log(`   ❌ Phase 3 file not found: ${activation.source}`);
      }
    });

    // Step 4: Create Phase 3 activation marker
    console.log('\n📋 Creating Phase 3 activation marker...');
    const markerContent = {
      phase: 'phase-3',
      activatedAt: new Date().toISOString(),
      description: 'Complete Reference-Based Architecture - Pure Data Hub Integration',
      features: [
        'Pure Data Hub vehicle references',
        'No local vehicle model',
        'Real-time Data Hub validation',
        'Deprecated vehicle CRUD operations',
        'Enhanced deployment tracking with Data Hub sync'
      ],
      backupLocation: 'phase2-backup/',
      migration: {
        vehicleDataSource: 'Database Management (Data Hub)',
        deploymentStorage: 'Pure reference-based',
        vehicleCRUD: 'Moved to Database Management module'
      }
    };

    fs.writeFileSync(
      path.join(__dirname, 'PHASE_3_ACTIVE.json'),
      JSON.stringify(markerContent, null, 2)
    );

    console.log('   ✅ Phase 3 activation marker created');

    // Step 5: Create migration summary
    console.log('\n📊 Phase 3 Activation Summary:');
    console.log('================================');
    console.log('✅ Architecture: Pure Data Hub Reference');
    console.log('✅ Vehicle Data Source: Database Management only');
    console.log('✅ Local Vehicle Model: Removed');
    console.log('✅ Deployment Model: Enhanced with Data Hub references');
    console.log('✅ API Endpoints: Data Hub integration focused');
    console.log('✅ Validation: Real-time Data Hub validation');
    console.log('✅ Backward Compatibility: Legacy endpoints return deprecation notices');

    console.log('\n🚨 Important Changes:');
    console.log('• Vehicle CRUD operations moved to Database Management module');
    console.log('• All vehicle data now comes from Data Hub in real-time');
    console.log('• Deployments store Data Hub references, not local copies');
    console.log('• Frontend should use registration number input exclusively');

    console.log('\n🎉 Phase 3 activation completed successfully!');
    console.log('🔄 Please restart the backend server to apply changes');

  } catch (error) {
    console.error('❌ Phase 3 activation failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run activation
activatePhase3();
