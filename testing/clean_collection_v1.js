const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'EduTrack.postman_collection.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function cleanItem(item) {
  if (item.item) {
    item.item.forEach(cleanItem);
  } else if (item.request && item.request.url) {
    const url = item.request.url;
    if (url.raw && url.raw.startsWith('{{baseUrl}}/v1/')) {
      url.raw = '{{baseUrl}}/' + url.raw.substring('{{baseUrl}}/v1/'.length);
    }
    if (Array.isArray(url.path) && url.path.length > 0 && url.path[0] === 'v1') {
      url.path.shift();
    }
  }
}

data.item.forEach(cleanItem);

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully stripped all /v1/ duplications from EduTrack.postman_collection.json!');
