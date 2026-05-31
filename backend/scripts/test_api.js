// End-to-end API test script for RevOps OS
import http from 'http';

const BASE = 'http://localhost:5000/api';
let TOKEN = '';
let LEAD_ID = '';
let CLIENT_ID = '';
let INVOICE_ID = '';
let SLAB_ID = '';
let PROPOSAL_ID = '';

const results = [];

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

function uploadCSV(path, csvString, overwrite, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundaryE2ETest';
    let payload = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="test_leads.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${csvString}\r\n`;

    if (overwrite !== undefined) {
      payload += 
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="overwrite"\r\n\r\n` +
        `${overwrite}\r\n`;
    }

    payload += `--${boundary}--\r\n`;

    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
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
    req.write(payload);
    req.end();
  });
}

async function pollJobStatus(jobId, token) {
  for (let i = 0; i < 20; i++) {
    const res = await request('GET', `/leads/bulk-upload/status/${jobId}`, null, token);
    if (res.status === 200) {
      if (res.data.status === 'completed' || res.data.status === 'failed') {
        return res.data;
      }
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Job ${jobId} timed out during status polling`);
}

function check(label, pass, detail = '') {
  const icon = pass ? '✅' : '❌';
  results.push({ label, pass, detail });
  console.log(`${icon} ${label}${detail ? ' — ' + detail : ''}`);
}

async function run() {
  console.log('\n========= RevOps OS — CEO Phase 1 End-to-End Test =========\n');

  // 1. TEST: Login – Super Admin
  const loginAdmin = await request('POST', '/auth/login', { email: 'admin@thevertical.ai', password: 'Password123@' });
  check('Login: Super Admin', loginAdmin.status === 200 && !!loginAdmin.data.token, `status=${loginAdmin.status}`);
  TOKEN = loginAdmin.data.token || '';

  // 2. TEST: Login – Team Leader
  const loginTL = await request('POST', '/auth/login', { email: 'arun@thevertical.ai', password: 'Password123@' });
  check('Login: Team Leader (Arun)', loginTL.status === 200, `status=${loginTL.status}`);

  // 3. TEST: Login – Sales Rep
  const loginRep = await request('POST', '/auth/login', { email: 'ravi@thevertical.ai', password: 'Password123@' });
  check('Login: Sales Rep (Ravi)', loginRep.status === 200, `status=${loginRep.status}`);

  // 4. TEST: Login – Finance
  const loginFin = await request('POST', '/auth/login', { email: 'finance@thevertical.ai', password: 'Password123@' });
  check('Login: Finance User', loginFin.status === 200, `status=${loginFin.status}`);

  // 5. TEST: Login – Account Manager
  const loginAM = await request('POST', '/auth/login', { email: 'am@thevertical.ai', password: 'Password123@' });
  check('Login: Account Manager (Deepa)', loginAM.status === 200, `status=${loginAM.status}`);

  // 6. TEST: Login – Manager
  const loginMgr = await request('POST', '/auth/login', { email: 'manager@thevertical.ai', password: 'Password123@' });
  check('Login: Manager (Raj)', loginMgr.status === 200, `status=${loginMgr.status}`);

  if (!TOKEN) { console.log('\nFATAL: Cannot proceed without auth token.'); return; }

  // 7. TEST: Get Leads list
  const leadsRes = await request('GET', '/leads', null, TOKEN);
  check('Leads: Fetch list', leadsRes.status === 200 && Array.isArray(leadsRes.data), `count=${leadsRes.data?.length}`);

  // 8. TEST: Duplicate lead prevention (phone 9876543210 already seeded)
  const dupRes = await request('POST', '/leads', { name: 'Dup Test', phone: '9876543210', source: 'Website' }, TOKEN);
  check('Leads: Duplicate phone blocked (409)', dupRes.status === 409, `status=${dupRes.status}, existingId=${dupRes.data?.existingLeadId}`);
  check('Leads: Duplicate returns existingLeadId', !!dupRes.data?.existingLeadId, `id=${dupRes.data?.existingLeadId}`);

  // 9. TEST: Create new lead
  const randPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);
  const randEmail = `e2e-${Math.floor(Math.random() * 1000000)}@test.com`;
  const newLead = await request('POST', '/leads', {
    name: 'E2E Test Lead', phone: randPhone, email: randEmail, source: 'Website', notes: 'Auto-test lead'
  }, TOKEN);
  check('Leads: Create new lead', newLead.status === 201, `status=${newLead.status}`);
  LEAD_ID = newLead.data?.id || '';

  // 10. TEST: Stage skip prevention (DISCOVERY_CALL → NEGOTIATION)
  if (LEAD_ID) {
    const skipRes = await request('PUT', `/leads/${LEAD_ID}/stage`, { stage: 'NEGOTIATION' }, TOKEN);
    check('Leads: Stage skip blocked', skipRes.status === 400, `status=${skipRes.status}, msg="${skipRes.data?.message}"`);
  }

  // 11. TEST: Sequential stage progression DISCOVERY_CALL → DEMO
  if (LEAD_ID) {
    const s1 = await request('PUT', `/leads/${LEAD_ID}/stage`, { stage: 'DEMO' }, TOKEN);
    check('Leads: Stage DISCOVERY_CALL → DEMO', s1.status === 200, `status=${s1.status}`);
  }

  // 12. TEST: Stage DEMO → PROPOSAL
  if (LEAD_ID) {
    const s2 = await request('PUT', `/leads/${LEAD_ID}/stage`, { stage: 'PROPOSAL' }, TOKEN);
    check('Leads: Stage DEMO → PROPOSAL', s2.status === 200, `status=${s2.status}`);
  }

  // 13. TEST: Stage PROPOSAL → NEGOTIATION
  if (LEAD_ID) {
    const s2b = await request('PUT', `/leads/${LEAD_ID}/stage`, { stage: 'NEGOTIATION' }, TOKEN);
    check('Leads: Stage PROPOSAL → NEGOTIATION', s2b.status === 200, `status=${s2b.status}`);
  }

  // 13b. TEST: Stage NEGOTIATION → WIN (auto client creation)
  if (LEAD_ID) {
    const s3 = await request('PUT', `/leads/${LEAD_ID}/stage`, { stage: 'WIN' }, TOKEN);
    check('Leads: Stage → WIN', s3.status === 200, `status=${s3.status}`);
  }

  // 14. TEST: Client auto-created from lead
  await new Promise(r => setTimeout(r, 500));
  const clients = await request('GET', '/clients', null, TOKEN);
  check('Clients: Auto-created on WIN', clients.status === 200 && Array.isArray(clients.data), `count=${clients.data?.length}`);
  const e2eClient = clients.data?.find(c => c.contactName === 'E2E Test Lead');
  check('Clients: E2E test client found', !!e2eClient, `company=${e2eClient?.companyName}`);
  CLIENT_ID = e2eClient?.id || clients.data?.[0]?.id || '';

  // 15. TEST: Manual call logging
  if (LEAD_ID) {
    const callRes = await request('POST', `/leads/${LEAD_ID}/call`, { duration: 15, description: 'Discovery call — discussed AI voice agent needs' }, TOKEN);
    check('Leads: Manual call log (15 min)', callRes.status === 201, `status=${callRes.status}`);
  }

  // 16. TEST: Note logging
  if (LEAD_ID) {
    const noteRes = await request('POST', `/leads/${LEAD_ID}/note`, { description: 'Client is highly interested in Maestro OS' }, TOKEN);
    check('Leads: Note logging', noteRes.status === 201, `status=${noteRes.status}`);
  }

  // 17. TEST: Lead timeline populated
  if (LEAD_ID) {
    const detail = await request('GET', `/leads/${LEAD_ID}`, null, TOKEN);
    check('Leads: Timeline activities populated', detail.status === 200 && detail.data?.activities?.length > 0, `activitiesCount=${detail.data?.activities?.length}`);
  }

  // 18. TEST: Billing — Create invoice (Finance role)
  const finToken = loginFin.data?.token;
  if (CLIENT_ID && finToken) {
    const inv = await request('POST', '/billing/invoices', {
      clientId: CLIENT_ID,
      baseAmount: 100000,
      gstRate: 18,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: 'E2E Test Invoice'
    }, finToken);
    check('Billing: Create invoice', inv.status === 201, `status=${inv.status}, invoice=${inv.data?.invoiceNumber}`);
    INVOICE_ID = inv.data?.id || '';
    // 19. TEST: Default 50/50 slabs created
    check('Billing: Default 50/50 slabs created', inv.data?.slabs?.length === 2 && inv.data.slabs[0].percentage === 50 && inv.data.slabs[1].percentage === 50,
      `slab1=${inv.data?.slabs?.[0]?.percentage}%, slab2=${inv.data?.slabs?.[1]?.percentage}%`);
    SLAB_ID = inv.data?.slabs?.[0]?.id || '';
  }

  // 20. TEST: Mark slab as paid
  if (INVOICE_ID && SLAB_ID && finToken) {
    const payRes = await request('POST', `/billing/invoices/${INVOICE_ID}/slabs/${SLAB_ID}/pay`, {}, finToken);
    check('Billing: Mark slab as Paid', payRes.status === 200, `status=${payRes.status}, invoiceStatus=${payRes.data?.status}`);
    check('Billing: Invoice status updates to PARTIALLY_PAID', payRes.data?.status === 'PARTIALLY_PAID', `status=${payRes.data?.status}`);
  }

  // 21. TEST: Proposals — Create proposal
  if (CLIENT_ID) {
    const propRes = await request('POST', '/proposals', {
      clientId: CLIENT_ID,
      clientName: 'E2E Test Lead Corp',
      validityDays: 15,
      gstRate: 18,
      notes: 'E2E test proposal',
      lineItems: [
        { component: 'AI Voice Agent', description: 'Core setup', qty: 1, costPerUnit: 45000, billingType: 'ONE_TIME' },
        { component: 'Minute Consumption', description: 'Pre-paid minutes', qty: 10000, costPerUnit: 3, billingType: 'CONSUMPTION' }
      ]
    }, TOKEN);
    check('Proposals: Create proposal', propRes.status === 201, `status=${propRes.status}, proposal=${propRes.data?.proposalNumber}`);
    PROPOSAL_ID = propRes.data?.id || '';
    // 22. TEST: Grand total calculated correctly (45000 + 30000 = 75000 + 18% GST = 88500)
    const expectedTotal = (45000 + 30000) * 1.18;
    check('Proposals: Grand total calculated (Qty×Cost+GST)', Math.abs(propRes.data?.grandTotal - expectedTotal) < 1, `expected=${expectedTotal}, got=${propRes.data?.grandTotal}`);
  }

  // 23. TEST: Targets — Set targets as Team Leader
  const tlToken = loginTL.data?.token;
  const repId = loginRep.data?.user?.id;
  if (tlToken && repId) {
    const targetRes = await request('POST', '/targets', {
      assignedToId: repId,
      month: '2026-05',
      callTarget: 50,
      talkTimeTarget: 300,
      revenueTarget: 500000,
      leadTarget: 5
    }, tlToken);
    check('Targets: TL sets targets for Sales Rep', targetRes.status === 200, `status=${targetRes.status}`);
  }

  // 24. TEST: Rep views own progress rings
  const repToken = loginRep.data?.token;
  if (repToken) {
    const progress = await request('GET', '/targets/progress?month=2026-05', null, repToken);
    check('Targets: Rep views progress actuals', progress.status === 200 && progress.data?.target !== undefined, `callTarget=${progress.data?.target?.callTarget}, actualCalls=${progress.data?.actual?.calls}`);
  }

  // 25. TEST: Split Mapping attribution
  const splitRes = await request('GET', '/split/attribution', null, TOKEN);
  check('Split Mapping: Attribution summary loads', splitRes.status === 200, `status=${splitRes.status}`);

  // 26. TEST: Dashboard summary with AI insights
  const dashRes = await request('GET', '/dashboard/summary', null, TOKEN);
  check('Dashboard: Summary loads', dashRes.status === 200, `status=${dashRes.status}`);
  check('Dashboard: AI Insights array present', Array.isArray(dashRes.data?.aiInsights) && dashRes.data.aiInsights.length > 0, `insightCount=${dashRes.data?.aiInsights?.length}`);
  check('Dashboard: Leads by stage populated', typeof dashRes.data?.leadsByStage === 'object', `DISCOVERY_CALL=${dashRes.data?.leadsByStage?.DISCOVERY_CALL}`);
  check('Dashboard: Team leaderboard present', Array.isArray(dashRes.data?.teamPerformance), `reps=${dashRes.data?.teamPerformance?.length}`);

  // 27. TEST: RBAC enforcement — Sales rep cannot access billing
  if (repToken) {
    const rbacRes = await request('POST', '/billing/invoices', { clientId: 'x', baseAmount: 1000, gstRate: 18 }, repToken);
    check('RBAC: Sales Rep blocked from Billing creation (403)', rbacRes.status === 403, `status=${rbacRes.status}`);
  }

  // 28. TEST: RBAC enforcement — Finance cannot set targets
  if (finToken) {
    const rbacRes2 = await request('POST', '/targets', { assignedToId: 'x', month: '2026-05', callTarget: 10 }, finToken);
    check('RBAC: Finance blocked from setting targets (403)', rbacRes2.status === 403, `status=${rbacRes2.status}`);
  }

  // 29. TEST: Bulk Upload Leads via CSV (overwrite = false)
  const randPhoneNum = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const randEmailStr = `bulk-${Math.floor(Math.random() * 1000000)}@test.com`;
  const csvContent = 
    "name,phone,personalEmail,companyName,companyEmail,linkedinUrl,socialMediaUrl,source,notes\n" +
    `Bulk E2E Lead 1,${randPhoneNum},${randEmailStr},Bulk Corp,work1@test.com,,,,notes 1\n` +
    "Bulk E2E Lead 2,9876543210,rajesh@acmecorp.com,,,,,,,notes 2\n" +
    ",,,,,,,,,\n";
  
  const uploadRes = await uploadCSV('/leads/bulk-upload', csvContent, false, TOKEN);
  check('Bulk Upload: Start async import CSV (overwrite=false)', uploadRes.status === 202, `status=${uploadRes.status}, jobId=${uploadRes.data?.jobId}`);
  
  if (uploadRes.status === 202) {
    const job = await pollJobStatus(uploadRes.data.jobId, TOKEN);
    check('Bulk Upload: Job completed successfully (overwrite=false)', job.status === 'completed', `status=${job.status}`);
    const summary = job.summary;
    check('Bulk Upload: Correct total parsed count (overwrite=false)', summary?.total === 3, `total=${summary?.total}`);
    check('Bulk Upload: Correct imported count (overwrite=false)', summary?.imported === 1, `imported=${summary?.imported}`);
    check('Bulk Upload: Correct duplicates count (overwrite=false)', summary?.duplicates === 1, `duplicates=${summary?.duplicates}`);
    check('Bulk Upload: Correct updated count (overwrite=false)', summary?.updated === 0, `updated=${summary?.updated}`);
    check('Bulk Upload: Correct failed count (overwrite=false)', summary?.failed === 1, `failed=${summary?.failed}`);
  }

  // 30. TEST: Bulk Upload Leads via CSV (overwrite = true)
  const uploadRes2 = await uploadCSV('/leads/bulk-upload', csvContent, true, TOKEN);
  check('Bulk Upload: Start async import CSV (overwrite=true)', uploadRes2.status === 202, `status=${uploadRes2.status}, jobId=${uploadRes2.data?.jobId}`);
  
  if (uploadRes2.status === 202) {
    const job = await pollJobStatus(uploadRes2.data.jobId, TOKEN);
    check('Bulk Upload: Job completed successfully (overwrite=true)', job.status === 'completed', `status=${job.status}`);
    const summary = job.summary;
    check('Bulk Upload: Correct total parsed count (overwrite=true)', summary?.total === 3, `total=${summary?.total}`);
    check('Bulk Upload: Correct imported count (overwrite=true)', summary?.imported === 0, `imported=${summary?.imported}`);
    check('Bulk Upload: Correct duplicates count (overwrite=true)', summary?.duplicates === 0, `duplicates=${summary?.duplicates}`);
    check('Bulk Upload: Correct updated count (overwrite=true)', summary?.updated === 2, `updated=${summary?.updated}`);
    check('Bulk Upload: Correct failed count (overwrite=true)', summary?.failed === 1, `failed=${summary?.failed}`);
  }

  // 31. TEST: BOLA Access Restrictions (Sales Rep cannot access/modify other rep's/TL's lead or resources)
  console.log('\n--- Running BOLA Security Validation Tests ---');

  const usersRes = await request('GET', '/users', null, TOKEN);
  const users = usersRes.data || [];
  const arunUser = users.find(u => u.email === 'arun@thevertical.ai');
  const raviUser = users.find(u => u.email === 'ravi@thevertical.ai');

  if (arunUser && raviUser && repToken) {
    // Create a lead assigned to Arun
    const arunLeadPhone = '8' + Math.floor(100000000 + Math.random() * 900000000);
    const arunLeadEmail = `bola-arun-${Math.floor(Math.random() * 1000000)}@test.com`;
    const arunLeadRes = await request('POST', '/leads', {
      name: 'Arun Private Lead',
      phone: arunLeadPhone,
      personalEmail: arunLeadEmail,
      source: 'Website',
      notes: 'TL Private Lead',
      assignedToId: arunUser.id
    }, TOKEN);

    const arunLeadId = arunLeadRes.data?.id;
    check('BOLA Setup: Create lead assigned to Arun', arunLeadRes.status === 201 && !!arunLeadId, `leadId=${arunLeadId}`);

    if (arunLeadId) {
      // 1. GET /leads/:id
      const bolaGetLead = await request('GET', `/leads/${arunLeadId}`, null, repToken);
      check('BOLA: Sales Rep blocked from GET other rep\'s lead (403)', bolaGetLead.status === 403, `status=${bolaGetLead.status}`);

      // 2. PUT /leads/:id
      const bolaPutLead = await request('PUT', `/leads/${arunLeadId}`, { name: 'Hacked name' }, repToken);
      check('BOLA: Sales Rep blocked from PUT other rep\'s lead (403)', bolaPutLead.status === 403, `status=${bolaPutLead.status}`);

      // 3. PUT /leads/:id/stage
      const bolaPutStage = await request('PUT', `/leads/${arunLeadId}/stage`, { stage: 'DEMO' }, repToken);
      check('BOLA: Sales Rep blocked from stage update on other rep\'s lead (403)', bolaPutStage.status === 403, `status=${bolaPutStage.status}`);

      // 4. POST /leads/:id/note
      const bolaPostNote = await request('POST', `/leads/${arunLeadId}/note`, { description: 'Hacked note' }, repToken);
      check('BOLA: Sales Rep blocked from note creation on other rep\'s lead (403)', bolaPostNote.status === 403, `status=${bolaPostNote.status}`);

      // 5. POST /leads/:id/call
      const bolaPostCall = await request('POST', `/leads/${arunLeadId}/call`, { duration: 10, description: 'Hacked call' }, repToken);
      check('BOLA: Sales Rep blocked from call logging on other rep\'s lead (403)', bolaPostCall.status === 403, `status=${bolaPostCall.status}`);

      // 6. POST /tasks
      const bolaPostTask = await request('POST', '/tasks', {
        leadId: arunLeadId,
        title: 'Hacked Task',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      }, repToken);
      check('BOLA: Sales Rep blocked from creating task on other rep\'s lead (403)', bolaPostTask.status === 403, `status=${bolaPostTask.status}`);

      // Create a task as Admin
      const adminTaskRes = await request('POST', '/tasks', {
        leadId: arunLeadId,
        title: 'Arun\'s Private Task',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assignedToId: arunUser.id
      }, TOKEN);
      const adminTaskId = adminTaskRes.data?.id;

      if (adminTaskId) {
        // 7. GET /tasks?leadId=xxx
        const bolaGetTasks = await request('GET', `/tasks?leadId=${arunLeadId}`, null, repToken);
        check('BOLA: Sales Rep blocked from GET tasks on other rep\'s lead (403)', bolaGetTasks.status === 403, `status=${bolaGetTasks.status}`);

        // 8. PUT /tasks/:id
        const bolaPutTask = await request('PUT', `/tasks/${adminTaskId}`, { title: 'Hacked Task Title' }, repToken);
        check('BOLA: Sales Rep blocked from PUT other rep\'s task (403)', bolaPutTask.status === 403, `status=${bolaPutTask.status}`);

        // 9. PUT /tasks/:id/complete
        const bolaCompleteTask = await request('PUT', `/tasks/${adminTaskId}/complete`, {}, repToken);
        check('BOLA: Sales Rep blocked from completing other rep\'s task (403)', bolaCompleteTask.status === 403, `status=${bolaCompleteTask.status}`);

        // 10. DELETE /tasks/:id
        const bolaDeleteTask = await request('DELETE', `/tasks/${adminTaskId}`, null, repToken);
        check('BOLA: Sales Rep blocked from deleting other rep\'s task (403)', bolaDeleteTask.status === 403, `status=${bolaDeleteTask.status}`);
      }

      // Transition lead sequentially to WIN to create a Client
      await request('PUT', `/leads/${arunLeadId}/stage`, { stage: 'DEMO' }, TOKEN);
      await request('PUT', `/leads/${arunLeadId}/stage`, { stage: 'PROPOSAL' }, TOKEN);
      await request('PUT', `/leads/${arunLeadId}/stage`, { stage: 'NEGOTIATION' }, TOKEN);
      await request('PUT', `/leads/${arunLeadId}/stage`, { stage: 'WIN' }, TOKEN);

      // Fetch client
      const adminClientsRes = await request('GET', '/clients', null, TOKEN);
      const arunClient = adminClientsRes.data?.find(c => c.leadId === arunLeadId);
      const arunClientId = arunClient?.id;

      if (arunClientId) {
        // Create proposal for Arun's client
        const arunPropRes = await request('POST', '/proposals', {
          clientId: arunClientId,
          clientName: 'Arun Lead Corp',
          validityDays: 15,
          gstRate: 18,
          notes: 'Arun test proposal',
          lineItems: [
            { component: 'Test Component', description: 'desc', qty: 1, costPerUnit: 1000, billingType: 'ONE_TIME' }
          ]
        }, TOKEN);
        const arunProposalId = arunPropRes.data?.id;

        if (arunProposalId) {
          // 11. GET /proposals/:id
          const bolaGetProp = await request('GET', `/proposals/${arunProposalId}`, null, repToken);
          check('BOLA: Sales Rep blocked from GET other rep\'s proposal (403)', bolaGetProp.status === 403, `status=${bolaGetProp.status}`);

          // 12. PUT /proposals/:id
          const bolaPutProp = await request('PUT', `/proposals/${arunProposalId}`, { notes: 'hacked notes' }, repToken);
          check('BOLA: Sales Rep blocked from PUT other rep\'s proposal (403)', bolaPutProp.status === 403, `status=${bolaPutProp.status}`);

          // 13. POST /proposals/:id/send
          const bolaSendProp = await request('POST', `/proposals/${arunProposalId}/send`, {}, repToken);
          check('BOLA: Sales Rep blocked from sending other rep\'s proposal (403)', bolaSendProp.status === 403, `status=${bolaSendProp.status}`);
        }

        // Create invoice for Arun's client
        const arunInvoiceRes = await request('POST', '/billing/invoices', {
          clientId: arunClientId,
          baseAmount: 50000,
          gstRate: 18,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          notes: 'Arun Test Invoice'
        }, TOKEN);
        const arunInvoiceId = arunInvoiceRes.data?.id;

        if (arunInvoiceId) {
          // 14. GET /billing/invoices/:id
          const bolaGetInvoice = await request('GET', `/billing/invoices/${arunInvoiceId}`, null, repToken);
          check('BOLA: Sales Rep blocked from GET other rep\'s invoice (403)', bolaGetInvoice.status === 403, `status=${bolaGetInvoice.status}`);
        }
      }
    }
  } else {
    check('BOLA Setup: Skip tests due to missing user contexts', false);
  }

  // SUMMARY
  console.log('\n================ SUMMARY ================');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Total Tests: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log('\n--- FAILED TESTS ---');
  results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.label} — ${r.detail}`));
  console.log('===========================================\n');
}

run().catch(console.error);
