import { Logger } from 'pino';
import EventEmitter from 'events';
import type { FlowMeterReading, SimulatedDevice } from '@scada/types';

interface SimulatorConfig {
  interval: number;
  logger: Logger;
}

class FlowMeterSimulator extends EventEmitter {
  private devices: Map<string, SimulatedDevice> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private updateInterval: number;

  constructor(logger: Logger, updateInterval: number) {
    super();
    this.logger = logger;
    this.updateInterval = updateInterval;
  }

  addDevice(device: SimulatedDevice): void {
    this.devices.set(device.id, device);
    this.logger.info({ deviceId: device.id, supplyLineId: device.supply_line_id }, 'Added simulated device');
  }

  removeDevice(deviceId: string): void {
    this.devices.delete(deviceId);
    this.logger.info({ deviceId }, 'Removed simulated device');
  }

  start(): void {
    if (this.interval) {
      this.logger.warn('Simulator already running');
      return;
    }

    this.logger.info('Starting flow meter simulator');
    this.interval = setInterval(() => {
      this.generateReadings();
    }, this.updateInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.info('Stopped flow meter simulator');
    }
  }

  private generateReadings(): void {
    const now = new Date();

    for (const [deviceId, device] of this.devices.entries()) {
      // Generate realistic flow rate with some variation
      const baseFlow = (device.current_flow + (Math.random() - 0.5) * 10);
      const flowRate = Math.max(10, Math.min(150, baseFlow));

      // Generate pressure with variation
      const basePressure = device.current_pressure;
      const pressure = Math.max(1, Math.min(10, basePressure + (Math.random() - 0.5) * 0.5));

      // Accumulate volume (flow rate in L/s * interval in seconds / 1000 = m³)
      const volumeIncrement = (flowRate * (this.updateInterval / 1000)) / 1000;
      const totalVolume = device.total_volume + volumeIncrement;

      // Update device state
      device.current_flow = flowRate;
      device.current_pressure = pressure;
      device.total_volume = totalVolume;

      // Determine status based on thresholds
      let status: 'ok' | 'warning' | 'error' = 'ok';
      if (flowRate > 120 || pressure > 9) {
        status = 'warning';
      } else if (flowRate > 140 || pressure > 9.5 || flowRate < 5 || pressure < 1.5) {
        status = 'error';
      }

      // Create reading
      const reading: FlowMeterReading = {
        meter_id: deviceId,
        timestamp: now,
        flow_rate: parseFloat(flowRate.toFixed(3)),
        total_volume: parseFloat(totalVolume.toFixed(3)),
        pressure: parseFloat(pressure.toFixed(2)),
        temperature: 20 + Math.random() * 5, // 20-25°C
        valve_position: device.valve_position,
        status,
      };

      // Emit reading event
      this.emit('reading', reading);
    }
  }

  getDevices(): SimulatedDevice[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): SimulatedDevice | undefined {
    return this.devices.get(deviceId);
  }
}

let simulator: FlowMeterSimulator | null = null;

export async function startSimulator(config: SimulatorConfig): Promise<FlowMeterSimulator> {
  const { interval, logger } = config;

  if (simulator) {
    logger.warn('Simulator already initialized');
    return simulator;
  }

  simulator = new FlowMeterSimulator(logger, interval);

  // Create simulated devices for each supply line
  // In a real system, this would query the database for supply lines
  // For now, we'll create a few test devices
  const testDevices: SimulatedDevice[] = [
    {
      id: 'FM-A1-001',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440001',
      type: 'ultrasonic',
      current_flow: 45,
      current_pressure: 5.5,
      total_volume: 1000,
      valve_position: 80,
    },
    {
      id: 'FM-A2-002',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440002',
      type: 'magnetic',
      current_flow: 35,
      current_pressure: 4.8,
      total_volume: 800,
      valve_position: 75,
    },
    {
      id: 'FM-B1-003',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440003',
      type: 'coriolis',
      current_flow: 70,
      current_pressure: 6.2,
      total_volume: 1500,
      valve_position: 85,
    },
    {
      id: 'FM-C1-004',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440004',
      type: 'ultrasonic',
      current_flow: 95,
      current_pressure: 7.0,
      total_volume: 2000,
      valve_position: 90,
    },
    {
      id: 'FM-C2-005',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440005',
      type: 'magnetic',
      current_flow: 60,
      current_pressure: 5.8,
      total_volume: 1200,
      valve_position: 78,
    },
    {
      id: 'FM-D1-006',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440006',
      type: 'coriolis',
      current_flow: 125,
      current_pressure: 6.5,
      total_volume: 2500,
      valve_position: 95,
    },
    {
      id: 'FM-E1-007',
      supply_line_id: '650e8400-e29b-41d4-a716-446655440007',
      type: 'ultrasonic',
      current_flow: 50,
      current_pressure: 5.2,
      total_volume: 1100,
      valve_position: 82,
    },
  ];

  testDevices.forEach((device) => {
    simulator!.addDevice(device);
  });

  simulator.start();
  logger.info({ deviceCount: testDevices.length }, 'Simulator initialized with devices');

  return simulator;
}

export function getSimulator(): FlowMeterSimulator | null {
  return simulator;
}

export function stopSimulator(): void {
  if (simulator) {
    simulator.stop();
    simulator = null;
  }
}
