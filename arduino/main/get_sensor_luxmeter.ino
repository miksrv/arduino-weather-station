// Function to read and process the light level from the sensor
void get_sensor_luxmeter() {
  // Read the light level from the light meter sensor
  uint16_t lux_val = lightmeter.readLightLevel();

  // Convert the light level (lux) to a string for further use
  dtostrf(lux_val, 0, 0, lux);

  // Debugging block: Print the light level to the Serial Monitor if DEBUG is enabled
  #ifdef DEBUG
    Serial.print(" - Lightmeter: ");
    Serial.print(lux);  // Output the light level in lux
    Serial.println(" lux");
  #endif

  // Wait for 500 milliseconds before the next sensor reading
  delay(500);
}