#include "PCF8574.h"

PCF8574 expander(0x27);

char wind_dir[2];
int fail_count = 0;

void setup() {
  Serial.begin (9600);
  delay(500);
    
  for (int i=0; i<8; i++) {
    expander.pinMode(i, INPUT_PULLUP);
    delay(100);
  }

  expander.begin();

}

void loop() {
  get_sensor_wind_direction();
  
  Serial.print("  [Ok] Wind direction: ");
  Serial.println(wind_dir);
  
  delay(1000);
}

void get_sensor_wind_direction() {
  int iterationCount = 0;

  //startLoop:
  String value = "";
  for (int i=0; i<8; i++) {
    if (expander.digitalRead(i) == 0) {
      value = value + String(i);
      delay(20);
    }
  }

  //iterationCount++;

  //Serial.print("Iteration: ");
  //Serial.println(iterationCount);

  //if (value == "" && iterationCount < 5) {
  //  delay(500);
  //  goto startLoop;
  //}

  

  value.toCharArray(wind_dir, 4);
}
