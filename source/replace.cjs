const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `    const originalUnits = originalWords.map(word => {
      const wordStrongs = word.strongs.split(',').filter(Boolean);
      let matchedInd = "";
      
      if (wordStrongs.length > 0) {
        const matchingUnitIndex = sabdaIndonesianCopy.findIndex((u: any) => {
          const uStrongs = u.strong.split(' ').filter(Boolean);
          return uStrongs.some((s: string) => wordStrongs.includes(s));
        });
        
        if (matchingUnitIndex !== -1) {
          const u = sabdaIndonesianCopy[matchingUnitIndex];
          matchedInd = u.ind;
          
          for (let i = matchingUnitIndex - 1; i >= 0; i--) {
            if (!sabdaIndonesianCopy[i].strong) {
              matchedInd = (sabdaIndonesianCopy[i].ind ? sabdaIndonesianCopy[i].ind + " " : "") + matchedInd;
              sabdaIndonesianCopy.splice(i, 1);
            } else {
              break;
            }
          }
          
          const newMatchingUnitIndex = sabdaIndonesianCopy.findIndex((u2: any) => u2 === u);
          
          let uStrongs = u.strong.split(' ').filter(Boolean);
          for (const s of wordStrongs) {
            const idx = uStrongs.indexOf(s);
            if (idx !== -1) {
              uStrongs.splice(idx, 1);
            }
          }
          
          if (uStrongs.length === 0) {
            sabdaIndonesianCopy.splice(newMatchingUnitIndex, 1);
          } else {`;

const replacement = `    const originalUnits = originalWords.map(word => {
      const wordStrongs = word.strongs.split(',').filter(Boolean);
      let matchedInd = "";
      
      if (wordStrongs.length > 0) {
        const matchingUnitIndex = sabdaIndonesianCopy.findIndex((u: any) => {
          const uStrongs = u.strong.split(' ').filter(Boolean);
          return uStrongs.some((s: string) => wordStrongs.some((ws: string) => ws.replace(/^0+/, '') === s.replace(/^0+/, '')));
        });
        
        if (matchingUnitIndex !== -1) {
          const u = sabdaIndonesianCopy[matchingUnitIndex];
          matchedInd = u.ind;
          
          for (let i = matchingUnitIndex - 1; i >= 0; i--) {
            if (!sabdaIndonesianCopy[i].strong) {
              matchedInd = (sabdaIndonesianCopy[i].ind ? sabdaIndonesianCopy[i].ind + " " : "") + matchedInd;
              sabdaIndonesianCopy.splice(i, 1);
            } else {
              break;
            }
          }
          
          const newMatchingUnitIndex = sabdaIndonesianCopy.findIndex((u2: any) => u2 === u);
          
          let uStrongs = u.strong.split(' ').filter(Boolean);
          for (const s of wordStrongs) {
            const idx = uStrongs.findIndex((us: string) => us.replace(/^0+/, '') === s.replace(/^0+/, ''));
            if (idx !== -1) {
              uStrongs.splice(idx, 1);
            }
          }
          
          if (uStrongs.length === 0) {
            sabdaIndonesianCopy.splice(newMatchingUnitIndex, 1);
          } else {`;

content = content.split(target).join(replacement);
fs.writeFileSync('server.ts', content);
console.log('Replaced occurrences:', content.split(replacement).length - 1);
