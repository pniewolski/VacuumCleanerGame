class CanvasBoard {
    
    constructor(canvas,walls,holes,checkpoints) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        
        this.clean_color = "#aeb198";
        this.robot_color = "black";

        //odleglosc kola od centrum robota
        this.wheel_base = 14;
        this.robot_radius = 17;
		this.radar_range = this.robot_radius + 200;
        this.max_engine_speed = 6;
        
        //moc silnikow
        this.f = {l: 0, r: 0};
        
        //pozycja i obrot robota
        this.o = {x: 450, y: 630, a: Math.PI*1.5};
        
        //definicja scian
        this.walls = walls;
        this.holes = holes;
        this.checkpoints = checkpoints;
        
        this.isCollision = false;
        this.isHoleAlert = false;
		this.lastCollisionAngle = 0;
    }
    
    getScore() {
        let allCheckpoints = this.checkpoints.length;
        let takenCheckpoints = this.getRawPoints();
        return  takenCheckpoints+"/"+allCheckpoints;
    }
    
    getRawPoints() {
        return this.checkpoints.reduce((acc, curr) => {
            if (curr.taken) return acc + 1;
            else return acc;
        },0);     
    }

    
    calculateMove() {
        if (this.f.l == 0 && this.f.r == 0) {         //silniki wylaczone
            return;
        }
        if (this.f.l == this.f.r) {                   //ruch prosto
            let dx = this.f.l*Math.cos(this.o.a);
            let dy = this.f.l*Math.sin(this.o.a); 
            this.o = {x: this.o.x+dx, y: this.o.y+dy, a: this.o.a}; 
        } else {                                      //ruch skrecajacy
            let c = 0-((this.wheel_base*(this.f.l+this.f.r))/(this.f.l-this.f.r));
           
            let da;
            if (this.f.r > this.f.l) {
                da = Math.atan(this.f.r/(this.wheel_base+c));
            } else {
                da = -Math.atan(this.f.l/(this.wheel_base+Math.abs(c)));
            }
            
            let piv_x = this.o.x+c*Math.cos(this.o.a + Math.PI*1.5);
            let piv_y = this.o.y+c*Math.sin(this.o.a + Math.PI*1.5);
            
            let x2 = piv_x - c*Math.cos(this.o.a + Math.PI*1.5 - da);
            let y2 = piv_y - c*Math.sin(this.o.a + Math.PI*1.5 - da);                
    
            this.o = {x: x2, y: y2, a: this.o.a - da};   
        }
        this.o.a = this.o.a%(Math.PI*2);
    }
    
	getAngleToPoint(point) {
		let angle = (Math.atan2(point.y - this.o.y, point.x - this.o.x) - this.o.a) % (2*Math.PI);
		if (angle > Math.PI) {
			angle = angle - 2*Math.PI;
		} else if (angle < -Math.PI) {
			angle = angle + 2*Math.PI;
		}
		return angle;
	}
    
    checkCollisionWithWall(p1,p2,holeMode = false) {
        let distInfo =  CollistionHelper.distanceBetweenPointAndLineSegment(this.o,p1,p2);
        if (holeMode) {
            if (distInfo.dist <  this.max_engine_speed/2+1) {
                return true;
            }
            else if (this.robot_radius - distInfo.dist > 0.1) {
                this.isHoleAlert = true;
            }
        } else if (this.robot_radius - distInfo.dist > 0.1) {
            this.wallPushBack(distInfo);
            this.isCollision = true;
			this.lastCollisionAngle = this.getAngleToPoint(distInfo.pushPoint);
            return true;              
        }
        else return false;
    }
    
    checkCollisions() {
        this.isCollision = false;
    	this.walls.forEach(wallLoop => {
    		for(let n=0; n<wallLoop.length; n++) {
                let n_plus_1 = (n+1)%(wallLoop.length);			
                if (CollistionHelper.checkIfLineInRange(this.robot_radius,wallLoop[n],wallLoop[n_plus_1],this.o)) {
      			    this.checkCollisionWithWall(wallLoop[n],wallLoop[n_plus_1]);
                }
    		}
        }); 
    }
    
    checkHolesCollisions() {
        this.isHoleAlert = false;
        let holeFall = false;
        this.holes.forEach(holeLoop => {
    		for(let n=0; n<holeLoop.length; n++) {
                let n_plus_1 = (n+1)%(holeLoop.length);			
                if (CollistionHelper.checkIfLineInRange(this.robot_radius,holeLoop[n],holeLoop[n_plus_1],this.o)) {
      			    let isCollision = this.checkCollisionWithWall(holeLoop[n],holeLoop[n_plus_1],true);
                    if (isCollision) {
                        holeFall = true;
                    }
                }
    		}
        }); 
        return holeFall;
    }
    
    checkCheckpointCollision(point) {
        if ((!point.taken) && (point.x >= this.o.x-this.robot_radius) && (point.x <= this.o.x+this.robot_radius) && (point.y >= this.o.y-this.robot_radius) && (point.y <= this.o.y+this.robot_radius) && (CollistionHelper.distanceTwoPoints(this.o,point) <= this.robot_radius)) {
            point.taken = true;
            this.paint_flag(point,"green");
        }
    }
    
    checkCheckpointCollisions() {
        this.checkpoints.forEach(checkpoint => {
            this.checkCheckpointCollision(checkpoint);    
        });
    }
    
    wallPushBack(distInfo) {
        
        let newPosition = CollistionHelper.pushToDistance(distInfo.pushPoint,this.o,this.robot_radius);
        distInfo.newPos = newPosition; 
        
        this.o.x = newPosition.x;
        this.o.y = newPosition.y;
    }
    
    move() {
    	this.calculateMove();                           //obliczenie ruchu nie uwzgledniajac przeszkod                            
        this.checkCollisions();
        if (this.checkHolesCollisions()) return false;
        this.checkCheckpointCollisions();
        return true;
    }

	getRadarValue() {
		let currentMin = this.radar_range;
		let radarEndBeamPoint = {
			x: this.radar_range*Math.cos(this.o.a) + this.o.x,
			y: this.radar_range*Math.sin(this.o.a) + this.o.y,
		};
		let found = false;
    	this.walls.forEach(wallLoop => {
    		for(let n=0; n<wallLoop.length; n++) {
                let n_plus_1 = (n+1)%(wallLoop.length);			
                let radarPoint = CollistionHelper.lineSegmentsIntersection(this.o,radarEndBeamPoint,wallLoop[n],wallLoop[n_plus_1]);
				if (radarPoint) {
					let dist = CollistionHelper.distanceTwoPoints(this.o,radarPoint);
					if (dist < currentMin) {
						found = true;
						currentMin = dist;
					}
				}
    		}
        });
		if(!found) return false;
		return currentMin - this.robot_radius;		
	}
    
    paint_line(x,y,arc,dist) {
        let dx = dist*Math.cos(arc);
        let dy = dist*Math.sin(arc); 
        this.ctx.beginPath();
        this.ctx.moveTo(x,y);
        this.ctx.lineTo(x+dx,y+dy);
        this.ctx.stroke();  
    }
    
    paint_simple(blobmode = false) { 
        if (blobmode) {
          this.ctx.fillStyle = this.clean_color;	
          this.ctx.beginPath();    
          this.ctx.arc(this.o.x, this.o.y, this.robot_radius+1, 0, 2 * Math.PI);   
          this.ctx.fill();
        } else { 
          this.ctx.strokeStyle = 'black';
		  if (this.isCollision) {
			this.ctx.strokeStyle = 'red';
		  }
          this.ctx.fillStyle = '#41494f';	
		  this.ctx.lineWidth = 4;	
          this.ctx.beginPath();    
          this.ctx.arc(this.o.x, this.o.y, this.robot_radius-2.5, 0, 2 * Math.PI);
          this.ctx.stroke();     
          this.ctx.fill();
		  this.ctx.lineWidth = 2;
          this.paint_line(this.o.x,this.o.y,this.o.a,this.robot_radius-2.5);
          
          this.ctx.fillStyle = this.robot_color;	
		  this.ctx.lineWidth = 2;	
          this.ctx.beginPath();    
          this.ctx.arc(this.o.x, this.o.y, 4, 0, 2 * Math.PI);
          this.ctx.stroke();     
          this.ctx.fill();
          
        }
    }
    
    paint_polygons(edges,colorEdge,colorFill,clearCanvas = false) {
        if (clearCanvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
        }
    	this.ctx.fillStyle = colorFill;
        if(colorEdge) {
            this.ctx.strokeStyle = colorEdge;
            this.ctx.lineWidth = 3;	
        } else {
            this.ctx.lineWidth = 0;	
        }
        	
    	edges.forEach(wallLoop => { 
    		this.ctx.beginPath();
    		this.ctx.moveTo(wallLoop[0].x,wallLoop[0].y);
    		for(let n=1; n<wallLoop.length; n++) {			
    			this.ctx.lineTo(wallLoop[n].x,wallLoop[n].y);
    		}
    		this.ctx.lineTo(wallLoop[0].x,wallLoop[0].y);
    		if(colorEdge) this.ctx.stroke();
    		this.ctx.fill();		
    	});
    }
    
    paint_flags_init(points, initValues = true) {
        let color = "white";
        for (let n=0 ; n<points.length; n++) {   
            if (initValues) {
                points[n].taken = false;
            }
            if (points[n].taken) {
                color = "green";
            } else {
                color = "red";
            }
            this.paint_flag(points[n],color);
        }
    }
    
    paint_flag(point,colorFill) {
        this.ctx.strokeStyle = 'black';
    	this.ctx.fillStyle = colorFill;	 
        this.ctx.beginPath();  
        this.ctx.moveTo(point.x+1,point.y);
        this.ctx.lineTo(point.x+1,point.y-7);
        this.ctx.lineTo(point.x+20,point.y-14);
        this.ctx.lineTo(point.x+1,point.y-21);
        this.ctx.lineTo(point.x-1,point.y-21);
        this.ctx.lineTo(point.x-1,point.y);
        this.ctx.lineTo(point.x+1,point.y);
        this.ctx.stroke();
    	this.ctx.fill();	 
    }
    
    paint_message(message) {
        this.ctx.fillStyle = "rgba(220,20,60,0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);        
        this.ctx.fillStyle = "white";
        this.ctx.font = "30px Arial";
        this.ctx.fillText(message, 100, 300);
    }
     
}