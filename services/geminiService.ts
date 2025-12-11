import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AGENTS, NAVIGATOR_INSTRUCTION } from "../constants";
import { AgentType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const NAVIGATOR_MODEL = 'gemini-2.5-flash';
const AGENT_MODEL = 'gemini-2.5-flash'; // Can be upgraded to pro if needed for complex reasoning

// --- Function Declarations for the Navigator ---

const delegationTools: Tool = {
  functionDeclarations: [
    {
      name: AgentType.SCHEDULER,
      description: "Delegasi ke Unit Penjadwalan untuk janji temu, batal, atau reschedule.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          originalRequest: { type: Type.STRING, description: "Konteks penuh permintaan user." }
        },
        required: ["originalRequest"]
      }
    },
    {
      name: AgentType.PATIENT_INFO,
      description: "Delegasi ke Unit Administrasi Pasien untuk data diri atau pendaftaran.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          originalRequest: { type: Type.STRING, description: "Konteks penuh permintaan user." }
        },
        required: ["originalRequest"]
      }
    },
    {
      name: AgentType.BILLING,
      description: "Delegasi ke Unit Keuangan/Asuransi untuk pertanyaan tagihan atau biaya.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          originalRequest: { type: Type.STRING, description: "Konteks penuh permintaan user." }
        },
        required: ["originalRequest"]
      }
    },
    {
      name: AgentType.MEDICAL_RECORDS,
      description: "Delegasi ke Unit Rekam Medis untuk hasil lab, diagnosis, atau riwayat.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          originalRequest: { type: Type.STRING, description: "Konteks penuh permintaan user." }
        },
        required: ["originalRequest"]
      }
    }
  ]
};

// --- Service Methods ---

export interface NavigatorResponse {
  navigatorMessage: string;
  delegatedAgent?: AgentType;
  delegationContext?: string;
}

/**
 * Step 1: The Navigator analyzes the request and decides which agent to call.
 * It strictly adheres to "Separation of Duties".
 */
export const runNavigator = async (userMessage: string): Promise<NavigatorResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: NAVIGATOR_MODEL,
      contents: userMessage,
      config: {
        systemInstruction: NAVIGATOR_INSTRUCTION,
        tools: [delegationTools],
        temperature: 0.1, // Low temp for strict routing
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Navigator");
    }

    const content = candidates[0].content;
    const textPart = content.parts.find(p => p.text);
    const functionCallPart = content.parts.find(p => p.functionCall);

    let result: NavigatorResponse = {
      navigatorMessage: textPart?.text || "Memproses permintaan...",
    };

    if (functionCallPart && functionCallPart.functionCall) {
      const fc = functionCallPart.functionCall;
      result.delegatedAgent = fc.name as AgentType;
      // Extract originalRequest from args
      // @ts-ignore - Dynamic typing of args
      result.delegationContext = fc.args['originalRequest'] || userMessage;
    }

    return result;

  } catch (error) {
    console.error("Navigator Error:", error);
    return { navigatorMessage: "Maaf, sistem navigasi sedang sibuk. Silakan coba lagi." };
  }
};

/**
 * Step 2: The Specific Agent executes the task based on the delegated context.
 */
export const runSpecialistAgent = async (agentType: AgentType, context: string): Promise<string> => {
  const agentConfig = AGENTS[agentType];
  
  if (!agentConfig) {
    return "Error: Agen tidak ditemukan.";
  }

  try {
    const response = await ai.models.generateContent({
      model: AGENT_MODEL,
      contents: context,
      config: {
        systemInstruction: agentConfig.systemInstruction,
        temperature: 0.7, // Slightly higher for natural conversation
      }
    });

    return response.text || "Agen tidak memberikan respon.";

  } catch (error) {
    console.error(`Agent ${agentType} Error:`, error);
    return `Maaf, ${agentConfig.name} sedang tidak dapat dihubungi saat ini.`;
  }
};
