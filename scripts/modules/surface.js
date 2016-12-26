function Surface(rune)
{
  Module.call(this,rune);
  
  this.element = null;
  this.parameters = [Rect,Color];
  this.variables  = {"layer" : "main"};

  this.layers = {};
  this.active_layer = null;
  this.render_layer = null;

  this.size = null;
  
  this.active = function(cmd)
  {
    if(cmd.rect()){
      this.resize(cmd.rect(),cmd.position());
      ronin.overlay.resize(cmd.rect());
    }
    if(cmd.color()){
      this.context().beginPath();
      this.context().rect(0, 0, this.active_layer.element.width, this.active_layer.element.height);
      this.context().fillStyle = cmd.color().hex;
      this.context().fill();
    }

    if(cmd.variable("layer")){
      var name = cmd.variable("layer").value;
      if(!this.layers[name]){
        this.add_layer(new Layer(name,this.size));
      }
      this.select_layer(this.layers[name]);
    }

  }

  this.select_layer = function(layer)
  {
    console.log("Selecting layer:"+layer.name);
    this.active_layer = layer;
  }

  this.add_layer = function(layer)
  {
    console.log("Creating layer:"+layer.name); 

    this.layers[layer.name] = layer;
    this.active_layer = layer;
    this.element.appendChild(layer.element);
    this.active_layer.resize(this.size);
  }
  
  this.passive = function(cmd)
  {
    if(cmd.rect()){
      ronin.overlay.draw(cmd.position(),cmd.rect());
    }
  }

  this.resize = function(rect, position = null)
  {
    this.size = rect;

    Object.keys(ronin.surface.layers).forEach(function (key) {
      ronin.surface.layers[key].resize(rect);
    });
    
    ronin.surface.element.width = rect.width * 2;
    ronin.surface.element.height = rect.height * 2;
    ronin.surface.element.style.marginLeft = -(rect.width/2);
    ronin.surface.element.style.marginTop = -(rect.height/2);
    ronin.surface.element.style.width = rect.width+"px";
    ronin.surface.element.style.height = rect.height+"px";
    ronin.widget.element.style.left = (window.innerWidth/2)-(rect.width/2);
    ronin.widget.element.style.top = (window.innerHeight/2)+(rect.height/2);
    ronin.widget.element.style.width = rect.width+"px";
    
    ronin.widget.update(); 
  }

  this.widget = function()
  {
    if(!this.active_layer){ return ""; }

    var s = "# "+this.size.render()+"<br />";

    Object.keys(ronin.surface.layers).forEach(function (key) {
      s += ronin.surface.layers[key].widget();
    });
    return s;
  }
  
  this.widget_cursor = function()
  {
    return "Drag";
  }

  // Layers

  this.context = function()
  {
    return this.active_layer.context();
  }

  this.merge = function()
  {
    this.render_layer = this.layers["render"];
    
    var a = [];
    Object.keys(ronin.surface.layers).forEach(function (key) {
      if(key != "render"){
        a.push(ronin.surface.layers[key]);
      }
    });
    for (i = a.length; i > 0 ; i--) {
      ronin.surface.render_layer.context().drawImage(a[i-1].context().canvas,0,0,this.size.width,this.size.height);
    }
    return this.render_layer;
  }
  
  // Cursor
  
  this.drag_from = null;
  this.drag_offset_x = 0;
  this.drag_offset_y = 0;

  this.mouse_down = function(position)
  {
    this.drag_from = ronin.position_in_window(position);
  }
  
  this.mouse_move = function(position)
  {
    if(this.drag_from === null){ return; }
    
    position = ronin.position_in_window(position);
    
    var offset_x = this.drag_from.x - position.x;
    var offset_y = this.drag_from.y - position.y;
    this.drag_offset_x -= offset_x;
    this.drag_offset_y -= offset_y;
    
    ronin.surface.element.style.marginLeft = -(this.size.width/2) + this.drag_offset_x;
    ronin.surface.element.style.marginTop = -(this.size.height/2) + this.drag_offset_y;

    ronin.element.style.backgroundPosition = ((this.drag_offset_x/8))-(window.innerWidth % 20)+"px "+((this.drag_offset_y/8)-(window.innerWidth % 20))+"px";
    ronin.widget.element.style.marginLeft = this.drag_offset_x;
    ronin.widget.element.style.marginTop = this.drag_offset_y;

    this.drag_from = new Position(position.x,position.y);
  }
  
  this.mouse_up = function(event)
  {
    this.drag_from = null;
  }
}