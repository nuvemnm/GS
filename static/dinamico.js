document.addEventListener('DOMContentLoaded', function() {

    // Cria o botão de Screenshot
    document.getElementById('screenshotButton').addEventListener('click', function() {
        // Selecione o corpo da página
        var body = document.body;

        // Espera pela próxima renderização antes de tirar a captura de tela
        renderer.render(scene, camera);
    
        // Use a biblioteca html2canvas para capturar a área e renderizar o screenshot
        html2canvas(body).then(function(canvas) {
            // Crie um link para download da imagem
            var link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = 'screenshot.png';
            // Simule um clique no link para iniciar o download
            link.click();
        })
    });

    // Event listener para o botão de enviar comando
    document.getElementById('sendCommandButton').addEventListener('click', async function() {
        const commandInput = document.getElementById('commandInput');
        const command = commandInput.value.trim();

        if (!command) {
            alert('Digite um comando!');
            return;
        }

        try {
            // Usar a função sendCommand diretamente (sem fetch)
            const result = await sendCommand(command);
            console.log(result);
            
            // Mostrar feedback visual (opcional)
            // alert('Comando enviado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao enviar comando:', error);
            alert('Erro ao enviar comando: ' + error);
        }

        // Limpar o campo de entrada
        commandInput.value = '';
    });

    //Cria as varáveis usadas no programa
    ///Variáveis para armazenar dados
    var dado_pressao = [];
    var dado_altitude = [];
    var dado_temperatura = [];
    var dado_umidade = [];
    var dado_longitude = [];
    var dado_latitude = [];
    
    // Variáveis para o mapa
    // Coordenadas iniciais (centro do mapa)
    const latInicial = -22.3568;
    const lonInicial = -49.8574;

    // 1. Inicializa o mapa
    // 'setView' define o centro e o nível de zoom inicial
    const map = L.map('map').setView([latInicial, lonInicial], 13);

    // 2. A PARTE MAIS IMPORTANTE: Carregar os tiles locais
    L.tileLayer(
        // O URL aponta para a pasta 'static' do seu servidor Flask
        '/static/tiles/{z}/{x}/{y}.png', 
        {
            // Informação de atribuição (mude conforme a fonte dos seus tiles)
            attribution: 'Map data &copy; OpenStreetMap contributors',
            
            // Defina o zoom mínimo e máximo que você baixou
            minZoom: 10,
            maxZoom: 18,
            
            // 'tms: false' é o padrão (eixo Y começa no topo). 
            // Se seus tiles estiverem invertidos, tente 'tms: true'
            tms: false 
        }
    ).addTo(map);

    // 3. Adiciona um marcador (ícone) ao mapa
    // Vamos começar com uma posição inicial e atualizá-la
    const marker = L.marker([latInicial, lonInicial]).addTo(map);
    marker.bindPopup("Posição Atual"); // Texto que aparece ao clicar


    ///Variáveis para determinar um máximo de pontos possíveis nos gráficos
    var maximoPontos = 100;
    const valorMinimo = 0;

    ///Variáveis para montar os mostradores
    var valor_tensao_bateria = document.getElementById('Tensao_Bateria');
    var valor_velocidade = document.getElementById('Velocidade');
    var valor_accel_X = document.getElementById('veloc_linear_X');
    var valor_accel_Y = document.getElementById('veloc_linear_Y');
    var valor_accel_Z = document.getElementById('veloc_linear_Z');
    var valor_mag_X = document.getElementById('veloc_angular_X');
    var valor_mag_Y = document.getElementById('veloc_angular_Y');
    var valor_mag_Z = document.getElementById('veloc_angular_Z');
    var valor_gyro_X = document.getElementById('campo_mag_X');
    var valor_gyro_Y = document.getElementById('campo_mag_Y');
    var valor_gyro_Z = document.getElementById('campo_mag_Z');

    //Função para atualizar o gráfico de temperatura da bateria
    function atualizarGrafico_Pressao() {
        console.log('Updating charts...');
        ///Atualiza o gráfico de temperatura da bateria
        graficoPressao.data.labels = Array.from({length: dado_pressao.length},(_, i) => (valorMinimo + i).toString());
        graficoPressao.data.datasets[0].data = dado_pressao;
        graficoPressao.update();

    }

    //Função para atualizar o gráfico de temperatura externa
    function atualizarGrafico_Altitude() {
        console.log('Updating charts...');
        ///Atualiza o gráfico de temperatura externa
        graficoAltitude.data.labels = Array.from({length: dado_altitude.length},(_, i) => (valorMinimo + i).toString());
        graficoAltitude.data.datasets[0].data = dado_altitude;
        graficoAltitude.update();

    }

    //Função para atualizar o gráfico de tensão da bateria
    function atualizarGrafico_Temperatura() {
        console.log('Updating charts...');
        ///Atualiza o gráfico de tensão da bateria
        graficoTemperatura.data.labels = Array.from({length: dado_temperatura.length},(_, i) => (valorMinimo + i).toString());
        graficoTemperatura.data.datasets[0].data = dado_temperatura;
        graficoTemperatura.update();

    }

    //Função para atualizar o gráfico de corrente da bateria
    function atualizarGrafico_Umidade() {
        console.log('Updating charts...');
        ///Atualiza o gráfico de corrente da bateria
        graficoUmidade.data.labels = Array.from({length: dado_umidade.length},(_, i) => (valorMinimo + i).toString());
        graficoUmidade.data.datasets[0].data = dado_umidade;
        graficoUmidade.update();

    }


    // Funçao para atualizar a bateria
    function atualizaBateria() {
        ///Faz a requisição dos dados
        fetch('/sensorData')
        .then(response => response.json())
        .then(data => {
        var tensao_bateria = data.tensao_bateria;

        let Tensao_Maxima = 8.2;   // Substitua isso pela sua tensão máxima real
        let Tensao_Minima = 5.5;   // Substitua isso pela sua tensão mínima real

        // Calcule a porcentagem da bateria com base na fórmula inversa
        let battery_level = ((tensao_bateria - Tensao_Minima) / (Tensao_Maxima - Tensao_Minima)) * 100;

        // Certifique-se de que a porcentagem esteja dentro do intervalo de 0 a 100
        battery_level = Math.max(0, Math.min(100, battery_level));

        // Chama a função que cria a bateria
        criarInterfaceBateria(Math.round(battery_level)); 
        })
        .catch(error => console.log(error));
    }

    function atualizarMapa(latitude, longitude) {
        try {

            // Atualiza a posição do marcador
            const novaPosicao = L.latLng(latitude, longitude);
            marker.setLatLng(novaPosicao);
            
            // Opcional: Centraliza o mapa no marcador
            map.panTo(novaPosicao);

            console.log("Posição atualizada:", latitude, longitude);

        } catch (error) {
            console.error("Erro ao buscar localização:", error);
        }
    }


    //Função para fazer a requisição dos dados ao servidor Flask
    function fetchSensorData() {
        // Faz a requisição dos dados
        fetch('/sensorData')
            .then(response => {
                if (!response.ok) {
                    console.error('Erro na requisição dos dados do sensor');
                    // Retornar uma estrutura de dados indicando um problema
                    return { error: 'Erro na requisição dos dados do sensor'};
                }
                return response.json();
            })
            .then(data => {
                // Defina uma função para verificar se um dado está presente
                if (data.error) {
                    console.warn(data.error);
                    return; // Para a execução da função aqui e aguarda a próxima chamada
                }

                const isDataPresent = (sensorData, sensorName) => {
                    if (sensorData && sensorData[sensorName] !== undefined) {
                        return true;
                    } else {
                        console.log(sensorData[sensorName] + ", " + sensorName);
                        console.error(`Dados do sensor de ${sensorName} incompletos ou ausentes.`);
                        return false;
                    }
                };
    
                // Pressão
                if (isDataPresent(data, 'pressao')) {
                    var pressao = data.pressao;
                    dado_pressao.push(pressao);
                    if (dado_pressao.length > maximoPontos) {
                        dado_pressao.shift();
                    }
                    atualizarGrafico_Pressao();
                }
    
                // Altitude
                if (isDataPresent(data, 'altitude')) {
                    var altitude = data.altitude;
                    dado_altitude.push(altitude);
                    if (dado_altitude.length > maximoPontos) {
                        dado_altitude.shift();
                    }
                    atualizarGrafico_Altitude();
                }
    
                // Temperatura
                if (isDataPresent(data, 'temperatura')) {
                    var temperatura = data.temperatura;
                    dado_temperatura.push(temperatura);
                    if (dado_temperatura.length > maximoPontos) {
                        dado_temperatura.shift();
                    }
                    atualizarGrafico_Temperatura();
                }

                // Corrente Bateria
                if (isDataPresent(data, 'umidade')) {
                    var umidade = data.umidade;
                    dado_umidade.push(umidade);
                    if (dado_umidade.length > maximoPontos) {
                        dado_umidade.shift();
                    }
                    atualizarGrafico_Umidade();
                }

                // Tensão Bateria
                if (isDataPresent(data, 'tensao_bateria')) {
                    var tensao_bateria = data.tensao_bateria;
                    valor_tensao_bateria.textContent = tensao_bateria.toFixed(2);
                    atualizaBateria();
                } 

                // Longitude e Latitude
                if ((isDataPresent(data, 'longitude')) && (isDataPresent(data, 'latitude'))) {
                    var longitude = data.longitude;
                    var latitude = data.latitude;
                    dado_longitude.textContent = longitude.toFixed(2);
                    dado_latitude.textContent = latitude.toFixed(2);
                    atualizarMapa(latitude, longitude);
                } 

                // Velocidade 
                if (isDataPresent(data, 'velocidade')) {
                    var velocidade = data.velocidade;
                    valor_velocidade.textContent = velocidade.toFixed(2);
                }     
                // Tensao Painel 1
                if (isDataPresent(data, 'accelX')) {
                    var accelX = data.accelX;
                    valor_accel_X.textContent = accelX.toFixed(2);
                }
    
                // Tensao Painel 2
                if (isDataPresent(data, 'accelY')) {
                    var accelY = data.accelY;
                    valor_accel_Y.textContent = accelY.toFixed(2);
                }
    
                // Tensao Painel 3
                if (isDataPresent(data, 'accelZ')) {
                    var accelZ = data.accelZ;
                    valor_accel_Z.textContent = accelZ.toFixed(2);
                }
    
                // Corrente Painel 1
                if (isDataPresent(data, 'magX')) {
                    var magX = data.magX;
                    valor_mag_X.textContent = magX.toFixed(2);
                }
    
                // Corrente Painel 2
                if (isDataPresent(data, 'magY')) {
                    var magY = data.magY;
                    valor_mag_Y.textContent = magY.toFixed(2);
                }
    
                // Corrente Painel 3
                if (isDataPresent(data, 'magZ')) {
                    var magZ = data.magZ;
                    valor_mag_Z.textContent = magZ.toFixed(2);
                }
    
                // Potência Painel 1
                if (isDataPresent(data, 'gyroX')) {
                    var gyroX = data.gyroX;
                    valor_gyro_X.textContent = gyroX.toFixed(2);
                }
    
                // Potência Painel 2
                if (isDataPresent(data, 'gyroY')) {
                    var gyroY = data.gyroY;
                    valor_gyro_Y.textContent = gyroY.toFixed(2);
                }
    
                // Potência Painel 3
                if (isDataPresent(data, 'gyroZ')) {
                    var gyroZ = data.gyroZ;
                    valor_gyro_Z.textContent = gyroZ.toFixed(2);
                }
    
            })
            .catch(error => console.log(error));
    }    


    var graficoTemperatura, graficoUmidade, graficoPressao, graficoAltitude;

    //Cria gráfico para tensão da bateria
    graficoTemperatura = new Chart(document.getElementById('graficoTemperatura').getContext('2d'),{
        type: 'line',
        data: {
        labels: [],
        datasets: [{
            label: 'Temperatura (°C)',
            data: [],
            borderColor: 'red',
            fill: false
        }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    position: 'bottom'
                },
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            animation: {
                duration: 0
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            maintainAspectRatio: false
        }
    })

    //Cria gráfico para corrente da bateria
    graficoUmidade = new Chart(document.getElementById('graficoUmidade').getContext('2d'),{
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Umidade',
                data: [],
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    position: 'bottom'
                },
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            animation: {
                duration: 0
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            maintainAspectRatio: false
        }
    })

    //Cria gráfico para temperatura da bateria
    graficoPressao = new Chart(document.getElementById('graficoPressao').getContext('2d'),{
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pressão (Pa)',
                data: [],
                borderColor: 'green',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    position: 'bottom'
                },
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            animation: {
                duration: 0
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            maintainAspectRatio: false
        }
    })

    //Cria gráfico para temperatura externa
    graficoAltitude = new Chart(document.getElementById('graficoAltitude').getContext('2d'),{
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Altitude',
                data: [],
                borderColor: 'purple',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    position: 'bottom'
                },
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0
                }
            },
            animation: {
                duration: 0
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            maintainAspectRatio: false
        }
        
    })

    function resetarGrafico(grafico) {
        // Limpa os dados do gráfico
        grafico.data.labels = [];
        grafico.data.datasets[0].data = [];
        grafico.update();

    }
    
    document.getElementById('resetButton').addEventListener('click', function() {
        // Limpa os dados dos gráficos ou recria os gráficos conforme necessário
        resetarGrafico(graficoTemperatura);
        resetarGrafico(graficoUmidade);
        resetarGrafico(graficoPressao);
        resetarGrafico(graficoAltitude);

        // Reinicializa as listas de dados
        dado_pressao = [];
        dado_altitude = [];
        dado_temperatura = [];
        dado_umidade = [];

    });

    //Cria mostrador da bateria
    const batteryPercentage = document.getElementById('batteryPercentage');
    const batteryCanvas = document.getElementById('batteryCanvas');
    const ctx = batteryCanvas.getContext('2d');

    function criarInterfaceBateria(battery_level) {

        let cor;
        // Cores dos retângulos
        const listaDeRetangulos = Array.from({ length: 100 }, (_, i) => `ret_${i + 1}`);
        console.log(listaDeRetangulos);
        // Cor do contorno
        const listaDeBordas = Array.from({ length: 100 }, (_, i) => `borda_${i + 1}`);
        console.log(listaDeBordas);

        // Lógica para definir as cores com base no nível da bateria
        if (battery_level >= 66) {
            cor = 'green';
        } else if (battery_level > 34 && battery_level <= 65) {
            cor = '#ffd968';
        } else {
            cor = 'red';
        }
        for (let i = 0; i < battery_level ; i++) {
            listaDeRetangulos[i] = cor;
            listaDeBordas[i] = cor;
        }
        for (let i = battery_level; i < listaDeRetangulos.length; i++) {
            listaDeRetangulos[i] = 'white';
            listaDeBordas[i] = 'white'; // ou listaDeBordas[i] = cor; se quiser os retãngulos com bordas coloridas
        }

        // Atualiza a porcentagem
        batteryPercentage.textContent =  Math.round(battery_level);

        // Limpa o canvas
        ctx.clearRect(0, 0, batteryCanvas.width, batteryCanvas.height);

        // Desenha a bateria no canvas

        // Função auxiliar para desenhar retângulo com contorno
        function drawRectWithOutline(x, y, width, height, fill, outline) {
            ctx.fillStyle = fill;
            ctx.fillRect(x, y, width, height);

            // Adiciona um contorno ao retângulo
            ctx.strokeStyle = outline;
            ctx.strokeRect(x, y, width, height);
        }

            // Chama a função para cada retângulo
            let inicio = 0;
            let final = 5;

        for(let i = 0; i < listaDeRetangulos.length; i++){
            drawRectWithOutline(inicio, 0, final, 100, listaDeRetangulos[i], listaDeBordas[i])
            inicio += 5;
            final += 5;
        }
    } 

    fetchSensorData();
    //Define pausa entre as chamadas da função
    setInterval(fetchSensorData, 2000);
});
