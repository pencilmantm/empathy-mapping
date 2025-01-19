import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import html2canvas from 'html2canvas';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [components, setComponents] = React.useState([]);
  const [inputText, setInputText] = React.useState('');
  const [droppedItems, setDroppedItems] = React.useState({
    says: [],
    thinks: [],
    does: [],
    feels: []
  });
  const [userName, setUserName] = React.useState('ENTER NAME');
  const [isEditingName, setIsEditingName] = React.useState(false);
  const captureRef = React.useRef(null);

  const colors = [
    '#bfdbfe', '#bbf7d0', '#fecaca', '#fed7aa',
    '#e9d5ff', '#fde68a', '#ddd6fe', '#99f6e4',
  ];

  const addComponent = () => {
    if (inputText.trim()) {
      const colorIndex = components.length % colors.length;
      setComponents([
        ...components,
        {
          id: Date.now(),
          text: inputText,
          color: colors[colorIndex],
        },
      ]);
      setInputText('');
    }
  };

  const deleteComponent = (id, quadrant = null) => {
    if (quadrant) {
      setDroppedItems(prev => ({
        ...prev,
        [quadrant]: prev[quadrant].filter(item => item.id !== id)
      }));
    } else {
      setComponents(components.filter((comp) => comp.id !== id));
    }
  };

  const captureScreen = async () => {
    const loadingToast = toast.loading('Capturing screenshot...');
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#f3f4f6',
        scale: window.devicePixelRatio
      });
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        toast.success('Screenshot copied to clipboard!');
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to capture screenshot');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Draggable Component
  const DraggableNote = ({ note, quadrant = null }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'NOTE',
      item: { ...note, fromQuadrant: quadrant },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          padding: '12px',
          backgroundColor: note.color,
          borderRadius: '4px',
          cursor: 'move',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: '4px',
          width: 'fit-content',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{note.text}</span>
          <button
            onClick={() => deleteComponent(note.id, quadrant)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Droppable Quadrant
  const DroppableQuadrant = ({ title, items, quadrantId }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'NOTE',
      drop: (item) => {
        if (item.fromQuadrant) {
          // Remove from old quadrant
          setDroppedItems(prev => ({
            ...prev,
            [item.fromQuadrant]: prev[item.fromQuadrant].filter(i => i.id !== item.id)
          }));
        } else {
          // Remove from components if it's a new drag
          setComponents(prev => prev.filter(comp => comp.id !== item.id));
        }
        // Add to new quadrant
        setDroppedItems(prev => ({
          ...prev,
          [quadrantId]: [...prev[quadrantId], item]
        }));
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }), [quadrantId]);

    return (
      <div
        ref={drop}
        style={{
          padding: '20px',
          backgroundColor: isOver ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => (
            <DraggableNote key={item.id} note={item} quadrant={quadrantId} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container" style={{ padding: '40px' }}>
        <Toaster position="top-right" />

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addComponent()}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '200px',
            }}
            placeholder="Add note for empathy map"
          />
          <button
            onClick={addComponent}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Note
          </button>
          <button
            onClick={captureScreen}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            📸 Capture Empathy Map
          </button>
        </div>

        {/* Note Pool */}
        <div
          style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {components.map((note) => (
            <DraggableNote key={note.id} note={note} />
          ))}
        </div>

        {/* Empathy Map */}
        <div
          className="empathy-map-container"
          ref={captureRef}
          style={{
            position: 'relative',
            width: '800px',
            height: '800px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            margin: 'auto',
            backgroundColor: '#f9fafb',
          }}
        >
          {/* Grid layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '1fr 1fr',
              gridTemplateColumns: '1fr 1fr',
              width: '100%',
              height: '100%',
            }}
          >
            <div style={{ borderRight: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>
              <DroppableQuadrant title="SAYS" items={droppedItems.says} quadrantId="says" />
            </div>
            <div style={{ borderBottom: '1px solid #ccc' }}>
              <DroppableQuadrant title="THINKS" items={droppedItems.thinks} quadrantId="thinks" />
            </div>
            <div style={{ borderRight: '1px solid #ccc' }}>
              <DroppableQuadrant title="DOES" items={droppedItems.does} quadrantId="does" />
            </div>
            <div>
              <DroppableQuadrant title="FEELS" items={droppedItems.feels} quadrantId="feels" />
            </div>
          </div>

          {/* Center circle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120px',
              height: '120px',
              backgroundColor: 'white',
              border: '2px solid #ccc',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              zIndex: 2,
              cursor: 'pointer',
            }}
            onClick={() => !isEditingName && setIsEditingName(true)}
          >
            {isEditingName ? (
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                style={{
                  width: '90px',
                  textAlign: 'center',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
              />
            ) : (
              <span>{userName}</span>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;