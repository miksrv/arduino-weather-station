void get_sensor_wind_direction() {
  // Initialize an empty string to store the wind direction value
  String value = "";

  // Iterate through the 8 possible pins on the expander to read wind direction
  for (int i = 0; i < 8; i++) {
    // If a pin reads 0 (active), append the index to the value string
    if (expander.digitalRead(i) == 0) {
      value = value + String(i);
    }
    // Short delay to prevent reading errors
    delay(20);
  }

  // If a valid wind direction was detected, convert the string to a char array
  if (value != "") {
    value.toCharArray(wind_dir, 2); // Store the first two characters into wind_dir
  }

  // Debug: Output the wind direction value if debugging is enabled
  #ifdef DEBUG
    Serial.print(" - Wind direction: ");
    Serial.println(wind_dir);
  #endif

  // Delay before the next read
  delay(500);
}