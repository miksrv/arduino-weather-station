#include <Wire.h>
#include <BMP085.h>
#include <TroykaDHT.h>
#include <BH1750.h>
#include <PCF8574.h>
#include <SPI.h>
#include <Ethernet.h>

// BMP 085 Initialization
BMP085 dps = BMP085();

// DHT22 Initialization
DHT dht(4, DHT22);

// Lightmeter Initialization
BH1750 lightmeter;

// Wind direction Initialization (0x20 address)
PCF8574 expander(0x20);

long impulse;
unsigned long timing; // Sensor Poll Countdown Timer
const byte interruptPin = 4;
char webclient_data[120];
char temp1[6], temp2[6], mmHg[6], humd[6],
     lux[6], uvindex[5], wind_dir[2], wind_speed[2];

// Network settings
byte mac[] = { 0x38, 0x59, 0xF9, 0x6D, 0xD7, 0xFF }; // MAC-address
IPAddress ip(10,10,2,9);                 // IP address of the device on the network
char server[] = "api.miksoft.pro"; //{ 217, 107, 34, 252 };

EthernetClient LAN;

int ReadUVintensityPin = A0; //Output from the sensor

// If the variable is not commented out, debug mode is activated, messages are sent to the serial port
// #define DEBUG



void setup() {
  #ifdef DEBUG
    Serial.begin(9600);
    delay(1500);
    Serial.print("Program initialization...");
  #endif

  pinMode(interruptPin, INPUT_PULLUP);
  pinMode(ReadUVintensityPin, INPUT);
  delay(200);

  lightmeter.begin();
  delay(1000);

  Wire.begin();
  delay(1000);

  dps.init();
  delay(1000);

  dht.begin();

  // Port extender initialization
  expander.begin();
  delay(100);
  for (int i=0; i<8; i++) {
    expander.pinMode(i, INPUT_PULLUP);
    delay(50);
  }

  Ethernet.begin(mac, ip);
  delay(1000);

  #ifdef DEBUG
    Serial.begin(9600);
    Serial.println("done!");
  #endif
}


void loop() {
  /* At this point, the execution of the delay () analogue begins
   * We calculate the difference between the current moment and the previously saved reference point.
   * If the difference is greater than the desired value, then execute the code.
   * If not, do nothing
   */
  if (millis() - timing > 30000) {
    timing = millis(); 
    
    #ifdef DEBUG
      Serial.println("Reading sensors...");
    #endif

    get_sensor_uvindex();
    get_sensor_pressure();
    get_sensor_dht22();
    get_sensor_luxmeter();
    get_sensor_wind_direction();
    get_sensor_anemometer();

    webclient_send_data();

    #ifdef DEBUG
      Serial.println(" ");
    #endif
  }
}


/** WebClinet send data to remote server **/
void webclient_send_data() {
    memset(webclient_data, 0, sizeof(webclient_data));

    strcpy(webclient_data, "id=A7FE9540D1F5");

    strcat(webclient_data, "&p=");  // Atmosphere pressure
    strcat(webclient_data, mmHg);
    strcat(webclient_data, "&t1="); // Room temperature
    strcat(webclient_data, temp1);
    strcat(webclient_data, "&t2="); // The temperature in the street
    strcat(webclient_data, temp2);
    strcat(webclient_data, "&h=");  // Air humidity
    strcat(webclient_data, humd);
    strcat(webclient_data, "&uv=");
    strcat(webclient_data, uvindex);
    strcat(webclient_data, "&lux=");
    strcat(webclient_data, lux);
    strcat(webclient_data, "&wd=");
    strcat(webclient_data, wind_dir);
    strcat(webclient_data, "&ws=");
    strcat(webclient_data, wind_speed);

    //strcat(webclient_data,'\0');

    #ifdef DEBUG
        Serial.print("  [Content-Length: ");
        Serial.print(len(webclient_data));
        Serial.print("] ");
        Serial.println(webclient_data);
    #endif

    if (LAN.connect(server, 80)) {
        LAN.println("POST /set/data HTTP/1.1");
        LAN.println("Host: api.miksoft.pro");
        LAN.println("Content-Type: application/x-www-form-urlencoded");
        LAN.println("Connection: close");
        LAN.print("Content-Length: ");
        LAN.println(len(webclient_data));
        LAN.println();
        LAN.println(webclient_data);
        LAN.println();
        
        delay(2000);
        
        LAN.stop();

        #ifdef DEBUG
          Serial.println("  [Webclient] Data send success");
          Serial.println();
        #endif
    } else {
        #ifdef DEBUG
          Serial.println("  [Webclient] Data send error");
          Serial.println();
        #endif
    }

    delay(2000);
}


/** Reading BMP085 sensor (pressure) **/
void get_sensor_pressure() {
  long tmp_bmp085_temp = 0,
       tmp_bmp085_pres = 0;
  
  dps.getPressure(&tmp_bmp085_pres);
  dps.getTemperature(&tmp_bmp085_temp);

  dtostrf(tmp_bmp085_pres / 133.3, 1, 1, mmHg);
  dtostrf(tmp_bmp085_temp * 0.1, 1, 1, temp1);

  #ifdef DEBUG
    Serial.print("  [Ok] BMP085 pressure: ");
    Serial.print(mmHg);
    Serial.println(" mmHg");
    Serial.print("  [Ok] BMP085 temperature: ");
    Serial.print(temp1);
    Serial.println(" C");
  #endif

  delay(2000);
}

void get_sensor_dht22() {
  dht.read();

  if (dht.getState() == DHT_OK) {
    dtostrf(dht.getTemperatureC(), 4, 1, temp2);
    dtostrf(dht.getHumidity(), 4, 1, humd);

    #ifdef DEBUG
      Serial.print("  [Ok] DHT22 temperature: ");
      Serial.print(temp2);
      Serial.println(" C");
      Serial.print("  [Ok] DHT22 humidity: ");
      Serial.print(humd);
      Serial.println(" %");
    #endif
  } else {
    #ifdef DEBUG
      Serial.println("  [ERROR] DHT22 no data");
    #endif
  }

  delay(2000);
}

void get_sensor_luxmeter() {
  uint16_t lux_val = lightmeter.readLightLevel();

  dtostrf(lux_val, 2, 0, lux);

  #ifdef DEBUG
    Serial.print("  [Ok] BH1750 Lightmeter: ");
    Serial.print(lux);
    Serial.println(" lx");
  #endif

  delay(2000);
}

void get_sensor_uvindex() {
  int uvLevel = averageAnalogRead(ReadUVintensityPin);
 
  float outputVoltage = 4.89 * uvLevel / 1024;
  float uvIntensity = mapfloat(outputVoltage, 0.99, 2.9, 0.0, 15.0);

  dtostrf(uvIntensity, 5, 2, uvindex);
  
  #ifdef DEBUG
    Serial.print("  [Ok] UV Index data: ");
    Serial.print(uvindex);
    Serial.println(" mW/cm^2");
  #endif

 delay(2000);
}

void get_sensor_anemometer() {
    impulse = 0;

    attachInterrupt(interruptPin, rpm, RISING);
    delay(5000);
    detachInterrupt(0);

    dtostrf((impulse / 5), 1, 0, wind_speed);

    #ifdef DEBUG
        Serial.print("  [OK] Wind speed = ");
        Serial.print(wind_speed);
        Serial.println(" RPS");
    #endif

    delay(500);
}

void get_sensor_wind_direction() {
  String value = "";

  for (int i=0; i<8; i++) {
    if (expander.digitalRead(i) == 0) {
      value = value + String(i);
    }
    
    delay(80);
  }

  value.toCharArray(wind_dir, 4);

  #ifdef DEBUG
    Serial.print("  [Ok] Wind direction: ");
    Serial.println(wind_dir);
  #endif
  
  delay(2000);
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
