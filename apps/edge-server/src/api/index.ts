import { Router } from 'express';
import { getSupabaseClient } from '../config/supabase';
import { getSimulator } from '../simulator';
import { getHistorian } from '../historian';
import { getAlarmEngine } from '../alarms';

export function createAPIRouter(): Router {
  const router = Router();
  const supabase = getSupabaseClient();

  // System status endpoint
  router.get('/status', (req, res) => {
    const simulator = getSimulator();
    const historian = getHistorian();
    const alarmEngine = getAlarmEngine();

    res.json({
      status: 'online',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      simulator: {
        enabled: !!simulator,
        device_count: simulator?.getDevices().length || 0,
      },
      historian: {
        enabled: !!historian,
        buffer_size: historian?.getBufferSize() || 0,
      },
      alarm_engine: {
        enabled: !!alarmEngine,
        active_alarms: alarmEngine?.getActiveAlarmCount() || 0,
      },
    });
  });

  // Get simulated devices
  router.get('/simulator/devices', (req, res) => {
    const simulator = getSimulator();

    if (!simulator) {
      return res.status(503).json({ error: 'Simulator not enabled' });
    }

    const devices = simulator.getDevices();
    res.json({ devices });
  });

  // Get supply lines
  router.get('/supply-lines', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('supply_lines')
        .select(`
          *,
          vendors (
            id,
            name,
            code
          )
        `)
        .order('name');

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ supply_lines: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get latest flow data
  router.get('/flow-data/latest', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('latest_flow_data')
        .select('*')
        .order('time', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ flow_data: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get flow data for a specific supply line with time range
  router.get('/flow-data/:supply_line_id', async (req, res) => {
    const { supply_line_id } = req.params;
    const { start_time, end_time, interval = '5min' } = req.query;

    try {
      // Determine which materialized view to use based on interval
      let tableName = 'flow_data';
      if (interval === '1min') {
        tableName = 'flow_data_1min';
      } else if (interval === '1hour') {
        tableName = 'flow_data_1hour';
      } else if (interval === '1day') {
        tableName = 'flow_data_1day';
      }

      let query = supabase
        .from(tableName)
        .select('*')
        .eq('supply_line_id', supply_line_id)
        .order(tableName === 'flow_data' ? 'time' : 'bucket', { ascending: false })
        .limit(1000);

      if (start_time) {
        query = query.gte(tableName === 'flow_data' ? 'time' : 'bucket', start_time as string);
      }

      if (end_time) {
        query = query.lte(tableName === 'flow_data' ? 'time' : 'bucket', end_time as string);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ flow_data: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get active alarms
  router.get('/alarms/active', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('active_alarms_detailed')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ alarms: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get alarms for a specific supply line
  router.get('/alarms/:supply_line_id', async (req, res) => {
    const { supply_line_id } = req.params;
    const { status } = req.query;

    try {
      let query = supabase
        .from('alarms')
        .select('*')
        .eq('supply_line_id', supply_line_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (status) {
        query = query.eq('status', status as string);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ alarms: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Acknowledge alarm
  router.post('/alarms/:alarm_id/acknowledge', async (req, res) => {
    const { alarm_id } = req.params;
    const { user_id, notes } = req.body;

    try {
      const alarmEngine = getAlarmEngine();
      if (alarmEngine) {
        await alarmEngine.acknowledgeAlarm(alarm_id, user_id, notes);
      }

      res.json({ success: true, message: 'Alarm acknowledged' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get vendor dashboard summary
  router.get('/vendors/:vendor_id/dashboard', async (req, res) => {
    const { vendor_id } = req.params;

    try {
      // Get vendor summary
      const { data: summary, error: summaryError } = await supabase
        .from('vendor_dashboard_summary')
        .select('*')
        .eq('vendor_id', vendor_id)
        .single();

      if (summaryError) {
        return res.status(500).json({ error: summaryError.message });
      }

      // Get supply lines
      const { data: supplyLines, error: linesError } = await supabase
        .from('supply_lines')
        .select('*, latest_flow_data:flow_data(time, flow_rate, total_volume, pressure)')
        .eq('vendor_id', vendor_id)
        .order('name');

      if (linesError) {
        return res.status(500).json({ error: linesError.message });
      }

      // Get active alarms
      const { data: alarms, error: alarmsError } = await supabase
        .from('active_alarms_detailed')
        .select('*')
        .eq('vendor_id', vendor_id);

      if (alarmsError) {
        return res.status(500).json({ error: alarmsError.message });
      }

      res.json({
        summary,
        supply_lines: supplyLines,
        active_alarms: alarms || [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get billing reports for a vendor
  router.get('/billing-reports/:vendor_id', async (req, res) => {
    const { vendor_id } = req.params;
    const { status, start_date, end_date } = req.query;

    try {
      let query = supabase
        .from('billing_reports')
        .select('*')
        .eq('vendor_id', vendor_id)
        .order('period_start', { ascending: false });

      if (status) {
        query = query.eq('status', status as string);
      }

      if (start_date) {
        query = query.gte('period_start', start_date as string);
      }

      if (end_date) {
        query = query.lte('period_end', end_date as string);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ reports: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check with detailed metrics
  router.get('/metrics', (req, res) => {
    const simulator = getSimulator();
    const historian = getHistorian();
    const alarmEngine = getAlarmEngine();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      simulator: {
        enabled: !!simulator,
        devices: simulator?.getDevices().length || 0,
      },
      historian: {
        enabled: !!historian,
        buffer_size: historian?.getBufferSize() || 0,
      },
      alarm_engine: {
        enabled: !!alarmEngine,
        active_alarms: alarmEngine?.getActiveAlarmCount() || 0,
      },
    };

    res.json(metrics);
  });

  return router;
}
