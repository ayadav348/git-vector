#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import readline from 'readline';
import pc from 'picocolors';

const execAsync = promisify(exec);

// Cross-Platform Configuration Persistence Path Setup
const CONFIG_DIR = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'git-vector'
);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// --- 🎨 Easter Egg ASCII Art Buffer ---
const EASTER_EGG_ART = `
⠀⠀⠀⠀⠀⢀⠀⠀⡀⠀⢈⠀⠀⣀⠴⢉⡰⢊⡥⠀⢄⠠⣰⠋⠄⣰⠞⢰⠋⢠⢀⡐⢰⠠⠀⠄⠂⠌⡀⢻⡜⡆⠠⡐⠈⠄⢳⣀⠂⡹⣆⠠⠐⠠⢂⠙⡄⠠⠐⠠⢉⢢⡠⠙⡽⣆⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⢈⠀⠀⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠠⠀⠀⠄⠀⠠⠀⣠⠊⣤⢊⠴⠁⢄⠨⢀⡼⠃⠌⣸⠋⢠⡏⠐⠠⡀⠐⣸⠀⠡⠌⢢⠁⡐⢸⣿⠷⠀⠠⠡⢈⠘⣧⠈⢧⢻⡄⡉⢣⣣⡠⢹⡆⠁⠆⡀⠂⠳⣆⣈⢎⢿⣄⣠⣀⣀⠤⠤⠤⣀⣈⠀⠀⡁⠀⠄⠀⠠⠀⠀⠄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠠⠀⠀⠄⣰⠁⢤⠗⡁⢂⠉⠄⠂⣼⡏⠐⢠⡿⢀⣼⡅⠈⢄⢰⡁⢺⠀⠡⠌⢸⠠⠐⡀⣿⣿⠀⡁⠢⠁⢂⢼⡂⣄⡈⡧⠐⠨⡔⡑⡀⢹⡈⠄⢡⠁⢆⠀⠱⡋⠀⢻⡖⠡⠤⠴⠮⠭⢍⡩⠂⠀⠄⠀⠠⠀⠀⠀⠠⠀⠀⠄⠀⠀⠀⠀
⠀⠀⠀⠐⠀⠀⠂⠐⠀⠀⡺⠁⡴⢋⠀⢐⠌⣐⡬⢼⠟⢠⡎⣸⡃⢨⠋⠠⠁⠂⣾⠀⢳⠀⢂⠘⣸⢀⣃⣤⠷⣿⡺⣵⣷⡟⣿⣹⣏⢷⡹⣿⢽⡳⣿⢦⣳⣈⢷⡈⠄⡈⢼⠀⢥⢃⡄⠀⢻⡆⠠⠦⠴⣴⡒⠄⠷⠦⡂⠀⠐⠀⠂⠀⠐⠀⠀⠂⠀⠐⠀⠀
⢀⠁⠒⠊⠤⣀⡁⠀⠈⢰⢃⡼⠑⠠⢐⡡⠚⠡⢰⣏⢡⢻⢁⡿⠁⠀⡈⣐⠁⢂⡗⠈⢼⣰⢦⢾⣹⣸⣓⢮⣛⣽⢳⡼⢥⣿⣿⡜⣯⢶⡹⣻⢮⢵⢻⣮⢵⣏⢿⡽⣲⠶⡜⡆⠘⣎⠘⡌⢆⣿⡷⠷⠶⡶⠮⢽⢄⠀⠁⠈⢈⠀⠁⠀⠈⠀⠀⡁⠀⠈⠀⠀
⠂⠈⠉⢒⠒⠠⠵⣦⡠⡞⡰⠠⣨⠖⡑⠌⡐⢁⡿⠈⠀⡜⣸⡏⠰⠀⡔⡏⢐⣬⣿⡞⣽⢻⣏⠶⣹⣷⢭⡞⣥⣿⢧⣛⢾⣏⣿⠼⣟⣎⢷⣹⢏⡾⣹⣯⢞⡿⣮⣽⡖⣯⢽⣻⣏⡿⣄⣳⠸⣸⡙⣦⠀⠌⠀⠠⠀⠀⠄⠠⠠⠀⢄⠀⠠⠀⠀⠄⠀⠠⠀⠀
⠂⠌⠐⣀⠂⢁⣂⣈⣹⣇⢡⠚⢀⠐⣀⣂⣐⣸⠇⠀⡄⡇⢸⣿⠀⢡⢀⣷⣿⢪⣽⡟⡼⣿⢫⢏⡟⣿⡞⣼⢣⣿⣏⠾⣹⡿⣞⡽⣗⣮⢳⣽⢾⣱⣻⣏⣾⡟⣵⣿⡟⡼⣎⡳⣯⡿⣜⣻⡵⡇⡇⠘⢷⡠⠀⠀⠄⠠⠂⠀⠔⠀⠠⠀⠀⠄⠀⠂⠀⠀⠀⠠
⡴⣺⠏⢁⣪⣽⣳⣝⣮⣽⠅⡒⠊⠍⡙⠒⡀⣾⠀⢰⠡⠒⢸⣽⡎⡶⣏⣿⣷⢳⡺⣽⡵⣻⡏⣟⣼⠟⣯⡷⠏⠻⢞⢟⡿⠇⢓⠛⠳⠞⣓⣺⠷⢒⣛⣓⢻⡿⣼⣇⣟⡳⡭⣽⣷⡿⣥⣻⢼⣧⡗⠈⠌⢷⡄⠂⠂⠐⠀⠀⠂⠀⠐⠀⠀⠂⠐⠐⠀⠂⠀⠐
⡽⢁⣴⡿⣫⡿⠑⢮⢖⣻⣆⠠⢁⠒⠠⡁⢬⡇⠂⠌⡠⠑⠸⡏⣷⣛⢶⣹⣿⣧⣝⣿⠷⠛⠓⠚⠒⠒⠲⠛⠿⠆⠶⠭⠀⠉⠀⠊⠐⠸⠟⠋⠉⡀⠀⠈⠉⠉⠛⠛⢾⡿⣕⠛⢿⣳⣥⣿⣻⣿⡉⢳⡀⢂⢻⡁⠀⢈⠀⠀⡁⠀⢈⠀⠀⡁⠀⢈⠀⠀⠀⠈
⢃⡞⡽⣼⠋⠠⠌⢠⡟⣾⢳⠳⣄⠊⡐⠄⢺⡏⠐⢂⢱⡌⠐⢿⣟⣯⢮⣵⡿⠟⠋⠀⠀⠀⠀⢀⡶⣞⣳⣤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣞⢿⢽⢳⡀⠀⠀⠀⠀⠈⠹⢿⣻⣦⣼⡿⣽⢻⣧⠐⡈⣿⡄⠨⣯⠄⠀⡀⠀⠄⠀⠠⠀⠀⠄⠀⠀⠀⠀⠀⠀
⢾⡄⢳⡟⠠⢁⡘⣼⠽⢯⣻⣧⡈⠳⣄⡌⣸⠅⡘⢀⢺⡀⢡⠈⣿⣼⢻⡞⠁⠀⠀⠀⠀⠀⠀⢸⡙⣼⡻⣸⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢯⣚⣛⡼⠁⠀⠀⠀⠀⠀⠀⢨⡿⢿⡿⣜⢧⢫⣿⠀⠄⡷⣳⠀⢼⡆⠀⠄⠠⠠⠀⠐⠀⠠⠀⠀⠄⠀⠠⠀⠀
⠀⣳⢠⣇⣢⣵⢮⠑⡁⢸⡖⣯⢿⡦⣌⠙⣿⡐⠠⡁⢸⣇⣠⢁⡈⢿⣟⠀⠀⠀⠀⠀⠀⠀⠀⠀⢙⣒⣾⡥⡶⠤⠀⠀⠀⠀⠀⠀⠀⠀⠰⠶⠾⡤⢄⣀⠀⠀⠀⠀⠀⢀⠞⠀⢸⡽⣟⣮⢳⣏⠐⠤⣟⣿⡌⢀⣷⠀⠂⠀⡁⠀⢈⠀⠀⡁⠀⠀⠀⠀⠀⠀
⠊⢰⡟⠁⠄⡈⢿⣯⢄⠀⣿⡭⣷⢻⣭⣿⣿⠀⡡⠐⡀⣯⠄⡞⠉⡁⢿⡢⢄⡀⠀⣀⣠⡴⠒⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠱⠶⡦⣴⡁⠂⡄⢺⡵⢻⣽⡾⠁⠌⣼⣻⣟⡇⡀⢽⡄⡁⠀⢈⠀⠀⠀⢀⠀⠀⡁⠀⠀⠀⠀
⠀⣺⠁⠰⢀⠁⢞⣿⠎⠀⡹⣧⣛⣾⠟⠉⣽⠀⠃⡄⠡⢹⡄⢷⡀⠡⡌⠳⣌⢱⡶⠟⠛⠁⢀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠁⠉⡇⡄⠇⠸⣷⢎⣿⠇⢂⣰⣯⣿⢻⢅⡇⠘⣷⡁⠀⢈⠀⠀⠀⢈⠀⠀⡁⠀⠀⠀⠀
⠀⡇⢈⡁⠂⢌⣾⠣⠡⠀⣴⠿⣿⠃⡔⠒⣼⢈⡐⣤⠁⠌⣷⣸⣷⡀⠹⣄⠈⠓⢄⡐⠀⠈⡀⡀⠆⠰⠈⡀⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠃⢠⠈⠄⠁⠂⠈⠀⠹⡿⠃⣠⣶⡟⡽⣒⡿⣼⠃⡄⠸⡇⠀⠠⠀⠌⠀⠠⠀⠀⠄⠀⠀⠀⠀
⢢⢹⠀⢄⣽⣯⠂⠐⠔⣰⢯⣙⣿⢠⠁⡾⢽⠠⢀⢻⡐⠠⢹⣧⣻⡽⣄⠙⣷⡈⢠⡉⠒⠥⣀⠁⠄⠂⡁⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠈⠈⠀⠀⠘⠚⠛⠒⣿⣿⢼⣿⡱⡭⡟⣽⢸⢇⠂⢷⠐⠔⠀⠠⠀⠐⠄⠀⠂⠀⠀⠀⠀
⠁⣿⡜⠡⠙⣿⣷⠀⠂⢸⣧⢏⣿⡘⡟⠡⠸⡇⠠⢸⡷⠐⡄⢳⡻⣽⣞⢦⡘⢟⡦⣌⠳⢤⣀⣍⡓⠒⢦⢦⠶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⢻⣾⣿⣱⢳⣏⡞⣸⠚⡌⢼⠀⠂⠀⠐⠀⠀⠂⠀⠀⠀⠀⠀⠀
⠀⡿⢀⠡⢂⢹⣟⠀⡁⠈⢙⣾⢿⣧⡈⢦⠉⣧⠁⠌⣿⡁⢻⡀⠻⣵⣛⠿⣹⠮⣳⣭⢛⣻⣶⡛⢛⡩⠍⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⢫⣿⢺⣷⢣⣿⣿⢃⡧⡁⢏⣞⠀⡁⠀⢈⠀⠀⡁⠀⢀⠀⠀⠀⢀
⢄⢷⠀⠒⣀⡿⠡⠀⠄⠀⣰⣏⢿⣜⡳⣄⠑⠺⡌⠰⣿⣯⡘⣷⡄⡙⢿⣞⡭⡻⣖⠽⣮⣱⢋⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠖⠊⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⢣⡿⣸⣻⣵⢫⢿⢃⡼⠄⠄⣸⠣⠀⠄⠀⠠⠀⠀⠄⠀⠠⠀⠄⠀⠠
⠀⡹⢎⢡⠞⠙⣿⣦⡂⠀⠼⣞⢮⣻⡵⣩⣛⡦⢷⡑⣧⠘⣧⠸⣿⣶⣀⠻⣝⣳⣭⣛⢶⣭⢻⣴⡫⢖⡤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠊⢽⢧⡿⢃⣿⠗⣡⢃⢏⡜⠀⠠⠂⠙⠀⠀⠂⠀⠐⠀⠀⠂⠀⠐⠀⠀⠀⠀
⠀⡇⢸⡟⠠⠁⣾⣹⡷⠀⢈⡩⣾⣿⢹⡳⣾⣁⣈⣳⣸⡢⣌⣷⡜⢿⡟⡷⣦⣕⣺⠭⣛⠾⣷⣚⡽⡯⠷⠿⠿⠓⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣔⣉⣁⠀⣾⠋⢀⡽⢃⠔⢡⡯⠊⠈⠀⠐⠁⠈⠂⠀⡁⠀⢈⠀⠀⡁⠀⠈⠀⠁⠀⠈
⠀⣷⡀⢧⣁⢢⡗⢧⣏⣤⡽⣽⣟⡼⣣⠷⣹⣧⢻⡜⣳⣷⣹⢚⡿⣄⢻⡵⢻⡏⠳⢭⣉⠉⠉⠉⠉⠀⠀⣀⣀⣀⣀⣤⣤⣤⣤⣶⣶⣶⣶⣻⣟⣿⣿⣿⣿⣿⣿⣷⣾⣾⣿⣿⣿⣶⣾⣯⣥⣑⣉⢀⠀⡁⠀⢈⠀⠀⡁⢀⢈⠀⡀⡀⢈⠀⠀⡁⠀⢀⠀⠀
⠀⠈⠑⢪⣧⣾⡹⣿⡱⢮⣝⣶⣭⣳⣝⣾⣹⣏⣧⣛⣵⣮⣷⣯⣼⣯⣷⣽⣷⣿⣶⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣤⣀⡀⠄⠀⠠⠀⠄⠀⠠⠀⠀⠄⠀⠠⠀⠀
⠀⠀⠀⢿⣿⣻⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⢻⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⠐⠀⠂⠀⠐⠀⠀⠂⠀⠐⠀⠀
⠀⠀⠀⢘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⠀⠀⠐⠀⠈⠀⠀⠀⠀⠀⠀⠀
⠀⢀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⡁⠀⢈⠀⠀⡁⢀⢀⠀⠀⠀⢀
`;

const askQuestion = (query) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
};

async function runCommand(cmd, dir) {
  try {
    const { stdout } = await execAsync(cmd, { 
      cwd: dir,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } 
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function getOrSetupTargetRoot(forceReset = false) {
  let config = {};
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  if (!forceReset) {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
      if (config.targetRoot) {
        return config.targetRoot;
      }
    } catch {
      // Configuration empty, prompt first run
    }
  }

  console.log(pc.bold(pc.magenta('\n⚙️  [git-vector] Target Environment Configuration Setup')));
  let chosenPath = '';
  
  while (!chosenPath) {
    const defaultSuggestion = path.join(os.homedir(), 'developer');
    const input = await askQuestion(`Enter absolute path to your Git projects directory [Default: ${defaultSuggestion}]: `);
    
    let resolvedPath = input || defaultSuggestion;
    if (resolvedPath.startsWith('~')) {
      resolvedPath = path.join(os.homedir(), resolvedPath.slice(1));
    }
    resolvedPath = path.resolve(resolvedPath);

    try {
      const stats = await fs.stat(resolvedPath);
      if (stats.isDirectory()) {
        chosenPath = resolvedPath;
      } else {
        console.log(pc.red('[!] Error: Path exists but is not a directory. Try again.'));
      }
    } catch {
      const createConfirm = await askQuestion(pc.yellow(`[?] Directory does not exist. Create it now? (y/n): `));
      if (createConfirm.toLowerCase() === 'y' || createConfirm === '') {
        await fs.mkdir(resolvedPath, { recursive: true });
        chosenPath = resolvedPath;
      }
    }
  }

  await fs.writeFile(CONFIG_FILE, JSON.stringify({ targetRoot: chosenPath }, null, 2), 'utf8');
  console.log(pc.green(`[✓] Configuration successfully locked to target path: ${chosenPath}\n`));
  return chosenPath;
}

async function analyzeRepository(repoPath) {
  const repoName = path.basename(repoPath);
  
  const statusOutput = await runCommand('git status --porcelain', repoPath);
  if (statusOutput === null) return null; 
  
  const uncommittedCount = statusOutput ? statusOutput.split('\n').length : 0;
  const currentBranch = await runCommand('git branch --show-current', repoPath) || 'detached';

  const fetchAttempt = await runCommand('git fetch --dry-run', repoPath);
  
  let ahead = 0, behind = 0;
  if (fetchAttempt !== null) {
    const upstreamCheck = await runCommand('git rev-list --left-right --count HEAD...@{u}', repoPath);
    if (upstreamCheck) {
      [ahead, behind] = upstreamCheck.split('\t').map(Number);
    }
  } else {
    return { name: repoName, branch: currentBranch, uncommitted: uncommittedCount, ahead: 0, behind: 0, isPrivate: true };
  }

  return { name: repoName, branch: currentBranch, uncommitted: uncommittedCount, ahead, behind, isPrivate: false };
}

async function main() {
  const args = process.argv.slice(2);

  // --- 🎭 Intercept and Process Easter Egg Flag Matrix ---
  if (args.includes('--n') || args.includes('-n')) {
    console.log(pc.magenta(EASTER_EGG_ART));
    process.exit(0); // Safely terminate process immediately after printing art
  }
    if (args.includes('--h') || args.includes('-h')) {
    console.log('git-vector -d, --d : change target directory');
    console.log('git-vector -n, --n : ?');
    process.exit(0); // Safely terminate process immediately after printing art
  }

  const requiresPathReset = args.includes('--d') || args.includes('-d');

  let targetRoot;
  try {
    targetRoot = await getOrSetupTargetRoot(requiresPathReset);
  } catch (err) {
    console.error(pc.red(`[!] Configuration error: ${err.message}`));
    process.exit(1);
  }

  if (requiresPathReset && args.length === 1) {
    process.exit(0);
  }

  console.log(pc.bold(pc.cyan(`\n⚔️  Running Low-Latency Git-Vector Telemetry Engine [Target: ${targetRoot}]`)));
  console.log(pc.dim('-------------------------------------------------------------------------'));

  try {
    const entries = await fs.readdir(targetRoot, { withFileTypes: true });
    const directoryPaths = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(targetRoot, entry.name));

    const evaluationPromises = directoryPaths.map(async (dir) => {
      try {
        const gitDirExists = await fs.access(path.join(dir, '.git')).then(() => true).catch(() => false);
        return gitDirExists ? analyzeRepository(dir) : null;
      } catch {
        return null;
      }
    });

    const datasets = (await Promise.all(evaluationPromises)).filter(Boolean);

    if (datasets.length === 0) {
      console.log(pc.yellow('[-] No active .git state-vectors identified in the target path.'));
      return;
    }

    for (const data of datasets) {
      const label = `[${data.name}] branch:(${data.branch})`;
      
      if (data.uncommitted > 0) {
        console.log(`${pc.yellow('⚠️  WARN ')} ${pc.bold(label)} ➜ ${pc.yellow(`${data.uncommitted} uncommitted changes`)}`);
      } else if (data.isPrivate) {
        console.log(`${pc.dim('🔒 PRIV ')} ${pc.dim(label)} ➜ Local status only (Terminal auth loop suppressed).`);
      } else if (data.ahead > 0 || data.behind > 0) {
        let driftMsg = [];
        if (data.ahead > 0) driftMsg.push(pc.green(`${data.ahead} ahead`));
        if (data.behind > 0) driftMsg.push(pc.red(`${data.behind} behind`));
        console.log(`${pc.blue('🔄 DRIFT')} ${pc.bold(label)} ➜ Diverged: ${driftMsg.join(', ')}`);
      } else {
        console.log(`${pc.green('✓  CLEAN')} ${pc.dim(label)} ➜ State synchronized perfectly.`);
      }
    }
    console.log('');
  } catch (err) {
    console.error(pc.red(`[!] Critical System Intercept: ${err.message}`));
  }
}

main();
