// Parte 1: Configuração Inicial
void setup() {
  // Inicializa a comunicação serial a 115200 bps
  Serial.begin(9600);

  // Aguarda a porta serial abrir. Útil para placas como o ESP32.
  while (!Serial);

  // Seed para o gerador de números aleatórios
  // Isso garante que os números gerados sejam diferentes a cada vez que o ESP reinicia
  randomSeed(analogRead(0));
}

// Parte 2: O Loop Principal
void loop() {
  // Geração e envio dos dados HK
  sendHKData();
  delay(3000); // Envia a cada 1 segundo

  // Geração e envio dos dados IN
  sendINData();
  delay(3000); // Envia a cada 1 segundo
}

// Parte 3: Funções para Enviar os Dados
void sendHKData() {
  // Geração de valores aleatórios para HK
  // As faixas de valores são aproximadas para simular dados realistas
  float temperatura = random(200, 350) / 10.0;     // 20.0 a 35.0
  float pressao = random(10000, 10200) / 10.0;       // 1000.0 a 1020.0
  float altitude = random(500, 1500) / 10.0;       // 50.0 a 150.0
  float tensao_bateria = random(50, 80) / 10.0;     // 5.0 a 8.0
  float umidade = random(400, 800) / 10.0;         // 40.0 a 80.0
  float latitude = random(-20000, -10000) / 1000.0; // -20.00 a -10.00
  float longitude = random(-50000, -40000) / 1000.0; // -50.00 a -40.00
  float velocidade = random(0, 300) / 10.0;        // 0.0 a 30.0

  // Imprime a string no formato desejado
  Serial.print("HK ");
  Serial.print(temperatura, 1); // 1 casa decimal
  Serial.print(" ");
  Serial.print(pressao, 1);
  Serial.print(" ");
  Serial.print(altitude, 1);
  Serial.print(" ");
  Serial.print(tensao_bateria, 1);
  Serial.print(" ");
  Serial.print(umidade, 1);
  Serial.print(" ");
  Serial.print(latitude, 3); // 3 casas decimais
  Serial.print(" ");
  Serial.print(longitude, 3);
  Serial.print(" ");
  Serial.print(velocidade, 1);
  Serial.println(); // Nova linha no final para separar as leituras
}

void sendINData() {
  // Geração de valores aleatórios para IN
  // As faixas de valores são menores para simular dados de inercia
  float accelX = random(-50, 50) / 100.0;   // -0.50 a 0.50
  float accelY = random(-50, 50) / 100.0;
  float accelZ = random(900, 1000) / 100.0; // Próximo de 9.81
  float magX = random(-500, 500) / 10.0;    // -50.0 a 50.0
  float magY = random(-500, 500) / 10.0;
  float magZ = random(-500, 500) / 10.0;
  float gyroX = random(-100, 100) / 100.0;  // -1.00 a 1.00
  float gyroY = random(-100, 100) / 100.0;
  float gyroZ = random(-100, 100) / 100.0;

  // Imprime a string no formato desejado
  Serial.print("IN ");
  Serial.print(accelX, 2); // 2 casas decimais
  Serial.print(" ");
  Serial.print(accelY, 2);
  Serial.print(" ");
  Serial.print(accelZ, 2);
  Serial.print(" ");
  Serial.print(magX, 1);
  Serial.print(" ");
  Serial.print(magY, 1);
  Serial.print(" ");
  Serial.print(magZ, 1);
  Serial.print(" ");
  Serial.print(gyroX, 2);
  Serial.print(" ");
  Serial.print(gyroY, 2);
  Serial.print(" ");
  Serial.print(gyroZ, 2);
  Serial.println(); // Nova linha no final
}