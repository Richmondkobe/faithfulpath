#!/usr/bin/env node
//
// Compresses a recording to something a member can actually stream.
//
//   npm run media:compress -- ~/Desktop/welcome.mp4
//   npm run media:compress -- talk.mov --height 1080 --crf 21
//
// Writes <name>-web.mp4 beside the source and leaves the original untouched.
//
// macOS's own avconvert was tried first and cannot do this: it has no bitrate
// control, and its presets land either around 150–225 MB for this length or at
// roughly 480x272. ffmpeg is bundled as a devDependency rather than installed
// system-wide, so nothing outside this project changes.

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import ffmpeg from "ffmpeg-static";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const source = args.find((a) => !a.startsWith("--") && !args.includes(`--${a}`));

const die = (m) => {
  console.error(`\n  ${m}\n`);
  process.exit(1);
};

if (!source) die("Usage: npm run media:compress -- <file> [--height 720] [--crf 23]");
if (!existsSync(source)) die(`No such file: ${source}`);

const height = Number(flag("height", 720));
const crf = Number(flag("crf", 23));
const audioOnly = extname(source).toLowerCase() === ".mp3";

const out = join(
  dirname(source),
  `${basename(source, extname(source))}-web${audioOnly ? ".mp3" : ".mp4"}`
);

const before = statSync(source).size;
console.log(`\n  ${source}`);
console.log(`  ${(before / 1048576).toFixed(1)} MB -> ${audioOnly ? "mp3 96k" : `${height}p, crf ${crf}`}`);

const videoArgs = [
  "-vf", `scale=-2:${height}`,
  "-c:v", "libx264", "-profile:v", "high", "-crf", String(crf), "-preset", "slow",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "96k", "-ac", "2",
  // moov atom at the front, so playback starts before the file has arrived.
  "-movflags", "+faststart",
];
const audioArgs = ["-c:a", "libmp3lame", "-b:a", "96k", "-ac", "2"];

try {
  execFileSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "error", "-y", "-i", source, ...(audioOnly ? audioArgs : videoArgs), out],
    { stdio: "inherit" }
  );
} catch {
  die("ffmpeg failed.");
}

const after = statSync(out).size;
console.log(`  ${out}`);
console.log(`  ${(after / 1048576).toFixed(1)} MB  (${Math.round((after / before) * 100)}% of the original)`);
if (after > 50 * 1048576) {
  console.log(`\n  Still over the 50 MB bucket limit — try --crf 26 or --height 540.`);
} else {
  console.log(`\n  Watch it, then: npm run media:upload -- ${out}\n`);
}
