// Wind vane: 8 reed switches on the PCF8574, one per compass sector.
// Assumption: pin 0 = North, and the index grows clockwise (1 = NE, 2 = E, ... 7 = NW).
// If the vane is mounted differently, adjust WIND_VANE_NORTH_PIN / the sector order here.
#define WIND_SECTOR_DEGREES 45  // 360 / 8 sectors
#define WIND_VANE_NORTH_PIN 0   // Expander pin that is active when the vane points North

void get_sensor_wind_direction() {
  // Last known direction in degrees (kept when no pin is active, e.g. between two sectors)
  static int windDegrees = 0;

  // Iterate through the 8 possible pins on the expander to read wind direction
  for (int i = 0; i < 8; i++) {
    // The first pin that reads 0 (active) is the current sector
    if (expander.digitalRead(i) == 0) {
      windDegrees = ((i - WIND_VANE_NORTH_PIN + 8) % 8) * WIND_SECTOR_DEGREES;
      break;
    }
    // Short delay to prevent reading errors
    delay(20);
  }

  // The server stores the direction in degrees
  itoa(windDegrees, wind_dir, 10);

  // Debug: Output the wind direction value if debugging is enabled
  #ifdef DEBUG
    Serial.print(" - Wind direction: ");
    Serial.print(wind_dir);
    Serial.println(" deg");
  #endif

  // Delay before the next read
  delay(500);
}
