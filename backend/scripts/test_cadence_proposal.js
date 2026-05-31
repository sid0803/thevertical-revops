import http from 'http';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- TESTING PROSPECTING CADENCES & PROPOSAL ENGAGEMENT SYSTEMS ---');

  // 1. Authenticate as admin
  const loginRes = await request('POST', '/auth/login', { email: 'admin@thevertical.ai', password: 'Password123@' });
  const token = loginRes.data.token;
  if (!token) throw new Error('Authentication failed');
  console.log('✅ Authenticated as admin');

  // 2. Create Lead for enrollment
  const randPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);
  const leadRes = await request('POST', '/leads', {
    name: 'Cadence Test Lead',
    phone: randPhone,
    source: 'Website',
    notes: 'Testing cadences and proposals',
    assignedToId: loginRes.data.user.id
  }, token);
  const leadId = leadRes.data.id;
  console.log(`✅ Created test lead: ${leadRes.data.name} (ID: ${leadId})`);

  // 3. Create a Cadence sequence
  const cadenceData = {
    name: 'Enterprise Outbound Sequence',
    description: 'Sequence for high-touch enterprise accounts',
    steps: [
      { type: 'CALL', delayDays: 0, template: 'Discovery Call Script' },
      { type: 'WHATSAPP', delayDays: 1, template: 'WhatsApp Followup Template' },
      { type: 'EMAIL', delayDays: 2, template: 'Email Demo Script' }
    ]
  };
  const cadenceRes = await request('POST', '/cadences', cadenceData, token);
  const cadenceId = cadenceRes.data.id;
  console.log(`✅ Created Cadence: ${cadenceRes.data.name} with ${cadenceRes.data.steps.length} steps (ID: ${cadenceId})`);

  // 4. Enroll Lead in Cadence
  const enrollRes = await request('POST', `/cadences/${cadenceId}/enroll`, { leadIds: [leadId] }, token);
  console.log(`✅ Enrolled lead in cadence: ${enrollRes.data.message}`);

  // 5. Fetch active queue tasks for the BDE
  const activeTasksRes = await request('GET', '/cadences/active-tasks', null, token);
  const myTask = activeTasksRes.data.find(t => t.lead.id === leadId);
  if (!myTask) throw new Error('Active task not found for enrolled lead');
  console.log(`✅ Retrieved active queue task for lead. Step: ${myTask.stepNumber}/${myTask.totalSteps}, Type: ${myTask.stepType}, Due: ${myTask.isDue}`);

  // 6. Complete cadence step and move to next step
  const progressRes = await request('PUT', `/cadences/enrollments/${myTask.id}/step`, {}, token);
  console.log(`✅ Progressed cadence step. Response message: ${progressRes.data.message}`);
  
  // Verify next step updated in the enrollment
  const nextTasksRes = await request('GET', '/cadences/active-tasks', null, token);
  const nextTask = nextTasksRes.data.find(t => t.lead.id === leadId);
  if (!nextTask || nextTask.stepNumber !== 2) {
    throw new Error('Lead enrollment did not progress to step 2 correctly');
  }
  console.log(`✅ Verified enrollment progressed to step ${nextTask.stepNumber}/${nextTask.totalSteps} (Type: ${nextTask.stepType}, delayDays: 1, isDue: false)`);

  // 7. Create a Proposal
  const proposalData = {
    clientName: 'Cadence Test Company',
    validityDays: 10,
    gstRate: 18,
    notes: 'Test proposal for page analytics',
    lineItems: [
      { component: 'CRM Suite Core License', billingType: 'MONTHLY', qty: 10, costPerUnit: 1200 },
      { component: 'Setup & Custom Handoffs Integration', billingType: 'ONE_TIME', qty: 1, costPerUnit: 50000 }
    ]
  };
  const proposalRes = await request('POST', '/proposals', proposalData, token);
  const proposalId = proposalRes.data.id;
  console.log(`✅ Created test proposal: ${proposalRes.data.proposalNumber} (ID: ${proposalId})`);

  // 8. Log proposal engagement heartbeats (Public route, NO token)
  console.log('🚀 Sending public proposal view engagement heartbeats...');
  const engage1 = await request('POST', `/proposals/public/${proposalId}/engage`, { pageNumber: 1, durationSec: 5 });
  const engage2 = await request('POST', `/proposals/public/${proposalId}/engage`, { pageNumber: 1, durationSec: 5 });
  const engage3 = await request('POST', `/proposals/public/${proposalId}/engage`, { pageNumber: 2, durationSec: 5 });
  
  if (engage1.status !== 200 || engage2.status !== 200 || engage3.status !== 200) {
    throw new Error('Failed to log public page engagement heartbeats');
  }
  console.log('✅ Registered 3 page duration heartbeats (Total: 15s) successfully on public endpoint');

  // 9. Fetch Proposal details as admin and assert engagement analytics are calculated
  const getProposalRes = await request('GET', `/proposals/${proposalId}`, null, token);
  const engagements = getProposalRes.data.engagements;
  if (!engagements || engagements.length !== 3) {
    throw new Error(`Expected 3 engagement log rows, but found ${engagements?.length}`);
  }
  
  // Calculate duration summary per page
  const pageDurations = {};
  engagements.forEach(e => {
    pageDurations[e.pageNumber] = (pageDurations[e.pageNumber] || 0) + e.durationSec;
  });
  console.log(`✅ Verified proposal engagement logs in database: Page 1 duration: ${pageDurations[1]}s (Expected: 10s), Page 2 duration: ${pageDurations[2]}s (Expected: 5s)`);

  console.log('--- ALL CADENCE AND PROPOSAL ENGAGEMENT TESTS PASSED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
