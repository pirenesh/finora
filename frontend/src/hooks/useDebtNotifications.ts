import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const useDebtNotifications = () => {
  const { user } = useAuth();
  const checkInterval = useRef<ReturnType<typeof setInterval> |null>(null);

  useEffect(() => {
    // Request permission immediately if not granted
    if (user && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user || !('Notification' in window)) return;

    const checkDebts = async () => {
      if (Notification.permission !== 'granted') return;

      try {
        // We fetch the latest debts from the API to stay updated
        const res = await axios.get('/api/debt');
        if (res.data.success) {
          const debts = res.data.data;
          const now = new Date();

          debts.forEach((debt: any) => {
            if (debt.status === 'active' && debt.currentBalance > 0 && debt.dueDate) {
              const dueDate = new Date(debt.dueDate);
              
              // Calculate difference in hours
              const diffMs = dueDate.getTime() - now.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);

              // If due in less than 36 hours (covering "tomorrow") and greater than -12 (don't notify for super old ones)
              if (diffHours > -12 && diffHours <= 36) {
                // Use localStorage to track if we already sent a notification for this specific due date cycle
                const storageKey = `debt_notif_${debt._id}_${dueDate.toDateString()}`;
                
                if (!localStorage.getItem(storageKey)) {
                  // Trigger native browser notification
                  new Notification('Finorsa: Payment Due Reminder', {
                    body: `Your payment of ₹${debt.currentBalance.toLocaleString()} ${debt.type === 'borrowed' ? 'to' : 'from'} ${debt.lenderBorrowerName} is due soon!`,
                    icon: '/favicon.ico',
                    tag: debt._id, // Prevent duplicate bubbles
                    requireInteraction: true
                  });

                  localStorage.setItem(storageKey, 'sent');
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to run debt notification check:', err);
      }
    };

    // Run check immediately upon login/mount
    checkDebts();

    // Then run a check every 15 minutes to catch newly added debts or date rollovers
    checkInterval.current = setInterval(checkDebts, 15 * 60 * 1000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [user]);
};
