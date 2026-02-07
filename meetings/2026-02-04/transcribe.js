#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    console.log('Extracting audio from video...');
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ar', '16000',
      '-ac', '1',
      '-b:a', '64k',
      audioPath,
      '-y'
    ]);

    ffmpeg.stderr.on('data', (data) => {
      // Silent - ffmpeg outputs to stderr
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Audio extracted successfully');
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

async function transcribeWithGroq(audioPath) {
  return new Promise((resolve, reject) => {
    console.log('Transcribing with Groq Whisper...');
    
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
    const videoPath = './meeting-recording.mp4';
    const audioPath = './meeting-audio.mp3';
    
    // Extract audio from video
    await extractAudio(videoPath, audioPath);
    
    // Transcribe with Groq
    const transcript = await transcribeWithGroq(audioPath);
    
    // Save transcript
    fs.writeFileSync('transcript-raw.json', JSON.stringify(transcript, null, 2));
    
    console.log('\n=== TRANSCRIPT ===\n');
    console.log(transcript.text);
    
    // Save readable text
    fs.writeFileSync('transcript.txt', transcript.text);
    
    console.log('\n=== Files created ===');
    console.log('- transcript.txt (readable text)');
    console.log('- transcript-raw.json (full JSON with timing)');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
