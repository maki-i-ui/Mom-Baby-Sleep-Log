// modules/dataLoader.js
export function loadAllJson(mapOfKeysToPaths){
    // mapOfKeysToPaths: { p1: 'path', p2: 'path'... }
    const keys = Object.keys(mapOfKeysToPaths);
    const promises = keys.map(k => new Promise((resolve, reject) => {
      loadJSON(mapOfKeysToPaths[k], data => resolve({k, data}), err => reject(err));
    }));
    return Promise.all(promises).then(results => {
      const out = {};
      results.forEach(r => out[r.k] = r.data);
      return out;
    });
  }
  