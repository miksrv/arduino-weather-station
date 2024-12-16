// Hardware pin definitions
int UVOUT = A0;    // Analog pin connected to the UV sensor output
int REF_3V3 = A1;  // Analog pin connected to the 3.3V reference voltage on the Arduino board

void setup()
{
  Serial.begin(9600);  // Initialize serial communication at 9600 baud rate

  pinMode(UVOUT, INPUT);   // Set UVOUT pin as input
  pinMode(REF_3V3, INPUT); // Set REF_3V3 pin as input

  Serial.println("MP8511 example");  // Print a message indicating the start of the MP8511 example
}

void loop()
{
  // Read average analog values from the UV sensor and reference voltage
  int uvLevel = averageAnalogRead(UVOUT);
  int refLevel = averageAnalogRead(REF_3V3);

  // Calculate the output voltage using the 3.3V reference pin for accuracy
  float outputVoltage = 3.3 / refLevel * uvLevel;

  // Convert the output voltage to UV intensity in mW/cm^2
  float uvIntensity = mapfloat(outputVoltage, 0.99, 2.9, 0.0, 15.0);

  // Print the UV sensor output level, voltage, and UV intensity
  Serial.print("MP8511 output: ");
  Serial.print(uvLevel);

  Serial.print(" MP8511 voltage: ");
  Serial.print(outputVoltage);

  Serial.print(" UV Intensity (mW/cm^2): ");
  Serial.print(uvIntensity);

  Serial.println();  // Print a newline character for formatting

  delay(100);  // Wait 100 milliseconds before the next loop iteration
}

// Takes an average of readings on a given analog pin
// Returns the average value
int averageAnalogRead(int pinToRead)
{
  byte numberOfReadings = 8;      // Number of readings to average
  unsigned int runningValue = 0; // Variable to accumulate the readings

  for(int x = 0 ; x < numberOfReadings ; x++)
    runningValue += analogRead(pinToRead);  // Sum the readings
  runningValue /= numberOfReadings;          // Calculate the average

  return(runningValue);  // Return the average reading
}

// Maps a floating-point value from one range to another
// Reference: http://forum.arduino.cc/index.php?topic=3922.0
float mapfloat(float x, float in_min, float in_max, float out_min, float out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
