void get_sensor_uvindex() {
  // Read the UV sensor output level
  int uvLevel = averageAnalogRead(PIN_UV_OUT);
  // Read the reference level for accurate voltage calculation
  int refLevel = averageAnalogRead(PIN_UV_REF);

  // Calculate the output voltage using the reference level and the 3.3V power pin
  // This ensures more precise readings from the UV sensor
  float outputVoltage = 3.3 / refLevel * uvLevel;

  // Map the output voltage to a UV intensity value in mW/cm^2, within the range of 0.0 to 15.0
  float uvIntensity = mapfloat(outputVoltage, 0.99, 2.9, 0.0, 15.0);

  // Convert the UV intensity value to a string with 2 decimal places and store it in uvindex
  dtostrf(uvIntensity, 0, 2, uvindex);

  // Debug: Output the UV intensity if debugging is enabled
  #ifdef DEBUG
    Serial.print(" - UV Intensity: ");
    Serial.print(uvindex);
    Serial.println(" mW/cm^2");
  #endif

  // Delay before the next read
  delay(500);
}

/** 
 * Averages multiple analog readings from the specified pin for better accuracy 
 * @param pinToRead The analog pin to read from
 * @return The average reading from the pin
 **/
int averageAnalogRead(int pinToRead) {
  byte numberOfReadings = 10;  // Define the number of readings to average
  unsigned int runningValue = 0;  // Accumulate the sum of the readings

  // Take multiple readings and sum them
  for (int x = 0 ; x < numberOfReadings ; x++) {
    runningValue += analogRead(pinToRead);
  }

  // Calculate the average by dividing the sum by the number of readings
  runningValue /= numberOfReadings;

  // Return the average reading
  return runningValue;
}

/** 
 * A float-based version of the Arduino map function 
 * @param x The input value to map
 * @param in_min The lower bound of the input range
 * @param in_max The upper bound of the input range
 * @param out_min The lower bound of the output range
 * @param out_max The upper bound of the output range
 * @return The mapped float value
 **/
float mapfloat(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}