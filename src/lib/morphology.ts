export function parseMorphology(code: string): { en: string; id: string } | null {
  if (!code) return null;

  // Hebrew/Aramaic parsing (OSHB)
  if (code.startsWith('H') || code.startsWith('A')) {
    const parts = code.split('/');
    const enParts: string[] = [];
    const idParts: string[] = [];

    for (const part of parts) {
      // Each part might start with H or A, or it might just be the morphology code if it's a suffix
      // Actually, in OSHB, usually the first part has H or A, subsequent parts might not, 
      // but let's assume they all might or might not.
      // Wait, let's look at HC/Vqw3ms. The first part is HC, the second is Vqw3ms.
      // If it starts with H or A, we strip it for parsing the posCode.
      let currentCode = part;
      if (currentCode.startsWith('H') || currentCode.startsWith('A')) {
        currentCode = currentCode.substring(1);
      }

      const posCode = currentCode[0];
      let posEn = '';
      let posId = '';

      switch (posCode) {
        case 'V': posEn = 'Verb'; posId = 'Kata Kerja'; break;
        case 'N': posEn = 'Noun'; posId = 'Kata Benda'; break;
        case 'A': posEn = 'Adjective'; posId = 'Kata Sifat'; break;
        case 'R': posEn = 'Preposition'; posId = 'Kata Depan'; break;
        case 'P': posEn = 'Pronoun'; posId = 'Kata Ganti'; break;
        case 'D': posEn = 'Adverb'; posId = 'Kata Keterangan'; break;
        case 'C': posEn = 'Conjunction'; posId = 'Kata Sambung'; break;
        case 'T': posEn = 'Particle'; posId = 'Partikel'; break;
        case 'I': posEn = 'Interjection'; posId = 'Kata Seru'; break;
        case 'S': posEn = 'Suffix'; posId = 'Akhiran'; break;
        default: posEn = 'Unknown'; posId = 'Tidak diketahui';
      }

      let detailsEn = [];
      let detailsId = [];

      if (posCode === 'V' && currentCode.length >= 3) {
        const stemCode = currentCode[1];
        const aspectCode = currentCode[2];
        
        let stemEn = stemCode;
        switch (stemCode) {
          case 'q': stemEn = 'qal'; break;
          case 'N': stemEn = 'niphal'; break;
          case 'p': stemEn = 'piel'; break;
          case 'P': stemEn = 'pual'; break;
          case 'h': stemEn = 'hiphil'; break;
          case 'H': stemEn = 'hophal'; break;
          case 't': stemEn = 'hithpael'; break;
        }
        detailsEn.push(stemEn);
        detailsId.push(stemEn);

        let aspectEn = aspectCode;
        let aspectId = aspectCode;
        switch (aspectCode) {
          case 'p': aspectEn = 'perfect'; aspectId = 'perfek'; break;
          case 'q': aspectEn = 'sequential perfect'; aspectId = 'perfek sekuensial'; break;
          case 'i': aspectEn = 'imperfect'; aspectId = 'imperfek'; break;
          case 'w': aspectEn = 'sequential imperfect'; aspectId = 'imperfek sekuensial'; break;
          case 'h': aspectEn = 'cohortative'; aspectId = 'kohortatif'; break;
          case 'j': aspectEn = 'jussive'; aspectId = 'jusif'; break;
          case 'v': aspectEn = 'imperative'; aspectId = 'imperatif'; break;
          case 'r': aspectEn = 'participle active'; aspectId = 'partisip aktif'; break;
          case 's': aspectEn = 'participle passive'; aspectId = 'partisip pasif'; break;
          case 'a': aspectEn = 'infinitive absolute'; aspectId = 'infinitif absolut'; break;
          case 'c': aspectEn = 'infinitive construct'; aspectId = 'infinitif konstruk'; break;
        }
        detailsEn.push(aspectEn);
        detailsId.push(aspectId);

        if (aspectCode === 'r' || aspectCode === 's') {
          // Participles: Gender, Number, State
          if (currentCode.length >= 4) {
            const gender = currentCode[3];
            if (gender === 'm') { detailsEn.push('masculine'); detailsId.push('maskulin'); }
            if (gender === 'f') { detailsEn.push('feminine'); detailsId.push('feminin'); }
            if (gender === 'b') { detailsEn.push('both'); detailsId.push('keduanya'); }
            if (gender === 'c') { detailsEn.push('common'); detailsId.push('umum'); }
          }
          if (currentCode.length >= 5) {
            const number = currentCode[4];
            if (number === 's') { detailsEn.push('singular'); detailsId.push('tunggal'); }
            if (number === 'p') { detailsEn.push('plural'); detailsId.push('jamak'); }
            if (number === 'd') { detailsEn.push('dual'); detailsId.push('ganda'); }
          }
          if (currentCode.length >= 6) {
            const state = currentCode[5];
            if (state === 'a') { detailsEn.push('absolute'); detailsId.push('absolut'); }
            if (state === 'c') { detailsEn.push('construct'); detailsId.push('konstruk'); }
            if (state === 'd') { detailsEn.push('determined'); detailsId.push('tertentu'); }
          }
        } else if (aspectCode !== 'a' && aspectCode !== 'c') {
          // Regular verbs: Person, Gender, Number
          if (currentCode.length >= 4) {
            const person = currentCode[3];
            if (person !== 'x' && person >= '1' && person <= '3') {
              detailsEn.push(`${person} person`);
              detailsId.push(`orang ke-${person}`);
            }
          }
          if (currentCode.length >= 5) {
            const gender = currentCode[4];
            if (gender === 'm') { detailsEn.push('masculine'); detailsId.push('maskulin'); }
            if (gender === 'f') { detailsEn.push('feminine'); detailsId.push('feminin'); }
            if (gender === 'b') { detailsEn.push('both'); detailsId.push('keduanya'); }
            if (gender === 'c') { detailsEn.push('common'); detailsId.push('umum'); }
          }
          if (currentCode.length >= 6) {
            const number = currentCode[5];
            if (number === 's') { detailsEn.push('singular'); detailsId.push('tunggal'); }
            if (number === 'p') { detailsEn.push('plural'); detailsId.push('jamak'); }
            if (number === 'd') { detailsEn.push('dual'); detailsId.push('ganda'); }
          }
        }
      } else if (posCode === 'N') {
        // Noun parsing
        if (currentCode.length >= 2) {
          const type = currentCode[1];
          if (type === 'c') { detailsEn.push('common'); detailsId.push('umum'); }
          if (type === 'p') { detailsEn.push('proper'); detailsId.push('nama diri'); }
        }
        if (currentCode.length >= 5) {
          const gender = currentCode[2];
          const number = currentCode[3];
          const state = currentCode[4];

          if (gender === 'm') { detailsEn.push('masculine'); detailsId.push('maskulin'); }
          if (gender === 'f') { detailsEn.push('feminine'); detailsId.push('feminin'); }
          if (gender === 'b') { detailsEn.push('both'); detailsId.push('keduanya'); }
          if (gender === 'c') { detailsEn.push('common'); detailsId.push('umum'); }

          if (number === 's') { detailsEn.push('singular'); detailsId.push('tunggal'); }
          if (number === 'p') { detailsEn.push('plural'); detailsId.push('jamak'); }
          if (number === 'd') { detailsEn.push('dual'); detailsId.push('ganda'); }

          if (state === 'a') { detailsEn.push('absolute'); detailsId.push('absolut'); }
          if (state === 'c') { detailsEn.push('construct'); detailsId.push('konstruk'); }
          if (state === 'd') { detailsEn.push('determined'); detailsId.push('tertentu'); }
        }
      } else if (posCode === 'A') {
        // Adjective parsing
        if (currentCode.length >= 4) {
          const gender = currentCode[1];
          const number = currentCode[2];
          const state = currentCode[3];

          if (gender === 'm') { detailsEn.push('masculine'); detailsId.push('maskulin'); }
          if (gender === 'f') { detailsEn.push('feminine'); detailsId.push('feminin'); }
          if (gender === 'b') { detailsEn.push('both'); detailsId.push('keduanya'); }
          if (gender === 'c') { detailsEn.push('common'); detailsId.push('umum'); }

          if (number === 's') { detailsEn.push('singular'); detailsId.push('tunggal'); }
          if (number === 'p') { detailsEn.push('plural'); detailsId.push('jamak'); }
          if (number === 'd') { detailsEn.push('dual'); detailsId.push('ganda'); }

          if (state === 'a') { detailsEn.push('absolute'); detailsId.push('absolut'); }
          if (state === 'c') { detailsEn.push('construct'); detailsId.push('konstruk'); }
          if (state === 'd') { detailsEn.push('determined'); detailsId.push('tertentu'); }
        }
      } else if (posCode === 'S') {
        // Suffix parsing (e.g., Sp3ms)
        if (currentCode.length >= 4) {
          const type = currentCode[1]; // p = pronominal, h = directional he, etc.
          const person = currentCode[2];
          const gender = currentCode[3];
          const number = currentCode[4];

          if (type === 'p') { detailsEn.push('pronominal'); detailsId.push('pronominal'); }
          if (type === 'h') { detailsEn.push('directional he'); detailsId.push('he direksional'); }
          if (type === 'n') { detailsEn.push('paragogic nun'); detailsId.push('nun paragogik'); }

          if (person >= '1' && person <= '3') {
            detailsEn.push(`${person} person`);
            detailsId.push(`orang ke-${person}`);
          }
          if (gender === 'm') { detailsEn.push('masculine'); detailsId.push('maskulin'); }
          if (gender === 'f') { detailsEn.push('feminine'); detailsId.push('feminin'); }
          if (gender === 'b') { detailsEn.push('both'); detailsId.push('keduanya'); }
          if (gender === 'c') { detailsEn.push('common'); detailsId.push('umum'); }

          if (number === 's') { detailsEn.push('singular'); detailsId.push('tunggal'); }
          if (number === 'p') { detailsEn.push('plural'); detailsId.push('jamak'); }
          if (number === 'd') { detailsEn.push('dual'); detailsId.push('ganda'); }
        }
      } else if (posCode === 'R') {
        // Preposition
        if (currentCode.length >= 2) {
          const type = currentCode[1];
          if (type === 'd') { detailsEn.push('definite article'); detailsId.push('kata sandang tentu'); }
        }
      } else if (posCode === 'T') {
        // Particle
        if (currentCode.length >= 2) {
          const type = currentCode[1];
          if (type === 'a') { detailsEn.push('affirmation'); detailsId.push('afirmasi'); }
          if (type === 'd') { detailsEn.push('definite article'); detailsId.push('kata sandang tentu'); }
          if (type === 'e') { detailsEn.push('exhortation'); detailsId.push('nasihat'); }
          if (type === 'i') { detailsEn.push('interrogative'); detailsId.push('interogatif'); }
          if (type === 'j') { detailsEn.push('interjection'); detailsId.push('kata seru'); }
          if (type === 'm') { detailsEn.push('demonstrative'); detailsId.push('demonstratif'); }
          if (type === 'n') { detailsEn.push('negative'); detailsId.push('negatif'); }
          if (type === 'o') { detailsEn.push('direct object marker'); detailsId.push('penanda objek langsung'); }
          if (type === 'r') { detailsEn.push('relative'); detailsId.push('relatif'); }
        }
      } else if (posCode === 'P') {
        // Pronoun
        if (currentCode.length >= 2) {
          const type = currentCode[1];
          if (type === 'd') { detailsEn.push('demonstrative'); detailsId.push('demonstratif'); }
          if (type === 'f') { detailsEn.push('indefinite'); detailsId.push('tak tentu'); }
          if (type === 'i') { detailsEn.push('interrogative'); detailsId.push('interogatif'); }
          if (type === 'p') { detailsEn.push('personal'); detailsId.push('personal'); }
          if (type === 'r') { detailsEn.push('relative'); detailsId.push('relatif'); }

          if (currentCode.length >= 5) {
            const person = currentCode[2];
            const gender = currentCode[3];
            const number = currentCode[4];

            if (person >= '1' && person <= '3') {
              detailsEn.push(`${person} person`);
              detailsId.push(`orang ke-${person}`);
            }
            if (gender === 'm') { detailsEn.push('masculine'); detailsId.push('maskulin'); }
            if (gender === 'f') { detailsEn.push('feminine'); detailsId.push('feminin'); }
            if (gender === 'b') { detailsEn.push('both'); detailsId.push('keduanya'); }
            if (gender === 'c') { detailsEn.push('common'); detailsId.push('umum'); }

            if (number === 's') { detailsEn.push('singular'); detailsId.push('tunggal'); }
            if (number === 'p') { detailsEn.push('plural'); detailsId.push('jamak'); }
            if (number === 'd') { detailsEn.push('dual'); detailsId.push('ganda'); }
          }
        }
      }

      enParts.push(`${posEn} ${detailsEn.join(' ')}`.trim());
      idParts.push(`${posId} ${detailsId.join(' ')}`.trim());
    }

    return { en: enParts.join(' + '), id: idParts.join(' + ') };
  }

  // Greek parsing (TAGNT/Robinson)
  // Example: V-PAI-3S
  if (code.includes('-')) {
    const parts = code.split('-');
    const posCode = parts[0];
    let posEn = posCode;
    let posId = posCode;

    switch (posCode) {
      case 'N': posEn = 'Noun'; posId = 'Kata Benda'; break;
      case 'V': posEn = 'Verb'; posId = 'Kata Kerja'; break;
      case 'A': posEn = 'Adjective'; posId = 'Kata Sifat'; break;
      case 'P': posEn = 'Pronoun'; posId = 'Kata Ganti'; break;
      case 'D': posEn = 'Adverb'; posId = 'Kata Keterangan'; break;
      case 'C': posEn = 'Conjunction'; posId = 'Kata Sambung'; break;
      case 'T': posEn = 'Article'; posId = 'Kata Sandang'; break;
      case 'PREP': posEn = 'Preposition'; posId = 'Kata Depan'; break;
      case 'PRT': posEn = 'Particle'; posId = 'Partikel'; break;
      case 'INTJ': posEn = 'Interjection'; posId = 'Kata Seru'; break;
    }

    let detailsEn = [];
    let detailsId = [];

    if (posCode === 'V' && parts.length >= 3) {
      const tenseVoiceMood = parts[1];
      const personNumber = parts[2];

      const tense = tenseVoiceMood[0];
      switch (tense) {
        case 'P': detailsEn.push('present'); detailsId.push('sekarang'); break;
        case 'I': detailsEn.push('imperfect'); detailsId.push('imperfek'); break;
        case 'F': detailsEn.push('future'); detailsId.push('masa depan'); break;
        case 'A': detailsEn.push('aorist'); detailsId.push('aoris'); break;
        case 'R': detailsEn.push('perfect'); detailsId.push('perfek'); break;
        case 'L': detailsEn.push('pluperfect'); detailsId.push('pluperfek'); break;
      }

      const voice = tenseVoiceMood[1];
      switch (voice) {
        case 'A': detailsEn.push('active'); detailsId.push('aktif'); break;
        case 'M': detailsEn.push('middle'); detailsId.push('menengah'); break;
        case 'P': detailsEn.push('passive'); detailsId.push('pasif'); break;
        case 'D': detailsEn.push('middle deponent'); detailsId.push('deponen menengah'); break;
        case 'O': detailsEn.push('passive deponent'); detailsId.push('deponen pasif'); break;
        case 'N': detailsEn.push('middle/passive deponent'); detailsId.push('deponen menengah/pasif'); break;
      }

      const mood = tenseVoiceMood[2];
      switch (mood) {
        case 'I': detailsEn.push('indicative'); detailsId.push('indikatif'); break;
        case 'S': detailsEn.push('subjunctive'); detailsId.push('subjungtif'); break;
        case 'O': detailsEn.push('optative'); detailsId.push('optatif'); break;
        case 'M': detailsEn.push('imperative'); detailsId.push('imperatif'); break;
        case 'N': detailsEn.push('infinitive'); detailsId.push('infinitif'); break;
        case 'P': detailsEn.push('participle'); detailsId.push('partisip'); break;
      }

      if (personNumber.length >= 2) {
        const person = personNumber[0];
        if (person >= '1' && person <= '3') {
          detailsEn.push(`${person} person`);
          detailsId.push(`orang ke-${person}`);
        }

        const number = personNumber[1];
        if (number === 'S') { detailsEn.push('singular'); detailsId.push('tunggal'); }
        if (number === 'P') { detailsEn.push('plural'); detailsId.push('jamak'); }
      }
    } else if (parts.length >= 2) {
      // Noun/Adjective parsing
      const caseGenderNumber = parts[1];
      if (caseGenderNumber.length >= 3) {
        const case_ = caseGenderNumber[0];
        switch (case_) {
          case 'N': detailsEn.push('nominative'); detailsId.push('nominatif'); break;
          case 'V': detailsEn.push('vocative'); detailsId.push('vokatif'); break;
          case 'G': detailsEn.push('genitive'); detailsId.push('genitif'); break;
          case 'D': detailsEn.push('dative'); detailsId.push('datif'); break;
          case 'A': detailsEn.push('accusative'); detailsId.push('akusatif'); break;
        }

        const number = caseGenderNumber[1];
        if (number === 'S') { detailsEn.push('singular'); detailsId.push('tunggal'); }
        if (number === 'P') { detailsEn.push('plural'); detailsId.push('jamak'); }

        const gender = caseGenderNumber[2];
        switch (gender) {
          case 'M': detailsEn.push('masculine'); detailsId.push('maskulin'); break;
          case 'F': detailsEn.push('feminine'); detailsId.push('feminin'); break;
          case 'N': detailsEn.push('neuter'); detailsId.push('netral'); break;
        }
      }
      
      if (parts.length >= 3) {
        const suffix = parts[2];
        if (suffix === 'P') { detailsEn.push('proper'); detailsId.push('nama diri'); }
        if (suffix === 'T') { detailsEn.push('title'); detailsId.push('gelar'); }
      }
    }

    const enStr = `${posEn} ${detailsEn.join(' ')}`.trim();
    const idStr = `${posId} ${detailsId.join(' ')}`.trim();

    return { en: enStr, id: idStr };
  }

  return { en: code, id: code };
}
