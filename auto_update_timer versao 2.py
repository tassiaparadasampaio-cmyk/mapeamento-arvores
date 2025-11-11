import requests
from qgis.core import QgsProject, QgsVectorLayer, QgsCoordinateReferenceSystem
from PyQt5.QtCore import QTimer
import tempfile
import os
import csv
import io

# --- CONFIGURAÇÃO ---
CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2Xqpbb7dcg2ZBFKrL5IClkmnHCg1kzCmwgbDdpj8xBe1U1yBSIa3oINkOZFSfdjd5PsvKFOkk62oW/pub?gid=0&single=true&output=csv"
LAYER_NAME = "Arvores_Coletadas_Automatico"
CRS_WKT = "EPSG:4326"
UPDATE_INTERVAL_MS = 60000
# --- FIM DA CONFIGURAÇÃO ---

update_timer = None

def fix_coordinate(value):
    """
    Corrige coordenadas que vêm formatadas incorretamente do Google Sheets.
    Exemplo: "-3.178.119.530" vira "-31.78119530"
    """
    if not value or value == '':
        return None
    
    # Converte para string e remove espaços
    value_str = str(value).strip()
    
    # Se já é um número válido, retorna
    try:
        num = float(value_str.replace(',', '.'))
        # Se o número está na faixa correta de coordenadas, retorna
        if -180 <= num <= 180:
            return value_str.replace(',', '.')
    except:
        pass
    
    # Remove todos os pontos e vírgulas
    clean = value_str.replace('.', '').replace(',', '')
    
    # Remove caracteres não numéricos exceto o sinal negativo no início
    is_negative = clean.startswith('-')
    clean = clean.lstrip('-').replace('-', '')
    
    # Remove zeros à esquerda
    clean = clean.lstrip('0')
    
    if not clean:
        return None
    
    # Coloca o ponto decimal após os primeiros 2-3 dígitos
    # Para coordenadas do Brasil: -31.xxx (lat) ou -52.xxx (lon)
    if len(clean) >= 2:
        # Insere o ponto após o segundo dígito
        fixed = clean[:2] + '.' + clean[2:]
        if is_negative:
            fixed = '-' + fixed
        return fixed
    
    return None

def fix_encoding(text):
    """
    Corrige problemas de encoding UTF-8.
    MÃ©dia -> Média
    """
    if not text:
        return text
    
    try:
        # Se o texto parece ter encoding errado, tenta corrigir
        if 'Ã©' in text or 'Ã' in text or 'Â' in text:
            # Tenta decodificar como latin1 e recodificar como utf-8
            return text.encode('latin1').decode('utf-8')
    except:
        pass
    
    return text

def update_layer_from_csv_url():
    """
    Baixa o CSV, corrige as coordenadas e encoding, cria uma nova camada.
    """
    print("--- Iniciando atualização de dados ---")
    
    # 1. Baixa o CSV
    try:
        response = requests.get(CSV_URL)
        response.raise_for_status()
        # ✅ Força encoding UTF-8
        response.encoding = 'utf-8'
        csv_content = response.text
    except requests.exceptions.RequestException as e:
        print(f"❌ ERRO: Falha ao baixar o CSV: {e}")
        return
    
    # 2. Cria arquivo temporário corrigido
    temp_dir = tempfile.gettempdir()
    temp_csv_path = os.path.join(temp_dir, "temp_arvores_data_fixed.csv")
    
    try:
        # Lê o CSV usando StringIO
        csv_file = io.StringIO(csv_content)
        reader = csv.DictReader(csv_file)
        
        # Prepara o CSV corrigido
        with open(temp_csv_path, 'w', encoding='utf-8', newline='') as f:
            fieldnames = reader.fieldnames
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            valid_rows = 0
            invalid_rows = 0
            
            for row in reader:
                # ✅ Corrige encoding de TODOS os campos de texto
                for key in row:
                    if row[key]:
                        row[key] = fix_encoding(row[key])
                
                # Corrige as coordenadas
                original_lat = row.get('Latitude', '')
                original_lon = row.get('Longitude', '')
                
                fixed_lat = fix_coordinate(original_lat)
                fixed_lon = fix_coordinate(original_lon)
                
                if fixed_lat and fixed_lon:
                    row['Latitude'] = fixed_lat
                    row['Longitude'] = fixed_lon
                    writer.writerow(row)
                    valid_rows += 1
                    
                    # Diagnóstico (apenas primeiro registro)
                    if valid_rows == 1:
                        print(f"📍 Exemplo de correção:")
                        print(f"   Coordenadas: Lat={fixed_lat}, Lon={fixed_lon}")
                        print(f"   Espécie: {row.get('Especie', 'N/A')}")
                        print(f"   Saúde: {row.get('Saude', 'N/A')}")
                else:
                    invalid_rows += 1
                    print(f"⚠️ Linha ignorada - coordenadas inválidas: Lat={original_lat}, Lon={original_lon}")
            
            print(f"✅ {valid_rows} registros válidos | ⚠️ {invalid_rows} registros ignorados")
            
    except Exception as e:
        print(f"❌ ERRO ao processar CSV: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 3. Cria URI para o QGIS
    uri = f"file:///{temp_csv_path.replace(os.sep, '/')}"
    uri += f"?delimiter=,&xField=Longitude&yField=Latitude&crs={CRS_WKT}&decimalPoint=.&detectTypes=yes&encoding=UTF-8"
    
    # 4. Remove camada antiga
    project = QgsProject.instance()
    layer_to_remove = project.mapLayersByName(LAYER_NAME)
    if layer_to_remove:
        project.removeMapLayers([layer_to_remove[0].id()])
        print(f"🗑️ Camada '{LAYER_NAME}' removida.")
    
    # 5. Cria nova camada
    vlayer = QgsVectorLayer(uri, LAYER_NAME, "delimitedtext")
    
    if not vlayer.isValid():
        print(f"❌ ERRO: Camada falhou ao carregar!")
        print(f"   URI: {uri}")
        print(f"   Verifique o arquivo: {temp_csv_path}")
        return
    
    # 6. Verifica quantas features foram carregadas
    feature_count = vlayer.featureCount()
    
    if feature_count == 0:
        print(f"⚠️ AVISO: Camada criada mas SEM FEATURES!")
        print(f"   Isso geralmente significa que as coordenadas ainda estão inválidas.")
        print(f"   Verifique o arquivo: {temp_csv_path}")
    else:
        print(f"✅ {feature_count} árvores carregadas!")
        
        # Mostra exemplo de um ponto
        features = list(vlayer.getFeatures())
        if features:
            feat = features[0]
            geom = feat.geometry()
            if geom:
                point = geom.asPoint()
                print(f"📍 Primeiro ponto: Lat={point.y():.8f}, Lon={point.x():.8f}")
    
    # 7. Adiciona ao projeto
    project.addMapLayer(vlayer)
    print(f"🔄 Próxima atualização em {UPDATE_INTERVAL_MS/1000} segundos.")
    print("-" * 60)

def start_auto_update():
    """
    Inicia a sincronização automática.
    """
    global update_timer
    
    if update_timer is not None and update_timer.isActive():
        update_timer.stop()
    
    update_timer = QTimer()
    update_timer.timeout.connect(update_layer_from_csv_url)
    update_timer.start(UPDATE_INTERVAL_MS)
    
    print("=" * 60)
    print("🚀 SINCRONIZAÇÃO AUTOMÁTICA INICIADA")
    print(f"⏱️ Intervalo: {UPDATE_INTERVAL_MS/1000} segundos")
    print("=" * 60)
    
    # Primeira atualização imediata
    update_layer_from_csv_url()

def stop_auto_update():
    """
    Para a sincronização automática.
    """
    global update_timer
    if update_timer is not None and update_timer.isActive():
        update_timer.stop()
        print("⏹️ Sincronização automática PARADA")
    else:
        print("⏹️ Sincronização já estava parada")

# --- INSTRUÇÕES DE USO ---
# No console Python do QGIS, digite:
# start_auto_update()
#
# Para parar:
# stop_auto_update()
#
# Para testar apenas uma vez:
# update_layer_from_csv_url()import requests
from qgis.core import QgsProject, QgsVectorLayer, QgsCoordinateReferenceSystem
from PyQt5.QtCore import QTimer
import tempfile
import os
import csv

# --- CONFIGURAÇÃO ---
CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2Xqpbb7dcg2ZBFKrL5IClkmnHCg1kzCmwgbDdpj8xBe1U1yBSIa3oINkOZFSfdjd5PsvKFOkk62oW/pub?gid=0&single=true&output=csv"
LAYER_NAME = "Arvores_Coletadas_Automatico"
CRS_WKT = "EPSG:4326"
UPDATE_INTERVAL_MS = 60000
# --- FIM DA CONFIGURAÇÃO ---

update_timer = None

def fix_coordinate(value):
    """
    Corrige coordenadas que vêm formatadas incorretamente do Google Sheets.
    Exemplo: "-3.178.119.530" vira "-31.78119530"
    """
    if not value or value == '':
        return None
    
    # Converte para string e remove espaços
    value_str = str(value).strip()
    
    # Se já é um número válido, retorna
    try:
        num = float(value_str.replace(',', '.'))
        # Se o número está na faixa correta de coordenadas, retorna
        if -180 <= num <= 180:
            return value_str.replace(',', '.')
    except:
        pass
    
    # Remove todos os pontos e vírgulas
    clean = value_str.replace('.', '').replace(',', '')
    
    # Remove caracteres não numéricos exceto o sinal negativo no início
    is_negative = clean.startswith('-')
    clean = clean.lstrip('-').replace('-', '')
    
    # Remove zeros à esquerda
    clean = clean.lstrip('0')
    
    if not clean:
        return None
    
    # Coloca o ponto decimal após os primeiros 2-3 dígitos
    # Para coordenadas do Brasil: -31.xxx (lat) ou -52.xxx (lon)
    if len(clean) >= 2:
        # Insere o ponto após o segundo dígito
        fixed = clean[:2] + '.' + clean[2:]
        if is_negative:
            fixed = '-' + fixed
        return fixed
    
    return None

def update_layer_from_csv_url():
    """
    Baixa o CSV, corrige as coordenadas e cria uma nova camada.
    """
    print("--- Iniciando atualização de dados ---")
    
    # 1. Baixa o CSV
    try:
        response = requests.get(CSV_URL)
        response.raise_for_status()
        csv_content = response.text
    except requests.exceptions.RequestException as e:
        print(f"❌ ERRO: Falha ao baixar o CSV: {e}")
        return
    
    # 2. Cria arquivo temporário corrigido
    temp_dir = tempfile.gettempdir()
    temp_csv_path = os.path.join(temp_dir, "temp_arvores_data_fixed.csv")
    
    try:
        # Lê o CSV original
        lines = csv_content.strip().split('\n')
        reader = csv.DictReader(lines)
        
        # Prepara o CSV corrigido
        with open(temp_csv_path, 'w', encoding='utf-8', newline='') as f:
            fieldnames = reader.fieldnames
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            valid_rows = 0
            invalid_rows = 0
            
            for row in reader:
                # Corrige as coordenadas
                original_lat = row.get('Latitude', '')
                original_lon = row.get('Longitude', '')
                
                fixed_lat = fix_coordinate(original_lat)
                fixed_lon = fix_coordinate(original_lon)
                
                if fixed_lat and fixed_lon:
                    row['Latitude'] = fixed_lat
                    row['Longitude'] = fixed_lon
                    writer.writerow(row)
                    valid_rows += 1
                    
                    # Diagnóstico (apenas primeiro registro)
                    if valid_rows == 1:
                        print(f"📍 Exemplo de correção:")
                        print(f"   Original: Lat={original_lat}, Lon={original_lon}")
                        print(f"   Corrigido: Lat={fixed_lat}, Lon={fixed_lon}")
                else:
                    invalid_rows += 1
                    print(f"⚠️ Linha ignorada - coordenadas inválidas: Lat={original_lat}, Lon={original_lon}")
            
            print(f"✅ {valid_rows} registros válidos | ⚠️ {invalid_rows} registros ignorados")
            
    except Exception as e:
        print(f"❌ ERRO ao processar CSV: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 3. Cria URI para o QGIS
    uri = f"file:///{temp_csv_path.replace(os.sep, '/')}"
    uri += f"?delimiter=,&xField=Longitude&yField=Latitude&crs={CRS_WKT}&decimalPoint=.&detectTypes=yes"
    
    # 4. Remove camada antiga
    project = QgsProject.instance()
    layer_to_remove = project.mapLayersByName(LAYER_NAME)
    if layer_to_remove:
        project.removeMapLayers([layer_to_remove[0].id()])
        print(f"🗑️ Camada '{LAYER_NAME}' removida.")
    
    # 5. Cria nova camada
    vlayer = QgsVectorLayer(uri, LAYER_NAME, "delimitedtext")
    
    if not vlayer.isValid():
        print(f"❌ ERRO: Camada falhou ao carregar!")
        print(f"   URI: {uri}")
        print(f"   Verifique o arquivo: {temp_csv_path}")
        return
    
    # 6. Verifica quantas features foram carregadas
    feature_count = vlayer.featureCount()
    
    if feature_count == 0:
        print(f"⚠️ AVISO: Camada criada mas SEM FEATURES!")
        print(f"   Isso geralmente significa que as coordenadas ainda estão inválidas.")
        print(f"   Verifique o arquivo: {temp_csv_path}")
    else:
        print(f"✅ {feature_count} árvores carregadas!")
        
        # Mostra exemplo de um ponto
        features = list(vlayer.getFeatures())
        if features:
            feat = features[0]
            geom = feat.geometry()
            if geom:
                point = geom.asPoint()
                print(f"📍 Primeiro ponto: Lat={point.y():.8f}, Lon={point.x():.8f}")
    
    # 7. Adiciona ao projeto
    project.addMapLayer(vlayer)
    print(f"🔄 Próxima atualização em {UPDATE_INTERVAL_MS/1000} segundos.")
    print("-" * 60)

def start_auto_update():
    """
    Inicia a sincronização automática.
    """
    global update_timer
    
    if update_timer is not None and update_timer.isActive():
        update_timer.stop()
    
    update_timer = QTimer()
    update_timer.timeout.connect(update_layer_from_csv_url)
    update_timer.start(UPDATE_INTERVAL_MS)
    
    print("=" * 60)
    print("🚀 SINCRONIZAÇÃO AUTOMÁTICA INICIADA")
    print(f"⏱️ Intervalo: {UPDATE_INTERVAL_MS/1000} segundos")
    print("=" * 60)
    
    # Primeira atualização imediata
    update_layer_from_csv_url()

def stop_auto_update():
    """
    Para a sincronização automática.
    """
    global update_timer
    if update_timer is not None and update_timer.isActive():
        update_timer.stop()
        print("⏹️ Sincronização automática PARADA")
    else:
        print("⏹️ Sincronização já estava parada")

# --- INSTRUÇÕES DE USO ---
# No console Python do QGIS, digite:
# start_auto_update()
#
# Para parar:
# stop_auto_update()
#
# Para testar apenas uma vez:
# update_layer_from_csv_url()