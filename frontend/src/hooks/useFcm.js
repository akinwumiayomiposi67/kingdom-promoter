import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import api from '../api/axios';

export function useFcm() {
  useEffect(() => {
    let unsubscribe;

    async function registerFcm() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
        });

        if (token) {
          await api.post('/auth/fcm-token', { fcm_token: token });
        }

        unsubscribe = onMessage(messaging, (payload) => {
          console.info('FCM foreground message:', payload);
        });
      } catch (err) {
        console.error('FCM registration failed:', err);
      }
    }

    registerFcm();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);
}
