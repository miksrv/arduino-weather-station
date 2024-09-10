void get_sensor_pressure() {
  // Temporary variable to store raw pressure data from the sensor
  long tmp_bmp085_pres = 0;
  
  // Get the current pressure reading from the sensor and store it in tmp_bmp085_pres
  dps.getPressure(&tmp_bmp085_pres);

  // Convert the pressure value from Pascals to mmHg (1 mmHg ≈ 133.3 Pa)
  // The result is formatted to one decimal place and stored in the mmHg string
  dtostrf(tmp_bmp085_pres / 133.3, 1, 1, mmHg);

  // Debug: Output the atmospheric pressure if debugging is enabled
  #ifdef DEBUG
    Serial.print(" - Atmosphere pressure: ");
    Serial.print(mmHg);
    Serial.println(" mmHg");
  #endif

  // Delay before the next pressure reading
  delay(500);
}