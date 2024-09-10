// ******************************************** //
//  Name    : WEATHER STATION
//  Author  : Misha Topchilo <miksoft.tm@gmail.com>
//  Version : 1.3.1 (10 Sep 2024)
// ******************************************** //

// This is the wiring scheme between the sensors and the Arduino
// Sensors      Arduino
//  [R] Red   -> VCC +5V
//  [W] White -> GND
//  [G] Green -> Data / I2C: SCL
//  [B] Blue  -> Data / I2C: SDA
//
// Sensor connections:
// 1. BMP085 (Barometric pressure sensor) [G, B] -> I2C (SCL, SDA)
// 2. BH1750 (Light sensor) [G, B] -> I2C (SCL, SDA)
// 3. Wind vane (for wind direction) [G, B] -> I2C (SCL, SDA)
// 4. Anemometer (for wind speed) [G] -> Digital PIN 3 (interrupt)
// 5. DHT22 (Temperature and humidity sensor) [G] -> Digital PIN 4
// 6. GUML8511 (UV sensor) [G] -> Analog PIN A0 (UV OUT), [B] -> Analog PIN A1 (UV Reference)

// Include necessary libraries
#include "Wire.h"         // For I2C communication
#include "BMP085.h"       // For barometric pressure sensor BMP085
#include "TroykaDHT.h"    // For temperature and humidity sensor DHT22
#include "BH1750.h"       // For light sensor BH1750
#include "PCF8574.h"      // For I2C expansion (used for wind vane)
// Ethernet libraries for networking
#include "SPI.h"
#include "Ethernet.h"

// Uncomment to enable debug messages sent to the serial monitor
// #define DEBUG

const long SEND_DATA_INTERVAL = 60; // Interval (in seconds) to send data to the server
const char API_SERVER[] = "api.meteo.miksoft.pro"; // API server address
const char API_METHOD[] = "/current";  // API endpoint to send sensor data
const char API_SECRET[] = "";  // API key for authorization (must be provided)

// Pin assignments for different sensors
const int PIN_ANEMOMETR = 3; // Digital PIN for the anemometer (wind speed sensor)
const int PIN_DHT22 = 4;     // Digital PIN for the DHT22 sensor (temperature and humidity)
const int PIN_UV_OUT = A0;   // Analog PIN for UV sensor output
const int PIN_UV_REF = A1;   // Analog PIN for UV reference voltage

// MAC address for the Ethernet shield
byte MAC[] = { 0x38, 0x59, 0xF9, 0x6D, 0xD7, 0xFF };
// Static IP address for the weather station
IPAddress IP(10,10,1,70);

// Initialize Ethernet client
EthernetClient LAN;

// Sensor objects
DHT dht(PIN_DHT22, DHT22);   // Initialize the DHT22 sensor
PCF8574 expander(0x20);      // Initialize the I2C expander for wind vane
BMP085 dps = BMP085();       // Initialize the BMP085 pressure sensor
BH1750 lightmeter;           // Initialize the BH1750 light sensor

// Variables for storing sensor data and transmission
int rps_impulses = -1;       // Impulse count for anemometer (used to calculate wind speed)
unsigned long previousMillis; // Variable for tracking time between data transmissions
char webclient_data[120], temp[6], humd[6], mmHg[6], // Data buffers for various sensor readings
     lux[5], uvindex[5], wind_dir[5], wind_speed[5]; // Buffers for light, UV index, wind direction, and wind speed

void setup() {
  // Start the serial port for debug messages if DEBUG is enabled
  #ifdef DEBUG
    delay(1000);
    Serial.begin(9600);
    delay(2000);
    Serial.println("Arduino weather init...");
  #endif

  // Configure UV sensor pins as inputs
  pinMode(PIN_UV_OUT, INPUT);
  pinMode(PIN_UV_REF, INPUT);
  delay(200);

  #ifdef DEBUG
    Serial.println(" - OK: Digital PINs");
  #endif

  // Initialize the BH1750 light sensor
  lightmeter.begin();
  delay(1000);
  
  #ifdef DEBUG
    Serial.println(" - OK: BH1750");
  #endif

  // Initialize I2C communication
  Wire.begin();
  delay(1000);

  #ifdef DEBUG
    Serial.println(" - OK: Wire");
  #endif

  // Initialize the BMP085 pressure sensor
  dps.init();
  delay(1000);
  
  #ifdef DEBUG
    Serial.println(" - OK: BMP085");
  #endif

  // Initialize the DHT22 temperature and humidity sensor
  dht.begin();
  delay(1000);

  #ifdef DEBUG
    Serial.println(" - OK: DHT22");
  #endif

  // Initialize the I2C expander for the wind vane
  expander.begin();
  delay(100);
  for (int i=0; i<8; i++) {
    expander.pinMode(i, INPUT_PULLUP);  // Set each pin as input with pull-up resistor
    delay(100);
  }
  
  #ifdef DEBUG
    Serial.println(" - OK: PCF8574");
  #endif

  // Initialize the Ethernet connection using a static IP address
  Ethernet.begin(MAC, IP);

  #ifdef DEBUG
    Serial.print(" - OK: Web client (IP: ");
    Serial.print(Ethernet.localIP());
    Serial.println(")");
  #endif

  delay(1000);

  #ifdef DEBUG
    Serial.println("Initialization complete");
  #endif
}

// Main loop function
void loop() {
  unsigned long currentMillis = millis();  // Get the current time

  // Check if it's time to send data
  if (currentMillis - previousMillis >= SEND_DATA_INTERVAL * 1000) {
    previousMillis = currentMillis;  // Update the last send time

    #ifdef DEBUG
      Serial.println(" ");
      Serial.println("Start reading sensors:");
    #endif

    // Read data from each sensor
    get_sensor_anemometer();
    get_sensor_wind_direction();
    get_sensor_uvindex();
    get_sensor_pressure();
    get_sensor_dht22();
    get_sensor_luxmeter();

    // Send the data to the web server
    webclient_send_data();

    #ifdef DEBUG
      Serial.println(" ");
    #endif
  }
}

// Function to read wind speed from the anemometer
void get_sensor_anemometer() {
  rps_impulses = -1;  // Reset the impulse count

  attachInterrupt(digitalPinToInterrupt(PIN_ANEMOMETR), rps, RISING);  // Attach interrupt to count pulses
  delay(5000);  // Wait 5 seconds to accumulate data
  detachInterrupt(digitalPinToInterrupt(PIN_ANEMOMETR));  // Detach interrupt after measurement

  dtostrf(rps_impulses, 0, 0, wind_speed);  // Convert the impulse count to a string for transmission

  #ifdef DEBUG
    Serial.print(" - Wind speed: ");
    Serial.print(wind_speed);
    Serial.println(" RPS");  // Display the wind speed in Revolutions Per Second
  #endif

  delay(500);
}

// Interrupt service routine for counting wind speed pulses
void rps() {
  rps_impulses++;  // Increment the pulse count each time the anemometer triggers an interrupt
}