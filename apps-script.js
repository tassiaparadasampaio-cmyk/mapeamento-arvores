// ======================================================
//  FUNÇÃO PRINCIPAL - Recebe dados do formulário (POST)
// ======================================================
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();

    garantirLocaleEN(ss);

    // Log detalhado dos parâmetros recebidos
    Logger.log('=== PARÂMETROS RECEBIDOS ===');
    for (let key in e.parameter) {
      Logger.log(`${key}: ${e.parameter[key]}`);
    }

    // Função auxiliar para pegar valores
    const get = (campo) => {
      try {
        return decodeURIComponent(e.parameter[campo] || '');
      } catch (_) {
        return e.parameter[campo] || '';
      }
    };

    const timestamp = new Date();
    const lat = parseCoordinate(get('Latitude'));
    const lon = parseCoordinate(get('Longitude'));

    // Monta array NA ORDEM EXATA dos cabeçalhos - AGORA COM 34 COLUNAS
    const rowValues = [
      timestamp,                          // A - Timestamp
      lat,                                // B - Latitude
      lon,                                // C - Longitude
      get('Microrregiao'),                // D
      get('Endereco'),                    // E
      get('Especie_Cientifica'),          // F
      get('Familia'),                     // G
      get('Nome_Popular'),                // H
      get('Porte'),                       // I
      get('Origem'),                      // J
      parseNumber(get('DAP')),            // K
      tratarCheckbox(get('Cupim_Broca')), // L
      tratarCheckbox(get('Tronco_Oco_Cancro')), // M
      tratarCheckbox(get('Fungos_Apodrecedores')), // N
      tratarCheckbox(get('Epifitas_Parasitas')), // O
      tratarCheckbox(get('Galhos_Secos')), // P
      tratarCheckbox(get('Abelhas_Vespas')), // Q
      tratarCheckbox(get('Exsudacao')),   // R
      get('Outro_Fitossanitario'),        // S
      get('Especie_Toxica'),              // T
      get('Aculeios_Espinhos'),           // U
      get('Dimensoes_Canteiro'),          // V
      get('Canteiro_80cm'),               // W
      parseNumber(get('Largura_Passeio')), // X
      get('Passeio_125m'),                // Y
      tratarCheckbox(get('Risco_Queda_Galhos')), // Z
      tratarCheckbox(get('Risco_Queda_Total')),  // AA
      tratarCheckbox(get('Rede_Eletrica')),      // AB
      tratarCheckbox(get('Pavimento')),          // AC
      tratarCheckbox(get('Patrimonio')),         // AD
      tratarCheckbox(get('Acesso_Veiculos')),    // AE
      tratarCheckbox(get('Acessibilidade')),     // AF
      get('Outro_Conflito'),              // AG
      ''                                  // AH - foto
    ];

    setupSheetHeaders(sheet);
    const lastRow = sheet.getLastRow() + 1;

    // Verifica se o número de colunas coincide
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    if (rowValues.length !== headers.length) {
      throw new Error(`Número de colunas não coincide! Dados: ${rowValues.length}, Cabeçalhos: ${headers.length}`);
    }

    sheet.getRange(lastRow, 1, 1, rowValues.length).setValues([rowValues]);

    // Formatação
    sheet.getRange(lastRow, 2).setNumberFormat("0.00000000"); // Lat
    sheet.getRange(lastRow, 3).setNumberFormat("0.00000000"); // Lon
    sheet.getRange(lastRow, 11).setNumberFormat("0.00");      // DAP
    sheet.getRange(lastRow, 24).setNumberFormat("0.00");      // Largura

    Logger.log('✅ Dados salvos na linha: ' + lastRow);

    return ContentService
      .createTextOutput("Salvo com sucesso!")
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    Logger.log('❌ ERRO: ' + error.toString());
    return ContentService
      .createTextOutput("Erro: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ======================================================
//    FUNÇÕES DE SUPORTE
// ======================================================
function tratarCheckbox(valor) {
  if (!valor || valor === '' || valor === 'undefined' || valor === 'null') {
    return 'Não';
  }
  if (valor === 'Sim' || valor === 'on' || valor === true || valor === 'true') {
    return 'Sim';
  }
  return 'Não';
}

function parseCoordinate(value) {
  if (!value) return 0;
  let v = value.toString().trim();
  v = v.replace(/\s/g, '').replace(',', '.');  
  v = v.replace(/[^0-9.\-]/g, '');             
  const parts = v.split('.');
  if (parts.length > 2) {
    v = parts[0] + '.' + parts.slice(1).join('');
  }
  const num = parseFloat(v);
  return isNaN(num) ? 0 : num;
}

function parseNumber(v) {
  if (!v || v === '' || v === 'undefined' || v === 'null') return '';
  const num = parseFloat(v.toString().replace(',', '.'));
  return isNaN(num) ? '' : num;
}

function garantirLocaleEN(ss) {
  if (ss.getSpreadsheetLocale() !== 'en_US') {
    ss.setSpreadsheetLocale('en_US');
  }
}

// ======================================================
//    CRIA CABEÇALHO DA TABELA (COM FOTO)
// ======================================================
function setupSheetHeaders(sheet) {
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }

  const headers = [
    "Timestamp", "Latitude", "Longitude", "Microrregiao", "Endereco",
    "Especie_Cientifica", "Familia", "Nome_Popular", "Porte", "Origem",
    "DAP", "Cupim_Broca", "Tronco_Oco_Cancro", "Fungos_Apodrecedores",
    "Epifitas_Parasitas", "Galhos_Secos", "Abelhas_Vespas", "Exsudacao",
    "Outro_Fitossanitario", "Especie_Toxica", "Aculeios_Espinhos",
    "Dimensoes_Canteiro", "Canteiro_80cm", "Largura_Passeio", "Passeio_125m",
    "Risco_Queda_Galhos", "Risco_Queda_Total", "Rede_Eletrica", "Pavimento",
    "Patrimonio", "Acesso_Veiculos", "Acessibilidade", "Outro_Conflito", "Foto"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight("bold")
         .setHorizontalAlignment("center")
         .setBackground("#403010")
         .setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
}

// ======================================================
//  FUNÇÕES DE TESTE E CONFIGURAÇÃO
// ======================================================
function configurarSistema() {
  Logger.log('=== CONFIGURANDO SISTEMA ===');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  // 1. Garantir locale correto
  garantirLocaleEN(ss);
  
  // 2. Recriar cabeçalhos
  sheet.clear();
  setupSheetHeaders(sheet);
  
  // 3. Verificar estrutura
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('✅ Sistema configurado com ' + headers.length + ' colunas');
  Logger.log('Cabeçalhos: ' + headers.join(', '));
}

function testeCompleto() {
  Logger.log('=== TESTE COMPLETO DO SISTEMA ===');
  
  // Teste de envio simulado
  const e = {
    parameter: {
      Latitude: '-31.765432',
      Longitude: '-52.341234',
      Microrregiao: 'Centro',
      Endereco: 'Rua Teste, 123',
      Especie_Cientifica: 'Ficus benjamina',
      Familia: 'Moraceae',
      Nome_Popular: 'Figueira-benjamim',
      Porte: 'Médio',
      Origem: 'Exótica',
      DAP: '35.5',
      Cupim_Broca: 'Sim',
      Tronco_Oco_Cancro: 'Não',
      Fungos_Apodrecedores: 'Sim',
      Epifitas_Parasitas: 'Não',
      Galhos_Secos: 'Sim',
      Abelhas_Vespas: 'Não',
      Exsudacao: 'Sim',
      Outro_Fitossanitario: 'Nenhum',
      Especie_Toxica: 'Não',
      Aculeios_Espinhos: 'Não',
      Dimensoes_Canteiro: '1.2m x 1.2m',
      Canteiro_80cm: 'Sim',
      Largura_Passeio: '1.8',
      Passeio_125m: 'Sim',
      Risco_Queda_Galhos: 'Sim',
      Risco_Queda_Total: 'Não',
      Rede_Eletrica: 'Sim',
      Pavimento: 'Não',
      Patrimonio: 'Sim',
      Acesso_Veiculos: 'Não',
      Acessibilidade: 'Sim',
      Outro_Conflito: 'Nenhum'
    }
  };
  
  doPost(e);
  Logger.log('✅ Teste completo executado');
}

function verificarEstrutura() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Logger.log('=== ESTRUTURA DA PLANILHA ===');
  Logger.log('Total de colunas: ' + headers.length);
  Logger.log('Total de linhas de dados: ' + (sheet.getLastRow() - 1));
  
  headers.forEach((header, index) => {
    Logger.log(`Coluna ${index + 1}: ${header}`);
  });
}
