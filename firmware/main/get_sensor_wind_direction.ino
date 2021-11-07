void get_sensor_wind_direction() {
  String value = "";

  for (int i=0; i<8; i++) {
    if (expander.digitalRead(i) == 0) {
      value = value + String(i);
    }
    delay(20);
  }

  if (value != "") {
    value.toCharArray(wind_dir, 2);
  }

  #ifdef DEBUG
    Serial.print(" - Wind direction: ");
    Serial.println(wind_dir);
  #endif
  
  delay(500);
}
