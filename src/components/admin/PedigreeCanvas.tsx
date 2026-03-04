import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CatData, usePedigreeConnections, useAddConnection, useRemoveConnection, useParents, useChildren, useCats } from '@/services/convexCatService';
import { PedigreeConnection } from '@/types/pedigree';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Smartphone, Plus } from 'lucide-react';

interface PedigreeCanvasProps {
  selectedCat: CatData | null;
  onCanvasReady?: (canvas: { addCatToCanvas: (cat: CatData, position?: { x: number; y: number }) => void }) => void;
}

interface CanvasNode {
  cat: CatData;
  x: number;
  y: number;
  id: string;
}

const PedigreeCanvas = ({ selectedCat, onCanvasReady }: PedigreeCanvasProps) => {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'father' | 'mother' | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<CatData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Mobile detection
  const { isMobile, screenSize } = useMobileDetection();

  // Convex hooks
  const connectionsData = usePedigreeConnections();
  const connections = useMemo(() => connectionsData || [], [connectionsData]);
  const addConnection = useAddConnection();
  const removeConnection = useRemoveConnection();
  const allCatsData = useCats();
  const allCats = useMemo(() => allCatsData || [], [allCatsData]);

  const { startDrag, setContainer, isDragging } = useDragAndDrop({
    constrainToParent: true,
    snapToGrid: { x: 10, y: 10 },
    onDragStart: (item) => {
      // Visual feedback when drag starts
      console.log('Drag started for:', item.id);
    },
    onDragMove: (item, position) => {
      // Update node position in state
      setNodes(prev => prev.map(node => 
        node.id === item.id ? { ...node, x: position.x, y: position.y } : node
      ));
    },
    onDragEnd: (item, position) => {
      // Final position update
      setNodes(prev => prev.map(node => 
        node.id === item.id ? { ...node, x: position.x, y: position.y } : node
      ));
    }
  });

  useEffect(() => {
    setContainer(canvasRef.current);
  }, [setContainer]);

  const loadPedigreeForCat = useCallback(async (cat: CatData) => {
    // Clear existing nodes
    setNodes([]);
    
    // Add the main cat in the center
    const mainNode: CanvasNode = {
      cat,
      x: 300,
      y: 200,
      id: cat._id
    };
    
    const newNodes: CanvasNode[] = [mainNode];

    // Load parents if they exist
    try {
      const parentConnections = connections.filter(conn => conn.childId === cat._id);
      
      for (const connection of parentConnections) {
        const parentCat = allCats.find(c => c._id === connection.parentId);
        if (parentCat) {
          const parentNode: CanvasNode = {
            cat: parentCat,
            x: connection.type === 'father' ? 500 : 100, // Father on right, mother on left
            y: 50, // Parents above the main cat
            id: parentCat._id
          };
          newNodes.push(parentNode);
        }
      }
    } catch (error) {
      console.error('Error loading parents:', error);
    }
    
    setNodes(newNodes);
  }, [connections, allCats]);

  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.preventDefault();
    
    if (isConnecting) {
      handleConnectionClick(node.cat);
      return;
    }

    // Disable drag and drop on mobile devices
    if (!isMobile) {
      startDrag(e.currentTarget as HTMLElement, node.id, node.x, node.y, e.nativeEvent);
    }
  };

  const handleConnectionClick = async (cat: CatData) => {
    if (isConnecting && connectingFrom && connectingFrom._id !== cat._id && connectionMode) {
      // Validate: prevent self-parenting
      if (connectingFrom._id === cat._id) {
        toast({
          title: "Невалидна връзка",
          description: "Котка не може да бъде родител на себе си!",
          variant: "destructive"
        });
        cancelConnection();
        return;
      }

      // Validate gender - fathers must be male, mothers must be female
      if (connectionMode === 'father' && connectingFrom.gender !== 'male') {
        toast({
          title: "Невалидна връзка",
          description: `${connectingFrom.name} не може да бъде баща - не е мъжки!`,
          variant: "destructive"
        });
        cancelConnection();
        return;
      }
      
      if (connectionMode === 'mother' && connectingFrom.gender !== 'female') {
        toast({
          title: "Невалидна връзка",
          description: `${connectingFrom.name} не може да бъде майка - не е женски!`,
          variant: "destructive"
        });
        cancelConnection();
        return;
      }

      // Validate connection - prevent circular relationships
      if (wouldCreateCircularRelationship(connectingFrom._id, cat._id)) {
        toast({
          title: "Невалидна връзка",
          description: "Не можете да създадете кръгова връзка в родословието!",
          variant: "destructive"
        });
        cancelConnection();
        return;
      }

      // Validate age logic using birth dates instead of age strings
      const validateAgeLogic = (parent: CatData, child: CatData): boolean => {
        if (!parent.birthDate || !child.birthDate) return true; // Skip if no birth dates
        
        const parentBirth = new Date(parent.birthDate);
        const childBirth = new Date(child.birthDate);
        
        // Parent should be born before child
        if (parentBirth >= childBirth) {
          return false;
        }
        
        // Calculate age difference in months
        const ageMonths = (childBirth.getTime() - parentBirth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        
        // Parent should be at least 6 months old when child is born (minimum breeding age)
        return ageMonths >= 6;
      };

      if (!validateAgeLogic(connectingFrom, cat)) {
        if (!confirm(`Възрастовата логика изглежда неправилна: ${connectingFrom.name} (${connectingFrom.birthDate}) → ${cat.name} (${cat.birthDate}). Продължете?`)) {
          return;
        }
      }

      try {
        // Create connection using Convex mutation
        await addConnection({
          parentId: connectingFrom._id,
          childId: cat._id,
          type: connectionMode
        });
        
        toast({
          title: "Връзка създадена",
          description: `${connectingFrom.name} е свързан като ${connectionMode === 'father' ? 'баща' : 'майка'} на ${cat.name}`,
          variant: "default"
        });
        
        setIsConnecting(false);
        setConnectingFrom(null);
        setConnectionMode(null);
      } catch (error) {
        toast({
          title: "Грешка",
          description: "Не можа да се създаде връзката",
          variant: "destructive"
        });
      }
    } else if (!isConnecting) {
      // This shouldn't happen, but just in case
      setIsConnecting(false);
      setConnectingFrom(null);
      setConnectionMode(null);
    }
  };

  const wouldCreateCircularRelationship = (parentId: string, childId: string): boolean => {
    // This is a simplified check - in a real implementation, you'd need to 
    // traverse the connections to detect cycles
    // For now, we'll just check direct parent-child relationships
    const isDirectChild = connections.some(conn => 
      conn.parentId === childId && conn.childId === parentId
    );
    return isDirectChild;
  };

  const startConnection = (cat: CatData, type: 'father' | 'mother') => {
    setIsConnecting(true);
    setConnectingFrom(cat);
    setConnectionMode(type);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const cancelConnection = () => {
    setIsConnecting(false);
    setConnectingFrom(null);
    setConnectionMode(null);
  };

  const addCatToCanvas = useCallback((cat: CatData, position?: { x: number; y: number }) => {
    // Check if cat is already on canvas
    if (nodes.some(node => node.cat._id === cat._id)) {
      // Show visual feedback that cat is already on canvas
      const existingNode = nodes.find(node => node.cat._id === cat._id);
      if (existingNode) {
        // Briefly highlight the existing cat
        const element = document.querySelector(`[data-cat-id="${cat._id}"]`);
        if (element) {
          element.classList.add('animate-bounce');
          setTimeout(() => {
            element.classList.remove('animate-bounce');
          }, 1000);
        }
      }
      toast({
        title: "Котката вече е добавена",
        description: `${cat.name} вече е на canvas-а`,
        variant: "default"
      });
      return;
    }

    const newNode: CanvasNode = {
      cat,
      x: position?.x || Math.random() * 400 + 100,
      y: position?.y || Math.random() * 300 + 100,
      id: cat._id
    };

    setNodes(prev => [...prev, newNode]);
    toast({
      title: "Котка добавена",
      description: `${cat.name} е добавена на canvas-а`,
      variant: "default"
    });
  }, [nodes, toast]);

  // Filter cats for search
  const filteredCats = allCats.filter(cat =>
    cat.name.toLowerCase().includes(catSearchQuery.toLowerCase()) &&
    !nodes.some(node => node.cat._id === cat._id)
  );

  // Mobile-specific helper to add cat from modal
  const handleAddCatFromModal = (cat: CatData) => {
    addCatToCanvas(cat);
    setIsAddCatModalOpen(false);
    setCatSearchQuery('');
  };

  const removeCatFromCanvas = (catId: string) => {
    const removedCat = nodes.find(node => node.cat._id === catId);
    
    // Clean up connection state if this cat was being used for connections
    if (isConnecting && connectingFrom?._id === catId) {
      cancelConnection();
    }
    
    setNodes(prev => prev.filter(node => node.cat._id !== catId));
    
    // Remove related connections
    const connectionsToRemove = connections.filter(conn => 
      conn.parentId === catId || conn.childId === catId
    );
    
    connectionsToRemove.forEach(async (conn) => {
      try {
        await removeConnection({ connectionId: conn._id });
      } catch (error) {
        console.error('Failed to remove connection:', error);
      }
    });
    
    if (removedCat) {
      toast({
        title: "Котка премахната",
        description: `${removedCat.cat.name} е премахната от canvas-а`,
        variant: "default"
      });
    }
  };

  const renderConnections = () => {
    const connectionElements = connections.map(conn => {
      const parentNode = nodes.find(n => n.cat._id === conn.parentId);
      const childNode = nodes.find(n => n.cat._id === conn.childId);
      
      if (!parentNode || !childNode) return null;

      const x1 = parentNode.x + 70; // Center of parent node
      const y1 = parentNode.y + 70;
      const x2 = childNode.x + 70; // Center of child node
      const y2 = childNode.y + 70;

      return (
        <g key={conn._id}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={conn.type === 'father' ? '#3b82f6' : '#ec4899'}
            strokeWidth="3"
            strokeDasharray="5,5"
            className="transition-all duration-200"
          />
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 15}
            textAnchor="middle"
            fontSize="12"
            fill={conn.type === 'father' ? '#3b82f6' : '#ec4899'}
            className="font-medium"
          >
            {conn.type === 'father' ? 'Баща' : 'Майка'}
          </text>
          <circle
            cx={(x1 + x2) / 2}
            cy={(y1 + y2) / 2}
            r="12"
            fill="white"
            stroke={conn.type === 'father' ? '#3b82f6' : '#ec4899'}
            strokeWidth="2"
            className="cursor-pointer hover:fill-red-50 transition-colors"
            style={{ pointerEvents: 'all' }}
            onClick={async () => {
              try {
                await removeConnection({ connectionId: conn._id });
                toast({
                  title: "Връзка премахната",
                  description: "Родителската връзка е премахната",
                  variant: "default"
                });
              } catch (error) {
                toast({
                  title: "Грешка",
                  description: "Не можа да се премахне връзката",
                  variant: "destructive"
                });
              }
            }}
          />
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 + 5}
            textAnchor="middle"
            fontSize="16"
            fill="red"
            className="cursor-pointer font-bold"
            style={{ pointerEvents: 'all' }}
            onClick={async () => {
              try {
                await removeConnection({ connectionId: conn._id });
                toast({
                  title: "Връзка премахната",
                  description: "Родителската връзка е премахната",
                  variant: "default"
                });
              } catch (error) {
                toast({
                  title: "Грешка",
                  description: "Не можа да се премахне връзката",
                  variant: "destructive"
                });
              }
            }}
          >
            ×
          </text>
        </g>
      );
    });

    // Add connection preview arrow when connecting
    if (isConnecting && connectingFrom) {
      const sourceNode = nodes.find(n => n.cat._id === connectingFrom._id);
      if (sourceNode) {
        const x1 = sourceNode.x + 70;
        const y1 = sourceNode.y + 70;
        const x2 = cursorPosition.x;
        const y2 = cursorPosition.y;
        
        connectionElements.push(
          <g key="connection-preview">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={connectionMode === 'father' ? '#3b82f6' : '#ec4899'}
                />
              </marker>
            </defs>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={connectionMode === 'father' ? '#3b82f6' : '#ec4899'}
              strokeWidth="3"
              strokeDasharray="8,4"
              className="animate-pulse"
              markerEnd="url(#arrowhead)"
            />
            <text
              x={x1 + (x2 - x1) * 0.3}
              y={y1 + (y2 - y1) * 0.3 - 10}
              textAnchor="middle"
              fontSize="12"
              fill={connectionMode === 'father' ? '#3b82f6' : '#ec4899'}
              className="font-medium animate-pulse"
            >
              {connectionMode === 'father' ? 'Баща' : 'Майка'}
            </text>
          </g>
        );
      }
    }

    return connectionElements;
  };

  // Auto-load pedigree when a cat is selected
  useEffect(() => {
    if (selectedCat && connections && allCats) {
      loadPedigreeForCat(selectedCat);
    }
  }, [selectedCat, connections, allCats, loadPedigreeForCat]);

  // Expose canvas methods to parent
  useEffect(() => {
    onCanvasReady?.({ addCatToCanvas });
  }, [onCanvasReady, addCatToCanvas]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnecting) {
        cancelConnection();
      }
      if (e.key === 'c' && e.ctrlKey && nodes.length > 0) {
        e.preventDefault();
        if (confirm('Сигурни ли сте, че искате да изчистите цялото родословие?')) {
          // Cancel any active connections
          if (isConnecting) {
            cancelConnection();
          }
          
          setNodes([]);
          
          // Bulk remove connections
          const connectionsToRemove = [...connections];
          connectionsToRemove.forEach(async (conn) => {
            try {
              await removeConnection({ connectionId: conn._id });
            } catch (error) {
              console.error('Failed to remove connection:', error);
            }
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isConnecting, nodes.length, connections, removeConnection]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <h2 className="font-playfair text-xl font-semibold">Pedigree Canvas</h2>
          {isMobile && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              <Smartphone className="w-3 h-3" />
              Мобилен режим
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isMobile && (
            <Dialog open={isAddCatModalOpen} onOpenChange={setIsAddCatModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700 text-sm px-3 py-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добави котка
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавяне на котка към родословието</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Търсене на котка..."
                      value={catSearchQuery}
                      onChange={(e) => setCatSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredCats.map((cat) => (
                        <div
                          key={cat._id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleAddCatFromModal(cat)}
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={cat.image || '/british-herosection.jpg'}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{cat.name}</p>
                            <p className="text-sm text-gray-500">
                              {cat.gender === 'male' ? '♂' : '♀'} {cat.age}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {filteredCats.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>Няма намерени котки</p>
                          {catSearchQuery && (
                            <p className="text-sm">Опитайте различен термин за търсене</p>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {isConnecting && (
            <Button
              onClick={cancelConnection}
              className="px-3 py-1 bg-red-600 text-white text-sm hover:bg-red-700"
            >
              ✕ Отказ връзка
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 text-sm text-gray-600 border-b">
        <p>
          {isConnecting 
            ? `🔗 Свързване от ${connectingFrom?.name} като ${connectionMode === 'father' ? 'баща' : 'майка'} - кликнете върху дете`
            : isMobile
              ? '📱 Мобилни инструкции: Използвайте "Добави котка" бутона → ♂/♀ иконите за свързване → Котките са неподвижни на мобилни устройства'
              : '💡 Инструкции: Влачете котки от лявата част → Използвайте ♂/♀ иконите за свързване → Влачете за преместване'
          }
        </p>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative bg-background overflow-hidden canvas-grid"
        style={{ minHeight: '600px' }}
        data-drop-zone="canvas"
        onMouseMove={handleCanvasMouseMove}
      >
        {/* Action Buttons - Fixed Position */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
          <Button
            onClick={() => {
              const pedigreeData = {
                nodes: nodes.map(node => ({
                  ...node.cat,
                  x: node.x,
                  y: node.y
                })),
                connections: connections
              };
              console.log('Pedigree saved:', pedigreeData);
              // Here you would typically save to a database
              toast({
                title: "Родословие запазено",
                description: `Запазени са ${nodes.length} котки и ${connections.length} връзки`,
                variant: "default"
              });
            }}
            className="bg-green-600 text-white hover:bg-green-700 shadow-lg"
            disabled={nodes.length === 0}
          >
            💾 Запази родословие
          </Button>
          
          <Button
            onClick={async () => {
              if (confirm('Сигурни ли сте, че искате да изчистите цялото родословие?')) {
                // Cancel any active connections
                if (isConnecting) {
                  cancelConnection();
                }
                
                setNodes([]);
                
                // Bulk remove connections to avoid multiple notifications
                const connectionsToRemove = [...connections];
                for (const conn of connectionsToRemove) {
                  try {
                    await removeConnection({ connectionId: conn._id });
                  } catch (error) {
                    console.error('Failed to remove connection:', error);
                  }
                }
                
                toast({
                  title: "Родословие изчистено",
                  description: "Всички котки и връзки са премахнати",
                  variant: "default"
                });
              }
            }}
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50 bg-white shadow-lg"
            disabled={nodes.length === 0}
          >
            🗑️ Изчисти родословие
          </Button>
        </div>
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {renderConnections()}
        </svg>

        {/* Cat nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            data-cat-id={node.cat._id}
            className={`absolute bg-white rounded-lg shadow-lg border-2 transition-all duration-200 z-20 canvas-node ${
              isDragging ? 'cursor-grabbing' : 
              isConnecting && connectingFrom?._id !== node.id ? 'cursor-pointer' : 
              isMobile ? 'cursor-default' : 'cursor-grab'
            } ${
              hoveredNode === node.id ? 'shadow-xl scale-105' : ''
            } ${
              connectingFrom?._id === node.id ? 'ring-4 ring-blue-500 ring-opacity-75 bg-blue-50' : 'border-gray-200'
            } ${
              isConnecting && connectingFrom?._id !== node.id ? 'hover:ring-2 hover:ring-green-400 hover:bg-green-50' : ''
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: '140px',
              height: '140px'
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className="w-full h-full p-2 flex flex-col">
              <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                <img
                  src={node.cat.image || '/british-herosection.jpg'}
                  alt={node.cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-1 text-center">
                <p className="text-xs font-semibold truncate">{node.cat.name}</p>
                <p className="text-xs text-gray-600">
                  {node.cat.gender === 'male' ? '♂' : '♀'} {node.cat.age}
                </p>
              </div>
            </div>

            {/* Connection Icons */}
            <div className="absolute -top-2 -right-2 flex gap-1">
              {!isConnecting && (
                <>
                  <button
                    className="w-7 h-7 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all duration-200 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      startConnection(node.cat, 'father');
                    }}
                    title="Свържи като баща"
                  >
                    ♂
                  </button>
                  <button
                    className="w-7 h-7 bg-pink-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-pink-600 hover:scale-110 transition-all duration-200 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      startConnection(node.cat, 'mother');
                    }}
                    title="Свържи като майка"
                  >
                    ♀
                  </button>
                </>
              )}
              {isConnecting && connectingFrom?._id === node.id && (
                <div className="w-7 h-7 bg-yellow-500 text-white rounded-full text-sm flex items-center justify-center animate-pulse shadow-lg">
                  🔗
                </div>
              )}
            </div>
            
            {/* Remove button */}
            <button
              className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                removeCatFromCanvas(node.cat._id);
              }}
              title="Премахни от canvas"
            >
              ×
            </button>
          </div>
        ))}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300">
              <p className="text-2xl mb-3">📊</p>
              <p className="text-lg mb-2 font-semibold">Празен canvas</p>
              {isMobile ? (
                <>
                  <p className="text-sm mb-1">📱 <strong>Използвайте "Добави котка"</strong> бутона горе</p>
                  <p className="text-sm mb-1">🎯 Или <strong>изберете котка</strong> за автоматично зареждане</p>
                </>
              ) : (
                <>
                  <p className="text-sm mb-1">👆 <strong>Влачете котки</strong> от лявата част</p>
                  <p className="text-sm mb-1">🎯 Или <strong>изберете котка</strong> за автоматично зареждане</p>
                </>
              )}
              <p className="text-xs text-gray-400 mt-3">Родословието ще се покаже автоматично</p>
            </div>
          </div>
        )}
        
        {/* Stats - Fixed Position */}
        <div className="absolute top-4 right-4 z-30 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-700">
          {nodes.length} котки • {connections.length} връзки
        </div>
      </div>
    </div>
  );
};

export default PedigreeCanvas;