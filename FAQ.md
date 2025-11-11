# ❓ Perguntas Frequentes (FAQ)

## Sistema de Mapeamento de Árvores - LGA

---

## 📱 Sobre a Coleta de Dados

### 1. Preciso de internet para usar o sistema?

**Sim**, atualmente o sistema requer conexão com internet para:
- Enviar dados do formulário web para o Google Sheets
- Capturar localização GPS (alguns dispositivos)
- Sincronizar dados no QGIS

**Futuro:** Estamos planejando um modo offline com sincronização posterior.

---

### 2. O GPS funciona dentro de prédios?

**Não recomendado.** O GPS funciona melhor em:
- ✅ Ambientes abertos (parques, ruas, campos)
- ✅ Próximo a janelas abertas
- ❌ Dentro de edifícios com teto/lajes
- ❌ Ambientes com muitos obstáculos metálicos

**Precisão esperada:**
- Ambiente aberto: 3-10 metros
- Próximo a janelas: 10-30 metros
- Ambientes fechados: pode falhar ou ter erro >100 metros

---

### 3. Quanto tempo leva para capturar o GPS?

**Depende do dispositivo e ambiente:**
- 🚀 Rápido (5-10 segundos): celulares modernos em ambiente aberto
- ⏱️ Moderado (10-30 segundos): tablets ou ambientes parcialmente obstruídos
- 🐌 Lento (30-60 segundos): primeiro uso após muito tempo desligado (GPS "frio")

**Dica:** Abra o app de mapas (Google Maps) antes para "esquentar" o GPS.

---

### 4. Posso usar em vários celulares ao mesmo tempo?

**Sim!** O sistema suporta múltiplos usuários simultâneos:
- Cada pessoa abre a página web no seu dispositivo
- Todos enviam dados para a mesma planilha do Google Sheets
- Dados aparecem no QGIS em tempo real

**Ideal para:** Equipes fazendo levantamento em campo

---

### 5. Como medir o DAP corretamente?

**DAP = Diâmetro à Altura do Peito**

1. **Posicione a fita métrica a 1,30m do solo**
2. **Meça o perímetro (circunferência) do tronco**
3. **Calcule o diâmetro:** `DAP = Perímetro ÷ 3,14`

**Exemplo:**
- Perímetro medido: 94 cm
- DAP = 94 ÷ 3,14 = **30 cm**

**Dica:** Existem fitas métricas especiais (fita de DAP) que já mostram o diâmetro diretamente.

---

### 6. O que significa "Condição de Saúde"?

**Critérios sugeridos:**

| Condição | Descrição |
|----------|-----------|
| **Boa** | Folhagem densa, sem pragas visíveis, tronco íntegro |
| **Média** | Folhagem rala, pequenas lesões, galhos secos (<30%) |
| **Ruim** | Folhagem muito escassa, pragas severas, risco de queda |

**Importante:** Esta é uma avaliação visual rápida, não substitui análise técnica detalhada.

---

## 📊 Sobre o Google Sheets

### 7. Quantas árvores posso cadastrar?

**Limite do Google Sheets:** 
- Até **10 milhões de células** por planilha
- Com 8 colunas = ~**1,25 milhão de árvores**

**Na prática:** Para inventários municipais (10.000-100.000 árvores) não há limitação.

---

### 8. Os dados ficam salvos para sempre?

**Sim**, desde que:
- ✅ A planilha do Google Sheets não seja deletada
- ✅ Sua conta Google esteja ativa
- ✅ Não exceda o limite de armazenamento do Google Drive (15 GB gratuito)

**Recomendações:**
- 💾 Faça backups periódicos (Download como CSV)
- 📂 Exporte para shapefile no QGIS
- ☁️ Considere Google Workspace para instituições (espaço ilimitado)

---

### 9. Posso editar os dados manualmente na planilha?

**Sim!** Você pode:
- ✏️ Corrigir erros de digitação
- 🗑️ Deletar registros duplicados
- ➕ Adicionar dados manualmente (respeitando o formato)

**Atenção às coordenadas:**
- Use formato decimal: `-31.78119530`
- Não use: `-31° 46' 52.3"` ou `-3.178.119.530`

---

### 10. Como compartilho a planilha com minha equipe?

**Passos:**
1. Abra a planilha no Google Sheets
2. Clique em **Compartilhar** (canto superior direito)
3. Adicione emails dos membros da equipe
4. Defina permissões:
   - **Visualizador:** apenas vê os dados
   - **Editor:** pode editar e adicionar dados
5. Clique em **Enviar**

---

## 🗺️ Sobre o QGIS

### 11. Com que frequência os dados são atualizados no QGIS?

**Padrão:** A cada **60 segundos** (1 minuto)

**Personalizável:** No script Python, altere:
```python
UPDATE_INTERVAL_MS = 60000  # milissegundos

# Exemplos:
UPDATE_INTERVAL_MS = 30000   # 30 segundos
UPDATE_INTERVAL_MS = 300000  # 5 minutos
```

**Atenção:** Intervalos muito curtos (<30s) podem causar tráfego excessivo.

---

### 12. Preciso deixar o QGIS aberto para sincronizar?

**Sim.** A sincronização automática funciona apenas enquanto:
- ✅ QGIS está aberto
- ✅ Script Python está em execução (`start_auto_update()`)

**Se fechar o QGIS:**
- Sincronização para
- Ao reabrir, execute `start_auto_update()` novamente
- Dados continuam salvos no Google Sheets

---

### 13. Posso trabalhar offline no QGIS?

**Parcialmente:**
- ❌ Sincronização automática requer internet
- ✅ Pode trabalhar com dados já baixados
- ✅ Pode salvar a camada como shapefile local

**Uso offline:**
1. Baixe os dados com internet: `update_layer_from_csv_url()`
2. Exporte a camada: Clique direito → `Exportar` → `Salvar Feições Como...`
3. Formato: `ESRI Shapefile` ou `GeoPackage`
4. Trabalhe com o arquivo local

---

### 14. Como exporto os dados para outros formatos?

**No QGIS:**

1. **Clique direito** na camada `Arvores_Coletadas_Automatico`
2. **Exportar** → `Salvar Feições Como...`
3. Escolha o formato:
   - **Shapefile** (`.shp`) - compatível com AutoCAD, ArcGIS
   - **GeoPackage** (`.gpkg`) - formato moderno, arquivo único
   - **KML** (`.kml`) - para Google Earth
   - **GeoJSON** (`.geojson`) - para web mapping
   - **CSV** (`.csv`) - tabela com coordenadas
   - **DXF** (`.dxf`) - para CAD

4. Configure SRC de saída (se necessário)
5. Clique em **OK**

---

### 15. Por que alguns pontos não aparecem no mapa?

**Causas comuns:**

1. **Coordenadas inválidas:**
   - Formato incorreto no Google Sheets
   - Solução: Use o script v2 com correção automática

2. **Pontos fora da visualização atual:**
   - Solução: Clique direito na camada → `Zoom para a(s) camada(s)`

3. **Camada desligada:**
   - Verifique se a checkbox da camada está marcada

4. **Simbologia com cor invisível:**
   - Solução: Altere a cor dos símbolos

---

### 16. Como crio um mapa temático por saúde?

**Passo a passo:**

1. **Clique direito** na camada → `Propriedades`
2. Aba **Simbologia**
3. Tipo: Selecione **Categorizado**
4. Coluna: `Saude`
5. Clique em **Classificar**
6. **Personalize as cores:**
   - Boa → Verde (#00AA00)
   - Média → Amarelo (#FFAA00)
   - Ruim → Vermelho (#FF0000)
7. Clique em **OK**

**Resultado:** Pontos coloridos conforme a saúde da árvore!

---

## 🔧 Problemas Técnicos

### 17. Erro: "Failed to load layer"

**Diagnóstico:**

```python
# No console Python do QGIS:
import requests
response = requests.get(CSV_URL)
print(response.status_code)  # Deve ser 200
print(response.text[:200])   # Primeiras linhas
```

**Soluções:**

- **403/404:** URL do CSV incorreta → Verifique publicação no Google Sheets
- **CSV vazio:** Nenhum dado coletado ainda
- **Timeout:** Problema de rede → Verifique firewall

---

### 18. Caracteres estranhos (Ã©, Ã£, Ã§)

**Problema:** Encoding UTF-8 incorreto

**Solução:** Use a versão 2 do script (`qgis_sync_script_v2.py`) que inclui correção automática:

```python
def fix_encoding(text):
    """Corrige Ã© → é, Ã£ → ã, etc."""
    try:
        if 'Ã' in text:
            return text.encode('latin1').decode('utf-8')
    except:
        pass
    return text
```

---

### 19. Coordenadas aparecem como "-3.178.119.530"

**Problema:** Google Sheets formatando números incorretamente

**Solução Automática:** O script Python já corrige automaticamente:

```python
def fix_coordinate(value):
    """Converte -3.178.119.530 → -31.78119530"""
    # Implementação no script
```

**Solução Manual:** Na planilha, formate a coluna como "Texto sem formatação"

---

### 20. "Geolocalização não é suportada por este navegador"

**Causas:**

1. **Navegador muito antigo**
   - Solução: Atualize ou use Chrome/Firefox moderno

2. **Acesso via HTTP (não HTTPS)**
   - Problema: Geolocation API requer HTTPS (exceto localhost)
   - Solução: Use GitHub Pages (automático HTTPS) ou servidor com SSL

3. **JavaScript desabilitado**
   - Solução: Habilite JavaScript nas configurações

---

## 🚀 Uso Avançado

### 21. Posso adicionar mais campos (ex: foto, altura da copa)?

**Sim!** Requer modificações em 3 lugares:

**1. Google Sheets:**
- Adicione colunas: `Foto_URL`, `Altura_Copa`, etc.

**2. HTML (index.html):**
```html
<label for="altura_copa">Altura da Copa (m):</label>
<input type="number" id="altura_copa" name="Altura_Copa">
```

**3. Apps Script:**
```javascript
altura_copa: e.parameter.Altura_Copa
```

**Nota:** Fotos requerem upload para serviço externo (Imgur, Cloudinary, etc.) e salvar apenas a URL.

---

### 22. Como integro com outros sistemas?

**Opções:**

1. **API do Google Sheets:**
   - Use Google Sheets API v4
   - Leia/escreva dados programaticamente

2. **Webhook do Apps Script:**
   - Já implementado! Recebe POST de qualquer fonte

3. **Exportação periódica:**
   - Script Python para baixar CSV e processar

4. **PostGIS:**
   - Exporte do QGIS para banco de dados PostgreSQL+PostGIS

---

### 23. Posso usar em produção para milhares de árvores?

**Sim**, mas considere:

**Vantagens:**
- ✅ Gratuito até 10 milhões de células
- ✅ Sincronização em tempo real
- ✅ Backup automático na nuvem

**Limitações:**
- ⚠️ Google Sheets não é um banco de dados
- ⚠️ Performance pode degradar com >100.000 linhas
- ⚠️ Apps Script tem limite de execução (6 min/execução)

**Para projetos grandes:**
- Considere migrar para PostGIS + API REST
- Ou use Google Sheets como intermediário e sincronize para BD

---

### 24. Como contribuo com melhorias?

**Adoramos contribuições!**

1. **Fork** o repositório no GitHub
2. **Crie uma branch:** `git checkout -b feature/minha-melhoria`
3. **Faça suas alterações**
4. **Teste** tudo!
5. **Commit:** `git commit -m 'Adiciona funcionalidade X'`
6. **Push:** `git push origin feature/minha-melhoria`
7. **Abra um Pull Request**

**Ideias bem-vindas:**
- 📸 Upload de fotos
- 🌐 Modo offline
- 📊 Dashboard de estatísticas
- 🤖 IA para identificar espécies
- 📱 App mobile nativo

---

### 25. Existe suporte comercial?

**Não**, mas:

- 📧 **Suporte acadêmico gratuito:** tssiap.sampaio@gmail.com
- 🤝 **Parcerias institucionais:** Entre em contato com o LGA
- 🎓 **Consultoria:** Podemos indicar profissionais da área

**Este é um projeto acadêmico open source**, mantido pelo Laboratório de Gestão Arbórea da UFPel.

---

## 📚 Recursos Adicionais

- 📖 [Manual Completo (PDF)](docs/manual-usuario.pdf)
- 💻 [Repositório GitHub](https://github.com/seu-usuario/mapeamento-arvores-lga)
- 🎓 [Documentação QGIS](https://docs.qgis.org/)
- 🌐 [Google Sheets API](https://developers.google.com/sheets/api)

---

**Não encontrou sua dúvida?** Entre em contato: tssiap.sampaio@gmail.com

---

<div align="center">

**Desenvolvido com 🌳 pelo Laboratório de Gestão Arbórea - UFPel**

</div>
