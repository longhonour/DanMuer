//特效弹幕
class effectDM{

	constructor( cv, opts = {}){

		this.canvas = cv;
		this.cxt = cv.getContext("2d");
		this.enable = opts.enable || true;

		this.startIndex = 0;

		this.save = [];
	}

	//添加数据
	add(data){
		if(!data || typeof data != "object" )
		return false;

		let [steps,i,step] = [data.steps,0]

		for( ; step = steps[i++]; ){
			this.initStep(step); //初始化参数
		}

		this.save.push(data);
	}

	//清除数据
	clear(){
		this.save = [];
		this.startIndex = 0;
	}

	//重置弹幕
	reset(i){
		let [items,item] = [this.save];
		for( ; item = items[i++]; ){
			item.hide = false;
		}
	}

	//暂停
	pause(){
		this.paused = true;
	}

	//继续
	run(){
		this.paused = false;
	}

	//启用
	enableEffect(){
		this.enable = true;
	}

	//停用
	disableEffect(){
		this.enable = false;
	}

	//初始化参数
	initStep(step){
		step.scaleStartX = step.scaleStartX || 1;
		step.scaleStartY = step.scaleStartY || 1;
		step.scaleEndX = step.scaleEndX  || 1;
		step.scaleEndY = step.scaleEndY  || 1;
		step.rotateEnd = step.rotateEnd || 0;
		step.rotateStart = step.rotateStart || 0;
		step.endX = step.endX || 0;
		step.startX = step.startX || 0;
		step.endY = step.endY || 0;
		step.startY = step.startY || 0;
		step.skewStartX = step.skewStartX || 0;
		step.skewStartY = step.skewStartY || 0;
		step.skewEndX = step.skewEndX || 0;
		step.skewEndY = step.skewEndY || 0;
		step.pastTime = step.pastTime || 0;
		step.duration = step.duration || 0;
		step.scaleDistX = step.scaleEndX - step.scaleStartX;
		step.scaleDistY = step.scaleEndY - step.scaleStartY;
		step.rotateDist = step.rotateEnd - step.rotateStart;
		//判断多边形
		step.distX = step.points ? ( step.distX || 0 ) : step.endX - step.startX;
		step.distY = step.points ? ( step.distY || 0 ) : step.endY - step.startY;
		step.skewDistX = step.skewEndX - step.skewStartX;
		step.skewDistY = step.skewEndY - step.skewStartY;

	}

	//更新canvas尺寸
	getSize(){

		this.width = this.canvas.width;
		this.height = this.canvas.height;

	}

	//清除画布
	clearRect(){
		this.cxt.clearRect(0,0,this.width,this.height);
	}

	//动画循环
	update(w,h,time){

		if(this.paused) //如果暂停，return
		return false;
		
		let [canvas,cxt] = [this.canvas,this.cxt];
		cxt.clearRect(0,0,w,h);

		if(!this.enable) //如果不启用, return
		return false;

		let [i,items,item] = [this.startIndex,this.save];

		for( ; item = items[i++]; ){
			if( item.hide )
			continue;

			let steps = item.steps;
			let stepItem = steps[item.currentIndex];
			this.step(item,stepItem,time);
			this.draw(item,stepItem,cxt);
			this.recovery(item,stepItem);
		}

	}

	step(item,stepItem,time){

		stepItem.pastTime += time;

		let [type,past,duration] = [stepItem.type || "linear",stepItem.pastTime,stepItem.duration];

		//多边形特殊处理
		if(item.type == "polygon" )
		this.stepCheckPolygon(stepItem,item);

		stepItem.x = this.Tween(type, past, stepItem.startX, stepItem.distX, duration);
		stepItem.y = this.Tween(type, past, stepItem.startY, stepItem.distY, duration);
		stepItem.scaleX = this.Tween(type, past, stepItem.scaleStartX, stepItem.scaleDistX, duration );
		stepItem.scaleY = this.Tween(type, past, stepItem.scaleStartY, stepItem.scaleDistY, duration );
		stepItem.rotate = this.Tween(type, past, stepItem.rotateStart, stepItem.rotateDist, duration );
		stepItem.skewX = this.Tween(type, past, stepItem.skewStartX, stepItem.skewDistX, duration );
		stepItem.skewY = this.Tween(type, past, stepItem.skewStartY, stepItem.skewDistY, duration);

	}
	//多边形特殊设置
	stepCheckPolygon(stepItem,item){
		let currentIndex = item.currentIndex;

		//初始化进行计算
		if( currentIndex == 0){
			let [tempX,tempY,points,len] = [0, 0, stepItem.points.concat([]) || [],0];
			let [i,point] = [0];
			for( ; point = points[i++]; ){
				tempX += point.x;
				tempY += point.y;
				len++;
			}
			if(len <= 0) return false;
			stepItem.startX = tempX / len; //计算中心点
			stepItem.startY = tempY / len;
			stepItem.firstPoint = stepItem.points.concat([]).shift(); //获取moveTo的第一个点
		} else if( !stepItem.points ) {
			//调用上一步的数据
			let prevStep = item.steps[currentIndex - 1];
			stepItem.startX = prevStep.x;
			stepItem.startY = prevStep.y;
			stepItem.points = prevStep.points;
			stepItem.firstPoint = prevStep.firstPoint;
		}

	}

	draw(item,stepItem,cxt){
		cxt.save();
		//根据type调用
		!!this[item.type] && this[item.type](stepItem,cxt,Math, Math.PI / 180);
		cxt.restore();
	}

	rect( stepItem, cxt, Math , rotUnit ){
		let [x,y,w,h] = [stepItem.x,stepItem.y,stepItem.width,stepItem.height];
		let [tx,ty] = [Math.tan(stepItem.skewX * rotUnit),Math.tan(stepItem.skewY * rotUnit)];
		cxt.beginPath();
		cxt.transform(stepItem.scaleX,tx,ty,stepItem.scaleY,x + w/2,y + h/2 );
		cxt.rotate( stepItem.rotate * Math.PI / 180 );
		cxt.rect( - w / 2 , - h / 2 , w , h);
		cxt.closePath();
		cxt.fillStyle = stepItem.fillStyle;
		cxt.strokeStyle = stepItem.strokeStyle;
		cxt.fill();
		cxt.stroke();
	}

	text( stepItem, cxt, Math , rotUnit ){
		let [fstyle,fweight,fsize,ffamily,text] = [
			stepItem.fontStyle || "normal",
			stepItem.fontWeight || "normal",
			stepItem.fontSize || "24px",
			stepItem.fontFamily || "微软雅黑",
			stepItem.text || ""
		];
		cxt.font = fstyle+" "+fweight+" "+fsize+" "+ffamily;
		let [x,y,w,h] = [stepItem.x,stepItem.y,cxt.measureText(text).width,parseInt(fsize)];
		let [tx,ty] = [Math.tan(stepItem.skewX * rotUnit),Math.tan(stepItem.skewY * rotUnit)];
		cxt.transform(stepItem.scaleX,tx,ty,stepItem.scaleY,x + w/2,y + h/2 );
		cxt.rotate( stepItem.rotate * Math.PI / 180 );
		cxt.fillStyle = stepItem.fillStyle;
		cxt.strokeStyle = stepItem.strokeStyle;
		cxt.fillText(text,-w/2,-h/2);
		cxt.strokeText(text,-w/2,-h/2);
	}

	polygon( stepItem, cxt, Math , rotUnit ){
		let points = stepItem.points;
		let [ x, y, firstPoint ] = [ stepItem.x, stepItem.y, stepItem.firstPoint ];
		let [tx,ty] = [ Math.tan(stepItem.skewX * rotUnit),Math.tan(stepItem.skewY * rotUnit)];

		cxt.beginPath();
		cxt.transform(stepItem.scaleX,tx,ty,stepItem.scaleY, x, y);
		cxt.rotate( stepItem.rotate * Math.PI / 180 );
		cxt.fillStyle = stepItem.fillStyle;
		cxt.strokeStyle = stepItem.strokeStyle;

		cxt.moveTo( firstPoint.x - x, firstPoint.y - y );

		let [i,point] = [0];
		
		for( ; point = points[i++]; ){
			cxt.lineTo( point.x - x, point.y - y );
		}
		cxt.closePath();
		cxt.fill();
		cxt.stroke();
	}

	//回收已经完成的弹幕
	recovery( item, stepItem ){
		if( stepItem.pastTime >= stepItem.duration ){
			item.currentIndex++;
			stepItem.pastTime = 0;
		}

		if( !item.steps[item.currentIndex] ){
			item.hide = true;
			item.currentIndex = 0;
		}
	}

	//运动时间曲线
	Tween(type,...data){

		const trail = {
			
			linear : ( t, b, c, d ) => c * t/d + b,

			easeIn : ( t, b, c, d ) => c * ( t /= d ) * t + b,

			easeOut : ( t, b, c, d ) => -c *( t/=d )*( t - 2 ) + b,

			easeInOut : ( t, b, c, d ) => {
				if ( ( t/=d/2 ) < 1 ) return c/2 * t * t + b;
            	return -c/2 * ( (--t) * (t-2) - 1 ) + b;
			}

		}

		return !!trail[type] && trail[type](...data);

	}
}