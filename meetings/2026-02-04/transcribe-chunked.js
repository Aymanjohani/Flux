#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHUNK_DURATION = 600; // 10 minutes per chunk

async function splitAudio(audioPath) {
  return new Promise((resolve, reject) => {
    console.log('Splitting audio into 10-minute chunks...');
    
    // Create chunks directory
    if (!fs.existsSync('./chunks')) {
      fs.mkdirSync('./chunks');
    }
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', audioPath,
      '-f', 'segment',
      '-segment_time', CHUNK_DURATION.toString(),
      '-c', 'copy',
      './chunks/chunk_%03d.mp3',
      '-y'
    ]);

    ffmpeg.stderr.on('data', (data) => {
      // Silent - ffmpeg outputs to stderr
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const chunks = fs.readdirSync('./chunks')
          .filter(f => f.startsWith('chunk_') && f.endsWith('.mp3'))
          .sort();
        console.log(`Created ${chunks.length} chunks`);
        resolve(chunks.map(c => `./chunks/${c}`));
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

async function transcribeWithGroq(audioPath) {
  return new Promise((resolve, reject) => {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'verbose_json');
    form.append('temperature', '0');

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        ...form.getHeaders()
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

async function main() {
  try {
    const audioPath = './meeting-audio.mp3';
    
    // Split audio into chunks
    const chunks = await splitAudio(audioPath);
    
    console.log('\nTranscribing chunks...');
    const transcripts = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`\nProcessing chunk ${i + 1}/${chunks.length}: ${path.basename(chunk)}`);
      
      try {
        const transcript = await transcribeWithGroq(chunk);
        transcripts.push({
          chunk: i + 1,
          text: transcript.text,
          duration: transcript.duration
        });
        console.log(`✓ Chunk ${i + 1} transcribed (${transcript.duration.toFixed(1)}s)`);
      } catch (error) {
        console.error(`✗ Chunk ${i + 1} failed:`, error.message);
        transcripts.push({
          chunk: i + 1,
          text: `[Error transcribing chunk ${i + 1}]`,
          error: error.message
        });
      }
      
      // Small delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Combine all transcripts
    const fullText = transcripts.map((t, i) => {
      const timestamp = `[${Math.floor(i * CHUNK_DURATION / 60)}:${String(i * CHUNK_DURATION % 60).padStart(2, '0')}]`;
      return `${timestamp}\n${t.text}`;
    }).join('\n\n');
    
    // Save results
    fs.writeFileSync('transcript.txt', fullText);
    fs.writeFileSync('transcript-chunks.json', JSON.stringify(transcripts, null, 2));
    
    console.log('\n=== TRANSCRIPTION COMPLETE ===\n');
    console.log(`Total chunks: ${chunks.length}`);
    console.log(`Total duration: ~${Math.floor(chunks.length * CHUNK_DURATION / 60)} minutes`);
    console.log('\nFiles created:');
    console.log('- transcript.txt (full readable text)');
    console.log('- transcript-chunks.json (detailed chunks)');
    
    // Clean up chunks
    console.log('\nCleaning up chunk files...');
    chunks.forEach(chunk => fs.unlinkSync(chunk));
    fs.rmdirSync('./chunks');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
