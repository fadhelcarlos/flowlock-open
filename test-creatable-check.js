// Test script to verify the creatable-needs-detail check fix
const { creatableNeedsDetailCheck } = require('./packages/checks-core/src/creatable-needs-detail.ts');

// Test spec with correct entity field
const testSpec = {
  entities: [
    { id: 'segment', name: 'Segment' },
    { id: 'playbook', name: 'Playbook' },
    { id: 'alert', name: 'Alert' }
  ],
  screens: [
    // Create form screens
    {
      id: 'segment-create',
      type: 'form',
      forms: [
        { 
          id: 'create-segment-form',
          entityId: 'segment',
          type: 'create',
          fields: []
        }
      ]
    },
    {
      id: 'playbook-create',
      type: 'form', 
      forms: [
        {
          id: 'create-playbook-form',
          entityId: 'playbook',
          type: 'create',
          fields: []
        }
      ]
    },
    {
      id: 'alert-create',
      type: 'form',
      forms: [
        {
          id: 'create-alert-form',
          entityId: 'alert',
          type: 'create',
          fields: []
        }
      ]
    },
    // Detail screens with 'entity' field (not 'entityId')
    {
      id: 'segment-detail',
      type: 'detail',
      entity: 'segment'  // Using 'entity' instead of 'entityId'
    },
    {
      id: 'playbook-detail',
      type: 'detail',
      entity: 'playbook'  // Using 'entity' instead of 'entityId'
    },
    {
      id: 'alert-detail',
      type: 'detail',
      entity: 'alert'  // Using 'entity' instead of 'entityId'
    }
  ],
  flows: []
};

// Run the check
console.log('Testing creatable-needs-detail check with fixed logic...\n');
process.env.FLOWLOCK_VERBOSE = 'true';

try {
  const results = creatableNeedsDetailCheck.run(testSpec);
  
  console.log('Results:');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} [${result.level}] ${result.message}`);
  });
  
  // Check if the test passed
  const hasErrors = results.some(r => r.status === 'fail' && r.level === 'error');
  if (!hasErrors) {
    console.log('\n✅ Test PASSED! The check now correctly detects detail screens with "entity" field.');
  } else {
    console.log('\n❌ Test FAILED! There are still issues with the check.');
  }
} catch (error) {
  console.error('Error running check:', error);
}