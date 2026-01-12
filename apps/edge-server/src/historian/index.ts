import { Logger } from 'pino';
import { SupabaseClient } from '@supabase/supabase-js';
import type { FlowData } from '@scada/types';
import { getSimulator } from '../simulator';

interface HistorianConfig {
  supabase: SupabaseClient;
  logger: Logger;
}

interface BufferedRecord {
  time: string;
  supply_line_id: string;
  flow_rate: number;
  total_volume: number;
  pressure: number;
  valve_position: number;
  status: string;
}

class Historian {
  private supabase: SupabaseClient;
  private logger: Logger;
  private buffer: BufferedRecord[] = [];
  private batchSize: number;
  private flushInterval: number;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: HistorianConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.batchSize = parseInt(process.env.HISTORIAN_BATCH_SIZE || '100', 10);
    this.flushInterval = parseInt(process.env.HISTORIAN_FLUSH_INTERVAL || '10000', 10);
  }

  async start(): Promise<void> {
    this.logger.info('Starting historian');

    // Listen to simulator readings
    const simulator = getSimulator();
    if (simulator) {
      simulator.on('reading', (reading) => {
        this.recordReading(reading);
      });
      this.logger.info('Historian listening to simulator readings');
    }

    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    this.logger.info({ batchSize: this.batchSize, flushInterval: this.flushInterval }, 'Historian started');
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining records
    if (this.buffer.length > 0) {
      this.flush();
    }

    this.logger.info('Historian stopped');
  }

  private recordReading(reading: any): void {
    const record: BufferedRecord = {
      time: reading.timestamp.toISOString(),
      supply_line_id: reading.meter_id.replace('FM-', '650e8400-e29b-41d4-a716-446655440').slice(0, 36), // Map meter ID to supply line ID (simplified)
      flow_rate: reading.flow_rate,
      total_volume: reading.total_volume,
      pressure: reading.pressure,
      valve_position: reading.valve_position,
      status: reading.status === 'ok' ? 'normal' : reading.status === 'warning' ? 'warning' : 'alarm',
    };

    // Get the actual supply line ID from the devices map
    const simulator = getSimulator();
    if (simulator) {
      const device = simulator.getDevice(reading.meter_id);
      if (device) {
        record.supply_line_id = device.supply_line_id;
      }
    }

    this.buffer.push(record);

    // Flush if buffer is full
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const recordsToWrite = this.buffer.splice(0, this.buffer.length);
    const startTime = Date.now();

    try {
      const { error } = await this.supabase
        .from('flow_data')
        .insert(recordsToWrite);

      if (error) {
        this.logger.error({ error, count: recordsToWrite.length }, 'Failed to write flow data to database');
        // Re-add to buffer for retry (in production, implement a dead-letter queue)
        this.buffer.unshift(...recordsToWrite);
      } else {
        const duration = Date.now() - startTime;
        this.logger.info(
          { count: recordsToWrite.length, duration },
          'Successfully wrote flow data to database'
        );
      }
    } catch (error) {
      this.logger.error({ error, count: recordsToWrite.length }, 'Exception writing flow data');
      // Re-add to buffer for retry
      this.buffer.unshift(...recordsToWrite);
    }
  }

  getBufferSize(): number {
    return this.buffer.length;
  }
}

let historian: Historian | null = null;

export async function startHistorian(config: HistorianConfig): Promise<void> {
  if (historian) {
    config.logger.warn('Historian already initialized');
    return;
  }

  historian = new Historian(config);
  await historian.start();
}

export function stopHistorian(): void {
  if (historian) {
    historian.stop();
    historian = null;
  }
}

export function getHistorian(): Historian | null {
  return historian;
}
