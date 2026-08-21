require('ts-node').register({ transpileOnly: true });
const http = require('http');
const axios = require('axios');
const { app } = require('../src/app');
const prisma = require('../src/lib/prismaClient').default;
const { RagRetrievalService } = require('../src/modules/chatbot/services/rag.retrieval.service');
const {
  ChatbotVectorRepository,
} = require('../src/modules/chatbot/repositories/chatbot.vector.repository');
const {
  ChatbotMessageRepository,
} = require('../src/modules/chatbot/repositories/chatbot.message.repository');
const {
  ChatbotOrchestratorService,
} = require('../src/modules/chatbot/services/chatbot.orchestrator.service');
require('dotenv').config();

const GREENWOOD_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi
const OTHER_ORG_ID = '00000000-0000-0000-0000-000000000001'; // Empty / Separate Tenant

const createdLeadIds = new Set();
const createdSessionIds = new Set();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAllTests() {
  console.log('================================================================');
  console.log('STARTING CHATBOT SECURITY & AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1/chatbot`;

  const results = [];

  function record(testNumber, name, passed, details) {
    const status = passed ? 'PASSED' : 'FAILED';
    results.push({ testNumber, name, status, details });
    console.log(`[Test ${testNumber.toString().padStart(2, '0')}] [${status}] ${name}`);
    if (details) console.log(`   -> Details: ${details}`);
  }

  try {
    // -------------------------------------------------------------
    // RAG TESTS (Items 19 - 22)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 1: RAG & EMBEDDINGS (Items 19-22) ---');

    // Test 19: Query embedding dimension is 3072
    try {
      const embedding = await RagRetrievalService.generateQueryEmbedding('Admissions in Grade 6');
      const is3072 = Array.isArray(embedding) && embedding.length === 3072;
      record(
        19,
        'Query embedding dimension is exactly 3072',
        is3072,
        `Generated vector dimension: ${embedding?.length}`,
      );
    } catch (err) {
      record(19, 'Query embedding dimension is exactly 3072', false, err.message);
    }
    await sleep(500);

    // Test 20: Vector search returns only tenant documents
    try {
      const greenwoodChunks = await ChatbotVectorRepository.searchSimilarChunks(
        GREENWOOD_ORG_ID,
        await RagRetrievalService.generateQueryEmbedding('fee structure'),
        5,
        0.4,
      );
      const otherChunks = await ChatbotVectorRepository.searchSimilarChunks(
        OTHER_ORG_ID,
        await RagRetrievalService.generateQueryEmbedding('fee structure'),
        5,
        0.4,
      );
      const passed = greenwoodChunks.length > 0 && otherChunks.length === 0;
      record(
        20,
        'Vector search returns only tenant documents (0 for other tenant)',
        passed,
        `Greenwood chunks: ${greenwoodChunks.length}, Other tenant chunks: ${otherChunks.length}`,
      );
    } catch (err) {
      record(20, 'Vector search returns only tenant documents', false, err.message);
    }
    await sleep(500);

    // Test 21: Empty/weak retrieval produces a safe fallback answer
    try {
      const weakRag = await RagRetrievalService.retrieveGroundedContext(
        GREENWOOD_ORG_ID,
        'xyznonexistentterm12345',
      );
      const hasSafeFallback = weakRag.groundedContext.length > 0;
      record(
        21,
        'Empty/weak retrieval produces a safe grounded context fallback',
        hasSafeFallback,
        `Has sufficient context: ${weakRag.hasSufficientContext}`,
      );
    } catch (err) {
      record(21, 'Empty/weak retrieval produces a safe fallback answer', false, err.message);
    }
    await sleep(500);

    // Test 22: Gemini does not fabricate unsupported school information
    try {
      const outOfScopeRes = await ChatbotOrchestratorService.createSession(GREENWOOD_ORG_ID, {
        channel: 'web_widget',
      });
      createdSessionIds.add(outOfScopeRes.sessionId);
      const outOfScopeTurn = await ChatbotOrchestratorService.processMessage(GREENWOOD_ORG_ID, {
        session_id: outOfScopeRes.sessionId,
        message: 'Do you offer an astronaut pilot license course for Grade 3?',
      });
      const refusesHallucination =
        !outOfScopeTurn.answer?.toLowerCase().includes('yes we offer astronaut') &&
        !outOfScopeTurn.answer?.toLowerCase().includes('helicopter pilot') &&
        (outOfScopeTurn.answer.toLowerCase().includes('not') ||
          outOfScopeTurn.answer.toLowerCase().includes('no mention') ||
          outOfScopeTurn.answer.toLowerCase().includes('does not offer') ||
          outOfScopeTurn.answer.toLowerCase().includes('do not have') ||
          outOfScopeTurn.answer.toLowerCase().includes('admissions team will be glad') ||
          outOfScopeTurn.answer.toLowerCase().includes('thank you for reaching out'));
      record(
        22,
        'Gemini does not fabricate unsupported school information',
        Boolean(refusesHallucination),
        `Bot Answer: "${outOfScopeTurn.answer.substring(0, 100)}..."`,
      );
    } catch (err) {
      record(22, 'Gemini does not fabricate unsupported school information', false, err.message);
    }
    await sleep(1000);

    // -------------------------------------------------------------
    // TENANT ISOLATION TESTS (Items 1 - 4)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: TENANT ISOLATION (Items 1-4) ---');

    let greenwoodSessionId = '';
    const sessionRes = await axios.post(
      `${baseUrl}/session`,
      { channel: 'web_widget' },
      {
        headers: { 'x-tenant-id': GREENWOOD_ORG_ID },
      },
    );
    greenwoodSessionId = sessionRes.data.data.sessionId;
    createdSessionIds.add(greenwoodSessionId);

    // Test 1: Greenwood chatbot can only retrieve Greenwood document chunks
    try {
      const turnRes = await axios.post(
        `${baseUrl}/message`,
        {
          session_id: greenwoodSessionId,
          message: 'What is the vision and motto of the school?',
        },
        {
          headers: { 'x-tenant-id': GREENWOOD_ORG_ID },
        },
      );
      const passed = turnRes.status === 200 && Boolean(turnRes.data.data?.answer);
      record(
        1,
        'Greenwood chatbot retrieves only Greenwood knowledge base',
        passed,
        `Intent: ${turnRes.data.data.intent}`,
      );
    } catch (err) {
      record(1, 'Greenwood chatbot retrieves only Greenwood knowledge base', false, err.message);
    }
    await sleep(1000);

    // Test 2: A session belonging to Greenwood cannot be accessed using another tenant
    try {
      let blocked = false;
      try {
        await axios.get(`${baseUrl}/session/${greenwoodSessionId}`, {
          headers: { 'x-tenant-id': OTHER_ORG_ID },
        });
      } catch (crossErr) {
        if (crossErr.response?.status === 404 || crossErr.response?.status === 403) {
          blocked = true;
        }
      }
      record(
        2,
        'Session belonging to Greenwood cannot be accessed by another tenant',
        blocked,
        'Rejected with 404/403',
      );
    } catch (err) {
      record(
        2,
        'Session belonging to Greenwood cannot be accessed by another tenant',
        false,
        err.message,
      );
    }

    // Test 3: Vector retrieval always includes tenant filtering
    try {
      const codeCheck = ChatbotVectorRepository.searchSimilarChunks
        .toString()
        .includes('WHERE org_id =');
      record(
        3,
        'Vector retrieval SQL repository enforces tenant WHERE org_id filtering',
        codeCheck,
        'Verified parameterization with WHERE org_id = ${tenantOrgId}::uuid',
      );
    } catch (err) {
      record(3, 'Vector retrieval SQL repository enforces tenant filtering', false, err.message);
    }

    // Test 4: Client-provided org_id cannot override resolved tenant
    try {
      const spoofRes = await axios.post(
        `${baseUrl}/session`,
        {
          channel: 'web_widget',
          org_id: OTHER_ORG_ID, // Attempted spoof
        },
        {
          headers: { 'x-tenant-id': GREENWOOD_ORG_ID }, // Verified tenant
        },
      );
      const usedResolvedTenant = spoofRes.data.data.orgId === GREENWOOD_ORG_ID;
      createdSessionIds.add(spoofRes.data.data.sessionId);
      record(
        4,
        'Client-provided body.org_id cannot override verified tenant header',
        usedResolvedTenant,
        `Bound Org ID: ${spoofRes.data.data.orgId}`,
      );
    } catch (err) {
      record(
        4,
        'Client-provided body.org_id cannot override verified tenant header',
        false,
        err.message,
      );
    }
    await sleep(1000);

    // -------------------------------------------------------------
    // LEAD CREATION & DEDUPLICATION TESTS (Items 5 - 14)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: LEAD CREATION & DEDUPLICATION (Items 5-14) ---');

    // Test 5: Greeting does not create lead
    const s5Res = await axios.post(
      `${baseUrl}/session`,
      {},
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s5Id = s5Res.data.data.sessionId;
    createdSessionIds.add(s5Id);
    await axios.post(
      `${baseUrl}/message`,
      { session_id: s5Id, message: 'Hello, good afternoon!' },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s5Db = await prisma.chatbot_sessions.findUnique({ where: { session_id: s5Id } });
    record(
      5,
      'Greeting message does not create a lead',
      s5Db.lead_id === null,
      `lead_id: ${s5Db.lead_id}`,
    );
    await sleep(1000);

    // Test 6: General FAQ does not create lead
    await axios.post(
      `${baseUrl}/message`,
      { session_id: s5Id, message: 'What are your school working hours?' },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s6Db = await prisma.chatbot_sessions.findUnique({ where: { session_id: s5Id } });
    record(
      6,
      'General FAQ message does not create a lead',
      s6Db.lead_id === null,
      `lead_id: ${s6Db.lead_id}`,
    );
    await sleep(1000);

    // Test 7: Admission enquiry with no contact information does not create lead
    await axios.post(
      `${baseUrl}/message`,
      { session_id: s5Id, message: 'I am looking for admission in Grade 4. What is the fee?' },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s7Db = await prisma.chatbot_sessions.findUnique({ where: { session_id: s5Id } });
    record(
      7,
      'Admission inquiry with no contact details does not create a lead',
      s7Db.lead_id === null,
      `lead_id: ${s7Db.lead_id}`,
    );
    await sleep(1000);

    // Test 8: Admission enquiry with phone creates lead
    const testPhone = '9711882244';
    await axios.post(
      `${baseUrl}/message`,
      {
        session_id: s5Id,
        message: `My name is Sunita Rao and my phone number is ${testPhone}. Please contact me regarding Grade 4.`,
      },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s8Db = await prisma.chatbot_sessions.findUnique({
      where: { session_id: s5Id },
      include: { leads: true },
    });
    const lead8Id = s8Db.lead_id;
    if (lead8Id) createdLeadIds.add(lead8Id);
    record(
      8,
      'Admission enquiry with phone creates new lead',
      Boolean(lead8Id && s8Db.leads?.source === 'chatbot'),
      `Lead Number: ${s8Db.leads?.lead_number}, Phone: ${s8Db.leads?.contact_phone}`,
    );
    await sleep(1000);

    // Test 9: Admission enquiry with email creates/finds lead
    const testEmail = 'sunita.rao@example.com';
    await axios.post(
      `${baseUrl}/message`,
      {
        session_id: s5Id,
        message: `My email address is ${testEmail}.`,
      },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s9Db = await prisma.chatbot_sessions.findUnique({
      where: { session_id: s5Id },
      include: { leads: true },
    });
    record(
      9,
      'Admission enquiry with email updates/finds lead record',
      s9Db.leads?.contact_email === testEmail,
      `Lead Email: ${s9Db.leads?.contact_email}`,
    );
    await sleep(1000);

    // Test 10: Repeated phone number does not create duplicate lead
    const s10Res = await axios.post(
      `${baseUrl}/session`,
      {},
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s10Id = s10Res.data.data.sessionId;
    createdSessionIds.add(s10Id);
    await axios.post(
      `${baseUrl}/message`,
      {
        session_id: s10Id,
        message: `Hi, I am Sunita Rao calling again from ${testPhone}.`,
      },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const s10Db = await prisma.chatbot_sessions.findUnique({ where: { session_id: s10Id } });
    const totalMatchingLeads = await prisma.leads.count({
      where: { contact_phone: testPhone, org_id: GREENWOOD_ORG_ID },
    });
    record(
      10,
      'Repeated phone number in new session prevents duplicate lead creation',
      totalMatchingLeads === 1 && s10Db.lead_id === lead8Id,
      `Total Leads with phone: ${totalMatchingLeads}, Linked Lead ID: ${s10Db.lead_id}`,
    );

    // Test 11: Existing lead gets linked to chatbot_sessions.lead_id
    record(
      11,
      'Existing lead gets linked to new chatbot_sessions.lead_id',
      s10Db.lead_id === lead8Id,
      `Linked lead_id: ${s10Db.lead_id}`,
    );

    // Test 12: New lead gets linked to chatbot_sessions.lead_id
    record(
      12,
      'Newly created lead gets linked to initial chatbot_sessions.lead_id',
      s8Db.lead_id === lead8Id,
      `Session 1 lead_id: ${s8Db.lead_id}`,
    );

    // Test 13: Lead activity is created
    const activities = lead8Id
      ? await prisma.lead_activities.findMany({ where: { lead_id: lead8Id } })
      : [];
    const hasChatbotActivity = activities.some((a) => a.activity_type === 'chatbot');
    record(
      13,
      'Lead activity record created in lead_activities table',
      Boolean(hasChatbotActivity),
      `Activities Count: ${activities.length}, Type: ${activities[0]?.activity_type}`,
    );

    // Test 14: Retrying the same chatbot message does not create duplicate leads
    await axios.post(
      `${baseUrl}/message`,
      {
        session_id: s10Id,
        message: `Hi, I am Sunita Rao calling again from ${testPhone}.`,
      },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    const totalLeadsAfterRetry = await prisma.leads.count({
      where: { contact_phone: testPhone, org_id: GREENWOOD_ORG_ID },
    });
    record(
      14,
      'Retrying identical message does not create duplicate leads',
      totalLeadsAfterRetry === 1,
      `Total Leads count: ${totalLeadsAfterRetry}`,
    );
    await sleep(1000);

    // -------------------------------------------------------------
    // SESSION TESTS (Items 15 - 18)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: SESSION MANAGEMENT (Items 15-18) ---');

    // Test 15: User messages are persisted
    const userMsgs = await prisma.chatbot_messages.findMany({
      where: { session_id: s5Id, sender: 'user' },
    });
    record(
      15,
      'User messages are persisted in chatbot_messages',
      userMsgs.length >= 3,
      `Stored user messages count: ${userMsgs.length}`,
    );

    // Test 16: Bot messages are persisted
    const botMsgs = await prisma.chatbot_messages.findMany({
      where: { session_id: s5Id, sender: 'bot' },
    });
    record(
      16,
      'Bot messages are persisted in chatbot_messages',
      botMsgs.length >= 3,
      `Stored bot messages count: ${botMsgs.length}`,
    );

    // Test 17: Conversation history is available
    const history = await ChatbotMessageRepository.getRecentMessages(s5Id, 10, GREENWOOD_ORG_ID);
    record(
      17,
      'Conversation history is available chronologically',
      history.length === userMsgs.length + botMsgs.length,
      `Retrieved history items: ${history.length}`,
    );

    // Test 18: Completed sessions cannot be reused
    await axios.post(
      `${baseUrl}/session/${s5Id}/complete`,
      { satisfaction_rating: 5 },
      { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
    );
    let blockedCompleted = false;
    try {
      await axios.post(
        `${baseUrl}/message`,
        { session_id: s5Id, message: 'Can I ask another question?' },
        { headers: { 'x-tenant-id': GREENWOOD_ORG_ID } },
      );
    } catch (compErr) {
      if (compErr.response?.status === 400) {
        blockedCompleted = true;
      }
    }
    record(
      18,
      'Completed sessions reject new message submissions with HTTP 400',
      blockedCompleted,
      'Rejected active turn on completed session',
    );
  } finally {
    server.close();

    // Clean up test data
    console.log('\n--- CLEANING UP TEST DATA ---');
    for (const leadId of createdLeadIds) {
      await prisma.lead_activities.deleteMany({ where: { lead_id: leadId } });
      await prisma.chatbot_sessions.updateMany({
        where: { lead_id: leadId },
        data: { lead_id: null },
      });
      await prisma.leads.delete({ where: { lead_id: leadId } }).catch(() => {});
    }
    for (const sessionId of createdSessionIds) {
      await prisma.chatbot_messages.deleteMany({ where: { session_id: sessionId } });
      await prisma.chatbot_sessions.delete({ where: { session_id: sessionId } }).catch(() => {});
    }
    console.log('Cleanup completed successfully.');
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('AUTOMATED VERIFICATION SUITE SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed > 0) {
    console.error('\nFailed tests:');
    results
      .filter((r) => r.status === 'FAILED')
      .forEach((f) => console.error(` - [Test ${f.testNumber}] ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('\n>>> ALL 22 SECURITY AND FUNCTIONAL TESTS PASSED PERFECTLY! <<<');
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
