// Drag and Drop functionality for QFQA
// Handles dragging floating tasks to schedule slots

export interface DragData {
  type: 'floating-task';
  task: any;
}

export interface DropZone {
  hour: number;
  accepts: string[];
  onDrop: (data: DragData) => void;
}

let currentDragData: DragData | null = null;

export function handleDragStart(event: DragEvent, data: DragData): void {
  if (!event.dataTransfer) return;
  
  currentDragData = data;
  
  // Set drag effect and data
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/json', JSON.stringify(data));
  
  // Add visual feedback
  const dragElement = event.target as HTMLElement;
  if (dragElement) {
    dragElement.style.opacity = '0.5';
    dragElement.classList.add('dragging');
  }
}

export function handleDragEnd(event: DragEvent): void {
  currentDragData = null;
  
  // Remove visual feedback
  const dragElement = event.target as HTMLElement;
  if (dragElement) {
    dragElement.style.opacity = '1';
    dragElement.classList.remove('dragging');
  }
  
  // Clean up drop zones
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
  });
}

export function handleDragOver(event: DragEvent, zone: DropZone): void {
  event.preventDefault();
  
  if (!currentDragData || !zone.accepts.includes(currentDragData.type)) {
    return;
  }
  
  // Set drop effect
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

export function handleDragEnter(event: DragEvent, zone: DropZone): void {
  event.preventDefault();
  
  const dropElement = event.currentTarget as HTMLElement;
  if (!dropElement) return;
  
  dropElement.classList.add('drag-over');
  
  if (currentDragData && zone.accepts.includes(currentDragData.type)) {
    // Check if task energy matches current time constraints
    const isValidDrop = validateDrop(currentDragData, zone);
    dropElement.classList.add(isValidDrop ? 'valid-drop' : 'invalid-drop');
  }
}

export function handleDragLeave(event: DragEvent): void {
  const dropElement = event.currentTarget as HTMLElement;
  if (!dropElement) return;
  
  // Only remove classes if we're actually leaving the element
  const rect = dropElement.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dropElement.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
  }
}

export function handleDrop(event: DragEvent, zone: DropZone): void {
  event.preventDefault();
  
  const dropElement = event.currentTarget as HTMLElement;
  if (dropElement) {
    dropElement.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
  }
  
  try {
    const dataString = event.dataTransfer?.getData('application/json');
    if (!dataString) return;
    
    const data: DragData = JSON.parse(dataString);
    
    if (zone.accepts.includes(data.type)) {
      zone.onDrop(data);
    }
  } catch (error) {
    console.error('Error handling drop:', error);
  }
}

function validateDrop(dragData: DragData, zone: DropZone): boolean {
  if (dragData.type !== 'floating-task') return false;
  
  const task = dragData.task;
  const hour = zone.hour;
  
  // Basic validation rules
  // You could extend this with more sophisticated validation
  // based on neurotype, energy levels, conflicts, etc.
  
  // Check if it's a reasonable hour for the task
  if (task.energy_cost > 8 && (hour < 6 || hour > 20)) {
    return false; // High energy tasks should be during day hours
  }
  
  if (task.energy_cost < 4 && hour > 6 && hour < 22) {
    return true; // Low energy tasks can be scheduled anytime during waking hours
  }
  
  return true; // Default to valid
}

// Neurotype-specific drag behavior
export function getNeuroTypeDragBehavior(neurotype: string) {
  switch (neurotype) {
    case 'TDAH':
      return {
        // TDAH users might benefit from immediate visual feedback
        highlightCompatibleSlots: true,
        showEnergyWarnings: true,
        autoSuggestOptimalTime: false
      };
      
    case 'Autiste':
      return {
        // Autistic users might prefer predictable behavior
        highlightCompatibleSlots: false,
        showEnergyWarnings: true,
        autoSuggestOptimalTime: true
      };
      
    case 'Les deux':
      return {
        // Balanced approach
        highlightCompatibleSlots: true,
        showEnergyWarnings: true,
        autoSuggestOptimalTime: true
      };
      
    default:
      return {
        highlightCompatibleSlots: false,
        showEnergyWarnings: false,
        autoSuggestOptimalTime: false
      };
  }
}

// Create drop zone configuration for a time slot
export function createDropZone(hour: number, onTaskDrop: (task: any, hour: number) => void): DropZone {
  return {
    hour,
    accepts: ['floating-task'],
    onDrop: (data: DragData) => {
      if (data.type === 'floating-task') {
        onTaskDrop(data.task, hour);
      }
    }
  };
}

// Helper function to add all drag and drop event listeners to an element
export function makeDraggable(element: HTMLElement, data: DragData): void {
  element.draggable = true;
  
  element.addEventListener('dragstart', (e) => handleDragStart(e, data));
  element.addEventListener('dragend', handleDragEnd);
}

export function makeDropZone(element: HTMLElement, zone: DropZone): void {
  element.classList.add('drop-zone');
  
  element.addEventListener('dragover', (e) => handleDragOver(e, zone));
  element.addEventListener('dragenter', (e) => handleDragEnter(e, zone));
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('drop', (e) => handleDrop(e, zone));
}