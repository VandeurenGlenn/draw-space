import 'fabric'
import './../node_modules/custom-drawer/custom-drawer.js'
import './../node_modules/custom-selector/src/index.js'


export default customElements.define('draw-space', class DrawSpace extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode:'open'})
    this.innerHTML = `
    <style>
    .flex {
      flex: 1;
    }
    .flex2 {
      flex: 2;
    }
    custom-selector {
      height: 100%;
      align-items: center;
      box-sizing: border-box;
    }
    i {
      padding: 4px;
      
      box-sizing: border-box;
    }
    </style>
    <custom-drawer>
      <custom-selector attr-for-selected="data-route" slot="content">
        <i class="fas fa-save" title="save drawing" data-route="save"></i>
        <span class="flex"></span>
        
        <i class="fas fa-mouse-pointer" title="select objects" data-route="select"></i>
        <i class="fas fa-arrows-alt" title="select objects" data-route="select"></i>
        <i class="fas fa-trash" title="remove selected objects" data-route="remove"></i>
        
        <span class="flex"></span>
        
        <i class="fas fa-slash" data-route="line"></i>
        <i class="fas fa-circle-notch" data-route="arc"></i>
        <i class="far fa-circle" data-route="circle"></i>
        <i class="far fa-square" data-route="rect"></i>
        
        <span class="flex2"></span>
        <i class="fas fa-object-group" title="create group from selected objects" data-route="group"></i>
        <span class="flex2"></span>
        <i class="fas fa-th" title="disable grid (freeDrawing)" data-route="disable-grid"></i>
      </custom-selector>
      
    </custom-drawer>
    
    <canvas id="draw"></canvas>`
    this.shadowRoot.innerHTML = this.template
    
    this._objectMoving = this._objectMoving.bind(this)
    this._objectClick = this._objectClick.bind(this)
    this._mouseDown = this._mouseDown.bind(this)
    this._mouseUp = this._mouseUp.bind(this)
    this._mouseMove = this._mouseMove.bind(this)
    this._onAction = this._onAction.bind(this)
    this._keyUp = this._keyUp.bind(this)
  }
  
  set _drawState(val) {
    this.setAttribute('draw-state', val)
  }
  
  get _drawState() {
    return this.getAttribute('draw-state')
  }
  
  get selector() {
    return this.querySelector('custom-selector')
  }
  
  set editMode(val) {
    if (val) this.setAttribute('edit-mode', '')
    else this.removeAttribute('edit-mode')
  }
  
  get editMode() {
    return this.hasAttribute('edit-mode')
  }
  
  set drawing(val) {
    if (val) this.setAttribute('drawing', '')
    else this.removeAttribute('drawing')
  }
  
  get drawing() {
    return this.hasAttribute('drawing')
  }
  
  set gridSize(val) {
    this.setAttribute('grid-size', val)
  }
  
  get gridSize() {
    return this.getAttribute('grid-size')
  }
  
  connectedCallback() {
     // set default states & values    
    this.freeDrawing = false
    this.drawing = false
    this._drawState = 'draw'
    this.gridSize = 15
    
    this.selector.addEventListener('selected', this._onAction)
    globalThis.addEventListener('keyup', this._keyUp)
    const script = document.createElement('script')
    script.src = 'https://kit.fontawesome.com/6478a471ce.js'
    script.crossorigin = 'anonymous'
    document.head.appendChild(script)
    
    const { width, height } = document.body.getBoundingClientRect()
    
    this.setAttribute('edit-mode', '')
    this.canvas = new fabric.Canvas('draw', { selection :true, evented: false, width, height })
    
    for (var i = 0; i < (width / this.gridSize); i++) {
      this.canvas.add(new fabric.Line([ i * this.gridSize, 0, i * this.gridSize, width], { stroke: '#ccc', selection: false, selectable: false, evented: false }));
      this.canvas.add(new fabric.Line([ 0, i * this.gridSize, width, i * this.gridSize], { stroke: '#ccc', selection: false, selectable: false, evented: false }))
    }
    this._startIndex = this.canvas._objects.length - 1
    
    this.canvas.on('object:moving', this._objectMoving)
    this.canvas.on('mouse:down', this._mouseDown)
    this.canvas.on('mouse:up', this._mouseUp)
    this.canvas.on('mouse:move', this._mouseMove)
    
    let items = localStorage.getItem('items')
    if (items) items = JSON.parse(items)
    
    if (items && items.length > 0) {
      for (const item of items) {
        const id = Math.random().toString(36).slice(-12)
        const index = this.canvas._objects.length
        let object;
        if (item.type === 'circle') {
          object = new fabric.Circle(item)          
        } else if (item.type === 'rect') {
          object = new fabric.Rect(item)
        } else if (item.type === 'line') {
          object = new fabric.Line([item.x1, item.y1, item.x2, item.y2], item)
        }
        object.id = id
        object.index = index
        this.canvas.add(object)
      }
      
    }
    
    // this.canvas.add(drawCircle(0, 0))
    // this.canvas.add(drawLine(0, 0))
  }
  
  _objectClick(o) {
    console.log(o);
  }
  
  removeActiveObjects() {
    this.canvas.getActiveObjects().forEach((item, i) => {
      this.canvas.remove(item)
    })
  }
  
  save() {
    const items = this.canvas._objects.filter(obj => obj.id ? true : false)
    localStorage.setItem('items', JSON.stringify(items))
  }
  
  cut() {
    this.copy()
    
    this.removeActiveObjects()
    
    this.canvas.renderAll()
  }
  
  copy() {
    const objects = this.canvas.getActiveObjects().reduce((p, c) => {
      c.clone(clone => p.push(clone))
      return p
    }, [])
    globalThis.inCopy = objects
  }
  
  paste() {
    for (let i of globalThis.inCopy) {
      const id = Math.random().toString(36).slice(-12)
      const index = this.canvas._objects.length
      this.canvas.add(i.set({
        left: this.mouseLocation.left,
        top: this.mouseLocation.top,
        id,
        index
      }))
    }
    this.canvas.renderAll()
  }
  _onAction() {
    this.action = this.selector.selected
    if (this.action === 'disable-grid') this.freeDrawing = !this.freeDrawing
    else if (this.action === 'group') {
      let items = this.canvas.getActiveObjects()
      const group = this._currentGroup
      items = items.map(i => this.canvas.item(i.index))
      this.removeActiveObjects()
      
      this.canvas.renderAll()
      
      this.canvas.add(new fabric.Group(items, {
        left: group.left,
        top: group.top
      }))
      
      this.action = undefined
      this._currentGroup = undefined
    } else if (this.action === 'save') {
      this.save()
    } else if (this.action === 'remove') {
      this.removeActiveObjects()
      
      this.canvas.renderAll()
    } else if (this.action === 'select') {
      this.canvas.selection = !this.canvas.selection
    } else if (this.action === 'copy') {
      this.copy()
    }
  }
  
  _objectMoving(movement) {
    if (this.freeDrawing) return
    
    movement.target.set({
      left: Math.round(movement.target.left / this.gridSize) * this.gridSize,
      top: Math.round(movement.target.top / this.gridSize) * this.gridSize
    });
  }
  
  _mouseDown(o) {
    console.log(o);
    const {e} = o
      
    if (this.action === 'save' || this.action === 'disable-grid' ||
        this.action === 'group' || this.action === 'remove'  ||
        this.action === 'select' || this.action === 'move') return;
    if (this.action) {
      if (this.canvas.selection) {
        this._selectionWasTrue = true
        this.canvas.selection = false
      } else this._selectionWasTrue = false
      
      
      this.drawing = true;
      const pointer = this.canvas.getPointer(e);
      this._currentPoints = [ pointer.x, pointer.y, pointer.x, pointer.y ];
      const id = Math.random().toString(36).slice(-12)
      const index = this.canvas._objects.length
      if (this.action === 'line') {
        this._current = new fabric.Line(this._currentPoints, {
          id,
          index,
          strokeWidth: 5,
          fill: '#555',
          stroke: '#555',
          originX: 'center',
          originY: 'center'
        });
      } else if (this.action === 'circle') {
        this._current = new fabric.Circle({
          id,
          index,
          top: this._currentPoints[1],
          left: this._currentPoints[0],
          originX: 'left',
          originY: 'top',
          radius: pointer.x-this._currentPoints[0],
          strokeWidth: 5,
          fill: '#00000000',
          stroke: '#555'
        });
      } else if (this.action === 'arc') {
        this._current = new fabric.Circle({
          id,
          index,
          top: this._currentPoints[1],
          left: this._currentPoints[0],
          originX: 'left',
          originY: 'top',
          radius: pointer.y-this._currentPoints[1],
          startAngle: 0,
          endAngle: pointer.x -this._currentPoints[0],
          strokeWidth: 5,
          fill: '#00000000',
          stroke: '#555'
        });
      } else if (this.action === 'rect') {
        this._current = new fabric.Rect({
          id,
          index,
          left: this._currentPoints[0],
          top: this._currentPoints[1],
          originX: 'left',
          originY: 'top',
          width: pointer.x-this._currentPoints[0],
          height: pointer.y-this._currentPoints[1],
          angle: 0,
          strokeWidth: 5,
          fill: '#00000000',
          stroke: '#555'
        });
      }
      this.canvas.add(this._current);
    }
    
  }
  
  _mouseMove({e}) {
    const pointer = this.canvas.getPointer(e)
    
    this.mouseLocation = {
      left: pointer.x,
      top: pointer.y
    }
    
    if (!this.drawing) return
    // const pointer = this.canvas.getPointer(e)
    if (this.action === 'line') {
      this._current.set({ x2: pointer.x, y2: pointer.y })
    } else if (this.action === 'circle') {
      this._current.set({ radius: Math.abs(this._currentPoints[0] - pointer.x) });
      // this._current.set({ radius: Math.abs(this._currentPoints[1] - pointer.y) });    
    } else if (this.action === 'rect') {
      if (this._currentPoints[0] > pointer.x){
        this._current.set({ left: Math.abs(pointer.x) });
      }
      if (this._currentPoints[1] > pointer.y){
        this._current.set({ top: Math.abs(pointer.y) });
      }
      
      this._current.set({ width: Math.abs(this._currentPoints[0] - pointer.x) });
      this._current.set({ height: Math.abs(this._currentPoints[1] - pointer.y) });
    } else if (this.action === 'arc') {
      this._current.set({ 
        radius: Math.abs(this._currentPoints[1] - pointer.y),
        endAngle: Math.abs((pointer.x -this._currentPoints[0]) / 10 + (Math.PI / 5))
      });
      // this._current.set({ radius: Math.abs(this._currentPoints[1] - pointer.y) });
    }
    
    this.canvas.renderAll()
  }
  
  _mouseUp() {
    if (this.drawing) {
      this.action = undefined
      this.drawing = false
      this.canvas.remove(this._current)
      this.canvas.add(this._current);
      
      if (this._selectionWasTrue) this.canvas.selection = true
      // this.canvas.renderAll()
    } else if (this.canvas.getActiveObjects().length > 1) {
      this._drawState = 'group'
      this._currentGroup = this.canvas.getActiveObjects()[0].group;
      this.canvas.renderAll()
    }
  }
  
  _keyUp(event) {
    console.log();
    if (event.ctrlKey)
      if (event.key === 'x') this.cut()
      else if (event.key === 'c') this.copy()
      else if (event.key === 'v') this.paste()
      else if (event.key === 's') {
        event.preventdefault()
        this.save()
      }
      
      
    console.log(event);
  }
  
  get template() {
    return `
    <style>
      :host {
        display: flex;
        position: relative;
        z-index: 100;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      ::slotted(custom-drawer) {
        width: 24px;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        transform: translateX(-110%);
      }
      :host([edit-mode]) ::slotted(custom-drawer) {
        transform: translateX(0);
        opacity: 1;
      }
      
      :host([edit-mode]) ::slotted(.canvas-container) {
        transform: translateX(24px)
      }
      :host([draw-state="draw"]) ::slotted() {
        
      }
      ::slotted(*) {
        position: absolute;
      }
    </style>
    
    <slot></slot>
    `
  }
})