const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUTPUT_DIR = path.join(__dirname, 'docs', 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate terminal HTML template
function createTerminalHtml(title, promptDir, command, outputLines) {
  const linesHtml = outputLines.map(line => {
    let colored = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    if (colored.includes('http://') || colored.includes('https://')) {
      colored = colored.replace(/(https?:\/\/[^\s]+)/g, '<span style="color:#38bdf8;text-decoration:underline;">$1</span>');
    }
    if (colored.startsWith('* Running on') || colored.startsWith('* Restarting') || colored.startsWith('* Debugger')) {
      colored = `<span style="color:#a78bfa;">${colored}</span>`;
    } else if (colored.includes('Loaded Deep Learning') || colored.includes('Loaded SFace') || colored.includes('ready in')) {
      colored = `<span style="color:#34d399;">${colored}</span>`;
    } else if (colored.includes('SmartAttend') || colored.includes('=====')) {
      colored = `<span style="color:#38bdf8;font-weight:600;">${colored}</span>`;
    } else if (colored.includes('WARNING:')) {
      colored = `<span style="color:#fbbf24;">${colored}</span>`;
    }
    return `<div class="line">${colored || '&nbsp;'}</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 32px;
    background: #0f172a;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Courier New', monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .window {
    width: 100%;
    max-width: 960px;
    background: #090d16;
    border-radius: 12px;
    box-shadow: 0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08);
    overflow: hidden;
  }
  .titlebar {
    background: #131b2e;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    user-select: none;
  }
  .buttons {
    display: flex;
    gap: 8px;
  }
  .btn {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .btn-close { background: #ff5f56; }
  .btn-min { background: #ffbd2e; }
  .btn-max { background: #27c93f; }
  .title {
    color: #94a3b8;
    font-size: 12px;
    letter-spacing: 0.5px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .content {
    padding: 24px 28px;
    color: #e2e8f0;
    font-size: 13.5px;
    line-height: 1.6;
  }
  .prompt {
    color: #38bdf8;
    margin-bottom: 8px;
  }
  .prompt span.path {
    color: #94a3b8;
  }
  .prompt span.cmd {
    color: #f8fafc;
    font-weight: 600;
  }
  .line {
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <div class="buttons">
      <div class="btn btn-close"></div>
      <div class="btn btn-min"></div>
      <div class="btn btn-max"></div>
    </div>
    <div class="title">${title}</div>
    <div style="width: 52px;"></div>
  </div>
  <div class="content">
    <div class="prompt">PS <span class="path">${promptDir}</span>&gt; <span class="cmd">${command}</span></div>
    ${linesHtml}
  </div>
</div>
</body>
</html>`;
}

async function captureAll() {
  console.log("Launching Edge browser via Playwright...");
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--disable-web-security'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 1.5,
    permissions: ['camera']
  });

  const page = await context.newPage();

  // 1. Figure M.1: Backend Terminal
  console.log("Capturing Figure M.1: Backend Terminal...");
  const backendLines = [
    "[FaceDetector] Loaded Deep Learning YuNet detector from face_detection_yunet_2023mar.onnx",
    "[FaceEmbedding] Loaded SFace Deep CNN model from face_recognition_sface_2021dec.onnx",
    "[SmartAttend Seed] 18 Indian employee records verified in SQLite database.",
    "==================================================",
    "  SmartAttend 3D – AI Workplace Security System   ",
    "  API Backend running on http://127.0.0.1:5000   ",
    "==================================================",
    " * Serving Flask app 'app'",
    " * Debug mode: on",
    " * Running on all addresses (0.0.0.0)",
    " * Running on http://127.0.0.1:5000",
    " * Running on http://10.189.227.22:5000",
    "Press CTRL+C to quit",
    " * Restarting with stat",
    " * Debugger is active!",
    " * Debugger PIN: 121-779-930"
  ];
  const backendHtml = createTerminalHtml(
    "PowerShell — backend (Python Flask REST API :5000)",
    "C:\\Users\\lenovo\\Desktop\\Project\\backend",
    "python app.py",
    backendLines
  );
  await page.setContent(backendHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_m1_backend_terminal.png'), fullPage: false });

  // 2. Figure M.2: Frontend Terminal
  console.log("Capturing Figure M.2: Frontend Terminal...");
  const frontendLines = [
    "",
    "> smartattend-3d-frontend@1.0.0 dev",
    "> vite",
    "",
    "  VITE v5.4.21  ready in 3864 ms",
    "",
    "  ➜  Local:   http://localhost:5173/",
    "  ➜  Network: use --host to expose",
    "  ➜  press h + enter to show help"
  ];
  const frontendHtml = createTerminalHtml(
    "PowerShell — frontend (Vite React 18 Dev Server :5173)",
    "C:\\Users\\lenovo\\Desktop\\Project\\frontend",
    "npm run dev",
    frontendLines
  );
  await page.setContent(frontendHtml);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_m2_frontend_terminal.png'), fullPage: false });

  // 3. Figure M.3: Auth Portal
  console.log("Capturing Figure M.3: Admin Secure Authentication Portal...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_m3_auth_portal.png') });

  // Authenticate as Admin
  console.log("Logging in as Admin...");
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(1500);
  }

  // 4. Figure M.4: Mark Attendance Scanner with Verified Face
  console.log("Capturing Figure M.4: Live Check-In Scanner with Facial Boundary Box...");
  await page.goto('http://localhost:5173/mark-attendance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const sampleFace = fs.readFileSync('backend/uploads/avatars/emp_47_1789490867.jpg').toString('base64');
  const sampleDataUrl = `data:image/jpeg;base64,${sampleFace}`;

  await page.evaluate((dataUrl) => {
    // Override canvas toDataURL so any frame capture yields sample face
    HTMLCanvasElement.prototype.toDataURL = function() {
      return dataUrl;
    };

    const video = document.querySelector('video');
    if (video) {
      const parent = video.parentElement;
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = "w-full h-full object-cover";
      img.style.filter = "contrast(1.05) brightness(1.02)";
      video.style.display = 'none';
      parent.insertBefore(img, video);
    }
  }, sampleDataUrl);

  await page.waitForTimeout(500);

  // Click "Verify & Mark Attendance"
  const verifyBtn = await page.$('button:has-text("Verify & Mark Attendance")');
  if (verifyBtn) {
    await verifyBtn.click();
    await page.waitForTimeout(2500); // wait for success badge / employee info / boundary box
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_m4_scanner.png') });

  // 5. Figure M.5: 3D Workplace Floor Map & Profile Drawer
  console.log("Capturing Figure M.5: 3D Floor Map & Employee Profile Drawer...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // wait for 3D canvas to render

  // Click on the first employee card in "Requires Attention" to open profile drawer
  const empCard = await page.$('.space-y-2 > div.cursor-pointer');
  if (empCard) {
    await empCard.click();
    await page.waitForTimeout(1000);
  }

  // Scroll to Workplace Floor area
  await page.evaluate(() => {
    const floorHeader = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('Workplace Floor'));
    if (floorHeader) {
      floorHeader.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_m5_floor_map.png') });

  // 6. Figure M.6: Attendance Record Export (CSV)
  console.log("Capturing Figure M.6: Attendance Records & Export CSV...");
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Focus / highlight the Export CSV button
  await page.evaluate(() => {
    const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Export CSV'));
    if (exportBtn) {
      exportBtn.style.outline = '3px solid #0071e3';
      exportBtn.style.outlineOffset = '2px';
      exportBtn.style.boxShadow = '0 0 16px rgba(0, 113, 227, 0.4)';
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'fig_m6_export_csv.png') });

  await browser.close();
  console.log("All 6 figures captured successfully in:", OUTPUT_DIR);
}

captureAll().catch(err => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
