// Get UV sensor data

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
