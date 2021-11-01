// Get BH1750 sensor data

void get_sensor_luxmeter() {
  delay(500);
  
  uint16_t lux_val = lightmeter.readLightLevel();

  dtostrf(lux_val, 2, 0, lux);

  #ifdef DEBUG
    Serial.print("  [Ok] BH1750 Lightmeter: ");
    Serial.print(lux);
    Serial.println(" lx");
  #endif

  delay(2000);
}
