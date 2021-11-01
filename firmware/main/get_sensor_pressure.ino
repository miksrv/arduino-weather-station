// Reading BMP085 sensor (pressure)

void get_sensor_pressure() {
  long tmp_bmp085_temp = 0,
       tmp_bmp085_pres = 0;
  
  dps.getPressure(&tmp_bmp085_pres);
  dps.getTemperature(&tmp_bmp085_temp);

  dtostrf(tmp_bmp085_pres / 133.3, 1, 1, mmHg);
  dtostrf(tmp_bmp085_temp * 0.1, 1, 1, temp1);

  #ifdef DEBUG
    Serial.print("  [Ok] BMP085 pressure: ");
    Serial.print(mmHg);
    Serial.println(" mmHg");
    Serial.print("  [Ok] BMP085 temperature: ");
    Serial.print(temp1);
    Serial.println(" C");
  #endif

  delay(2000);
}
