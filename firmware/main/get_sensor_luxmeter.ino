void get_sensor_luxmeter() {
  uint16_t lux_val = lightmeter.readLightLevel();

  dtostrf(lux_val, 0, 0, lux);

  #ifdef DEBUG
    Serial.print(" - Lightmeter: ");
    Serial.print(lux);
    Serial.println(" lux");
  #endif

  delay(500);
}
