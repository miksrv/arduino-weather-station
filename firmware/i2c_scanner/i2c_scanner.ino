#include <Wire.h>  // Include the Wire library for I2C communication

void setup()
{
  Wire.begin();         // Initialize I2C communication
  Serial.begin(9600);  // Start serial communication at 9600 baud rate
  while (!Serial);     // Wait for the serial monitor to connect (for Leonardo boards)
  
  Serial.println("\nI2C Scanner");  // Print a message indicating the start of the I2C scanner
}

void loop()
{
  byte error, address;  // Variables for error code and device address
  int nDevices;         // Counter for the number of devices found

  Serial.println("Scanning...");  // Print message indicating scanning is starting

  nDevices = 0;  // Initialize device counter
  for(address = 1; address < 127; address++ )  // Loop through possible I2C addresses
  {
    // Use Wire.beginTransmission() and Wire.endTransmission() to check if a device
    // responds to the address. If no error is returned, a device is present.
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0)  // Device acknowledged the address
    {
      Serial.print("I2C device found at address 0x");
      if (address < 16) 
        Serial.print("0");  // Print leading zero for addresses less than 16
      Serial.print(address, HEX);  // Print address in hexadecimal format
      Serial.println("  !");

      nDevices++;  // Increment the number of devices found
    }
    else if (error == 4)  // An unknown error occurred
    {
      Serial.print("Unknown error at address 0x");
      if (address < 16) 
        Serial.print("0");  // Print leading zero for addresses less than 16
      Serial.println(address, HEX);  // Print address in hexadecimal format
    }    
  }
  
  // Print summary of the scan results
  if (nDevices == 0)
    Serial.println("No I2C devices found\n");
  else
    Serial.println("done\n");

  delay(5000);  // Wait 5 seconds before the next scan
}