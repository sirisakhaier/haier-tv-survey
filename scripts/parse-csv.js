#!/usr/bin/env node
// Parses Store Dimension.csv and Model Dimension.csv into JSON seed files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += line[i]; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

const baseDir = path.join(__dirname, '../..');
const outDir = path.join(__dirname, '../src/data');

// Parse stores
const storeCSV = fs.readFileSync(path.join(baseDir, 'Store Dimension.csv'), 'utf-8');
const storeRaw = parseCSV(storeCSV);
const stores = storeRaw.map(r => ({
  store_id: r['Store ID(Primary key)'] || r['Store ID (Primary key)'],
  hang: r['ห้าง'],
  phumipak: r['ภูมิภาค'],
  changwat: r['จังหวัด'],
  sakha: r['สาขา'],
  store_name: r['Store Name'],
})).filter(s => s.store_id);

fs.writeFileSync(path.join(outDir, 'stores.json'), JSON.stringify(stores, null, 2));
console.log(`✓ Parsed ${stores.length} stores`);

// Parse models
const modelCSV = fs.readFileSync(path.join(baseDir, 'Model Dimension.csv'), 'utf-8');
const modelRaw = parseCSV(modelCSV);
const models = modelRaw.map(r => ({
  model_code: r['Model (Primary key)'],
  category: r['Model Category'],
  sub_category: r['Model Sub Category'],
  size: r['Model Size'],
})).filter(m => m.model_code);

fs.writeFileSync(path.join(outDir, 'models.json'), JSON.stringify(models, null, 2));
console.log(`✓ Parsed ${models.length} models`);

// Location types (static)
const locationTypes = [
  { code: 'wall',   label_th: 'ผนัง',  label_en: 'Wall'   },
  { code: 'table',  label_th: 'โต๊ะ',  label_en: 'Table'  },
  { code: 'pillar', label_th: 'เสา',   label_en: 'Pillar' },
];
fs.writeFileSync(path.join(outDir, 'locations.json'), JSON.stringify(locationTypes, null, 2));
console.log('✓ Written 3 location types');
