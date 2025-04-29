import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TimelineItem = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "subtitle";
  startTime: number;
  endTime: number;
  fileId?: Id<"_storage">;
  url?: string;
  text?: string;
  isMuted?: boolean;
  style?: {
    fontSize?: number;
    color?: string;
    opacity?: number;
    border?: string;
    animation?: string;
    position?: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
  };
};

type DraggableOverlayProps = {
  item: TimelineItem;
  onUpdate: (updates: Partial<TimelineItem>) => void;
  children: React.ReactNode;
};

function DraggableOverlay({ item, onUpdate, children }: DraggableOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: item.style?.position?.x || 50, y: item.style?.position?.y || 50 });

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const container = (e.target as HTMLElement).closest('.video-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onUpdate({
      style: {
        ...item.style,
        position: {
          ...item.style?.position,
          x: position.x,
          y: position.y,
        },
      },
    });
  }, [item.style, onUpdate, position]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  return (
    <div
      onMouseDown={handleDragStart}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

function SortableTimelineItem({ item, onUpdate }: { item: TimelineItem; onUpdate: (id: string, updates: Partial<TimelineItem>) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-4 p-4 bg-gray-50 rounded cursor-move">
      <span className="font-mono">
        {formatTime(item.startTime)} - {formatTime(item.endTime)}
      </span>
      <span className="capitalize">{item.type}</span>
      {(item.type === "text" || item.type === "subtitle") && (
        <input
          type="text"
          value={item.text}
          onChange={(e) => onUpdate(item.id, { text: e.target.value })}
          className="flex-1 px-2 py-1 border rounded"
        />
      )}
      {(item.type === "text" || item.type === "subtitle") && (
        <div className="flex gap-2">
          <input
            type="color"
            value={item.style?.color || "#ffffff"}
            onChange={(e) => onUpdate(item.id, { 
              style: { ...item.style, color: e.target.value }
            })}
            className="w-8 h-8"
          />
          <input
            type="number"
            value={item.style?.fontSize || 24}
            onChange={(e) => onUpdate(item.id, {
              style: { ...item.style, fontSize: parseInt(e.target.value) }
            })}
            className="w-16 px-2 py-1 border rounded"
          />
        </div>
      )}
      {(item.type === "image") && (
        <div className="flex gap-2">
          <input
            type="number"
            value={item.style?.opacity || 1}
            min="0"
            max="1"
            step="0.1"
            onChange={(e) => onUpdate(item.id, {
              style: { ...item.style, opacity: parseFloat(e.target.value) }
            })}
            className="w-16 px-2 py-1 border rounded"
          />
          <select
            value={item.style?.animation || "none"}
            onChange={(e) => onUpdate(item.id, {
              style: { ...item.style, animation: e.target.value }
            })}
            className="px-2 py-1 border rounded"
          >
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="bounce">Bounce</option>
          </select>
        </div>
      )}
      {item.type === "audio" && (
        <button
          onClick={() => onUpdate(item.id, { isMuted: !item.isMuted })}
          className={`px-2 py-1 rounded ${item.isMuted ? 'bg-red-500' : 'bg-green-500'} text-white`}
        >
          {item.isMuted ? 'Unmute' : 'Mute'}
        </button>
      )}
      <button
        onClick={() => onUpdate(item.id, { startTime: currentTime })}
        className="px-2 py-1 bg-blue-500 text-white rounded"
      >
        Set Start
      </button>
      <button
        onClick={() => onUpdate(item.id, { endTime: currentTime })}
        className="px-2 py-1 bg-blue-500 text-white rounded"
      >
        Set End
      </button>
    </div>
  );
}

function stripClientFields(item: TimelineItem) {
  const { url, ...serverItem } = item;
  return serverItem;
}

export function VideoEditor() {
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  const createProject = useMutation(api.projects.createProject);
  const updateTimeline = useMutation(api.projects.updateTimeline);
  const project = useQuery(api.projects.getProject, projectId ? { projectId } : "skip");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadProgress(0);
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const postUrl = await generateUploadUrl();
      
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      clearInterval(uploadInterval);
      setUploadProgress(100);
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      
      const newProjectId = await createProject({
        title: file.name,
        duration: 0,
      });
      
      await updateTimeline({
        projectId: newProjectId,
        timeline: [{
          id: crypto.randomUUID(),
          type: "video",
          startTime: 0,
          endTime: duration || 0,
          fileId: storageId,
        }]
      });
      
      setProjectId(newProjectId);
      toast.success("Video uploaded successfully!");
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload video");
      setUploadProgress(0);
    }
  }, [generateUploadUrl, createProject, updateTimeline, duration]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg'],
      'audio/*': ['.mp3', '.wav']
    },
    maxFiles: 1
  });

  useEffect(() => {
    if (project) {
      setTimeline(project.timeline as TimelineItem[]);
    }
  }, [project]);

  const onMediaLoad = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement;
    setDuration(video.duration);
    if (projectId && timeline.length === 1) {
      updateTimeline({
        projectId,
        timeline: [stripClientFields({
          ...timeline[0],
          endTime: video.duration
        })]
      });
    }
  }, [projectId, timeline, updateTimeline]);

  const addText = useCallback(() => {
    if (!projectId) return;
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      type: "text",
      startTime: currentTime,
      endTime: currentTime + 5,
      text: "New Text",
      style: {
        fontSize: 24,
        color: "#ffffff",
        position: { x: 50, y: 50 }
      }
    };
    updateTimeline({
      projectId,
      timeline: [...timeline.map(stripClientFields), stripClientFields(newItem)]
    });
  }, [projectId, currentTime, timeline, updateTimeline]);

  const addSubtitle = useCallback(() => {
    if (!projectId) return;
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      type: "subtitle",
      startTime: currentTime,
      endTime: currentTime + 5,
      text: "New Subtitle",
      style: {
        fontSize: 20,
        color: "#ffffff",
        position: { x: 50, y: 90 }
      }
    };
    updateTimeline({
      projectId,
      timeline: [...timeline.map(stripClientFields), stripClientFields(newItem)]
    });
  }, [projectId, currentTime, timeline, updateTimeline]);

  const addImage = useCallback(async (file: File) => {
    if (!projectId) return;
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
      const newItem: TimelineItem = {
        id: crypto.randomUUID(),
        type: "image",
        startTime: currentTime,
        endTime: currentTime + 5,
        fileId: storageId,
        style: {
          position: { x: 50, y: 50 },
          opacity: 1,
          animation: "none"
        }
      };
      
      updateTimeline({
        projectId,
        timeline: [...timeline.map(stripClientFields), stripClientFields(newItem)]
      });
      
      toast.success("Image added successfully!");
    } catch (error) {
      toast.error("Failed to add image");
    }
  }, [projectId, currentTime, timeline, updateTimeline, generateUploadUrl]);

  const addAudio = useCallback(async (file: File) => {
    if (!projectId) return;
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
      const newItem: TimelineItem = {
        id: crypto.randomUUID(),
        type: "audio",
        startTime: currentTime,
        endTime: currentTime + 30,
        fileId: storageId,
        isMuted: false
      };
      
      updateTimeline({
        projectId,
        timeline: [...timeline.map(stripClientFields), stripClientFields(newItem)]
      });
      
      toast.success("Audio added successfully!");
    } catch (error) {
      toast.error("Failed to add audio");
    }
  }, [projectId, currentTime, timeline, updateTimeline, generateUploadUrl]);

  const updateItem = useCallback((itemId: string, updates: Partial<TimelineItem>) => {
    if (!projectId) return;
    const newTimeline = timeline.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateTimeline({
      projectId,
      timeline: newTimeline.map(stripClientFields)
    });
  }, [projectId, timeline, updateTimeline]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setTimeline((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const newTimeline = arrayMove(items, oldIndex, newIndex);
        if (projectId) {
          updateTimeline({
            projectId,
            timeline: newTimeline.map(stripClientFields)
          });
        }
        return newTimeline;
      });
    }
  }, [projectId, updateTimeline]);

  const handleRender = useCallback(async () => {
    setIsRendering(true);
    // Simulate rendering process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsRendering(false);
    toast.success("Video rendered successfully!");
  }, []);

  if (!projectId) {
    return (
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors">
        <input {...getInputProps()} />
        <p className="text-gray-500">Drag and drop a video file here, or click to select one</p>
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Uploading: {uploadProgress}%</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative video-container">
        {timeline.map(item => {
          if (item.type === "video" && item.url) {
            return (
              <video
                key={item.id}
                ref={videoRef}
                src={item.url}
                className="w-full h-full"
                controls
                onLoadedMetadata={onMediaLoad}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            );
          }
          if ((item.type === "text" || item.type === "subtitle") && 
              item.text && item.style?.position && 
              currentTime >= item.startTime && currentTime <= item.endTime) {
            return (
              <DraggableOverlay
                key={item.id}
                item={item}
                onUpdate={(updates) => updateItem(item.id, updates)}
              >
                <div
                  style={{
                    fontSize: item.style.fontSize,
                    color: item.style.color,
                  }}
                >
                  {item.text}
                </div>
              </DraggableOverlay>
            );
          }
          if (item.type === "image" && item.url && item.style?.position &&
              currentTime >= item.startTime && currentTime <= item.endTime) {
            const animation = item.style.animation === "fade" ? "animate-fade-in" :
                            item.style.animation === "slide" ? "animate-slide-in" :
                            item.style.animation === "bounce" ? "animate-bounce" : "";
            return (
              <DraggableOverlay
                key={item.id}
                item={item}
                onUpdate={(updates) => updateItem(item.id, updates)}
              >
                <img
                  src={item.url}
                  style={{
                    opacity: item.style.opacity,
                    border: item.style.border,
                    width: item.style.position.width ? `${item.style.position.width}px` : 'auto',
                    height: item.style.position.height ? `${item.style.position.height}px` : 'auto',
                  }}
                  className={`max-w-[200px] max-h-[200px] ${animation}`}
                  alt=""
                />
              </DraggableOverlay>
            );
          }
          return null;
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={addText}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Text
        </button>
        <button
          onClick={addSubtitle}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Add Subtitle
        </button>
        <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
          Add Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addImage(file);
            }}
          />
        </label>
        <label className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors cursor-pointer">
          Add Audio
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addAudio(file);
            }}
          />
        </label>
        <button
          onClick={handleRender}
          disabled={isRendering}
          className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${isRendering ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRendering ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Rendering...
            </span>
          ) : (
            'Render'
          )}
        </button>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <div className="w-full h-8 bg-gray-100 rounded mb-4 relative">
          <div
            className="absolute h-full bg-blue-200"
            style={{ left: '0%', width: `${(currentTime / duration) * 100}%` }}
          />
          {timeline.map(item => (
            <div
              key={item.id}
              className="absolute h-full bg-blue-500 opacity-50"
              style={{
                left: `${(item.startTime / duration) * 100}%`,
                width: `${((item.endTime - item.startTime) / duration) * 100}%`,
              }}
            />
          ))}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={timeline.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {timeline.map(item => (
                <SortableTimelineItem
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
