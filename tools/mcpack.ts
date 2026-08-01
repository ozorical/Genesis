import fs from "fs";
import path from "path";
import zlib from "zlib";

interface PackedEntry {
  name: string;
  crc: number;
  compressed: Buffer;
  rawSize: number;
  offset: number;
}

const crcTable = buildCrcTable();

export function buildMcpack(sourceDirectory: string, outputFile: string) {
  if (!fs.existsSync(sourceDirectory)) throw new Error("Nothing to package at " + sourceDirectory);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  const entries: PackedEntry[] = [];
  const chunks: Buffer[] = [];
  let offset = 0;

  for (const relative of collectFiles(sourceDirectory)) {
    const raw = fs.readFileSync(path.join(sourceDirectory, relative));
    const compressed = zlib.deflateRawSync(raw, { level: 9 });
    const entry: PackedEntry = {
      name: relative.split(path.sep).join("/"),
      crc: crc32(raw),
      compressed,
      rawSize: raw.length,
      offset,
    };
    const header = localHeader(entry);
    chunks.push(header, compressed);
    offset += header.length + compressed.length;
    entries.push(entry);
  }

  const directoryStart = offset;
  let directorySize = 0;
  for (const entry of entries) {
    const record = centralRecord(entry);
    chunks.push(record);
    directorySize += record.length;
  }
  chunks.push(endRecord(entries.length, directorySize, directoryStart));

  fs.writeFileSync(outputFile, Buffer.concat(chunks));
  console.log("Packed " + entries.length + " files into " + outputFile);
  return outputFile;
}

function collectFiles(root: string, current = ""): string[] {
  const found: string[] = [];
  for (const item of fs.readdirSync(path.join(root, current), { withFileTypes: true })) {
    const relative = path.join(current, item.name);
    if (item.isDirectory()) found.push(...collectFiles(root, relative));
    else found.push(relative);
  }
  return found;
}

function localHeader(entry: PackedEntry) {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt32LE(0, 10);
  header.writeUInt32LE(entry.crc >>> 0, 14);
  header.writeUInt32LE(entry.compressed.length, 18);
  header.writeUInt32LE(entry.rawSize, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, name]);
}

function centralRecord(entry: PackedEntry) {
  const name = Buffer.from(entry.name, "utf8");
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(20, 4);
  record.writeUInt16LE(20, 6);
  record.writeUInt16LE(0, 8);
  record.writeUInt16LE(8, 10);
  record.writeUInt32LE(0, 12);
  record.writeUInt32LE(entry.crc >>> 0, 16);
  record.writeUInt32LE(entry.compressed.length, 20);
  record.writeUInt32LE(entry.rawSize, 24);
  record.writeUInt16LE(name.length, 28);
  record.writeUInt32LE(entry.offset, 42);
  return Buffer.concat([record, name]);
}

function endRecord(count: number, size: number, start: number) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(count, 8);
  record.writeUInt16LE(count, 10);
  record.writeUInt32LE(size, 12);
  record.writeUInt32LE(start, 16);
  return record;
}

function buildCrcTable() {
  const table = new Int32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value;
  }
  return table;
}

function crc32(buffer: Buffer) {
  let value = -1;
  for (let index = 0; index < buffer.length; index++) {
    value = (value >>> 8) ^ crcTable[(value ^ buffer[index]) & 0xff];
  }
  return (value ^ -1) >>> 0;
}
