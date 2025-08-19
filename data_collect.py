# -*- coding: utf-8 -*-
# Importa as bibliotecas necessárias para o servidor Flask, comunicação serial e threading.
from flask import Flask, request, render_template, jsonify
import serial
import threading
import math
import time

# --- Variáveis Globais ---
# Os dados coletados pela thread de leitura serão armazenados aqui.
dados_HK = []
dados_IN = []
arduino_connected = False
ser = None # Variável para a porta serial

# Últimos valores válidos (usados para substituir dados corrompidos)
# A estrutura de dados de "últimos valores" deve ser um dicionário para fácil acesso.
ultimo_HK = {
    'temperatura': 0.0,
    'pressao': 0.0,
    'altitude': 0.0,
    'tensao_bateria': 0.0,
    'umidade': 0.0,
    'latitude': 0.0,
    'longitude': 0.0,
    'velocidade': 0.0
}

ultimo_IN = {
    'accelX': 0.0, 'accelY': 0.0, 'accelZ': 0.0,
    'magX': 0.0, 'magY': 0.0, 'magZ': 0.0,
    'gyroX': 0.0, 'gyroY': 0.0, 'gyroZ': 0.0
}

# --- Funções de Ajuda ---
def verifica_nulo(valor_str, ultimo_valor_valido, nome_campo):

    try:
        valor_float = float(valor_str)
        if math.isnan(valor_float):
            print(f"[{nome_campo}]: Valor NaN detectado, usando último valor válido: {ultimo_valor_valido}")
            return ultimo_valor_valido
        else:
            return valor_float
    except (ValueError, TypeError):
        print(f"[{nome_campo}]: Erro de conversão, usando último valor válido: {ultimo_valor_valido}")
        return ultimo_valor_valido


def save_dados_HK(data_dict):
    """Salva os dados de HouseKeeping em um arquivo."""
    with open("house_keeping.txt", "a") as file:
        file.write(
            f"{data_dict['temperatura']},{data_dict['pressao']},{data_dict['altitude']},"
            f"{data_dict['tensao_bateria']},{data_dict['umidade']},"
            f"{data_dict['latitude']},{data_dict['longitude']},{data_dict['velocidade']}\n"
        )

def save_dados_IN(data_dict):
    """Salva os dados Inerciais em um arquivo."""
    with open("inercial.txt", "a") as file:
        file.write(
            f"{data_dict['accelX']},{data_dict['accelY']},{data_dict['accelZ']},"
            f"{data_dict['magX']},{data_dict['magY']},{data_dict['magZ']},"
            f"{data_dict['gyroX']},{data_dict['gyroY']},{data_dict['gyroZ']}\n"
        )

# --- Funções de Leitura e Processamento ---
def read_data():
    """
    Função principal que roda em uma thread para ler dados da porta serial.
    Ela tenta se conectar e, uma vez conectada, lê e processa as linhas de dados.
    """
    global dados_HK
    global dados_IN
    global arduino_connected
    global ser
    global ultimo_HK
    global ultimo_IN
    
    # Loop para tentar a conexão serial continuamente até ter sucesso
    while True:
        try:
            # CORREÇÃO CRÍTICA: Mude a taxa de baud para 115200 para coincidir com o código do ESP.
            ser = serial.Serial('COM16', 9600, timeout=1) 
            print('Conexão serial estabelecida!')
            arduino_connected = True
            break
        except serial.SerialException as e:
            print(f"Erro ao conectar à porta serial: {e}. Tentando novamente em 3 segundos...")
            time.sleep(3)

    # Loop principal para ler dados após a conexão
    while arduino_connected:
        try:
            # Lê a linha completa e decodifica para string
            data = ser.readline().decode('utf-8').strip()
            
            if data:
                print(f"Lido: {data}")
                
                # Divide a linha em partes separadas por espaço
                parts = data.split(' ')

                # Processa os dados HK
                if parts[0] == "HK" and len(parts) == 9:
                    # Cria um dicionário com os novos valores para facilitar a manipulação
                    new_hk_data = {
                        'temperatura': verifica_nulo(parts[1], ultimo_HK['temperatura'], 'temperatura'),
                        'pressao': verifica_nulo(parts[2], ultimo_HK['pressao'], 'pressao'),
                        'altitude': verifica_nulo(parts[3], ultimo_HK['altitude'], 'altitude'),
                        'tensao_bateria': verifica_nulo(parts[4], ultimo_HK['tensao_bateria'], 'tensao_bateria'),
                        'umidade': verifica_nulo(parts[5], ultimo_HK['umidade'], 'umidade'),
                        'latitude': verifica_nulo(parts[6], ultimo_HK['latitude'], 'latitude'),
                        'longitude': verifica_nulo(parts[7], ultimo_HK['longitude'], 'longitude'),
                        'velocidade': verifica_nulo(parts[8], ultimo_HK['velocidade'], 'velocidade')
                    }
                    
                    # Atualiza os dados globais e salva no arquivo
                    ultimo_HK.update(new_hk_data)
                    dados_HK = list(new_hk_data.values())
                    save_dados_HK(new_hk_data)
                
                # Processa os dados IN
                elif parts[0] == "IN" and len(parts) == 10:
                    new_in_data = {
                        'accelX': verifica_nulo(parts[1], ultimo_IN['accelX'], 'accelX'),
                        'accelY': verifica_nulo(parts[2], ultimo_IN['accelY'], 'accelY'),
                        'accelZ': verifica_nulo(parts[3], ultimo_IN['accelZ'], 'accelZ'),
                        'magX': verifica_nulo(parts[4], ultimo_IN['magX'], 'magX'),
                        'magY': verifica_nulo(parts[5], ultimo_IN['magY'], 'magY'),
                        'magZ': verifica_nulo(parts[6], ultimo_IN['magZ'], 'magZ'),
                        'gyroX': verifica_nulo(parts[7], ultimo_IN['gyroX'], 'gyroX'),
                        'gyroY': verifica_nulo(parts[8], ultimo_IN['gyroY'], 'gyroY'),
                        'gyroZ': verifica_nulo(parts[9], ultimo_IN['gyroZ'], 'gyroZ')
                    }
                    
                    # Atualiza os dados globais e salva no arquivo
                    ultimo_IN.update(new_in_data)
                    dados_IN = list(new_in_data.values())
                    save_dados_IN(new_in_data)

        except serial.SerialException:
            print("Conexão serial perdida. Tentando reconectar...")
            arduino_connected = False
            ser.close()
            # O loop externo tentará a reconexão
            break
        except Exception as e:
            print(f"Erro inesperado durante a leitura de dados: {e}")
            
# --- Servidor Flask e Rotas ---
app = Flask(__name__)

@app.route('/')
def index():
    """Rota para servir a página principal."""
    return render_template('index.html')

@app.route('/sensorData')
def get_sensor_data():

    global dados_HK
    global dados_IN

    if len(dados_HK) < 8 or len(dados_IN) < 9:
        print("Aviso: Dados incompletos. A thread de leitura pode estar se conectando ou sem dados.")
        # Retorna um erro HTTP 503 (Serviço Indisponível)
        return jsonify({"error": "Dados do sensor ainda não disponíveis ou incompletos."}), 503 

    data_to_send = {
        'temperatura': dados_HK[0], 'pressao': dados_HK[1], 'altitude': dados_HK[2],
        'tensao_bateria': dados_HK[3], 'umidade': dados_HK[4], 'latitude': dados_HK[5],
        'longitude': dados_HK[6], 'velocidade': dados_HK[7],
        'accelX': dados_IN[0], 'accelY': dados_IN[1], 'accelZ': dados_IN[2],
        'magX': dados_IN[3], 'magY': dados_IN[4], 'magZ': dados_IN[5],
        'gyroX': dados_IN[6], 'gyroY': dados_IN[7], 'gyroZ': dados_IN[8]
    }

    return jsonify(data_to_send)

@app.route('/sendCommand', methods=['POST'])
def send_command():
    command = request.json['command']
    ser.write(command.encode())
    print("Comando: - " + command + " - enviado com sucesso!")
    return 'Comando enviado com sucesso!'



# --- Inicialização da Aplicação ---
if __name__ == '__main__':
    # Inicia a thread para ler dados do Arduino
    # Ela roda em segundo plano e não bloqueia o servidor Flask
    arduino_thread = threading.Thread(target=read_data)
    arduino_thread.daemon = True # Permite que a thread seja fechada quando o programa principal terminar
    arduino_thread.start()
    # Roda o servidor Flask
    app.run(debug=True)
