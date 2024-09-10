#include "PCF8574.h"

// Create an instance of the PCF8574 class with address 0x27
PCF8574 expander(0x27);

char wind_dir[2];  // Array to store the wind direction
int fail_count = 0; // Counter for failed readings (currently unused)

void setup() {
  Serial.begin(9600);   // Initialize serial communication at 9600 baud rate
  delay(500);           // Wait for half a second to ensure serial connection

  // Initialize all 8 pins of the PCF8574 as INPUT_PULLUP
  for (int i = 0; i < 8; i++) {
    expander.pinMode(i, INPUT_PULLUP);
    delay(100); // Short delay to ensure each pin is set correctly
  }

  expander.begin();    // Initialize the PCF8574 expander
}

void loop() {
  get_sensor_wind_direction();  // Read the wind direction from the sensor
  
  Serial.print("  [Ok] Wind direction: ");
  Serial.println(wind_dir);     // Print the wind direction
  
  delay(1000);  // Wait for 1 second before the next reading
}

// Function to read the wind direction from the sensor
void get_sensor_wind_direction() {
  int iterationCount = 0;  // Counter for iterations (currently unused)

  String value = "";  // String to accumulate the wind direction data
  for (int i = 0; i < 8; i++) {
    // Read each pin of the expander
    if (expander.digitalRead(i) == 0) {
      // If the pin reads LOW, append its index to the value string
      value = value + String(i);
      delay(20); // Short delay to debounce
    }
  }

  // Convert the accumulated value to a character array
  value.toCharArray(wind_dir, 4);
}