void get_sensor_pressure() {
  long tmp_bmp085_pres = 0;
  
  dps.getPressure(&tmp_bmp085_pres);

  dtostrf(tmp_bmp085_pres / 133.3, 1, 1, mmHg);

  #ifdef DEBUG
    Serial.print(" - Atmosphere pressure: ");
    Serial.print(mmHg);
    Serial.println(" mmHg");
  #endif

  delay(500);
}
