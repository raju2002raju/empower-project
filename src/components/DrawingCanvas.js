// Full feature-enhanced DrawingCanvas.js with all original toolbars + new zoom & body parts view

import React, { useEffect, useRef, useState } from 'react';
import {
  Stage, Layer,
  Image as KonvaImage,
  Line,
  Star,
  Ellipse,
  Rect,
  Text,
  Label,
  Tag,
  Arrow
} from 'react-konva';
import useImage from 'use-image';
import EditShapeModal from './EditSHapeModal';
import './EditShapeModal.css';

const DrawingCanvas = () => {
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [canvasWidth, setCanvasWidth] = useState(window.innerHeight / 667 * 375);

  const [tool, setTool] = useState('pencil');
  // const [lines, setLines] = useState([]);
  // const [shapes, setShapes] = useState([]);
  const [savedDrawings, setSavedDrawings] = useState({});

  const [drawings, setDrawings] = useState([]);
  const eraserRadius = 10;
  const isErasing = useRef(false);

  const [color, setColor] = useState('#ff0000');
  const [gender, setGender] = useState('woman');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [view, setView] = useState('full-body');
  const [isBack, setBack] = useState(0);
  // const [showGenderOptions, setShowGenderOptions] = useState(false);

  // const [arrows, setArrows] = useState([]);
  const [currentArrow, setCurrentArrow] = useState(null);
  const arrowStart = useRef(null);


  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const stageRefs = useRef({});

  const partTextStyle = {
    // fontSize: 14,
    fontFamily: 'Arial',
    fontStyle: 'bold', // ✅ make it bold
    fill: '#333',
    padding: 6,
  };

  const saveCurrentViewDrawings = () => {
    const key = `${gender}-${view}`;
    setSavedDrawings(prev => ({
      ...prev,
      [key]: drawings
    }));
  };

  const [showShapeEditor, setShowShapeEditor] = useState(false);
  // const [customShapeSize, setCustomShapeSize] = useState(10);
  // const [customShapeColor, setCustomShapeColor] = useState('#ff0000');

  const [shapeConfigs, setShapeConfigs] = useState({
    'sharp-pain': { size: 10, color: 'red', label: 'Sharp Pain' },
    'dull-ache': { size: 10, color: 'orange', label: 'Dull Ache' },
    'tingling': { size: 10, color: 'blue', label: 'Tingling' },
    'numbness': { size: 10, color: 'green', label: 'Numbness' },
  });

  const updateShapeConfig = (toolKey, newValues) => {
    setShapeConfigs(prev => ({
      ...prev,
      [toolKey]: { ...prev[toolKey], ...newValues }
    }));
  };

  const imageMap = {
    'man': '/body_man.png',
    'woman': '/body_woman.png',
    'man-back': '/body_man_back.png',
    'woman-back': '/body_woman_back.png',
    'man-head-neck': '/body_man_head.png',
    'woman-head-neck': '/body_woman_head.png',
    'man-upper-body': '/body_man_upper.png',
    'woman-upper-body': '/body_woman_upper.png',
    'man-left-arm': '/body_man_leftarm.png',
    'woman-left-arm': '/body_woman_leftarm.png',
    'man-right-arm': '/body_man_rightarm.png',
    'woman-right-arm': '/body_woman_rightarm.png',
    'man-left-leg': '/body_man_leftleg.png',
    'woman-left-leg': '/body_woman_leftleg.png',
    'man-right-leg': '/body_man_rightleg.png',
    'woman-right-leg': '/body_woman_rightleg.png'
  };

  const [bodyImage] = useImage(imageMap[`${gender}${view === 'full-body' ? '' : '-' + view}`]);

  const eraseAtPoint = (pos) => {
    const radiusSq = eraserRadius * eraserRadius;
    const updatedDrawings = [];

    for (const d of drawings) {
      if (d.type === 'pencil') {
        const oldPts = d.data.points;
        let currentSegment = [];

        for (let i = 0; i < oldPts.length; i += 2) {
          const x = oldPts[i];
          const y = oldPts[i + 1];
          const dx = x - pos.x;
          const dy = y - pos.y;
          const inside = dx * dx + dy * dy < radiusSq;

          if (!inside) {
            currentSegment.push(x, y);
          } else if (currentSegment.length >= 4) {
            updatedDrawings.push({
              type: 'pencil',
              data: { stroke: d.data.stroke, points: currentSegment }
            });
            currentSegment = [];
          } else {
            currentSegment = [];
          }
        }

        if (currentSegment.length >= 4) {
          updatedDrawings.push({
            type: 'pencil',
            data: { stroke: d.data.stroke, points: currentSegment }
          });
        }

      } else if (d.type === 'shape') {
        const dx = d.data.x - pos.x;
        const dy = d.data.y - pos.y;
        if (dx * dx + dy * dy > radiusSq) {
          updatedDrawings.push(d);
        }
      } else if (d.type === 'arrow') {
        const midX = (d.data.start.x + d.data.end.x) / 2;
        const midY = (d.data.start.y + d.data.end.y) / 2;
        const dx = midX - pos.x;
        const dy = midY - pos.y;
        if (dx * dx + dy * dy > radiusSq) {
          updatedDrawings.push(d);
        }
      } else {
        updatedDrawings.push(d);
      }
    }
    setDrawings(updatedDrawings);
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (zoomMode) return;

    if (tool === 'eraser') {
      isErasing.current = true;
      eraseAtPoint(pos);
    } else if (tool === 'pencil') {
      isDrawing.current = true;
      setDrawings([
        ...drawings,
        {
          type: 'pencil',
          data: {
            points: [pos.x, pos.y],
            stroke: color,
          },
        },
      ]);
    } else if (tool === 'arrow') {
      arrowStart.current = pos;
    } else {
      const { size, color } = shapeConfigs[tool] || {};
      setDrawings([...drawings, {
        type: 'shape',
        data: { tool, x: pos.x, y: pos.y, size, color }
      }]);
    }
  };

  const handleMouseMove = (e) => {
    const point = e.target.getStage().getPointerPosition();

    if (tool === 'eraser' && isErasing.current) {
      eraseAtPoint(point);
      return;
    }

    if (tool === 'pencil' && isDrawing.current) {
      const last = drawings[drawings.length - 1];
      if (last?.type === 'pencil') {
        const updated = {
          ...last,
          data: {
            ...last.data,
            points: [...last.data.points, point.x, point.y]
          }
        };
        setDrawings([...drawings.slice(0, -1), updated]);
      }
    } else if (tool === 'arrow' && arrowStart.current) {
      setCurrentArrow({
        start: arrowStart.current,
        end: point,
        stroke: color,
      });
    }
  };

  const handleMouseUp = (e) => {
    if (tool === 'eraser') {
      isErasing.current = false;
    } else if (tool === 'pencil') {
      isDrawing.current = false;
    } else if (tool === 'arrow' && arrowStart.current) {
      const end = e.target.getStage().getPointerPosition();
      setDrawings([...drawings, {
        type: 'arrow',
        data: { start: arrowStart.current, end, stroke: color },
      }]);
      arrowStart.current = null;
      setCurrentArrow(null);
    }
  };

  const handleZoomSelect = (part) => {
    saveCurrentViewDrawings();
    const nextKey = `${gender}-${part}`;
    setDrawings(savedDrawings[nextKey] || []);
    setZoomMode(false);
    setView(part);
  };

  const handleResetView = () => {
    saveCurrentViewDrawings();
    const nextKey = `${gender}-full-body`;
    setDrawings(savedDrawings[nextKey] || []);
    setZoomMode(false);
    setView('full-body');
  };

  const handleDownload = async () => {
    saveCurrentViewDrawings(); // Save current view
    
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [600, 912] });
    
    // [... existing PDF generation code ...]
    
    // Generate the filename
    const fileName = `${gender}-pain-diagram.pdf`;
    
    // Get PDF data as base64 string
    const pdfBase64 = pdf.output('datauristring');
    
    // Calculate file size
    const pdfOutput = pdf.output('arraybuffer');
    const fileSizeInBytes = pdfOutput.byteLength;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
    
    try {
      // Create a message with all necessary file data
      const messageData = {
        type: 'PAIN_DIAGRAM_PDF',
        fileName: fileName,
        fileSize: fileSizeInKB,
        fileData: pdfBase64 // Send the full base64 data
      };
      
      // Post message to parent window (GHL)
      window.parent.postMessage(messageData, '*');
      console.log(`Sent PDF data to GHL with file name: ${fileName}`);
      
      // Also save the PDF file as normal
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF for GHL:', error);
      // Fall back to just saving the PDF
      pdf.save(fileName);
    }
  };
  
  // Add this listener in your component's useEffect to confirm communication is working
  useEffect(() => {
    // Send a message that the iframe is ready
    window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
    
    // Optional: Listen for messages from the parent (GHL)
    const handleMessage = (event) => {
      // Process messages from GHL if needed
      console.log('Received message from parent:', event.data);
    };
    
    window.addEventListener('message', handleMessage);
    
    // Clean up
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);


  useEffect(() => {
    const handleResize = () => {
      setCanvasHeight(window.innerHeight);
      setCanvasWidth(window.innerHeight / 667 * 375);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (bodyImage && stageRef.current) {
      stageRef.current.batchDraw();
    }
  }, [bodyImage]);

  useEffect(() => {
    const tryFullscreen = () => {
      const el = document.documentElement;

      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => { }); // silently fail
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }

      document.removeEventListener('click', tryFullscreen);
    };

    document.addEventListener('click', tryFullscreen, { once: true });
  }, []);


  useEffect(() => {
    const resize = () => {
      setCanvasHeight(window.innerHeight);
      setCanvasWidth(window.innerHeight / 667 * 375);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const key = `${gender}-${view}`;
    setDrawings(savedDrawings[key] || []);
  }, [gender, view]);

  return (
    <div className="drawing-wrapper">
      {/* Top Buttons */}
      <div className="top-bar">
        <button className="top-left">
          <img src="/icons/more-385-128.png" alt="Shapes" className="icon-img" />
        </button>
        <button className="top-right" onClick={handleDownload}>
          <img src="/icons/download.png" alt="Shapes" className="icon-img" />
        </button>
      </div>

      <div className='canvas-container'>
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          // visible={false}
          ref={(node) => { stageRefs.current[`${gender}-${view}`] = node }}
        >
          <Layer>
            {bodyImage && (
              <KonvaImage
                image={bodyImage}
                ref={(node) => {
                  if (node && bodyImage) {
                    node.getLayer().batchDraw(); // Ensure image layer is fully drawn
                  }
                }}
                width={canvasWidth}
                height={canvasHeight}
                opacity={zoomMode ? 0.4 : 0.6}
              />

            )}

            {currentArrow && (
              <Arrow
                points={[
                  currentArrow.start.x,
                  currentArrow.start.y,
                  currentArrow.end.x,
                  currentArrow.end.y,
                ]}
                stroke={currentArrow.stroke}
                strokeWidth={2}
                pointerLength={10}
                pointerWidth={8}
                dash={[4, 4]} // optional: dashed line for preview
              />
            )}

            {drawings.map((item, i) => {
              const d = item.data;

              if (item.type === 'arrow') {
                const { start, end, stroke } = item.data;
                return (
                  <Arrow
                    key={i}
                    points={[start.x, start.y, end.x, end.y]}
                    stroke={stroke}
                    strokeWidth={2}
                    pointerLength={10}
                    pointerWidth={8}
                    fill={stroke}
                  />
                );
              }

              if (item.type === 'pencil' && !zoomMode) {
                const { points, stroke } = item.data;
                return (
                  <Line
                    key={i}
                    points={points}
                    stroke={stroke}
                    strokeWidth={2}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                  />
                );
              }

              if (item.type === 'eraser') {
                return (
                  <Line
                    key={i}
                    points={d.points}
                    stroke={d.stroke}
                    strokeWidth={d.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="destination-out"
                  />
                );
              }

              if (item.type === 'shape' && !zoomMode) {
                const { tool, x, y, size = 10, color = '#ff0000' } = item.data;

                switch (tool) {
                  case 'sharp-pain':
                    return (
                      <Line
                        key={i}
                        points={[x, y - size, x - size, y + size, x + size, y + size]}
                        closed
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  case 'dull-ache':
                    return (
                      <Ellipse
                        key={i}
                        x={x}
                        y={y}
                        radiusX={size}
                        radiusY={size}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  case 'tingling':
                    return (
                      <Rect
                        key={i}
                        x={x - size}
                        y={y - size}
                        width={size * 2}
                        height={size * 2}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  case 'numbness':
                    return (
                      <Star
                        key={i}
                        x={x}
                        y={y}
                        numPoints={5}
                        innerRadius={size / 2}
                        outerRadius={size}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  default:
                    return null;
                }
              }

              return null;
            })}

            {zoomMode && (
              <>
                <Label x={140 / 375 * canvasWidth} y={50 / 667 * canvasHeight} onClick={() => handleZoomSelect('head-neck')} onTap={() => handleZoomSelect('head-neck')} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Head & Neck" fontSize={14} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
                <Label x={140 / 375 * canvasWidth} y={130 / 667 * canvasHeight} onClick={() => handleZoomSelect('upper-body')} onTap={() => handleZoomSelect('upper-body')} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Upper Body" fontSize={14} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
                <Label x={260 / 375 * canvasWidth} y={180 / 667 * canvasHeight} onClick={() => handleZoomSelect('left-arm')} onTap={() => handleZoomSelect('left-arm')} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Left Arm" fontSize={14} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
                <Label x={30 / 375 * canvasWidth} y={180 / 667 * canvasHeight} onClick={() => handleZoomSelect('right-arm')} onTap={() => handleZoomSelect('right-arm')} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Right Arm" fontSize={14} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
                <Label x={80 / 375 * canvasWidth} y={400 / 667 * canvasHeight} onClick={() => handleZoomSelect('left-leg')} onTap={() => handleZoomSelect('left-leg')} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Left Leg" fontSize={14} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
                <Label x={210 / 375 * canvasWidth} y={400 / 667 * canvasHeight} onClick={() => handleZoomSelect('right-leg')} onTap={() => handleZoomSelect('right-leg')} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Right Leg" fontSize={14} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
                <Label x={110 / 375 * canvasWidth} y={620 / 667 * canvasHeight} onClick={() => handleResetView()} onTap={() => handleResetView()} listening={true} cursor="pointer">
                  <Tag fill="white" cornerRadius={10} shadowColor="black" shadowBlur={5} shadowOpacity={0.2} shadowOffset={{ x: 2, y: 2 }} listening={true} cursor="pointer" />
                  <Text text="Back to Full Body" fontSize={16} fontFamily="Arial" fill="#333" padding={8} {...partTextStyle} listening={true} cursor="pointer" />
                </Label>
              </>
            )}
          </Layer>
        </Stage>
      </div>

      {/* Left-side toolbar with color, shape panel, gender, zoom */}
      <div className="tool-panel left">
        {/* <button className="icon-button">
          <img src="/icons/click-2-3-512.png" alt="Shapes" className="icon-img" />
        </button> */}
        <div className="color-button-wrapper">
          <button className="color-main-button" onClick={() => setShowColorPicker(!showColorPicker)}>
            <div className="color-ring">
              <div className="inner-ring" style={{ backgroundColor: color }} />
            </div>
            <text className='tool-name'> Color Picker </text>
          </button>
          {showColorPicker && (
            <div className="color-options">
              {['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'].map((c) => (
                <div
                  key={c}
                  className="color-circle"
                  style={{ backgroundColor: c, border: color === c ? '2px solid #000' : '1px solid #aaa' }}
                  onClick={() => { setColor(c); setShowColorPicker(false); }}
                />
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowShapePanel(!showShapePanel)} className="icon-button">
          <img src="/icons/tool.png" alt="Shapes" className="icon-img" />
          <text className='tool-name'> Shapes </text>
        </button>

        {showShapePanel && (
          <div className="shape-popup">
            <button className="modal-close" onClick={() => {
              setShowShapePanel(prev => {
                const newState = !prev;
                if (!newState) setShowShapeEditor(false); // auto-close modal
                return newState;
              });
            }}>✖</button>
            <button className='optionBtn' onClick={() => {
              setTool('sharp-pain'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false); // auto-close modal
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="12,4 4,20 20,20" stroke={shapeConfigs['sharp-pain']?.color || 'red'} fill="white" strokeWidth="3" />
              </svg>
              <span>{shapeConfigs['sharp-pain'].label}</span>
            </button>

            <button className='optionBtn' onClick={() => {
              setTool('dull-ache'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false); // auto-close modal
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke={shapeConfigs['dull-ache']?.color || 'orange'} fill="white" strokeWidth="3" />
              </svg>
              <span>{shapeConfigs['dull-ache'].label}</span>
            </button>

            <button className='optionBtn' onClick={() => {
              setTool('tingling'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false); // auto-close modal
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" stroke={shapeConfigs['tingling']?.color || 'blue'} fill="white" strokeWidth="3" />
              </svg>
              <span>{shapeConfigs['tingling'].label}</span>
            </button>

            <button className='optionBtn' onClick={() => {
              setTool('numbness'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false); // auto-close modal
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon
                  stroke={shapeConfigs['numbness']?.color || 'green'}
                  fill="white"
                  strokeWidth="3"
                  points="
                    12,2
                    14.7,8.5
                    22,9.3
                    16.5,14.1
                    18.2,21.5
                    12,17.8
                    5.8,21.5
                    7.5,14.1
                    2,9.3
                    9.3,8.5
                  "
                />
              </svg>
              <span>{shapeConfigs['numbness'].label}</span>
            </button>
            <div style={{ "height": "2px", "background": "#CCC" }} />
            <button className="optionBtn" onClick={() => { setShowShapeEditor(prev => !prev); }}>
              <img src="/icons/pencil-81-512.png" alt="Shapes" className="icon-img-shape" />
              <span> Edit Shape</span>
            </button>

            {/* Edit Shape Modal */}
            {showShapeEditor && (
              <EditShapeModal
                tool={tool}
                config={shapeConfigs[tool]} // ✅ pass shape-specific config
                onUpdate={(newConfig) => updateShapeConfig(tool, newConfig)} // ✅ hook to update specific shape
                onClose={() => setShowShapeEditor(false)}
              />
            )}

          </div>
        )}

        <button onClick={() => {
          if (isBack === 0) {
            setBack(1);
            handleZoomSelect('back');
          } else {
            setBack(0);
            handleZoomSelect('full-body');
          }
        }}>
          <img src="/icons/refresh-109-512.png" alt="Shapes" className="icon-img" />
          <text className='tool-name'> Front / Back </text>
        </button>

        {/* Gender Selection (Always Visible) */}
        <div className="gender-toggle-row">
          <button
            className={`gender-btn ${gender === 'man' ? 'selected' : ''}`}
            onClick={() => {
              saveCurrentViewDrawings();
              const nextKey = `man-${view}`;
              setGender('man');
              setDrawings(savedDrawings[nextKey] || []);
            }}
          >
            <img src="/icons/male-21-512.png" alt="Male" className="icon-img" />
            <text className='tool-name'> Male </text>
          </button>
          <button
            className={`gender-btn ${gender === 'woman' ? 'selected' : ''}`}
            onClick={() => {
              saveCurrentViewDrawings();
              const nextKey = `woman-${view}`;
              setGender('woman');
              setDrawings(savedDrawings[nextKey] || []);
            }}
          >
            <img src="/icons/female-28-512.png" alt="Female" className="icon-img" />
            <text className='tool-name'> Female </text>
          </button>
        </div>
      </div>

      {/* Right-side tools (pencil, undo, clear) */}
      <div className="tool-panel right">
        <button onClick={() => setDrawings(drawings.slice(0, -1))}>
          <img src="/icons/reset-16-128.png" alt="Shapes" className="icon-img" />
          <text className='tool-name'> Undo </text>
        </button>
        <button
          onClick={() => setTool('arrow')}
          className={`icon-button ${tool === 'arrow' ? 'selected' : ''}`}
        >
          <img src="/icons/arrow1.png" alt="Arrow" className="icon-img" />
          <text className='tool-name'> Arrow </text>
        </button>

        <button
          onClick={() => setTool('pencil')}
          className={`icon-button ${tool === 'pencil' ? 'selected' : ''}`}
        >
          <img src="/icons/pencil-81-512.png" alt="Pencil" className="icon-img" />
          <text className='tool-name'> Pencil </text>
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`icon-button ${tool === 'eraser' ? 'selected' : ''}`}
        >
          <img src="/icons/eraser.png" alt="Eraser" className="icon-img" />
          <text className='tool-name'> Eraser </text>
        </button>
        <button onClick={() => setZoomMode(true)}>
          <img src="/icons/zoom-in-zoom-in-512.png" alt="Shapes" className="icon-img" />
          <text className='tool-name'> Body Part </text>
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
