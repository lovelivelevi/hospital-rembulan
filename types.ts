import React from 'react';

export enum AgentType {
  NAVIGATOR = 'Navigator',
  SCHEDULER = 'PenjadwalJanjiTemu',
  PATIENT_INFO = 'AgenInformasiPasien',
  BILLING = 'AgenPenagihanDanAsuransi',
  MEDICAL_RECORDS = 'AgenRekamMedis',
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  sender?: string; // Display name of the agent
  agentType?: AgentType;
  timestamp: Date;
  isThinking?: boolean;
}

export interface AgentConfig {
  id: AgentType;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  systemInstruction: string;
}

export type ProcessingState = 'idle' | 'navigating' | 'delegating' | 'responding';