// ******************************************** //
//  Name    : WEATHER STATION
//  Author  : Mik™ <miksoft.tm@gmail.com>
//  Version : 1.3.0 (07 Nov 2021)
// ******************************************** //
// Sensors      Arduino
//  [R] Red   -> VCC +5V
//  [W] White -> GND
//  [G] Green -> Data / I2C: SCL
//  [B] Blue  -> Data / I2C: SDA
// 
// 1. BMP085 [G, B] -> I2C
// 2. BH1750 [G, B] -> I2C
// 3. Vane   [G, B] -> I2C
// 4. Anemometr [G] -> PIN3
// 5. DHT22     [G] -> PIN4
// 6. GUML8511  [G] -> A0
//              [B] -> A1

#include "Wire.h"
#include "BMP085.h"
#include "TroykaDHT.h"
#include "BH1750.h"
#include "PCF8574.h"
#include "SPI.h"
#include "Ethernet.h"

const int SEND_DATA_INTERVAL = 15; // Interval to send data (sec)
const char API_SERVER[] = "meteo.miksoft.pro";
const char API_METHOD[] = "/api/set/data";
const char API_SECRET[] = "A7FE9540D1F5"; // Change this API key

const int PIN_ANEMOMETR = 3; // Leonardo ETH PIN #3
const int PIN_DHT22 = 4;
const int PIN_UV_OUT = A0; // Output from the sensor
const int PIN_UV_REF = A1; // 3.3V power on the Arduino board


byte MAC[] = { 0x38, 0x59, 0xF9, 0x6D, 0xD7, 0xFF };
IPAddress IP(10,10,1,70);
EthernetClient LAN;
DHT dht(PIN_DHT22, DHT22);
PCF8574 expander(0x20);
BMP085 dps = BMP085();
BH1750 lightmeter;

int rps_impulses = -1;
unsigned long previousMillis;
char webclient_data[120], temp[6], humd[6], mmHg[6], // mlxA[6], mlxO[6],
     lux[5], uvindex[5], wind_dir[5], wind_speed[5];

// If the variable is not commented out, debug mode is activated, messages are sent to the serial port
#define DEBUG

void setup() {
  #ifdef DEBUG
    Serial.begin(9600);
    Serial.println("Arduino weather init...");
  #endif

  pinMode(PIN_UV_OUT, INPUT);
  pinMode(PIN_UV_REF, INPUT);
  delay(200);
  
  #ifdef DEBUG
    Serial.println(" - OK: Digital PINs");
  #endif

  lightmeter.begin();
  delay(1000);
  
  #ifdef DEBUG
    Serial.println(" - OK: BH1750");
  #endif

  Wire.begin();
  delay(1000);

  #ifdef DEBUG
    Serial.println(" - OK: Wire");
  #endif

  dps.init();
  delay(1000);
  #ifdef DEBUG
    Serial.println(" - OK: BMP085");
  #endif

  dht.begin();
  delay(1000);
  #ifdef DEBUG
    Serial.println(" - OK: DHT22");
  #endif

  expander.begin();
  delay(100);
  for (int i=0; i<8; i++) {
    expander.pinMode(i, INPUT_PULLUP);
    delay(100);
  }
  #ifdef DEBUG
    Serial.println(" - OK: PCF8574");
  #endif

  // start the Ethernet connection:
//  #ifdef DEBUG
//    Serial.println("Initialize Ethernet with DHCP:");
//  #endif
  
//  if (Ethernet.begin(MAC) == 0) {
//    #ifdef DEBUG
//      Serial.println("Failed to configure Ethernet using DHCP");
//    #endif
//
//    // Check for Ethernet hardware present
//    if (Ethernet.hardwareStatus() == EthernetNoHardware) {
//      #ifdef DEBUG
//        Serial.println("Ethernet shield was not found.  Sorry, can't run without hardware. :(");
//      #endif
//
//      while (true) {
//        delay(1); // do nothing, no point running without Ethernet hardware
//      }
//    }
//    if (Ethernet.linkStatus() == LinkOFF) {
//      #ifdef DEBUG
//        Serial.println("Ethernet cable is not connected.");
//      #endif
//    }
//    // try to congifure using IP address instead of DHCP:
//    Ethernet.begin(MAC, IP);
//    #ifdef DEBUG
//      Serial.print("My IP address: ");
//      Serial.println(Ethernet.localIP());
//    #endif
//  } else {
//    #ifdef DEBUG
//      Serial.print("DHCP assigned IP: ");
//      Serial.println(Ethernet.localIP());
//    #endif
//  }

  Ethernet.begin(MAC, IP);

  #ifdef DEBUG
    Serial.print(" - OK: Web client (IP: ");
    Serial.print(Ethernet.localIP());
    Serial.println(")");
  #endif

  delay(1000);

  #ifdef DEBUG
    Serial.begin(9600);
    Serial.println("Initializatiom complete");
  #endif
}


void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= SEND_DATA_INTERVAL * 1000) {
    previousMillis = currentMillis; 

    #ifdef DEBUG
      Serial.println(" ");
      Serial.println("Start reading sensors:");
    #endif

    get_sensor_anemometer();
    get_sensor_wind_direction();
    get_sensor_uvindex();
    get_sensor_pressure();
    get_sensor_dht22();
    get_sensor_luxmeter();
    webclient_send_data();

    #ifdef DEBUG
      Serial.println(" ");
    #endif
  }
}

void get_sensor_anemometer() {
  rps_impulses = -1;

  attachInterrupt(digitalPinToInterrupt(PIN_ANEMOMETR), rps, RISING);
  delay(5000);
  detachInterrupt(digitalPinToInterrupt(PIN_ANEMOMETR));

  dtostrf(rps_impulses, 0, 0, wind_speed);

  #ifdef DEBUG
    Serial.print(" - Wind speed: ");
    Serial.print(wind_speed);
    Serial.println(" RPS");
  #endif

  delay(500);
}

void rps() {
  rps_impulses++;
}
