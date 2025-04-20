// server.js
const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'GitCDN v1.0'
});

const REPO_OWNER = 'mrfr8nk';
const REPO_NAME = 'GITHUB-CDN';
const BRANCH = 'main';

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const fileContent = fs.readFileSync(file.path);
    const fileName = `${Date.now()}-${file.originalname}`;
    
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `uploads/${fileName}`,
      message: `Upload ${fileName}`,
      content: fileContent.toString('base64'),
      branch: BRANCH
    });

    const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/uploads/${fileName}`;
    res.json({ url: rawUrl });

    fs.unlinkSync(file.path); // Cleanup
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
