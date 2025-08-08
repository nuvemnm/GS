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
    var dado_tensao_bateria = [];
    var dado_temperatura = [];
    var dado_umidade = [];
    var dado_longitude = [];
    var dado_latitude = [];
    
    // NOVO: Variáveis para o mapa
    var satelliteMap;
    var satelliteMarker;
    var satelliteTrail = [];
    var trailPolyline;


    ///Variáveis para determinar um máximo de pontos possíveis nos gráficos
    var maximoPontos = 1000;
    const valorMinimo = 0;

    ///Variáveis para montar os mostradores
    var valor_altitude = document.getElementById('Altitude');
    var valor_velocidade = document.getElementById('Velocidade');
    /*
    var valorCube_Rotation_XElemento = document.getElementById('valorCube_Rotation_X');
    var valorCube_Rotation_YElemento = document.getElementById('valorCube_Rotation_Y');
    var valorCube_Rotation_ZElemento = document.getElementById('valorCube_Rotation_Z');
    */
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
    function atualizarGrafico_TensaoBateria() {
        console.log('Updating charts...');
        ///Atualiza o gráfico de temperatura externa
        graficoTensaoBateria.data.labels = Array.from({length: dado_tensao_bateria.length},(_, i) => (valorMinimo + i).toString());
        graficoTensaoBateria.data.datasets[0].data = dado_tensao_bateria;
        graficoTensaoBateria.update();

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

    // Variáveis para armazenar as rotações atuais e alvo
    var currentRotation = { x: 0, y: 0, z: 0 };
    var targetRotation = { x: 0, y: 0, z: 0 };

    // Função para suavizar a rotação
    function smoothRotate() {

        // Interpolar entre os valores atuais e alvo
        currentRotation.x += (targetRotation.x - currentRotation.x) * interpolationRate;
        currentRotation.y += (targetRotation.y - currentRotation.y) * interpolationRate;
        currentRotation.z += (targetRotation.z - currentRotation.z) * interpolationRate;

        // Aplicar as rotações suavizadas ao cubo
        cubeGroup.rotation.x = currentRotation.x;
        cubeGroup.rotation.y = currentRotation.y;
        cubeGroup.rotation.z = currentRotation.z;

        // Renderizar a cena
        renderer.render(scene, camera);

        // Chamar a próxima renderização
        requestAnimationFrame(smoothRotate);
    }

    // NOVO: Inicializar o mapa
    function initializeMap() {
        // Criar o mapa centrado no Brasil
        satelliteMap = L.map('satelliteMap').setView([-15.7797, -47.9297], 6);

        // Adicionar camada do mapa (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(satelliteMap);

        // Criar marcador inicial do satélite
        satelliteMarker = L.circleMarker([-15.7797, -47.9297], {
            color: '#ffffff',
            fillColor: '#ff0000',
            fillOpacity: 1,
            radius: 8
        }).addTo(satelliteMap);

        // Adicionar popup ao marcador
        satelliteMarker.bindPopup("<b>Satélite</b><br>Localização atual");
    }

    // NOVO: Atualizar posição no mapa
    function atualizarMapa(latitude, longitude, altitude) {
        if (!satelliteMap) return;

        const newLatLng = [latitude, longitude];
        
        // Atualizar posição do marcador
        satelliteMarker.setLatLng(newLatLng);
        
        // Adicionar ponto à trilha
        satelliteTrail.push(newLatLng);
        
        // Manter apenas os últimos 50 pontos da trilha
        if (satelliteTrail.length > 50) {
            satelliteTrail.shift();
        }
        
        // Remover trilha anterior
        if (trailPolyline) {
            satelliteMap.removeLayer(trailPolyline);
        }
        
        // Desenhar nova trilha
        if (satelliteTrail.length > 1) {
            trailPolyline = L.polyline(satelliteTrail, {
                color: '#b33676',
                weight: 3,
                opacity: 0.7
            }).addTo(satelliteMap);
        }
        
        // Centralizar mapa na nova posição
        satelliteMap.setView(newLatLng, satelliteMap.getZoom());
        
        // Atualizar popup com informações atuais
        satelliteMarker.setPopupContent(
            `<b>Satélite</b><br>
             Lat: ${latitude.toFixed(6)}°<br>
             Lng: ${longitude.toFixed(6)}°<br>
             Alt: ${altitude.toFixed(2)}m`
        );
    }
    /*
    // Função para atualizar a atitude
    function atualizarAtitude() {
        // Faz a requisição dos dados
        fetch('/sensorData')
            .then(response => response.json())
            .then(data => {
                // Taxa de interpolação (quanto menor, mais lenta é a transição entre as posições)
                interpolationRate = data.Velocidade_Angular/100;

                // Definir os novos valores de rotação
                targetRotation.x = data.Cube_Rotation_X;
                targetRotation.y = data.Cube_Rotation_Y;
                targetRotation.z = data.Cube_Rotation_Z;

                // Iniciar o processo de interpolação
                smoothRotate();
        });
    }
    */
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
                const isDataPresent = (sensorData, sensorName) => {
                    if (sensorData && sensorData[sensorName] !== undefined) {
                        return true;
                    } else {
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
    
                // Tensão Bateria
                if (isDataPresent(data, 'tensao_bateria')) {
                    var tensao_bateria = data.tensao_bateria;
                    dado_tensao_bateria.push(tensao_bateria);
                    if (dado_tensao_bateria.length > maximoPontos) {
                        dado_tensao_bateria.shift();
                    }
                    atualizarGrafico_TensaoBateria();
                    atualizaBateria();
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

                // Altitude
                if (isDataPresent(data, 'altitude')) {
                    var altitude = data.altitude;
                    valor_altitude.textContent = altitude.toFixed(2);
                } 

                // Longitude e Latitude
                if ((isDataPresent(data, 'longitude')) && (isDataPresent(data, 'latitude'))) {
                    var longitude = data.longitude;
                    var latitude = data.latitude;
                    dado_longitude.textContent = longitude.toFixed(2);
                    dado_latitude.textContent = latitude.toFixed(2);
                    atualizarMapa(latitude, longitude, altitude);
                } 

                // Velocidade 
                if (isDataPresent(data, 'velocidade')) {
                    var velocidade = data.velocidade;
                    valor_velocidade.textContent = velocidade.toFixed(2);
                }                 
                /*
                // Atitude
                if (isDataPresent(data, 'Cube_Rotation_X') && isDataPresent(data, 'Cube_Rotation_Y') && isDataPresent(data, 'Cube_Rotation_Z')) {
                    var Cube_Rotation_X = data.Cube_Rotation_X;
                    var Cube_Rotation_Y = data.Cube_Rotation_Y;
                    var Cube_Rotation_Z = data.Cube_Rotation_Z;
                    valorCube_Rotation_XElemento.textContent = Cube_Rotation_X.toFixed(2);
                    valorCube_Rotation_YElemento.textContent = Cube_Rotation_Y.toFixed(2);
                    valorCube_Rotation_ZElemento.textContent = Cube_Rotation_Z.toFixed(2);
                    // Chama a função para a atitude 3D
                    atualizarAtitude();   
                 }  
                */
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


    var graficoTemperatura, graficoUmidade, graficoPressao, graficoTensaoBateria;

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
    graficoTensaoBateria = new Chart(document.getElementById('graficoTensaoBateria').getContext('2d'),{
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Tensão Bateria (V)',
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
        resetarGrafico(graficoTensaoBateria);

        // Reinicializa as listas de dados
        dado_pressao = [];
        dado_tensao_bateria = [];
        dado_temperatura = [];
        dado_umidade = [];

        // NOVO: Limpar trilha do satélite
        satelliteTrail = [];
        if (trailPolyline) {
            satelliteMap.removeLayer(trailPolyline);
        }

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

    // Cria o bloco da atitude
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(90, 500 / 350, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 4;
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(500, 350);
    renderer.setClearColor(0xd3d3d3);
    document.getElementById('AtitudeContainer').appendChild(renderer.domElement);

    // Adicionar iluminação
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, -1, 5);
    scene.add(directionalLight);

    // Adicionar um cubo como satélite
    var geometry = new THREE.BoxGeometry(2, 2, 4);
    var material = new THREE.MeshBasicMaterial({ color: 0xb33676 , specular: 0x000000, shininess: 30});
    var cube = new THREE.Mesh(geometry, material);

    // Adiciona as arestas coloridas
    var edges = new THREE.EdgesGeometry(geometry);
    var edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // Cor das arestas
    var edgesMesh = new THREE.LineSegments(edges, edgesMaterial);

    // Agrupa o cubo e as arestas em um único objeto
    var cubeGroup = new THREE.Group();
    cubeGroup.add(cube);
    cubeGroup.add(edgesMesh);
    scene.add(cubeGroup);
    
    // NOVO: Inicializar mapa após carregar página
    initializeMap();
    //Chama função para pegar novos dados
    fetchSensorData();
    //Define pausa entre as chamadas da função
    setInterval(fetchSensorData, 1000);
});
