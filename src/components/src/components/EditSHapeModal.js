import React, { useState, useEffect } from 'react';
import './EditShapeModal.css';

const EditShapeModal = ({ tool, config, onUpdate, onClose }) => {
    const [size, setSize] = useState(config?.size || 10);
    const [color, setColor] = useState(config?.color || '#ff0000');
    const [label, setLabel] = useState(config?.label || '');

    const colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'];

    useEffect(() => {
        onUpdate({ size, color, label }); // 👈 update live when changed
    }, [size, color, label]);

    function generateStarPoints(cx, cy, spikes, outerRadius, innerRadius) {
        const step = Math.PI / spikes;
        const points = [];

        for (let i = 0; i < 2 * spikes; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * step - Math.PI / 2; // ✅ Rotate to point upward
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push(`${x},${y}`);
        }

        return points.join(' ');
    }

    const renderShapePreview = () => {
        const commonStyle = {
            stroke: color,
            fill: 'transparent',
            strokeWidth: '3px',
        };

        switch (tool) {
            case 'sharp-pain':
                return (
                    <svg width="100" height="100">
                        <polygon
                            points={`50,${50 - size} ${50 - size},${50 + size} ${50 + size},${50 + size}`}
                            {...commonStyle}
                        />
                    </svg>
                );
            case 'tingling':
                return (
                    <svg width="100" height="100">
                        <rect
                            x={50 - size}
                            y={50 - size}
                            width={size * 2}
                            height={size * 2}
                            {...commonStyle}
                        />
                    </svg>
                );
            case 'numbness':
                const outerRadius = size;
                const innerRadius = size / 2;
                const starPoints = generateStarPoints(50, 50, 5, outerRadius, innerRadius);

                return (
                    <svg width="100" height="100">
                        <polygon
                            points={starPoints}
                            stroke={color}
                            fill="transparent"
                            strokeWidth="3px"
                        />
                    </svg>
                );

            default: // dull-ache
                return (
                    <svg width="100" height="100">
                        <circle cx="50" cy="50" r={size} {...commonStyle} />
                    </svg>
                );
        }
    };

    return (
        <div className="shape-edit-modal">
            <button className="modal-close" onClick={onClose}>✖</button>

            {/* ✅ Title */}
            <h3 className="modal-title">Edit Shape</h3>

            {/* ✅ Label input */}
            <label className="shape-edit-label">Shape Label</label>
            <input
                type="text"
                className="shape-edit-title-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter label..."
                disabled={!config || !config.label}
            />

            <div className="shape-preview">{renderShapePreview()}</div>

            <label className="shape-edit-label">Shape Size</label>
            <input
                type="range"
                min="5"
                max="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="shape-edit-slider"
            />

            <label className="shape-edit-label">Shape Color</label>
            <div className="shape-edit-color-options">
                {colors.map((c) => (
                    <div
                        key={c}
                        className={`shape-edit-color ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>
        </div>
    );
};

export default EditShapeModal;
