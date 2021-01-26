//**************************************************************//
//  Name    : WEATHER STATION
//  Author  : Mik™ <miksoft.tm@gmail.com>
//  Version : 1.2.2 (26 Jan 2021)
//**************************************************************//

#include <Wire.h>
#include <BMP085.h>
#include <TroykaDHT.h>
#include <BH1750.h>
#include <PCF8574.h>
#include <SPI.h>
#include <Ethernet.h>
//#include <Adafruit_MLX90614.h>

// BMP 085 Initialization
BMP085 dps = BMP085();

// DHT22 Initialization
DHT dht(4, DHT22);

// Lightmeter Initialization
BH1750 lightmeter;

// Wind direction Initialization (0x27 address)
PCF8574 expander(0x27);

// MLX Initialization
//Adafruit_MLX90614 MLX = Adafruit_MLX90614();

const byte interruptPin = 4; // PIN Anemometr

long impulse;
unsigned long timing; // Sensor Poll Countdown Timer
unsigned long WinSpeedTiming; // Wind speed timer
char webclient_data[120];
char temp1[6], temp2[6], mmHg[6], humd[6], // mlxA[6], mlxO[6],
     lux[6], uvindex[5], 
     wind_dir[2], wind_speed[2];

// Network settings
byte MAC[] = { 0x38, 0x59, 0xF9, 0x6D, 0xD7, 0xFF }; // MAC-address
IPAddress IP(10,10,2,9);
char server[] = "api.miksoft.pro";

EthernetClient LAN;

int MAXwind = 0;
int ReadUVintensityPin = A0; //Output from the sensor

// If the variable is not commented out, debug mode is activated, messages are sent to the serial port
// #define DEBUG

void setup() {
  #ifdef DEBUG
    Serial.begin(9600);
    delay(1000);
    Serial.println("Program initialization...");
  #endif

  pinMode(interruptPin, INPUT_PULLUP);
  pinMode(ReadUVintensityPin, INPUT);
  delay(200);
  #ifdef DEBUG
    Serial.print("-");
  #endif

  lightmeter.begin();
  delay(1000);
  #ifdef DEBUG
    Serial.print("-");
  #endif

  Wire.begin();
  delay(1000);
  #ifdef DEBUG
    Serial.print("-");
  #endif

  dps.init();
  delay(1000);
  #ifdef DEBUG
    Serial.print("-");
  #endif

  dht.begin();
  delay(1000);
  #ifdef DEBUG
    Serial.print("-");
  #endif

//  MLX.begin();
//  delay(1000);
//  #ifdef DEBUG
//    Serial.print("-");
//  #endif

  // Port extender initialization
  expander.begin();
  delay(100);
  for (int i=0; i<8; i++) {
    expander.pinMode(i, INPUT_PULLUP);
    delay(50);
  }
  #ifdef DEBUG
    Serial.println("-");
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
    Serial.print("My IP address: ");
    Serial.println(Ethernet.localIP());
  #endif
  // give the Ethernet shield a second to initialize:
  delay(1000);

  #ifdef DEBUG
    Serial.begin(9600);
    Serial.println("Done!");
  #endif
}


void loop() {
  /* At this point, the execution of the delay () analogue begins
   * We calculate the difference between the current moment and the previously saved reference point.
   * If the difference is greater than the desired value, then execute the code.
   * If not, do nothing
   */
  if (millis() - WinSpeedTiming > 60000) {
    WinSpeedTiming = millis();

    get_sensor_anemometer();
  }
   
  if (millis() - timing > 15000) {
    timing = millis(); 
    
    #ifdef DEBUG
      Serial.println(" ");
      Serial.println("Reading sensors...");
    #endif

    #ifdef DEBUG
        Serial.print("  [OK] Wind speed = ");
        Serial.print(wind_speed);
        Serial.println(" RPS");
    #endif

    get_sensor_uvindex();
    get_sensor_pressure();
    get_sensor_dht22();
//    get_sensor_mlx();
    get_sensor_luxmeter();
    get_sensor_wind_direction();

    webclient_send_data();

    MAXwind = 0;

    #ifdef DEBUG
      Serial.println(" ");
    #endif
  }
}


void get_sensor_anemometer() {
    impulse = 0;

    attachInterrupt(interruptPin, rpm, RISING);
    delay(5000);
    detachInterrupt(0);

    if (impulse > MAXwind) {
      MAXwind = impulse;
    }

    dtostrf((MAXwind / 4), 1, 0, wind_speed);

    delay(500);
}

void rpm() {
    impulse++;
} // void rpm()

/** Takes an average of readings on a given pin **/
int averageAnalogRead(int pinToRead) {
  byte numberOfReadings = 10;
  unsigned int runningValue = 0; 

  for (int x = 0 ; x < numberOfReadings ; x++) {
    runningValue += analogRead(pinToRead);
  }
  
  runningValue /= numberOfReadings;
 
  return(runningValue);
}

/** The Arduino Map function but for floats **/
/** From: http://forum.arduino.cc/index.php?topic=3922.0 **/
float mapfloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/** The method determines the length of the string **/
int len(char *buf) {
  int i=0; 
  do {
    i++;
  } while (buf[i]!='\0');
  return i;
}
