require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'GitCDN v1.0'
});

const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME  = process.env.REPO_NAME;
const BRANCH     = process.env.BRANCH || 'main';

app.use(express.static('public'));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file     = req.file;
    const buf      = fs.readFileSync(file.path);
    const name     = `${Date.now()}-${file.originalname}`;
    const filePath = `uploads/${name}`;

    await octokit.repos.createOrUpdateFileContents({
      owner:   REPO_OWNER,
      repo:    REPO_NAME,
      path:    filePath,
      message: `Upload ${name}`,
      content: buf.toString('base64'),
      branch:  BRANCH
    });

    const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${filePath}`;
    fs.unlinkSync(file.path);
    res.json({ url: rawUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
