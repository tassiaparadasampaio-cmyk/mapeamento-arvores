function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // ✅ Trata encoding UTF-8 corretamente
  const data = {};
  for (let key in e.parameter) {
    try {
      data[key] = decodeURIComponent(e.parameter[key]);
    } catch (err) {
      data[key] = e.parameter[key];
    }
  }

  // Função para normalizar coordenadas
  function parseCoordinate(value) {
    if (!value) return '';
    let v = value.toString().trim();
    v = v.replace(/\s/g, '').replace(',', '.');
    v = v.replace(/[^0-9.\-]/g, '');
    
    const parts = v.split('.');
    if (parts.length > 2) {
      v = parts[0] + '.' + parts.slice(1).join('');
    }
    
    return parseFloat(v);
  }

  const timestamp = new Date();
  const lat = parseCoordinate(data.Latitude);
  const lon = parseCoordinate(data.Longitude);
  const altura = parseFloat((data.Altura || '0').replace(',', '.'));
  const dap = parseFloat((data.DAP || '0').replace(',', '.'));
  const especie = data.Especie || '';
  const saude = data.Saude || '';
  const observacoes = data.Observacoes || '';

  // Garante cabeçalho e configurações
  setupSheetHeaders(sheet);

  const lastRow = sheet.getLastRow() + 1;

  // Insere valores
  sheet.getRange(lastRow, 1).setValue(timestamp);
  sheet.getRange(lastRow, 2).setValue(lat);
  sheet.getRange(lastRow, 3).setValue(lon);
  sheet.getRange(lastRow, 4).setValue(especie);
  sheet.getRange(lastRow, 5).setValue(altura);
  sheet.getRange(lastRow, 6).setValue(dap);
  sheet.getRange(lastRow, 7).setValue(saude);
  sheet.getRange(lastRow, 8).setValue(observacoes);

  // ✅ Formata coordenadas como números decimais
  sheet.getRange(lastRow, 2).setNumberFormat('0.00000000');
  sheet.getRange(lastRow, 3).setNumberFormat('0.00000000');
  
  // ✅ Garante locale correto (executado sempre)
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSpreadsheetLocale() !== 'en_US') {
    ss.setSpreadsheetLocale('en_US');
  }

  return ContentService
    .createTextOutput("Salvo com sucesso!")
    .setMimeType(ContentService.MimeType.TEXT);
}

function setupSheetHeaders(sheet) {
  const headers = ["Timestamp", "Latitude", "Longitude", "Especie", "Altura", "DAP", "Saude", "Observacoes"];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Define formato das colunas
    sheet.getRange(2, 2, 1000, 1).setNumberFormat('0.00000000'); // Latitude
    sheet.getRange(2, 3, 1000, 1).setNumberFormat('0.00000000'); // Longitude
  }
  
  // ✅ Garante locale en_US
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSpreadsheetLocale() !== 'en_US') {
    ss.setSpreadsheetLocale('en_US');
  }
}

// 🔧 Execute esta função UMA VEZ para corrigir dados existentes
function corrigirDadosExistentes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    Logger.log("Nenhum dado para corrigir");
    return;
  }
  
  // 1. Corrige locale da planilha
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale('en_US');
  Logger.log("✅ Locale alterado para en_US");
  
  // 2. Pega dados de coordenadas
  const latRange = sheet.getRange(2, 2, lastRow - 1, 1);
  const lonRange = sheet.getRange(2, 3, lastRow - 1, 1);
  
  const latValues = latRange.getDisplayValues(); // Pega valores como string
  const lonValues = lonRange.getDisplayValues();
  
  const latFixed = [];
  const lonFixed = [];
  
  // 3. Corrige cada valor
  for (let i = 0; i < latValues.length; i++) {
    let lat = latValues[i][0];
    let lon = lonValues[i][0];
    
    // Remove formatação errada: "-3.178.119.530" -> "-31.78119530"
    if (typeof lat === 'string' && lat.includes('.')) {
      // Conta quantos pontos tem
      const dotCount = (lat.match(/\./g) || []).length;
      if (dotCount > 1) {
        // Remove todos os pontos e reinsere no lugar correto
        const isNeg = lat.startsWith('-');
        let clean = lat.replace(/[^0-9]/g, '');
        if (clean.length >= 2) {
          lat = (isNeg ? '-' : '') + clean.substring(0, 2) + '.' + clean.substring(2);
        }
      }
    }
    
    if (typeof lon === 'string' && lon.includes('.')) {
      const dotCount = (lon.match(/\./g) || []).length;
      if (dotCount > 1) {
        const isNeg = lon.startsWith('-');
        let clean = lon.replace(/[^0-9]/g, '');
        if (clean.length >= 2) {
          lon = (isNeg ? '-' : '') + clean.substring(0, 2) + '.' + clean.substring(2);
        }
      }
    }
    
    latFixed.push([parseFloat(lat)]);
    lonFixed.push([parseFloat(lon)]);
  }
  
  // 4. Reinsere valores corrigidos
  latRange.setValues(latFixed);
  lonRange.setValues(lonFixed);
  
  // 5. Aplica formato
  latRange.setNumberFormat('0.00000000');
  lonRange.setNumberFormat('0.00000000');
  
  Logger.log("✅ Correção concluída! " + latFixed.length + " linhas processadas.");
}