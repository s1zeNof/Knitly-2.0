/**
 * Діагностичний модуль для відстеження зависань
 * Логи видно у DevTools → вкладка Console (F12 → Console)
 *
 * Як шукати: набери в фільтрі [DIAG] або [LONGTASK] для фільтрації.
 * ВИДАЛИ цей файл та всі імпорти після того як знайдеш баг.
 */

const start = performance.now();
const t = () => `+${((performance.now() - start) / 1000).toFixed(3)}s`;

export const diag = (label, data) => {
    if (data !== undefined) {
        console.log(`%c[DIAG ${t()}] ${label}`, 'color:#a78bfa;font-weight:bold', data);
    } else {
        console.log(`%c[DIAG ${t()}] ${label}`, 'color:#a78bfa;font-weight:bold');
    }
};

export const diagWarn = (label, data) => {
    if (data !== undefined) {
        console.warn(`[DIAG ${t()}] ⚠️ ${label}`, data);
    } else {
        console.warn(`[DIAG ${t()}] ⚠️ ${label}`);
    }
};

/**
 * Запускає PerformanceObserver для longtask — відстежує завдання >50мс на JS-потоці.
 * Якщо побачиш [LONGTASK] з великою тривалістю — це і є причина зависання.
 * Викликай один раз на старті App.
 */
export const startLongTaskObserver = () => {
    if (!('PerformanceObserver' in window)) {
        console.warn('[DIAG] PerformanceObserver не підтримується цим браузером');
        return;
    }
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const duration = entry.duration.toFixed(0);
                const startAt = entry.startTime.toFixed(0);
                const attribution = entry.attribution?.[0];
                const script = attribution?.name || 'unknown';
                const container = attribution?.containerName || '';
                console.error(
                    `%c[LONGTASK +${startAt}ms] JS заблокував потік на ${duration}мс | скрипт: ${script} ${container}`,
                    'color:red;font-weight:bold'
                );
            }
        });
        observer.observe({ entryTypes: ['longtask'] });
        diag('LongTask observer запущено — шукай [LONGTASK] у консолі');
    } catch (e) {
        console.warn('[DIAG] Не вдалося запустити PerformanceObserver:', e);
    }
};
