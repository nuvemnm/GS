from flask import Flask, request, render_template, jsonify
import serial
import threading
import math

dados_HK = []  # Dados HouseKeeping
dados_IN = []  # Dados Inerciais
arduino_connected = False

# Últimos valores válidos (inicializar com valores padrão)
ultimo_HK = {
    'HK' : 'HK',
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
    'IN' : 'IN', 'accelX': 0.0, 'accelY': 0.0, 'accelZ': 0.0,
    'magX': 0.0, 'magY': 0.0, 'magZ': 0.0,
    'gyroX': 0.0, 'gyroY': 0.0, 'gyroZ': 0.0
}

def verifica_nulo(valor, ultimo_valor_valido, nome_campo):
    """
    Verifica se o valor é NaN e substitui pelo último valor válido
    """
    try:
        # Converte para float
        valor_float = float(valor)
        
        # Verifica se é NaN
        if math.isnan(valor_float):
            print(f"{nome_campo}: NaN detectado, usando último valor válido: {ultimo_valor_valido}")
            return ultimo_valor_valido
        else:
            # Valor válido, atualiza o último valor
            return valor_float
            
    except (ValueError, TypeError):
        print(f"{nome_campo}: Erro de conversão, usando último valor válido: {ultimo_valor_valido}")
        return ultimo_valor_valido
    
while True:
    try:  # Tenta se conectar, se conseguir, o loop se encerra
        ser = serial.Serial('COM7', 9600)
        print('Arduino conectado')

        break

    except:
        pass



def save_dados_HK(temperatura, pressao, altitude, tensao_bateria, umidade, latitude, longitude, velocidade):
    with open("house_keeping.txt", "a") as file:
        data_line = f"{temperatura}, {pressao}, {altitude},{tensao_bateria}, {umidade}, {latitude}, {longitude}, {velocidade}\n"
        file.write(data_line)

def save_dados_IN(accelX, accelY, accelZ, magX, magY, magZ, gyroX, gyroY, gyroZ):
    with open("inercial.txt", "a") as file:
        data_line = f"{accelX}, {accelY}, {accelZ}, {magX}, {magY}, {magZ}, {gyroX}, {gyroY}, {gyroZ}\n"
        file.write(data_line)


# Cria servidor Flask
app = Flask(__name__)

# Abre a rota '/' no servidor Flask para rodar a página 'index.html'


@app.route('/')
def index():
    return render_template('index.html')

# Abre a rota '/sensorData' no servidor Flask para rodar a função get_sensor_data(), que coleta os dados do servidor Socket


@app.route('/sensorData')
def get_sensor_data():
    global dados_HK
    global dados_IN
    global ultimo_HK
    global ultimo_IN

    if dados_HK is None:
        return jsonify(error="Falha na coleta de dados de House Keeping")

    if dados_IN is None:
        return jsonify(error="Falha na coleta de dados Inerciais")

    # Inicialize todas as variáveis com valores padrão ou None
    temperatura, pressao, altitude, tensao_bateria, umidade, latitude, longitude, velocidade = [None] * 8
    accelX, accelY, accelZ, magX, magY, magZ, gyroX, gyroY, gyroZ = [None] * 9

    print(dados_IN[0])
    # Tente converter os valores, atribuindo aos dados apenas se a conversão for bem-sucedida
    try:
        temperatura = float(dados_HK[0])
    except (IndexError, ValueError):
        print("Erro ao converter temperatura")

    try:
        pressao = float(dados_HK[1])
    except (IndexError, ValueError):
        print("Erro ao converter pressão")

    try:
        altitude = float(dados_HK[2])
    except (IndexError, ValueError):
        print("Erro ao converter altitude")

    try:
        tensao_bateria = float(dados_HK[3])
    except (IndexError, ValueError):
        print("Erro ao converter Tensão da Bateria")

    try:
        umidade = float(dados_HK[4])
    except (IndexError, ValueError):
        print("Erro ao converter Umidade")

    try:
        latitude = float(dados_HK[5])
    except (IndexError, ValueError):
        print("Erro ao converter Latitude")

    try:
        longitude = float(dados_HK[6])
    except (IndexError, ValueError):
        print("Erro ao converter Longitude")

    try:
        velocidade = float(dados_HK[7])
    except (IndexError, ValueError):
        print("Erro ao converter Velocidade")

    try:
        accelX = float(dados_IN[0])
    except (IndexError, ValueError):
        print("Erro ao converter Corrente_Painel_1")

    try:
        accelY = float(dados_IN[1])
    except (IndexError, ValueError):
        print("Erro ao converter Corrente_Painel_2")

    try:
        accelZ = float(dados_IN[2])
    except (IndexError, ValueError):
        print("Erro ao converter Corrente_Painel_3")

    try:
        magX = float(dados_IN[3])
    except (IndexError, ValueError):
        print("Erro ao converter Corrente_Painel_4")

    try:
        magY = float(dados_IN[4])
    except (TypeError, ValueError):
        print("Erro ao calcular Potencia_Painel_1")

    try:
        magZ = float(dados_IN[5])
    except (TypeError, ValueError):
        print("Erro ao calcular Potencia_Painel_2")

    try:
        gyroX = float(dados_IN[6])
    except (TypeError, ValueError):
        print("Erro ao calcular Potencia_Painel_3")

    try:
        gyroY = float(dados_IN[7])
    except (TypeError, ValueError):
        print("Erro ao calcular Potencia_Painel_4")

    try:
        gyroZ = float(dados_IN[8])
    except (IndexError, ValueError):
        print("Erro ao converter Velocidade_Angular")

    # Envia para o servidor Flask os dados
    return jsonify(temperatura = temperatura, pressao = pressao, altitude = altitude, tensao_bateria = tensao_bateria, 
                   umidade = umidade, latitude = latitude, longitude = longitude, velocidade = velocidade,
                   accelX = accelX, accelY = accelY, accelZ = accelZ,
                   magX = magX, magY = magY, magZ = magZ, 
                   gyroX = gyroX, gyroY = gyroY, gyroZ = gyroZ)


'''
@app.route('/sendCommand', methods=['POST'])
def send_command():
    command = request.json['command']
    ser.write(command.encode())
    print("Comando: - " + command + " - enviado com sucesso!")
    return 'Comando enviado com sucesso!'
'''

# Função para ler dados do Arduino
def read_data():
    global dados_HK
    global dados_IN
    global arduino_connected
    global ser

    while True:
        try:
             # Lê os dados da porta serial e decodifica os dados
            data = ser.readline().decode()
            print(data)
            linhas = data.split('\n')
            dados = []

            for linha in linhas:
                l = linha.split(' ')
                if '[SX1278]' == l[0] or 'Tempo' == l[0]:
                    pass
                else:
                    dados += [linha]

            for i in range(0, len(dados)-1):
                dado = dados[i]

                data = dado.split(" ")  

                if data[0] == "HK":
                    try:
                        valores = data[1:9]  # Corrigir índices para 8 valores
                        
                        # Aplicar tratamento de NaN para cada valor
                        temperatura = verifica_nulo(valores[0], ultimo_HK['temperatura'], 'temperatura')
                        pressao = verifica_nulo(valores[1], ultimo_HK['pressao'], 'pressao')
                        altitude = verifica_nulo(valores[2], ultimo_HK['altitude'], 'altitude')
                        tensao_bateria = verifica_nulo(valores[3], ultimo_HK['tensao_bateria'], 'tensao_bateria')
                        umidade = verifica_nulo(valores[4], ultimo_HK['umidade'], 'umidade')
                        latitude = verifica_nulo(valores[5], ultimo_HK['latitude'], 'latitude')
                        longitude = verifica_nulo(valores[6], ultimo_HK['longitude'], 'longitude')
                        velocidade = verifica_nulo(valores[7], ultimo_HK['velocidade'], 'velocidade')

                        # Atualizar últimos valores válidos
                        ultimo_HK.update({
                            'temperatura': temperatura,
                            'pressao': pressao,
                            'altitude': altitude,
                            'tensao_bateria': tensao_bateria,
                            'umidade': umidade,
                            'latitude': latitude,
                            'longitude': longitude,
                            'velocidade': velocidade
                        })

                        # Atualizar dados globais
                        dados_HK = [temperatura, pressao, altitude, tensao_bateria, 
                                umidade, latitude, longitude, velocidade]
                        
                        save_dados_HK(temperatura, pressao, altitude, tensao_bateria, 
                                    umidade, latitude, longitude, velocidade)

                        #print(f"Dados HK processados!")

                    except (ValueError, IndexError) as e:
                        print(f"Erro ao processar dados HK: {e}")

                if data[0] == "IN":
                    try:
                        valores = data[1:10]  # 9 valores inerciais
                        
                        # Aplicar tratamento de NaN para dados inerciais
                        accelX = verifica_nulo(valores[0], ultimo_IN['accelX'], 'accelX')
                        accelY = verifica_nulo(valores[1], ultimo_IN['accelY'], 'accelY')
                        accelZ = verifica_nulo(valores[2], ultimo_IN['accelZ'], 'accelZ')
                        magX = verifica_nulo(valores[3], ultimo_IN['magX'], 'magX')
                        magY = verifica_nulo(valores[4], ultimo_IN['magY'], 'magY')
                        magZ = verifica_nulo(valores[5], ultimo_IN['magZ'], 'magZ')
                        gyroX = verifica_nulo(valores[6], ultimo_IN['gyroX'], 'gyroX')
                        gyroY = verifica_nulo(valores[7], ultimo_IN['gyroY'], 'gyroY')
                        gyroZ = verifica_nulo(valores[8], ultimo_IN['gyroZ'], 'gyroZ')

                        # Atualizar últimos valores válidos
                        ultimo_IN.update({
                            'accelX': accelX, 'accelY': accelY, 'accelZ': accelZ,
                            'magX': magX, 'magY': magY, 'magZ': magZ,
                            'gyroX': gyroX, 'gyroY': gyroY, 'gyroZ': gyroZ
                        })

                        dados_IN = [accelX, accelY, accelZ, magX, magY, magZ, gyroX, gyroY, gyroZ]
                        save_dados_IN(accelX, accelY, accelZ, magX, magY, magZ, gyroX, gyroY, gyroZ)

                        #print(f"Dados IN processados!")
                    
                    except (ValueError, IndexError) as e:
                        print(f"Erro ao processar dados IN: {e}")

        except KeyboardInterrupt:
            # Encerra o loop quando o usuário pressionar Ctrl+C
            ser.close()
            arduino_connected = False
            break


# Inicia a thread para ler dados do Arduino
arduino_thread = threading.Thread(target=read_data)
arduino_thread.daemon = True
arduino_thread.start()

# Roda o servidor Flask
if __name__ == '__main__':
    app.run()
