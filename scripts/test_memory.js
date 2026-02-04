#!/usr/bin/env node
/**
 * Test script for Flux-Lite Memory Engine
 */

const { ingest, retrieve } = require('./memory_engine.js');
const path = require('path');

async function runTests() {
  console.log('🧪 Flux-Lite Memory Engine Tests\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Ingest a test file
    console.log('\n📝 Test 1: Ingesting test knowledge base...');
    const testFile = path.join(__dirname, '../memory/semantic/test_knowledge.md');
    const ingestResult = await ingest(testFile);
    console.log(`✅ Test 1 passed: ${ingestResult.chunksAdded} chunks ingested`);
    
    // Wait a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Retrieve with technology query
    console.log('\n📝 Test 2: Searching for "LanceDB vector storage"...');
    const result1 = await retrieve('LanceDB vector storage', { limit: 3 });
    if (result1.count > 0) {
      console.log(`✅ Test 2 passed: Found ${result1.count} relevant chunks`);
      console.log(`   Top result: "${result1.results[0].header}" (score: ${result1.results[0].score.toFixed(3)})`);
    } else {
      console.log('❌ Test 2 failed: No results found');
    }
    
    // Test 3: Retrieve with team query
    console.log('\n📝 Test 3: Searching for "team members"...');
    const result2 = await retrieve('team members', { limit: 3 });
    if (result2.count > 0) {
      console.log(`✅ Test 3 passed: Found ${result2.count} relevant chunks`);
      console.log(`   Top result: "${result2.results[0].header}" (score: ${result2.results[0].score.toFixed(3)})`);
    } else {
      console.log('❌ Test 3 failed: No results found');
    }
    
    // Test 4: Retrieve with date query
    console.log('\n📝 Test 4: Searching for "project timeline dates"...');
    const result3 = await retrieve('project timeline dates', { limit: 3 });
    if (result3.count > 0) {
      console.log(`✅ Test 4 passed: Found ${result3.count} relevant chunks`);
      console.log(`   Top result: "${result3.results[0].header}" (score: ${result3.results[0].score.toFixed(3)})`);
    } else {
      console.log('❌ Test 4 failed: No results found');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests completed!\n');
    
    // Show detailed results from last query
    console.log('📋 Detailed results from last query:');
    result3.results.forEach((r, idx) => {
      console.log(`\n${idx + 1}. Source: ${r.source}`);
      console.log(`   Header: ${r.header}`);
      console.log(`   Score: ${r.score.toFixed(3)}`);
      console.log(`   Preview: ${r.text.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
