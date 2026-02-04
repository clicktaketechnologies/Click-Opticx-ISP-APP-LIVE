
import Vapi from '@vapi-ai/web';

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY || '');

export const startCall = async (assistantId: string) => {
    try {
        await vapi.start(assistantId);
        return { success: true };
    } catch (error) {
        console.error('Failed to start Vapi call:', error);
        return { success: false, error };
    }
};

export const stopCall = () => {
    vapi.stop();
};

export const getVapiInstance = () => vapi;
