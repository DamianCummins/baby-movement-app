import React from 'react';
import './ButtonGrid.css';

type Props = {
    setPosition: (value: string) => void;
    selected: string;
}
export default function ButtonGrid ({setPosition, selected}: Props) {
    return (
        <div className="grid">
            <div className="row">
                <button className={selected === 'high left' ? 'selected' : ''} type="button" onClick={() => setPosition('high left')}>High Left</button>
                <button className={selected === 'high centre' ? 'selected' : ''} type="button" onClick={() => setPosition('high centre')}>High Centre</button>
                <button className={selected === 'high right' ? 'selected' : ''} type="button" onClick={() => setPosition('high right')}>High Right</button>
            </div>
            <div className="row">
                <button className={selected === 'middle left' ? 'selected' : ''} type="button" onClick={() => setPosition('middle left')}>Middle Left</button>
                <button className={selected === 'middle centre' ? 'selected' : ''} type="button" onClick={() => setPosition('middle centre')}>Middle Centre</button>
                <button className={selected === 'middle right' ? 'selected' : ''} type="button" onClick={() => setPosition('middle right')}>Middle Right</button>
            </div>
            <div className="row">
                <button className={selected === 'low left' ? 'selected' : ''} type="button" onClick={() => setPosition('low left')}>Low Left</button>
                <button className={selected === 'low centre' ? 'selected' : ''} type="button" onClick={() => setPosition('low centre')}>Low Centre</button>
                <button className={selected === 'low right' ? 'selected' : ''} type="button" onClick={() => setPosition('low right')}>Low Right</button>
            </div>
        </div>
    )
}