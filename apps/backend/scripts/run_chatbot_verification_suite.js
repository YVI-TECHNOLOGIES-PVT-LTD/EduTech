require('ts-node').register({ transpileOnly: true });
const prisma = require('../src/lib/prismaClient').default;
const {
  ChatbotOrchestratorService,
} = require('../src/modules/chatbot/services/chatbot.orchestrator.service');
const { RagRetrievalService } = require('../src/modules/chatbot/services/rag.retrieval.service');
require('dotenv').config();

const GREENWOOD_ORG_ID = '624efc1b-4144-43a4-90b8-552d945cbef7';

const questions = [
  'What documents are required for admission?',
  'What are the admission dates?',
  'What is the tuition fee?',
  'Does the school have robotics?',
  'How many students are there?',
  'What sports are available?',
  'My name is Rajesh Sharma, phone 9876543210, looking for Grade 5 admission',
];

async function runVerification() {
  console.log('========================================================================');
  console.log('RUNNING CHATBOT PRODUCTION VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Create test session
  const sessionRes = await ChatbotOrchestratorService.createSession(GREENWOOD_ORG_ID, {
    channel: 'web_widget',
  });
  const sessionId = sessionRes.sessionId;
  console.log(`Created Session: ${sessionId} for org: ${GREENWOOD_ORG_ID}\n`);

  const reports = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`[TEST ${i + 1}/${questions.length}] Query: "${q}"`);
    console.log(`------------------------------------------------------------------------`);

    const t0 = Date.now();

    // Retrieve chunks directly for detailed inspection report
    const rag = await RagRetrievalService.retrieveGroundedContext(GREENWOOD_ORG_ID, q);

    // Execute full chatbot turn
    const turn = await ChatbotOrchestratorService.processMessage(GREENWOOD_ORG_ID, {
      session_id: sessionId,
      message: q,
    });

    const totalTimeMs = Date.now() - t0;
    const isFallback = turn.answer.includes(
      'Thank you for reaching out to Greenwood School. How may I assist you with admissions today?',
    );

    const rep = {
      testNumber: i + 1,
      request: q,
      retrievedChunksCount: rag.retrievedChunks.length,
      retrievedChunks: rag.retrievedChunks.map((c) => ({
        index: c.chunk_index,
        section: c.metadata?.section_heading || 'N/A',
        page: c.metadata?.page_number || 'N/A',
        similarity: c.similarity.toFixed(4),
      })),
      topSimilarity: rag.topSimilarity.toFixed(4),
      geminiResponse: turn.answer,
      intent: turn.intent,
      confidence: turn.confidence,
      leadCaptured: turn.leadCaptured,
      leadId: turn.leadId,
      totalResponseTimeMs: totalTimeMs,
      fallbackUsed: isFallback,
    };

    reports.push(rep);

    console.log(`Total Time: ${totalTimeMs}ms`);
    console.log(
      `Retrieved Chunks: ${rag.retrievedChunks.length} (Top Similarity: ${rep.topSimilarity})`,
    );
    console.log(`Intent: ${turn.intent} | Confidence: ${turn.confidence}`);
    console.log(`Lead Captured: ${turn.leadCaptured} (Lead ID: ${turn.leadId || 'none'})`);
    console.log(`Fallback Used: ${isFallback}`);
    console.log(`Answer:\n${turn.answer}\n`);
    if (turn.suggestedFollowUps?.length > 0) {
      console.log(`Suggested Follow-ups:`, turn.suggestedFollowUps);
    }
  }

  // Cleanup session and any created lead
  const lastLeadId = reports[reports.length - 1].leadId;
  if (lastLeadId) {
    await prisma.lead_activities.deleteMany({ where: { lead_id: lastLeadId } });
    await prisma.chatbot_sessions.updateMany({
      where: { lead_id: lastLeadId },
      data: { lead_id: null },
    });
    await prisma.leads.delete({ where: { lead_id: lastLeadId } }).catch(() => {});
  }
  await prisma.chatbot_messages.deleteMany({ where: { session_id: sessionId } });
  await prisma.chatbot_sessions.delete({ where: { session_id: sessionId } }).catch(() => {});

  await prisma.$disconnect();

  console.log('\n========================================================================');
  console.log('VERIFICATION SUMMARY JSON');
  console.log('========================================================================');
  console.log(JSON.stringify(reports, null, 2));
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
