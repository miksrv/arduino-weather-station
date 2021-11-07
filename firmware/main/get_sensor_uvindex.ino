void get_sensor_uvindex() {
  int uvLevel = averageAnalogRead(PIN_UV_OUT);
  int refLevel = averageAnalogRead(PIN_UV_REF);

  //Use the 3.3V power pin as a reference to get a very accurate output value from sensor
  float outputVoltage = 3.3 / refLevel * uvLevel;

  float uvIntensity = mapfloat(outputVoltage, 0.99, 2.9, 0.0, 15.0);

  dtostrf(uvIntensity, 0, 2, uvindex);

  #ifdef DEBUG
    Serial.print(" - UV Intensity: ");
    Serial.print(uvindex);
    Serial.println(" mW/cm^2");
  #endif

 delay(500);
}

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
