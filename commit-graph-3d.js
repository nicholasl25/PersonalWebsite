import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function bucketCommitsByDay(commits) {
  const map = new Map();
  for (const c of commits) {
    const raw = c.commit?.author?.date || c.commit?.committer?.date;
    if (!raw) continue;
    const key = raw.slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

async function fetchAllCommits(owner, repo, maxPages = 20) {
  const all = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body.slice(0, 240)}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function parseBg(hex) {
  const c = new THREE.Color();
  const h = hex && hex.length ? hex : '#fafaf9';
  try {
    c.setStyle(h);
  } catch {
    c.setStyle('#fafaf9');
  }
  return c;
}

function buildScene(canvas, dayBuckets, bgHex) {
  const wrap = canvas.parentElement;
  const width = Math.max(wrap.clientWidth, 320);
  const height = Math.max(wrap.clientHeight, 360);

  const scene = new THREE.Scene();
  scene.background = parseBg(bgHex);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
  camera.position.set(14, 12, 22);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.85);
  dir.position.set(8, 18, 10);
  scene.add(dir);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 2, 0);

  const grid = new THREE.GridHelper(40, 20, 0xbfc7d4, 0xd9dde5);
  grid.position.y = 0;
  scene.add(grid);

  const barW = 0.42;
  const gap = 0.1;
  const maxCount = Math.max(1, ...dayBuckets.map(([, n]) => n));
  const nBars = dayBuckets.length;
  const span = nBars * (barW + gap);
  const startX = -span / 2 + barW / 2;

  const matA = new THREE.MeshStandardMaterial({ color: 0x2c5282, metalness: 0.15, roughness: 0.45 });
  const matB = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.12, roughness: 0.5 });

  dayBuckets.forEach(([day, count], i) => {
    const h = Math.max(0.12, (count / maxCount) * 6.5);
    const geo = new THREE.BoxGeometry(barW, h, 0.55);
    const mesh = new THREE.Mesh(geo, i % 2 === 0 ? matA : matB);
    const x = startX + i * (barW + gap);
    mesh.position.set(x, h / 2, 0);
    mesh.userData.day = day;
    mesh.userData.count = count;
    scene.add(mesh);
  });

  if (nBars > 0) {
    const centerX = startX + ((nBars - 1) * (barW + gap)) / 2;
    controls.target.set(centerX, 2, 0);
    camera.position.set(centerX + 14, 11, 20);
  }

  function tick() {
    requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  }
  tick();

  const onResize = () => {
    const w = Math.max(wrap.clientWidth, 320);
    const h = Math.max(wrap.clientHeight, 360);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', onResize, { passive: true });

  return { renderer, scene, onResize };
}

function readBg() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (v.startsWith('#') || v.startsWith('rgb')) return v;
  return '#fafaf9';
}

(async () => {
  const root = document.getElementById('commit-viz-root');
  const canvas = document.getElementById('commit-canvas');
  const status = document.getElementById('commit-viz-status');
  if (!root || !canvas || !status) return;

  const owner = root.dataset.repoOwner || 'nicholasl25';
  const repo = root.dataset.repoName || 'PersonalWebsite';

  status.textContent = 'Loading commits from GitHub…';

  try {
    const commits = await fetchAllCommits(owner, repo);
    const buckets = bucketCommitsByDay(commits);
    if (buckets.length === 0) {
      status.textContent = 'No commit dates found for this repository.';
      return;
    }
    status.textContent = `${commits.length} commits across ${buckets.length} days with activity. Drag to rotate.`;
    buildScene(canvas, buckets, readBg());
  } catch (err) {
    status.textContent =
      `Could not load commits (${err.message}). For a private repo, keep this public or adjust data-repo-owner / data-repo-name on #commit-viz-root.`;
  }
})();
