import { Logger } from 'pino';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Alarm, AlarmRule } from '@scada/types';
import { getSimulator } from '../simulator';

interface AlarmEngineConfig {
  supabase: SupabaseClient;
  logger: Logger;
}

interface AlarmContext {
  supply_line_id: string;
  parameter: string;
  value: number;
  rule: AlarmRule;
}

class AlarmEngine {
  private supabase: SupabaseClient;
  private logger: Logger;
  private checkInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private alarmRules: AlarmRule[] = [];
  private activeAlarms: Map<string, Alarm> = new Map();

  constructor(config: AlarmEngineConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.checkInterval = parseInt(process.env.ALARM_CHECK_INTERVAL || '5000', 10);
  }

  async start(): Promise<void> {
    this.logger.info('Starting alarm engine');

    // Load alarm rules from database
    await this.loadAlarmRules();

    // Start periodic alarm checks
    this.timer = setInterval(() => {
      this.checkAlarms();
    }, this.checkInterval);

    this.logger.info({ checkInterval: this.checkInterval, ruleCount: this.alarmRules.length }, 'Alarm engine started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.info('Alarm engine stopped');
  }

  private async loadAlarmRules(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('alarm_rules')
        .select('*')
        .eq('enabled', true);

      if (error) {
        this.logger.error({ error }, 'Failed to load alarm rules');
        return;
      }

      this.alarmRules = data || [];
      this.logger.info({ count: this.alarmRules.length }, 'Loaded alarm rules');
    } catch (error) {
      this.logger.error({ error }, 'Exception loading alarm rules');
    }
  }

  private async checkAlarms(): Promise<void> {
    const simulator = getSimulator();
    if (!simulator) {
      return;
    }

    const devices = simulator.getDevices();

    for (const device of devices) {
      // Get applicable rules for this supply line
      const rules = this.alarmRules.filter(
        (rule) => rule.supply_line_id === device.supply_line_id || !rule.supply_line_id
      );

      for (const rule of rules) {
        let value: number = 0;

        // Get the current value for the parameter
        switch (rule.parameter) {
          case 'flow_rate':
            value = device.current_flow;
            break;
          case 'pressure':
            value = device.current_pressure;
            break;
          case 'valve_position':
            value = device.valve_position;
            break;
          case 'total_volume':
            value = device.total_volume;
            break;
        }

        // Check condition
        const isViolation = this.evaluateCondition(value, rule.condition, rule.threshold);

        if (isViolation) {
          await this.raiseAlarm({
            supply_line_id: device.supply_line_id,
            parameter: rule.parameter,
            value,
            rule,
          });
        } else {
          // Check if we need to close an active alarm
          await this.closeAlarm(device.supply_line_id, rule.parameter);
        }
      }
    }
  }

  private evaluateCondition(
    value: number,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  private async raiseAlarm(context: AlarmContext): Promise<void> {
    const { supply_line_id, parameter, value, rule } = context;

    // Check if alarm already exists for this supply line and parameter
    const alarmKey = `${supply_line_id}-${parameter}`;
    if (this.activeAlarms.has(alarmKey)) {
      return; // Alarm already active
    }

    const message = rule.message_template.replace('{supply_line_name}', 'Supply Line');

    try {
      const { data, error } = await this.supabase
        .from('alarms')
        .insert({
          supply_line_id,
          alarm_type: `${parameter}_${rule.condition}`,
          severity: rule.severity,
          message,
          value,
          threshold: rule.threshold,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        this.logger.error({ error, context }, 'Failed to create alarm');
        return;
      }

      this.activeAlarms.set(alarmKey, data);
      this.logger.warn(
        {
          alarmId: data.id,
          supplyLineId: supply_line_id,
          parameter,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
        },
        'Alarm raised'
      );

      // TODO: Send notifications (email, SMS, push)
    } catch (error) {
      this.logger.error({ error, context }, 'Exception raising alarm');
    }
  }

  private async closeAlarm(supply_line_id: string, parameter: string): Promise<void> {
    const alarmKey = `${supply_line_id}-${parameter}`;
    const alarm = this.activeAlarms.get(alarmKey);

    if (!alarm) {
      return; // No active alarm
    }

    try {
      const { error } = await this.supabase
        .from('alarms')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', alarm.id);

      if (error) {
        this.logger.error({ error, alarmId: alarm.id }, 'Failed to close alarm');
        return;
      }

      this.activeAlarms.delete(alarmKey);
      this.logger.info(
        { alarmId: alarm.id, supplyLineId: supply_line_id, parameter },
        'Alarm closed'
      );
    } catch (error) {
      this.logger.error({ error, alarmId: alarm.id }, 'Exception closing alarm');
    }
  }

  async acknowledgeAlarm(alarmId: string, userId: string, notes?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alarms')
        .update({
          status: 'acknowledged',
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
          notes,
        })
        .eq('id', alarmId);

      if (error) {
        this.logger.error({ error, alarmId }, 'Failed to acknowledge alarm');
        return;
      }

      this.logger.info({ alarmId, userId }, 'Alarm acknowledged');
    } catch (error) {
      this.logger.error({ error, alarmId }, 'Exception acknowledging alarm');
    }
  }

  getActiveAlarmCount(): number {
    return this.activeAlarms.size;
  }
}

let alarmEngine: AlarmEngine | null = null;

export async function startAlarmEngine(config: AlarmEngineConfig): Promise<void> {
  if (alarmEngine) {
    config.logger.warn('Alarm engine already initialized');
    return;
  }

  alarmEngine = new AlarmEngine(config);
  await alarmEngine.start();
}

export function stopAlarmEngine(): void {
  if (alarmEngine) {
    alarmEngine.stop();
    alarmEngine = null;
  }
}

export function getAlarmEngine(): AlarmEngine | null {
  return alarmEngine;
}
