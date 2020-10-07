// Get anemometr data

void get_sensor_wind_direction() {
  String value = "";

  for (int i=0; i<8; i++) {
    if (expander.digitalRead(i) == 0) {
      value = value + String(i);
    }
    
    delay(80);
  }

  value.toCharArray(wind_dir, 4);

  #ifdef DEBUG
    Serial.print("  [Ok] Wind direction: ");
    Serial.println(wind_dir);
  #endif
  
  delay(2000);
}
