import React, { useState, useEffect, memo } from 'react';
import './AnimatedCounter.css';

const AnimatedCounter = memo(({ count }) => {
    const [prevCount, setPrevCount] = useState(null);
    const [direction, setDirection] = useState(null);

    useEffect(() => {
        if (prevCount !== null && prevCount !== count) {
            setDirection(count > prevCount ? 'up' : 'down');
        }
        const timer = setTimeout(() => {
            setPrevCount(count);
            setDirection(null);
        }, 400); // Час має збігатися з анімацією в CSS

        return () => clearTimeout(timer);
    }, [count]);

    return (
        <span className="counter-viewport">
            {direction === 'up' && <span key={prevCount} className="digit-leave-up">{prevCount}</span>}
            {direction === 'down' && <span key={prevCount} className="digit-leave-down">{prevCount}</span>}
            
            <span key={count} className={`digit-enter ${direction ? 'from-' + direction : ''}`}>
                {count}
            </span>
        </span>
    );
});

export default AnimatedCounter;