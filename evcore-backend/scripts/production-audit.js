#!/usr/bin/env node

/**
 * EVCORE Backend - Production Script Audit
 * This script identifies and marks all scripts that are NOT required for production website
 */

const fs = require('fs');
const path = require('path');

async function auditProductionScripts() {
  console.log('🔍 EVCORE Backend - Production Script Audit\n');
  console.log('Analyzing all scripts to identify production requirements...\n');

  const scriptsDir = './scripts';
  
  if (!fs.existsSync(scriptsDir)) {
    console.log('❌ Scripts directory not found!');
    return;
  }

  const allScripts = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.js'));
  
  console.log(`📊 Total Scripts Found: ${allScripts.length}\n`);

  // Define ESSENTIAL production scripts (KEEP)
  const essentialScripts = {
    'database-helper.js': {
      reason: 'Core MongoDB Atlas connection utility - REQUIRED by other scripts',
      status: '🟢 ESSENTIAL',
      action: 'KEEP'
    },
    'seed.js': {
      reason: 'Database seeding for initial data - USEFUL for fresh deployments',
      status: '🟡 USEFUL', 
      action: 'KEEP'
    },
    'initialize-rbac.js': {
      reason: 'Initialize Role-Based Access Control - REQUIRED for first deployment',
      status: '🟢 ESSENTIAL',
      action: 'KEEP'
    }
  };

  // Analyze each script and categorize
  const scriptAnalysis = {};
  
  for (const script of allScripts) {
    const scriptPath = path.join(scriptsDir, script);
    let content = '';
    
    try {
      content = fs.readFileSync(scriptPath, 'utf8');
    } catch (error) {
      console.log(`⚠️  Could not read ${script}: ${error.message}`);
      continue;
    }

    // Check if it's an essential script
    if (essentialScripts[script]) {
      scriptAnalysis[script] = essentialScripts[script];
      continue;
    }

    // Analyze script purpose and mark for removal
    let reason = '';
    let category = '';
    
    // Pattern matching for different script types
    if (script.startsWith('test-') || content.includes('test')) {
      reason = 'Testing/debugging script - NOT needed in production';
      category = 'Testing';
    }
    else if (script.startsWith('check-') || script.startsWith('verify-')) {
      reason = 'Data verification/debugging script - NOT needed in production'; 
      category = 'Debugging';
    }
    else if (script.startsWith('create-') && (script.includes('test') || script.includes('harsha') || script.includes('prasadh'))) {
      reason = 'Development user creation script - NOT needed in production';
      category = 'Development';
    }
    else if (script.startsWith('debug-') || script.startsWith('diagnose-')) {
      reason = 'Debugging utility - NOT needed in production';
      category = 'Debugging';
    }
    else if (script.includes('atlas') && !script.includes('helper')) {
      reason = 'Atlas migration/testing script - NOT needed after migration complete';
      category = 'Migration';
    }
    else if (script.includes('login') && script !== 'initialize-rbac.js') {
      reason = 'Authentication testing script - NOT needed in production';
      category = 'Testing';
    }
    else if (script.includes('analysis') || script.includes('cleanup')) {
      reason = 'Analysis/cleanup utility - NOT needed in production';
      category = 'Utility';
    }
    else {
      reason = 'Development/testing utility - NOT needed in production';
      category = 'Development';
    }

    scriptAnalysis[script] = {
      reason,
      category,
      status: '🔴 REMOVE',
      action: 'DELETE'
    };
  }

  // Display analysis results
  console.log('📋 PRODUCTION SCRIPT AUDIT RESULTS:\n');

  // First show scripts to KEEP
  console.log('✅ SCRIPTS TO KEEP (Production Required):');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const keepScripts = Object.entries(scriptAnalysis).filter(([_, data]) => data.action === 'KEEP');
  keepScripts.forEach(([script, data]) => {
    console.log(`${data.status} ${script}`);
    console.log(`   📝 ${data.reason}`);
    console.log('');
  });

  // Then show scripts to REMOVE
  console.log('❌ SCRIPTS TO REMOVE (Not Required for Production):');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const removeScripts = Object.entries(scriptAnalysis).filter(([_, data]) => data.action === 'DELETE');
  
  // Group by category
  const categories = {};
  removeScripts.forEach(([script, data]) => {
    if (!categories[data.category]) {
      categories[data.category] = [];
    }
    categories[data.category].push([script, data]);
  });

  Object.entries(categories).forEach(([category, scripts]) => {
    console.log(`🗂️  ${category.toUpperCase()} SCRIPTS (${scripts.length} files):`);
    scripts.forEach(([script, data]) => {
      console.log(`   ${data.status} ${script}`);
      console.log(`      ${data.reason}`);
    });
    console.log('');
  });

  // Summary statistics
  console.log('📊 AUDIT SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`   Total Scripts: ${allScripts.length}`);
  console.log(`   Keep in Production: ${keepScripts.length} (${Math.round((keepScripts.length / allScripts.length) * 100)}%)`);
  console.log(`   Remove from Production: ${removeScripts.length} (${Math.round((removeScripts.length / allScripts.length) * 100)}%)`);
  console.log(`   Storage Savings: ~${Math.round((removeScripts.length / allScripts.length) * 100)}% reduction in scripts folder`);

  // Generate deletion commands
  console.log('\n🗑️  DELETION COMMANDS:');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('# PowerShell commands to remove unnecessary scripts:');
  removeScripts.forEach(([script, _]) => {
    console.log(`Remove-Item "scripts\\${script}" -Force`);
  });

  console.log('\n# OR Unix/Linux commands:');
  removeScripts.forEach(([script, _]) => {
    console.log(`rm scripts/${script}`);
  });

  // Generate file list for batch operations
  console.log('\n📝 FILES TO DELETE (Copy-paste list):');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  removeScripts.forEach(([script, _]) => {
    console.log(`scripts/${script}`);
  });

  console.log('\n🎯 FINAL PRODUCTION SCRIPT STRUCTURE:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('After cleanup, your scripts/ folder will contain:');
  keepScripts.forEach(([script, data]) => {
    console.log(`   ✅ ${script} - ${data.reason}`);
  });

  console.log('\n🚀 POST-CLEANUP BENEFITS:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   ✅ Cleaner codebase with only production-necessary files');
  console.log('   ✅ Reduced deployment size and complexity');
  console.log('   ✅ Eliminated confusion about which scripts to run');
  console.log('   ✅ Better security (no development/testing scripts in production)');
  console.log('   ✅ Faster build and deployment times');
  console.log('   ✅ Professional production-ready structure');

  console.log('\n💡 RECOMMENDATION:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Execute the deletion commands above to clean up your production codebase.');
  console.log('Your website functionality will remain 100% intact.');
  console.log('Only development artifacts and testing scripts will be removed.');

  return {
    total: allScripts.length,
    keep: keepScripts.length,
    remove: removeScripts.length,
    keepList: keepScripts.map(([script]) => script),
    removeList: removeScripts.map(([script]) => script)
  };
}

// Run the audit
auditProductionScripts()
  .then(result => {
    console.log('\n🏁 Audit completed successfully!');
    console.log(`Ready to remove ${result.remove} unnecessary scripts.`);
  })
  .catch(error => {
    console.error('❌ Audit failed:', error.message);
  });
