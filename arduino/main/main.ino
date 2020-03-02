#include <Wire.h>
#include <BMP085.h>
#include <BH1750.h>
#include <TroykaDHT.h>

#include <SPI.h>      // ethernet shield
#include <Ethernet2.h>

DHT dht(4, DHT22);

BMP085 dps = BMP085();

BH1750 lightMeter;

long Temperature = 0, Pressure = 0, Altitude = 0;
int ReadUVintensityPin = A0; //Output from the sensor

// NETWORK SETTINGS
byte mac[] = { 0x38, 0x59, 0xF9, 0x6D, 0xD7, 0xFF }; // MAC-address
IPAddress ip(10,10,5,23);                 // IP address of the device on the network
char server[] = "miksrv.ru";

EthernetClient LAN;

char replyBuffer[160];
char temp1[6] = "00.0", temp2[6] = "00.0", 
     humd[6] = "00.0", uv[6] = "00.0", 
     mmHg[6] = "000.0", lux[6] = "0";

#define DEBUG

void setup() {
  Serial.begin(9600);

  Wire.begin();

  delay(1000);
  
  dht.begin();


  
  delay(1000);
//  
  Serial.println("START");
//
  dps.init();
//
  delay(1000);
//
  lightMeter.begin();
//
  pinMode(ReadUVintensityPin, INPUT);

  Ethernet.begin(mac, ip);
  delay(2000);

}

void loop() {

  pressure();
  delay(300);
  uv_sensor();
  delay(300);
  temp_humd();
  delay(300);
  luxmeter();

  Serial.println(" ");

  delay(2000);

  send_server_data();

  delay(5000);
}



void send_server_data() {
    char buf5[5];
  
    memset(replyBuffer, 0, sizeof(replyBuffer));

    strcpy(replyBuffer,"ID=3859F96DD7FF");

    strcat(replyBuffer, "&p=");  // Atmosphere pressure
    strcat(replyBuffer, mmHg);
    strcat(replyBuffer, "&t1="); // Room temperature
    strcat(replyBuffer, temp1);
    strcat(replyBuffer, "&t2="); // The temperature in the street
    strcat(replyBuffer, temp2);
    strcat(replyBuffer, "&h=");  // Air humidity
    strcat(replyBuffer, humd);
    strcat(replyBuffer, "&uv=");
    strcat(replyBuffer, uv);
    strcat(replyBuffer, "&lux=");
    strcat(replyBuffer, lux);

    strcat(replyBuffer,'\0');

    #ifdef DEBUG
        Serial.print("[Content-Length: ");
        Serial.print(len(replyBuffer));
        Serial.print("] ");
        Serial.println(replyBuffer);
    #endif

    if (LAN.connect(server, 80)) {
        LAN.println("POST http://miksrv.ru/meteo/insert HTTP/1.0");
        LAN.println("Host: miksrv.ru");
        LAN.println("Content-Type: application/x-www-form-urlencoded");
        LAN.println("Connection: close");
        LAN.print("Content-Length: ");
        LAN.println(len(replyBuffer));
        LAN.println();
        LAN.println(replyBuffer);
        LAN.println();
        delay(500);
        LAN.stop();

        #ifdef DEBUG
          Serial.println("SUCCESS!");
          Serial.println();
        #endif
    } else {
        #ifdef DEBUG
          Serial.println("ERROR!");
          Serial.println();
        #endif
    }
}




void luxmeter() {
  uint16_t lux_val = lightMeter.readLightLevel();
  Serial.print("Light: ");
  Serial.print(lux_val);
  Serial.println(" lx");

  dtostrf(lux_val, 3, 0, lux);
}

void temp_humd() {
  // считывание данных с датчика
  dht.read();
  // проверяем состояние данных
  switch(dht.getState()) {
    // всё OK
    case DHT_OK:
      // выводим показания влажности и температуры
      Serial.print("Temp = ");
      Serial.print(dht.getTemperatureC());
      Serial.print(" C \t ");
//      Serial.print("Temperature = ");
//      Serial.print(dht.getTemperatureK());
//      Serial.println(" K \t");
//      Serial.print("Temperature = ");
//      Serial.print(dht.getTemperatureF());
//      Serial.println(" F \t");
      Serial.print("humidity = ");
      Serial.print(dht.getHumidity());
      Serial.println(" %");

        dtostrf(dht.getTemperatureC(), 4, 1, temp2);
        dtostrf(dht.getHumidity(), 4, 1, humd);
      break;
    // ошибка контрольной суммы
    case DHT_ERROR_CHECKSUM:
      Serial.println("Checksum error");
      break;
    // превышение времени ожидания
    case DHT_ERROR_TIMEOUT:
      Serial.println("Time out error");
      break;
    // данных нет, датчик не реагирует или отсутствует
    case DHT_ERROR_NO_REPLY:
      Serial.println("Sensor not connected");
      break;
  }
  
}

void uv_sensor() {
    int uvLevel = averageAnalogRead(ReadUVintensityPin);
 
  float outputVoltage = 5.0 * uvLevel / 1024;
  float uvIntensity = mapfloat(outputVoltage, 0.99, 2.9, 0.0, 15.0);
  
 
//  Serial.print("UVAnalogOutput: ");
//  Serial.print(uvLevel);
// 
//  Serial.print(" OutputVoltage: ");
//  Serial.print(outputVoltage);
 
  Serial.print(" UV Intensity: ");
  Serial.print(uvIntensity);
  Serial.print(" mW/cm^2");

  dtostrf(uvIntensity, 4, 2, uv);
 
  Serial.println(); 
}

void pressure() {
  dps.getPressure(&Pressure);
  dps.getTemperature(&Temperature);

  Serial.print("Pressure(mm Hg):");
  Serial.print(Pressure/133.3);
  Serial.print(" Temp:");
  Serial.println(Temperature*0.1);
  delay(2000);

  dtostrf(Temperature*0.1, 4, 1, temp1);
  dtostrf(Pressure/133.3, 5, 1, mmHg);
}


//Takes an average of readings on a given pin
//Returns the average
int averageAnalogRead(int pinToRead)
{
  byte numberOfReadings = 8;
  unsigned int runningValue = 0; 
 
  for(int x = 0 ; x < numberOfReadings ; x++)
    runningValue += analogRead(pinToRead);
  runningValue /= numberOfReadings;
 
  return(runningValue);  
 
}

//The Arduino Map function but for floats
//From: <a href="http://forum.arduino.cc/index.php?topic=3922.0">http://forum.arduino.cc/index.php?topic=3922.0</a>
float mapfloat(float x, float in_min, float in_max, float out_min, float out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// The method determines the length of the string
int len(char *buf) {
  int i=0; 
  do
  {
    i++;
  } while (buf[i]!='\0');
  return i;
} // int len(char *buf)
