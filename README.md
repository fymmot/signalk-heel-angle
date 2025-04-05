# SignalK Wave Heave Sensor Plugin

This SignalK plugin estimates vessel heave (vertical displacement) and wave frequency using IMU data. It is based on the algorithms from the [BBN Boat Heave Sensor](https://github.com/bareboat-necessities/bbn-wave-period-esp32) project, adapted for use with SignalK and OpenPlotter.

## Features

- Estimates vessel heave using IMU data
- Calculates wave frequency using the Aranovskiy filter
- Provides alternative heave estimation using a trochoidal wave model
- Publishes data to SignalK in standard format
- Compatible with OpenPlotter and other SignalK applications

## Hardware Requirements

- Raspberry Pi (any model with I2C support)
- MPU6050 or compatible IMU sensor connected via I2C
- I2C connection:
  - VCC to 3.3V
  - GND to GND
  - SCL to GPIO3 (Pin 5)
  - SDA to GPIO2 (Pin 3)

## Installation

1. Install the plugin in OpenPlotter:
   - Open OpenPlotter
   - Go to SignalK > Plugin Manager
   - Click "Add Plugin"
   - Enter the plugin URL: `https://github.com/yourusername/signalk-wave-heave-sensor`
   - Click "Install"

2. Enable I2C on your Raspberry Pi:
   - Open OpenPlotter
   - Go to System > I2C
   - Enable I2C
   - Reboot if prompted

3. Connect the IMU sensor:
   - Follow the hardware connection instructions above
   - Verify the I2C address (default is 0x68)

## Configuration

The plugin can be configured through the SignalK plugin settings:

- **IMU I2C Address**: The I2C address of your IMU sensor (default: 0x68)
- **Sample Rate**: The sampling rate in Hz (default: 250)

## SignalK Data Paths

The plugin publishes the following data paths:

- `environment.waves.height`: Estimated vessel heave in meters
- `environment.waves.heightAlternate`: Alternative heave estimation using trochoidal wave model
- `environment.waves.frequency`: Estimated wave frequency in Hz

## Algorithm Details

The plugin uses several algorithms to estimate heave and wave frequency:

1. **Attitude Estimation**: A complementary filter combines accelerometer and gyroscope data to estimate vessel attitude.

2. **Heave Estimation**: Two Kalman filters estimate heave:
   - Basic model: Estimates heave using vertical acceleration
   - Trochoidal model: Uses wave frequency to improve heave estimation

3. **Frequency Estimation**: The Aranovskiy filter estimates wave frequency from vertical acceleration.

## Troubleshooting

- **No data**: Check I2C connections and address
- **Incorrect readings**: Calibrate IMU or adjust filter parameters
- **High CPU usage**: Reduce sample rate in plugin settings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on algorithms from [BBN Boat Heave Sensor](https://github.com/bareboat-necessities/bbn-wave-period-esp32)
- Uses SignalK plugin framework
- Compatible with OpenPlotter 